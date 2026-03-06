import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-primary-200 text-neutral-white mt-auto shadow-lg print:hidden">
            <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-4 md:px-6 py-4 sm:py-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* Logo & Copyright */}
                    <div className="text-center md:text-left">
                        <p className="text-sm font-medium text-neutral-white">
                            © {new Date().getFullYear()} <span className="text-secondary-600 font-bold">VinFast</span> Management System
                        </p>
                        <p className="text-xs text-neutral-white/80 mt-1">
                            Hệ thống quản lý hợp đồng và khách hàng
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-wrap justify-center gap-3 xs:gap-4 sm:gap-6 text-xs xs:text-sm">
                        <a
                            href="/dashboard"
                            className="text-neutral-white hover:text-secondary-600 transition-colors duration-200"
                        >
                            Dashboard
                        </a>
                        <a
                            href="/hop-dong"
                            className="text-neutral-white/90 hover:text-secondary-600 transition-colors duration-200"
                        >
                            Hợp đồng
                        </a>
                        <a
                            href="/quan-ly-khach-hang"
                            className="text-neutral-white/90 hover:text-secondary-600 transition-colors duration-200"
                        >
                            Khách hàng
                        </a>
                    </div>

                    {/* Version Info */}
                    <div className="text-center md:text-right">
                        <p className="text-xs text-neutral-white/80">
                            Version 1.0.0
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
