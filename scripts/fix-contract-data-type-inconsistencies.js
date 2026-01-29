/**
 * Migration script to fix type inconsistencies in Firebase contracts
 * Converts string numbers to actual numbers and normalizes enum values
 *
 * Usage: node scripts/fix-contract-data-type-inconsistencies.js
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update } from 'firebase/database';

// Firebase web config (matches src/firebase/config.js)
const firebaseConfig = {
  apiKey: "AIzaSyB_vAEz_pxfNWKtrgUbt4sgoj0CfaGQSas",
  authDomain: "vinfast-d5bd8.firebaseapp.com",
  projectId: "vinfast-d5bd8",
  databaseURL: "https://vinfast-d5bd8-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "vinfast-d5bd8.firebasestorage.app",
  messagingSenderId: "629544926555",
  appId: "1:629544926555:web:edcbfc14cc02dc6b832e7e",
  measurementId: "G-BWFGVBRLR5",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Numeric fields to fix
const NUMERIC_FIELDS = [
  'soTienCoc',
  'giaHD',
  'giamGia',
  'soTienVay',
  'Tiền đối ứng',
  'soTienPhaiThu',
  'deposit',
  'contractPrice',
  'loanAmount',
  'Giá Hợp Đồng',
  'Giá Niêm Yết',
  'tienDatCoc',
  'tienDoiUng'
];

/**
 * Parse currency string to number
 * @param {string|number} value - Value to parse
 * @returns {number} Parsed number or 0
 */
function parseCurrency(value) {
  if (typeof value === 'number') {
    return value >= 0 ? value : 0;
  }

  if (typeof value === 'string') {
    // Remove all non-digit characters (commas, spaces, dots)
    const cleaned = value.replace(/[^\d]/g, '');
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
  }

  return 0;
}

/**
 * Normalize thanhToan value to lowercase standard
 * @param {string} value - Original value
 * @returns {string} Normalized value
 */
function normalizeThanhToan(value) {
  if (!value || typeof value !== 'string') return 'trả thẳng';

  const lowercased = value.toLowerCase().trim();

  // Map variations to standard values
  if (['trả góp', 'tra gop', 'TRẢ GÓP', 'Trả góp'].includes(value) || lowercased.includes('góp')) {
    return 'trả góp';
  } else if (['trả thẳng', 'tra thang', 'TRẢ THẲNG', 'Trả thẳng'].includes(value) || lowercased.includes('thẳng')) {
    return 'trả thẳng';
  }

  // Invalid values - default to trả thẳng
  return 'trả thẳng';
}

/**
 * Normalize trangThai value to lowercase standard
 * @param {string} value - Original value
 * @returns {string} Normalized value
 */
function normalizeTrangThai(value) {
  if (!value || typeof value !== 'string') return 'mới';

  const lowercased = value.toLowerCase().trim();
  const validStates = ['mới', 'xuất', 'hủy', 'hoàn thành', 'hoàn', 'chuyển tên'];

  if (validStates.includes(lowercased)) {
    return lowercased;
  }

  // Default to 'mới' if invalid
  return 'mới';
}

/**
 * Fix type inconsistencies in contracts collection
 */
