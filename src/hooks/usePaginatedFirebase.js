/**
 * Firebase Pagination Hook
 *
 * Handles paginated queries to Firebase Realtime Database to prevent
 * loading large datasets at once.
 *
 * Edge cases handled:
 * - Empty datasets
 * - Last page detection
 * - Error handling with retry
 * - Loading states
 */

import { useState, useCallback, useEffect } from 'react';
import { ref, get, query, orderByKey, limitToFirst, startAfter } from 'firebase/database';
import { database } from '../firebase/config';

/**
 * Default page size for pagination
 */
const DEFAULT_PAGE_SIZE = 50;

/**
 * Maximum retries for failed queries
 */
const MAX_RETRIES = 3;

/**
 * Hook for paginated Firebase queries
 *
 * @param {string} path - Firebase database path (e.g., 'contracts', 'exportedContracts')
 * @param {Object} options - Configuration options
 * @param {number} options.pageSize - Number of items per page (default: 50)
 * @param {boolean} options.autoLoad - Auto-load first page on mount (default: true)
 * @returns {Object} Pagination state and controls
 *
 * @example
 * const { data, loading, error, loadMore, hasMore, refresh } = usePaginatedFirebase('contracts');
 */
export const usePaginatedFirebase = (path, options = {}) => {
  const { pageSize = DEFAULT_PAGE_SIZE, autoLoad = true } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastKey, setLastKey] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalLoaded, setTotalLoaded] = useState(0);

  /**
   * Load a page of data from Firebase
   * @param {string|null} startKey - Key to start after (for pagination)
   * @param {number} retryCount - Current retry attempt
   */
  const loadPage = useCallback(async (startKey = null, retryCount = 0) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const dbRef = ref(database, path);

      // Build query with pagination
      let pageQuery;
      if (startKey) {
        pageQuery = query(
          dbRef,
          orderByKey(),
          startAfter(startKey),
          limitToFirst(pageSize + 1) // Fetch one extra to check if there's more
        );
      } else {
        pageQuery = query(
          dbRef,
          orderByKey(),
          limitToFirst(pageSize + 1)
        );
      }

      const snapshot = await get(pageQuery);

      if (snapshot.exists()) {
        const rawData = snapshot.val();
        const entries = Object.entries(rawData).map(([key, value]) => ({
          firebaseKey: key,
          ...value,
        }));

        // Check if there's more data
        const hasMoreData = entries.length > pageSize;
        setHasMore(hasMoreData);

        // Remove extra item if present
        const pageData = hasMoreData ? entries.slice(0, pageSize) : entries;

        // Update last key for next page
        if (pageData.length > 0) {
          setLastKey(pageData[pageData.length - 1].firebaseKey);
        }

        // Append to existing data (for loadMore) or replace (for refresh)
        if (startKey) {
          setData(prev => [...prev, ...pageData]);
        } else {
          setData(pageData);
        }

        setTotalLoaded(prev => (startKey ? prev + pageData.length : pageData.length));
      } else {
        // No data found
        if (!startKey) {
          setData([]);
          setTotalLoaded(0);
        }
        setHasMore(false);
      }
    } catch (err) {
      console.error(`Error loading ${path}:`, err);

      // Retry logic
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        setTimeout(() => loadPage(startKey, retryCount + 1), 1000 * (retryCount + 1));
        return;
      }

      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [path, pageSize, loading]);

  /**
   * Load more data (next page)
   */
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    loadPage(lastKey);
  }, [hasMore, loading, lastKey, loadPage]);

  /**
   * Refresh data (reload from start)
   */
  const refresh = useCallback(() => {
    setData([]);
    setLastKey(null);
    setHasMore(true);
    setTotalLoaded(0);
    loadPage(null);
  }, [loadPage]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadPage(null);
    }
  }, [autoLoad]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    error,
    hasMore,
    totalLoaded,
    loadMore,
    refresh,
  };
};

/**
 * Simple hook for loading all data with a safety limit
 * Use this when you need all data but want protection against huge datasets
 *
 * @param {string} path - Firebase database path
 * @param {number} maxItems - Maximum items to load (default: 1000)
 * @returns {Object} Data and loading state
 */
export const useSafeFirebaseLoad = (path, maxItems = 1000) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const dbRef = ref(database, path);
        const limitedQuery = query(dbRef, orderByKey(), limitToFirst(maxItems + 1));
        const snapshot = await get(limitedQuery);

        if (snapshot.exists()) {
          const rawData = snapshot.val();
          const entries = Object.entries(rawData).map(([key, value]) => ({
            firebaseKey: key,
            ...value,
          }));

          // Check if data was truncated
          if (entries.length > maxItems) {
            setTruncated(true);
            setData(entries.slice(0, maxItems));
          } else {
            setTruncated(false);
            setData(entries);
          }
        } else {
          setData([]);
        }
      } catch (err) {
        console.error(`Error loading ${path}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [path, maxItems]);

  return { data, loading, error, truncated };
};

export default usePaginatedFirebase;
