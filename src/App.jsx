import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Suspense } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Header from './components/Header'
import Footer from './components/Footer'
import ZaloFloatingButton from './components/ZaloFloatingButton'
import { CarPriceDataProvider } from './contexts/CarPriceDataContext'

// Import critical pages directly, lazy pages from LazyPages
import {
  Login,
  Home,
  Menu,
  Profile,
  Dashboard,
  CalculatorPage,
  CalculatorConfigAdminPage,
  QuanLyKhachHangPage,
  ContractFormPage,
  HopDongPage,
  HopDongDaXuatPage,
  EditHopDongDaXuatPage,
  NhanSuPage,
  DanhSachXePage,
  PromotionsPage,
  Invoice2Page,
  GiayXacNhan,
  GiayXacNhanThongTin,
  GiayDeNghiThanhToan,
  GiayXacNhanTangBaoHiem,
  PhuLucHopDong,
  DeNghiXuatHoaDon,
  HopDongMuaBanXe,
  TTHTLV_CDX_Shinhan_gui_DL,
  TT_HTLV_CDX_TPB,
  Thoa_thuan_ho_tro_lai_suat_vay_CDX_Vinfast_va_LFVN,
  PhieuTangBaoHiem,
  PhieuRutCoc,
  PDI_KH,
  GiayXacNhanThanhToanNH,
  GiayXacNhanTangBaoHiemVPBank,
  GiayXacNhanSKSM,
  GiayXacNhanPhaiThuKH_DL_Gui_NH,
  GiayXacNhanKieuLoai,
  GiayThoaThuanTraCham,
  GiayThoaThuanTraThay,
  GiayThoaThuanHTVLCT90_nien_kim_60_thang,
  GiayThoaThuanHTLS_VPBank,
  GiayThoaThuanHoTroVayLai,
  DeXuatGiaban,
  BIDV_ThoaThuanHoTroLaiVay,
  PhieuDeNghiLapPhuKien,
  GiayXacNhanThongTinTangQua
} from './pages/LazyPages'

// Loading fallback component for lazy-loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      <span className="text-gray-500 text-sm">Đang tải...</span>
    </div>
  </div>
)

// Wrapper for lazy-loaded routes with Suspense
const LazyRoute = ({ children }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
)