async function fixContracts() {
  console.log('🔍 Checking contracts collection...\n');

  const contractsRef = ref(database, 'contracts');
  const snapshot = await get(contractsRef);

  if (!snapshot.exists()) {
    console.log('❌ No contracts found\n');
    return { total: 0, fixed: 0 };
  }

  const updates = {};
  let fixCount = 0;
  let totalContracts = 0;

  snapshot.forEach((child) => {
    totalContracts++;
    const key = child.key;
    const data = child.val();
    let contractFixed = false;

    // Fix numeric fields
    NUMERIC_FIELDS.forEach((field) => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        const currentValue = data[field];

        // Only fix if it's a string
        if (typeof currentValue === 'string') {
          const numValue = parseCurrency(currentValue);
          updates[`contracts/${key}/${field}`] = numValue;
          console.log(`  ✓ contracts/${key}/${field}: "${currentValue}" → ${numValue}`);
          contractFixed = true;
        }
      }
    });

    // Normalize thanhToan
    if (data.thanhToan && typeof data.thanhToan === 'string') {
      const normalized = normalizeThanhToan(data.thanhToan);
      if (normalized !== data.thanhToan) {
        updates[`contracts/${key}/thanhToan`] = normalized;
        console.log(`  ✓ contracts/${key}/thanhToan: "${data.thanhToan}" → "${normalized}"`);
        contractFixed = true;
      }
    }

    // Normalize payment (alias for thanhToan)
    if (data.payment && typeof data.payment === 'string') {
      const normalized = normalizeThanhToan(data.payment);
      if (normalized !== data.payment) {
        updates[`contracts/${key}/payment`] = normalized;
        console.log(`  ✓ contracts/${key}/payment: "${data.payment}" → "${normalized}"`);
        contractFixed = true;
      }
    }

    // Normalize trangThai
    if (data.trangThai && typeof data.trangThai === 'string') {
      const normalized = normalizeTrangThai(data.trangThai);
      if (normalized !== data.trangThai) {
        updates[`contracts/${key}/trangThai`] = normalized;
        console.log(`  ✓ contracts/${key}/trangThai: "${data.trangThai}" → "${normalized}"`);
        contractFixed = true;
      }
    }

    // Normalize status (alias for trangThai)
    if (data.status && typeof data.status === 'string') {
      const normalized = normalizeTrangThai(data.status);
      if (normalized !== data.status) {
        updates[`contracts/${key}/status`] = normalized;
        console.log(`  ✓ contracts/${key}/status: "${data.status}" → "${normalized}"`);
        contractFixed = true;
      }
    }

    if (contractFixed) {
      fixCount++;
    }
  });

  return { updates, total: totalContracts, fixed: fixCount };
}

/**
 * Fix type inconsistencies in exportedContracts collection
 */
async function fixExportedContracts() {
  console.log('🔍 Checking exportedContracts collection...\n');

  const exportedRef = ref(database, 'exportedContracts');
  const snapshot = await get(exportedRef);

  if (!snapshot.exists()) {
    console.log('❌ No exported contracts found\n');
    return { total: 0, fixed: 0 };
  }

  const updates = {};
  let fixCount = 0;
  let totalContracts = 0;

  snapshot.forEach((child) => {
    totalContracts++;
    const key = child.key;
    const data = child.val();
    let contractFixed = false;

    // Fix numeric fields
    NUMERIC_FIELDS.forEach((field) => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        const currentValue = data[field];

        // Only fix if it's a string
        if (typeof currentValue === 'string') {
          const numValue = parseCurrency(currentValue);
          updates[`exportedContracts/${key}/${field}`] = numValue;
          console.log(`  ✓ exportedContracts/${key}/${field}: "${currentValue}" → ${numValue}`);
          contractFixed = true;
        }
      }
    });

    // Normalize thanhToan
    if (data.thanhToan && typeof data.thanhToan === 'string') {
      const normalized = normalizeThanhToan(data.thanhToan);
      if (normalized !== data.thanhToan) {
        updates[`exportedContracts/${key}/thanhToan`] = normalized;
        console.log(`  ✓ exportedContracts/${key}/thanhToan: "${data.thanhToan}" → "${normalized}"`);
        contractFixed = true;
      }
    }

    if (contractFixed) {
      fixCount++;
    }
  });

  return { updates, total: totalContracts, fixed: fixCount };
}

/**
 * Main migration function
 */
async function main() {
  console.log('========================================');
  console.log('  Type Inconsistency Fix Migration');
  console.log('========================================\n');
  console.log('Starting migration...\n');

  try {
    // Fix contracts
    const contractsResult = await fixContracts();

    // Fix exported contracts
    const exportedResult = await fixExportedContracts();

    // Combine all updates
    const allUpdates = {
      ...contractsResult.updates,
      ...exportedResult.updates
    };

    const totalUpdates = Object.keys(allUpdates).length;

    if (totalUpdates > 0) {
      console.log('\n📝 Summary:');
      console.log(`   - Contracts checked: ${contractsResult.total}`);
      console.log(`   - Contracts with fixes: ${contractsResult.fixed}`);
      console.log(`   - Exported contracts checked: ${exportedResult.total}`);
      console.log(`   - Exported contracts with fixes: ${exportedResult.fixed}`);
      console.log(`   - Total field updates: ${totalUpdates}\n`);

      console.log('💾 Applying updates to Firebase...');
      await update(ref(database), allUpdates);
      console.log('✅ Updates applied successfully!\n');
    } else {
      console.log('\n✅ No type inconsistencies found. Database is clean!\n');
    }

    console.log('========================================');
    console.log('  Migration Complete!');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
