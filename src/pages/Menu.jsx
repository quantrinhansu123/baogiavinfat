import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, Briefcase, DollarSign, FileCheck, Car, Settings } from 'lucide-react';
import VinfastLogo from '../assets/vinfast.svg';

export default function Menu() {
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'user';
    setUserRole(role);
  }, []);

  const allCards = [
    { to: '/nhan-su', label: 'Nhân sự', color: 'primary', icon: Users, isExternal: false },
    { to: '/hop-dong', label: 'Hợp đồng', color: 'secondary', icon: FileText, isExternal: false },
    { to: '/hop-dong-da-xuat', label: 'Hợp đồng đã xuất', color: 'accent', icon: FileCheck, isExternal: false },
    { to: '/quan-ly-khach-hang', label: 'Khách hàng', color: 'accent', icon: Briefcase, isExternal: false },
    { to: '/bao-gia', label: 'Báo giá', color: 'primary', icon: DollarSign, isExternal: false },
    { to: '/danh-sach-xe', label: 'Danh sách xe', color: 'secondary', icon: Car, isExternal: false },
    { to: '/quan-tri-bang-gia', label: 'Quản trị bảng giá', color: 'accent', icon: Settings, isExternal: false, adminOnly: true },
  ];

  // Filter: ẩn Nhân sự với user, ẩn Quản trị bảng giá nếu không phải admin
  const cards = allCards.filter((card) => {
    if (card.to === '/nhan-su' && userRole === 'user') return false;
    if (card.adminOnly && userRole !== 'admin') return false;
    return true;
  });

  return (
    <div className="max-w mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 bg-gradient-to-br from-slate-50 to-slate-300 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-8 sm:mb-10 lg:mb-12 text-center sm:text-left">
        <div className="relative flex-shrink-0">
          <img
            src={VinfastLogo}
            alt="Vinfast Logo"
            className="h-10 w-10 sm:h-12 sm:w-12 drop-shadow-md"
          />
          <div className="absolute inset-0 bg-slate-200/20 rounded-full blur-md scale-110 -z-10"></div>
        </div>
        <div className="flex-grow">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Bảng Điều Khiển</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Truy cập nhanh các chức năng quản lý</p>
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          const CardContent = (
            <div
              className="group relative overflow-hidden rounded-xl p-4 sm:p-5 lg:p-6 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
            >
              {/* Subtle Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              {/* Content */}
              <div className="relative flex items-center gap-3 sm:gap-4">
                <div className="p-1.5 sm:p-2 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors flex-shrink-0">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">{card.label}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-2">Quản lý và theo dõi {card.label.toLowerCase()}</p>
                </div>
              </div>
            </div>
          );

          return card.isExternal ? (
            <a
              key={card.to}
              href={card.to}
              target="_blank"
              rel="noopener noreferrer"
            >
              {CardContent}
            </a>
          ) : (
            <Link key={card.to} to={card.to}>
              {CardContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}