function App() {
  return (
    <Router>
      <CarPriceDataProvider>
        <div className="min-h-screen bg-gradient-to-b from-white to-slate-200 flex flex-col print:min-h-0 print:bg-white">
          <Header />

          {/* Routes */}
          <div className="flex-1">
            <Routes>
              {/* Critical routes - no lazy loading needed */}
              <Route path="/dang-nhap" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/trang-chu" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
              <Route path="/ho-so" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

              {/* Dashboard - lazy loaded (Chart.js heavy) */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <LazyRoute><Dashboard /></LazyRoute>
                </ProtectedRoute>
              } />

              {/* Calculator - lazy loaded */}
              <Route path="/bao-gia" element={
                <ProtectedRoute>
                  <LazyRoute><CalculatorPage /></LazyRoute>
                </ProtectedRoute>
              } />

              {/* Customer management - lazy loaded */}
              <Route path="/quan-ly-khach-hang" element={
                <ProtectedRoute>
                  <LazyRoute><QuanLyKhachHangPage /></LazyRoute>
                </ProtectedRoute>
              } />

              {/* Contract pages - lazy loaded */}
              <Route path="/hop-dong" element={
                <ProtectedRoute>
                  <LazyRoute><HopDongPage /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/hop-dong/them-moi" element={
                <ProtectedRoute>
                  <LazyRoute><ContractFormPage /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/hop-dong/chinh-sua" element={
                <ProtectedRoute>
                  <LazyRoute><ContractFormPage /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/hop-dong/chi-tiet" element={
                <ProtectedRoute>
                  <LazyRoute><ContractFormPage /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/hop-dong-da-xuat" element={
                <ProtectedRoute>
                  <LazyRoute><HopDongDaXuatPage /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/hop-dong-da-xuat/edit/:id" element={
                <ProtectedRoute>
                  <LazyRoute><EditHopDongDaXuatPage /></LazyRoute>
                </ProtectedRoute>
              } />

              {/* Other pages - lazy loaded */}
              <Route path="/nhan-su" element={
                <ProtectedRoute>
                  <LazyRoute><NhanSuPage /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/danh-sach-xe" element={
                <ProtectedRoute>
                  <LazyRoute><DanhSachXePage /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/them-chuong-trinh-uu-dai" element={
                <ProtectedRoute>
                  <LazyRoute><PromotionsPage /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/in-bao-gia-2" element={
                <ProtectedRoute>
                  <LazyRoute><Invoice2Page /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/quan-tri-bang-gia" element={
                <ProtectedRoute>
                  <LazyRoute><CalculatorConfigAdminPage /></LazyRoute>
                </ProtectedRoute>
              } />

              {/* BieuMau routes - all lazy loaded */}
              <Route path="/giay-xac-nhan" element={
                <ProtectedRoute>
                  <LazyRoute><GiayXacNhan /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/giay-xac-nhan-thong-tin" element={
                <ProtectedRoute>
                  <LazyRoute><GiayXacNhanThongTin /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/giay-de-nghi-thanh-toan" element={
                <ProtectedRoute>
                  <LazyRoute><GiayDeNghiThanhToan /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/giay-xac-nhan-tang-bao-hiem" element={
                <ProtectedRoute>
                  <LazyRoute><GiayXacNhanTangBaoHiem /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/phu-luc-hop-dong" element={
                <ProtectedRoute>
                  <LazyRoute><PhuLucHopDong /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/hop-dong-mua-ban-xe" element={
                <ProtectedRoute>
                  <LazyRoute><HopDongMuaBanXe /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/de-nghi-xuat-hoa-don" element={
                <ProtectedRoute>
                  <LazyRoute><DeNghiXuatHoaDon /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/thoa-thuan-ho-tro-lai-vay-shinhan-cdx" element={
                <ProtectedRoute>
                  <LazyRoute><TTHTLV_CDX_Shinhan_gui_DL /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/bieu-mau-tpbank" element={
                <ProtectedRoute>
                  <LazyRoute><TT_HTLV_CDX_TPB /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/thoa-thuan-ho-tro-lai-suat-vay-cdx-vinfast-va-lfvn" element={
                <ProtectedRoute>
                  <LazyRoute><Thoa_thuan_ho_tro_lai_suat_vay_CDX_Vinfast_va_LFVN /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/phieu-tang-bao-hiem" element={
                <ProtectedRoute>
                  <LazyRoute><PhieuTangBaoHiem /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/phieu-rut-coc" element={
                <ProtectedRoute>
                  <LazyRoute><PhieuRutCoc /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/pdi-kh" element={
                <ProtectedRoute>
                  <LazyRoute><PDI_KH /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/giay-xac-nhan-thanh-toan-nh" element={
                <ProtectedRoute>
                  <LazyRoute><GiayXacNhanThanhToanNH /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/giay-xac-nhan-tang-bao-hiem-vpbank" element={
                <ProtectedRoute>
                  <LazyRoute><GiayXacNhanTangBaoHiemVPBank /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/giay-xac-nhan-sksm" element={
                <ProtectedRoute>
                  <LazyRoute><GiayXacNhanSKSM /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/xac-nhan-cong-no" element={
                <ProtectedRoute>
                  <LazyRoute><GiayXacNhanPhaiThuKH_DL_Gui_NH /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/giay-xac-nhan-kieu-loai" element={
                <ProtectedRoute>
                  <LazyRoute><GiayXacNhanKieuLoai /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/giay-thoa-thuan-tra-cham" element={
                <ProtectedRoute>
                  <LazyRoute><GiayThoaThuanTraCham /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/giay-thoa-thuan-tra-thay" element={
                <ProtectedRoute>
                  <LazyRoute><GiayThoaThuanTraThay /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/giay-thoa-thuan-htvlct90-nien-kim-60-thang" element={
                <ProtectedRoute>
                  <LazyRoute><GiayThoaThuanHTVLCT90_nien_kim_60_thang /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/giay-thoa-thuan-htls-vpbank" element={
                <ProtectedRoute>
                  <LazyRoute><GiayThoaThuanHTLS_VPBank /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/giay-thoa-thuan-ho-tro-vay-lai" element={
                <ProtectedRoute>
                  <LazyRoute><GiayThoaThuanHoTroVayLai /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/de-xuat-gia-ban" element={
                <ProtectedRoute>
                  <LazyRoute><DeXuatGiaban /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/bidv-thoa-thuan-ho-tro-lai-vay" element={
                <ProtectedRoute>
                  <LazyRoute><BIDV_ThoaThuanHoTroLaiVay /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/phieu-de-nghi-lap-phu-kien" element={
                <ProtectedRoute>
                  <LazyRoute><PhieuDeNghiLapPhuKien /></LazyRoute>
                </ProtectedRoute>
              } />
              <Route path="/phieu-xac-nhan-thong-tin-tang-qua" element={
                <ProtectedRoute>
                  <LazyRoute><GiayXacNhanThongTinTangQua /></LazyRoute>
                </ProtectedRoute>
              } />
            </Routes>
          </div>

          {/* Footer */}
          <Footer />

          {/* Zalo floating button */}
          <ZaloFloatingButton />

          {/* Toast notifications */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </CarPriceDataProvider>
    </Router>
  )
}

export default App
