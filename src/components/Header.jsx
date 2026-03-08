import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Bell, X, Check } from "lucide-react";
import { ref, get, onValue, update, remove } from "firebase/database";
import { database } from "../firebase/config";
import VinfastLogo from "../assets/vinfast.svg";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  // Session expiry check (24h)
  const SESSION_DURATION = 24 * 60 * 60 * 1000;
  const sessionTimestamp = localStorage.getItem("sessionTimestamp");

  if (sessionTimestamp && Date.now() - parseInt(sessionTimestamp) > SESSION_DURATION) {
    // Session expired, clear and redirect
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userTeam");
    localStorage.removeItem("userDepartment");
    localStorage.removeItem("sessionTimestamp");
    if (location.pathname !== "/dang-nhap") {
      navigate("/dang-nhap");
    }
  }

  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const username = localStorage.getItem("username") || "User";
  const userRole = localStorage.getItem("userRole") || "user";
  const userTeam = localStorage.getItem("userTeam") || "";

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const hamburgerButtonRef = useRef(null);
  const notificationsRef = useRef(null);
  const notificationsButtonRef = useRef(null);
  const notificationsMobileButtonRef = useRef(null);
  const notificationsMobileRef = useRef(null);
  const userEmail = localStorage.getItem("userEmail") || "";

  // Close menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  // Load notifications from Firebase
  useEffect(() => {
    if (!isAuthenticated || !userEmail) return;

    // Normalize email for Firebase key (replace . and @ with safe characters)
    const normalizedEmail = userEmail.replace(/\./g, '_').replace(/@/g, '_at_');
    const notificationsRef = ref(database, `notifications/${normalizedEmail}`);

    // Set up real-time listener
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const notificationsList = Object.entries(data)
          .map(([key, notification]) => ({
            id: key,
            firebaseKey: key,
            ...notification,
          }))
          .sort((a, b) => {
            // Sort by createdAt descending (newest first)
            const timeA = a.createdAt || a.timestamp || 0;
            const timeB = b.createdAt || b.timestamp || 0;
            return timeB - timeA;
          });

        setNotifications(notificationsList);
        const unread = notificationsList.filter((n) => !n.read).length;
        setUnreadCount(unread);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated, userEmail]);

  useEffect(() => {
    function handleClickOutside(e) {
      // Check if click is outside profile dropdown (both button and dropdown)
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target)
      ) {
        setProfileOpen(false);
      }
      
      // Check if click is outside mobile menu AND hamburger button
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        hamburgerButtonRef.current &&
        !hamburgerButtonRef.current.contains(e.target)
      ) {
        setMobileMenuOpen(false);
      }
      
      // Check if click is outside notifications dropdown (both button and dropdown for desktop and mobile)
      const isClickInsideNotifications = 
        (notificationsRef.current && notificationsRef.current.contains(e.target)) ||
        (notificationsButtonRef.current && notificationsButtonRef.current.contains(e.target)) ||
        (notificationsMobileRef.current && notificationsMobileRef.current.contains(e.target)) ||
        (notificationsMobileButtonRef.current && notificationsMobileButtonRef.current.contains(e.target));
      
      if (!isClickInsideNotifications) {
        setNotificationsOpen(false);
      }
    }
    // Use click instead of mousedown to allow Link navigation to complete first
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userTeam");
    localStorage.removeItem("userDepartment");
    localStorage.removeItem("sessionTimestamp");
    navigate("/dang-nhap");
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!userEmail) return;
    const normalizedEmail = userEmail.replace(/\./g, '_').replace(/@/g, '_at_');
    const notificationRef = ref(database, `notifications/${normalizedEmail}/${notificationId}`);
    try {
      await update(notificationRef, { read: true, readAt: new Date().toISOString() });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    if (!userEmail) return;
    const normalizedEmail = userEmail.replace(/\./g, '_').replace(/@/g, '_at_');
    const notificationRef = ref(database, `notifications/${normalizedEmail}/${notificationId}`);
    try {
      await remove(notificationRef);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!userEmail || notifications.length === 0) return;
    const normalizedEmail = userEmail.replace(/\./g, '_').replace(/@/g, '_at_');
    const updates = {};
    notifications.forEach((notification) => {
      if (!notification.read) {
        updates[`notifications/${normalizedEmail}/${notification.id}/read`] = true;
        updates[`notifications/${normalizedEmail}/${notification.id}/readAt`] = new Date().toISOString();
      }
    });
    if (Object.keys(updates).length > 0) {
      try {
        const dbRef = ref(database);
        await update(dbRef, updates);
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
      }
    }
  };

  // Format date for display
  const formatNotificationDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  // Load customer info and open modal
  const handleNotificationClick = async (notification) => {
    // Only handle notifications with customer info
    if (!notification.customerName && !notification.customerPhone) {
      return;
    }

    setLoadingCustomer(true);
    setCustomerModalOpen(true);

    try {
      const customersRef = ref(database, 'customers');
      const snapshot = await get(customersRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const customersList = Object.entries(data).map(([key, customer]) => ({
          firebaseKey: key,
          ...customer,
        }));

        // Find customer by name and/or phone
        const customer = customersList.find((c) => {
          const nameMatch = notification.customerName && 
            (c.tenKhachHang || '').trim().toLowerCase() === notification.customerName.trim().toLowerCase();
          const phoneMatch = notification.customerPhone && 
            (c.soDienThoai || '').trim() === notification.customerPhone.trim();
          
          if (notification.customerName && notification.customerPhone) {
            return nameMatch && phoneMatch;
          } else if (notification.customerName) {
            return nameMatch;
          } else if (notification.customerPhone) {
            return phoneMatch;
          }
          return false;
        });

        if (customer) {
          setSelectedCustomer(customer);
          // Mark notification as read when viewing customer
          if (!notification.read) {
            await markAsRead(notification.id);
          }
        } else {
          // If customer not found, show basic info from notification
          setSelectedCustomer({
            tenKhachHang: notification.customerName || '',
            soDienThoai: notification.customerPhone || '',
            notFound: true,
          });
        }
      } else {
        // No customers found, show basic info from notification
        setSelectedCustomer({
          tenKhachHang: notification.customerName || '',
          soDienThoai: notification.customerPhone || '',
          notFound: true,
        });
      }
    } catch (error) {
      console.error("Error loading customer info:", error);
      // Show basic info from notification on error
      setSelectedCustomer({
        tenKhachHang: notification.customerName || '',
        soDienThoai: notification.customerPhone || '',
        notFound: true,
      });
    } finally {
      setLoadingCustomer(false);
    }
  };

  // Don't show navigation on login page
  if (location.pathname === "/dang-nhap") {
    return null;
  }

  const navigationLinks = [
    { to: "/trang-chu", label: "Trang chủ" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/menu", label: "Menu" },
  ];

  return (
    <nav className="print:hidden" style={{ 
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      borderBottom: '3px solid #1e3a8a'
    }}>
      <div className="mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 max-w-[100vw]">
        <div className="flex items-center justify-between h-14 xs:h-16 min-h-[44px]">
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <img
              src={VinfastLogo}
              alt="Logo"
              className="h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 rounded-full shadow-md flex-shrink-0"
            />
            <span className="text-neutral-white text-base xs:text-lg sm:text-xl font-bold truncate">
              Vinfast
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {navigationLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="relative text-neutral-white px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition group"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {link.label}
                <span className="pointer-events-none absolute left-[-5px] right-[-5px] top-8 h-[2px] bg-secondary-600 rounded opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
              </Link>
            ))}
            {isAuthenticated && (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    ref={notificationsButtonRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotificationsOpen((s) => !s);
                      setProfileOpen(false);
                    }}
                    className="relative flex items-center justify-center text-neutral-white p-2 rounded-md transition"
                    style={{ 
                      '--hover-bg': 'rgba(255, 255, 255, 0.15)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    aria-label="Thông báo"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div 
                      ref={notificationsRef}
                      className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-w-md bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200"
                      onClick={(e) => e.stopPropagation()}
                      style={{ maxHeight: 'calc(100vh - 5rem)' }}
                    >
                      <div className="text-white px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)' }}>
                        <h3 className="font-semibold text-xs sm:text-sm">Thông báo</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAllAsRead();
                            }}
                            className="text-[10px] sm:text-xs hover:underline whitespace-nowrap"
                          >
                            Đánh dấu tất cả đã đọc
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-500 text-xs sm:text-sm">
                            Không có thông báo
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => {
                                if (notification.customerName || notification.customerPhone) {
                                  handleNotificationClick(notification);
                                }
                              }}
                              className={`px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 hover:bg-gray-50 transition ${
                                !notification.read ? "bg-blue-50" : ""
                              } ${notification.customerName || notification.customerPhone ? 'cursor-pointer hover:bg-blue-100' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-2">
                                    {!notification.read && (
                                      <span className="mt-1.5 h-2 w-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs sm:text-sm font-medium ${
                                        !notification.read ? "text-gray-900" : "text-gray-700"
                                      }`}>
                                        {notification.title || "Thông báo"}
                                      </p>
                                      {notification.message && (
                                        <p className="text-[10px] sm:text-xs text-gray-600 mt-1 line-clamp-2 break-words">
                                          {notification.message}
                                        </p>
                                      )}
                                      <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                                        {formatNotificationDate(notification.createdAt || notification.timestamp)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="text-gray-400 hover:text-red-500 transition p-1 flex-shrink-0"
                                  title="Xóa thông báo"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="mt-2 text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  Đánh dấu đã đọc
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile */}
                <div className="relative ml-2 lg:ml-4 lg:pl-4">
                  <div ref={profileRef} className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileOpen((s) => !s);
                    }}
                    className="flex items-center gap-1 lg:gap-2 text-neutral-white px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition bg-transparent"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    aria-haspopup="true"
                    aria-expanded={profileOpen}
                  >
                    <span className="hidden lg:inline">👤 </span>
                    <span className="text-xs lg:text-sm truncate max-w-[100px] lg:max-w-none">
                      {username}
                    </span>
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M6 8l4 4 4-4"
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 overflow-hidden">
                      <Link
                        to="/ho-so"
                        className="block px-4 py-2 text-sm text-primary-900 hover:bg-primary-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfileOpen(false);
                        }}
                      >
                        Hồ sơ
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfileOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button & Profile */}
          <div className="flex md:hidden items-center space-x-2">
            {isAuthenticated && (
              <>
                {/* Notifications - Mobile */}
                <div className="relative">
                  <button
                    ref={notificationsMobileButtonRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotificationsOpen((s) => !s);
                      setProfileOpen(false);
                    }}
                    className="relative flex items-center justify-center text-neutral-white p-2 rounded-md transition"
                    style={{ 
                      '--hover-bg': 'rgba(255, 255, 255, 0.15)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    aria-label="Thông báo"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div 
                      ref={notificationsMobileRef}
                      className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-1rem)] sm:w-80 max-w-sm bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200"
                      onClick={(e) => e.stopPropagation()}
                      style={{ maxHeight: 'calc(100vh - 5rem)' }}
                    >
                      <div className="text-white px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)' }}>
                        <h3 className="font-semibold text-xs sm:text-sm">Thông báo</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAllAsRead();
                            }}
                            className="text-[10px] sm:text-xs hover:underline whitespace-nowrap"
                          >
                            Đánh dấu tất cả đã đọc
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-500 text-xs sm:text-sm">
                            Không có thông báo
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => {
                                if (notification.customerName || notification.customerPhone) {
                                  handleNotificationClick(notification);
                                }
                              }}
                              className={`px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 hover:bg-gray-50 transition ${
                                !notification.read ? "bg-blue-50" : ""
                              } ${notification.customerName || notification.customerPhone ? 'cursor-pointer hover:bg-blue-100' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-2">
                                    {!notification.read && (
                                      <span className="mt-1.5 h-2 w-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs sm:text-sm font-medium ${
                                        !notification.read ? "text-gray-900" : "text-gray-700"
                                      }`}>
                                        {notification.title || "Thông báo"}
                                      </p>
                                      {notification.message && (
                                        <p className="text-[10px] sm:text-xs text-gray-600 mt-1 line-clamp-2 break-words">
                                          {notification.message}
                                        </p>
                                      )}
                                      <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                                        {formatNotificationDate(notification.createdAt || notification.timestamp)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="text-gray-400 hover:text-red-500 transition p-1 flex-shrink-0"
                                  title="Xóa thông báo"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="mt-2 text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  Đánh dấu đã đọc
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile - Mobile */}
                <div className="relative" ref={profileRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileOpen((s) => !s);
                  }}
                  className="flex items-center gap-1 text-neutral-white px-2 py-2 rounded-md text-sm font-medium transition bg-transparent hover:bg-primary-600"
                  aria-haspopup="true"
                  aria-expanded={profileOpen}
                >
                  <span className="text-xs truncate max-w-[80px]">
                    {username}
                  </span>
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M6 8l4 4 4-4"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 overflow-hidden">
                    <Link
                      to="/ho-so"
                      className="block px-4 py-2 text-sm text-primary-900 hover:bg-primary-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileOpen(false);
                      }}
                    >
                      Hồ sơ
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
              </>
            )}
            <button
              ref={hamburgerButtonRef}
              onClick={() => setMobileMenuOpen((s) => !s)}
              className="text-neutral-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden border-t"
            style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block text-neutral-white px-3 py-2 rounded-md text-base font-medium transition"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <Link
                  to="/dang-nhap"
                  className="block text-neutral-white px-3 py-2 rounded-md text-base font-medium transition"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Customer Info Modal */}
      {customerModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-2 sm:p-4">
          <div className="modal-box bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto m-2 sm:m-0">
            <div className="bg-gradient-to-r from-primary-600 to-primary-400 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg sticky top-0 z-10 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-white truncate pr-2">Thông tin khách hàng</h3>
              <button
                onClick={() => {
                  setCustomerModalOpen(false);
                  setSelectedCustomer(null);
                }}
                className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {loadingCustomer ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-500"></div>
                  <span className="ml-3 text-xs sm:text-sm text-gray-600">Đang tải thông tin...</span>
                </div>
              ) : selectedCustomer ? (
                <div className="space-y-4">
                  {selectedCustomer.notFound && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4">
                      <p className="text-xs sm:text-sm text-yellow-800">
                        ⚠️ Không tìm thấy thông tin đầy đủ của khách hàng trong hệ thống. Hiển thị thông tin cơ bản từ thông báo.
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tên Khách Hàng</label>
                      <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded border break-words">
                        {selectedCustomer.tenKhachHang || '-'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Số Điện Thoại</label>
                      <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded border break-words">
                        {selectedCustomer.soDienThoai || '-'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Ngày</label>
                      <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded border break-words">
                        {selectedCustomer.ngay || '-'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">TVBH</label>
                      <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded border break-words">
                        {selectedCustomer.tvbh || '-'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tỉnh Thành</label>
                      <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded border break-words">
                        {selectedCustomer.tinhThanh || '-'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Dòng Xe</label>
                      <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded border break-words">
                        {selectedCustomer.dongXe || '-'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phiên Bản</label>
                      <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded border break-words">
                        {selectedCustomer.phienBan || '-'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Màu Sắc</label>
                      <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded border break-words">
                        {selectedCustomer.mauSac || '-'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nhu Cầu</label>
                      <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded border break-words">
                        {selectedCustomer.nhuCau || '-'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Thanh Toán</label>
                      <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded border break-words">
                        {selectedCustomer.thanhToan || '-'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nguồn</label>
                      <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded border break-words">
                        {selectedCustomer.nguon || '-'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Mức Độ</label>
                      <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded border break-words">
                        {selectedCustomer.mucDo || '-'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                      <p className="text-xs sm:text-sm text-gray-900 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded border break-words">
                        {selectedCustomer.tinhTrang || '-'}
                      </p>
                    </div>
                  </div>

                  {selectedCustomer.noiDung && (
                    <div className="mt-4">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nội Dung</label>
                      <div className="text-xs sm:text-sm text-gray-900 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded border whitespace-pre-wrap break-words">
                        {selectedCustomer.noiDung}
                      </div>
                    </div>
                  )}

                  {!selectedCustomer.notFound && (
                    <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                      <button
                        onClick={() => {
                          setCustomerModalOpen(false);
                          setSelectedCustomer(null);
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs sm:text-sm font-medium"
                      >
                        Đóng
                      </button>
                      <button
                        onClick={() => {
                          setCustomerModalOpen(false);
                          setSelectedCustomer(null);
                          navigate('/quan-ly-khach-hang');
                        }}
                        className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs sm:text-sm font-medium"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-xs sm:text-sm text-gray-500">
                  Không có thông tin để hiển thị
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
