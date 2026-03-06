import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, Briefcase, DollarSign, FileCheck, Car, Settings, Gift } from 'lucide-react';
import VinfastLogo from '../assets/vinfast.svg';

export default function Menu() {
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'user';
    setUserRole(role);
  }, []);

  const allCards = [
    { to: '/nhan-su', label: 'Nhân sự', iconColor: 'text-blue-600', iconBg: 'bg-blue-100', hoverBg: 'group-hover:bg-blue-200', icon: Users, isExternal: false },
    { to: '/hop-dong', label: 'Hợp đồng', iconColor: 'text-emerald-600', iconBg: 'bg-emerald-100', hoverBg: 'group-hover:bg-emerald-200', icon: FileText, isExternal: false },
    { to: '/hop-dong-da-xuat', label: 'Hợp đồng đã xuất', iconColor: 'text-indigo-600', iconBg: 'bg-indigo-100', hoverBg: 'group-hover:bg-indigo-200', icon: FileCheck, isExternal: false },
    { to: '/quan-ly-khach-hang', label: 'Khách hàng', iconColor: 'text-amber-600', iconBg: 'bg-amber-100', hoverBg: 'group-hover:bg-amber-200', icon: Briefcase, isExternal: false },
    { to: '/bao-gia', label: 'Báo giá', iconColor: 'text-rose-600', iconBg: 'bg-rose-100', hoverBg: 'group-hover:bg-rose-200', icon: DollarSign, isExternal: false },
    { to: '/them-chuong-trinh-uu-dai', label: 'Chương trình ưu đãi', iconColor: 'text-fuchsia-600', iconBg: 'bg-fuchsia-100', hoverBg: 'group-hover:bg-fuchsia-200', icon: Gift, isExternal: false },
    { to: '/danh-sach-xe', label: 'Danh sách xe', iconColor: 'text-cyan-600', iconBg: 'bg-cyan-100', hoverBg: 'group-hover:bg-cyan-200', icon: Car, isExternal: false },
    { to: '/quan-tri-bang-gia', label: 'Quản trị bảng giá', iconColor: 'text-slate-600', iconBg: 'bg-slate-100', hoverBg: 'group-hover:bg-slate-200', icon: Settings, isExternal: false, adminOnly: true },
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
                <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 transition-colors ${card.iconBg || 'bg-slate-100'} ${card.hoverBg || 'group-hover:bg-slate-200'}`}>
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.iconColor || 'text-gray-700'}`} strokeWidth={2} />
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