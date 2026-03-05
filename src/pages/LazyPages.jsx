/**
 * Lazy-loaded page exports for code splitting
 * Critical pages are imported normally, heavy pages are lazy-loaded
 */
import { lazy } from 'react'

// Critical pages - always in main bundle (login flow, initial landing)
export { default as Login } from './Login'
export { default as Home } from './Home'
export { default as Menu } from './Menu'
export { default as Profile } from './Profile'

// Dashboard with charts - lazy load (Chart.js heavy)
export const Dashboard = lazy(() => import('./Dashboard'))

// Large pages - lazy load
export const CalculatorPage = lazy(() => import('./CalculatorPage'))
export const QuanLyKhachHangPage = lazy(() => import('./QuanLyKhachHangPage'))
export const ContractFormPage = lazy(() => import('./ContractFormPage'))

// Contract management pages - lazy load
export const HopDongPage = lazy(() => import('./HopDongPage'))
export const HopDongDaXuatPage = lazy(() => import('./HopDongDaXuatPage'))
export const EditHopDongDaXuatPage = lazy(() => import('./EditHopDongDaXuatPage'))
export const NhanSuPage = lazy(() => import('./NhanSuPage'))
export const DanhSachXePage = lazy(() => import('./DanhSachXePage'))
export const Invoice2Page = lazy(() => import('./Invoice2Page'))
export const CalculatorConfigAdminPage = lazy(() => import('./CalculatorConfigAdminPage'))

// BieuMau components - all lazy loaded
export const GiayXacNhan = lazy(() => import('../components/BieuMau/GiayXacNhan'))
export const GiayXacNhanThongTin = lazy(() => import('../components/BieuMau/GiayXacNhanThongTin'))
export const GiayDeNghiThanhToan = lazy(() => import('../components/BieuMau/GiayDeNghiThanhToan'))
export const GiayXacNhanTangBaoHiem = lazy(() => import('../components/BieuMau/GiayXacNhanTangBaoHiem'))
export const PhuLucHopDong = lazy(() => import('../components/BieuMau/PhuLucHopDong'))
export const DeNghiXuatHoaDon = lazy(() => import('../components/BieuMau/DeNghiXuatHoaDon'))
export const HopDongMuaBanXe = lazy(() => import('../components/BieuMau/HopDongMuaBanXe'))
export const TTHTLV_CDX_Shinhan_gui_DL = lazy(() => import('../components/BieuMau/TTHTLV_CĐX_Shinhan_gui_DL'))
export const TT_HTLV_CDX_TPB = lazy(() => import('../components/BieuMau/TT_HTLV_CĐX_TPB'))
export const Thoa_thuan_ho_tro_lai_suat_vay_CDX_Vinfast_va_LFVN = lazy(() => import('../components/BieuMau/Thoa_thuan_ho_tro_lai_suat_vay_CĐX_Vinfast_va_LFVN'))
export const PhieuTangBaoHiem = lazy(() => import('../components/BieuMau/PhieuTangBaoHiem'))
export const PhieuRutCoc = lazy(() => import('../components/BieuMau/PhieuRutCoc'))
export const PDI_KH = lazy(() => import('../components/BieuMau/PDI_KH'))
export const GiayXacNhanThanhToanNH = lazy(() => import('../components/BieuMau/GiayXacNhanThanhToanNH'))
export const GiayXacNhanTangBaoHiemVPBank = lazy(() => import('../components/BieuMau/GiayXacNhanTangBaoHiemVPBank'))
export const GiayXacNhanSKSM = lazy(() => import('../components/BieuMau/GiayXacNhanSKSM'))
export const GiayXacNhanPhaiThuKH_DL_Gui_NH = lazy(() => import('../components/BieuMau/GiayXacNhanPhaiThuKH-DL-Gui-NH'))
export const GiayXacNhanKieuLoai = lazy(() => import('../components/BieuMau/GiayXacNhanKieuLoai'))
export const GiayThoaThuanTraCham = lazy(() => import('../components/BieuMau/GiayThoaThuanTraCham'))
export const GiayThoaThuanTraThay = lazy(() => import('../components/BieuMau/GiayThoaThuanTraThay'))
export const GiayThoaThuanHTVLCT90_nien_kim_60_thang = lazy(() => import('../components/BieuMau/GiayThoaThuanHTVLCT90_nien_kim_60_thang'))
export const GiayThoaThuanHTLS_VPBank = lazy(() => import('../components/BieuMau/GiayThoaThuanHTLS_VPBank'))
export const GiayThoaThuanHoTroVayLai = lazy(() => import('../components/BieuMau/GiayThoaThuanHoTroVayLai'))
export const DeXuatGiaban = lazy(() => import('../components/BieuMau/DeXuatGiaban'))
export const BIDV_ThoaThuanHoTroLaiVay = lazy(() => import('../components/BieuMau/BIDV_ThoaThuanHoTroLaiVay'))
export const PhieuDeNghiLapPhuKien = lazy(() => import('../components/BieuMau/PhieuDeNghiLapPhuKien'))
export const GiayXacNhanThongTinTangQua = lazy(() => import('../components/BieuMau/GiayXacNhanThongTinTangQua'))
