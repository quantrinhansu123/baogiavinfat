import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import {
  getBranchByShowroomName,
  getDefaultBranch,
} from "../../data/branchData";
import vinfastLogo from "../../assets/vinfast.svg";
import { uploadImageToCloudinary } from "../../config/cloudinary";
import { toast } from "react-toastify";
import { downloadElementAsPdf } from "../../utils/pdfExport";

const PDI_KH = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);

  // Editable fields
  const [soPhieu, setSoPhieu] = useState("");
  const [khachHang, setKhachHang] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [dienThoai, setDienThoai] = useState("");
  const [fax, setFax] = useState("");
  const [email, setEmail] = useState("");
  const [mst, setMst] = useState("");
  const [nguoiLL, setNguoiLL] = useState("");

  // Thông tin xe
  const [bienSo, setBienSo] = useState("");
  const [hieuxe, setHieuxe] = useState("");
  const [model, setModel] = useState("");
  const [soKhung, setSoKhung] = useState("");
  const [soMay, setSoMay] = useState("");
  const [maMau, setMaMau] = useState("");
  const [namSX, setNamSX] = useState("");
  const [loaiCongViec, setLoaiCongViec] = useState("");
  const [soKM, setSoKM] = useState("");
  const [coVanDV, setCoVanDV] = useState("");
  const [dienThoaiDV, setDienThoaiDV] = useState("");
  const [tgXeVao, setTgXeVao] = useState("");

  // Time fields
  const [tgBatDauSC_Gio, setTgBatDauSC_Gio] = useState("");
  const [tgBatDauSC_Ngay, setTgBatDauSC_Ngay] = useState("");
  const [tgDuKienGiao_Gio, setTgDuKienGiao_Gio] = useState("");
  const [tgDuKienGiao_Ngay, setTgDuKienGiao_Ngay] = useState("");
  const [tgHoanTat_Gio, setTgHoanTat_Gio] = useState("");
  const [tgHoanTat_Ngay, setTgHoanTat_Ngay] = useState("");

  // Khách hàng yêu cầu
  const [ruaXe, setRuaXe] = useState(false);
  const [danhBongXe, setDanhBongXe] = useState(false);
  const [veSinhXe, setVeSinhXe] = useState(false);

  // Nguyên nhân có thể
  const [nguyenNhan, setNguyenNhan] = useState("");

  // Biện pháp xử lý
  const [bienPhap, setBienPhap] = useState("");

  // Kết quả
  const [ketQua, setKetQua] = useState("");

  // Lưu ý
  const [luuY, setLuuY] = useState("");

  // Bộ dụng cụ theo xe
  const [mucNhieuLieu, setMucNhieuLieu] = useState({
    "0": false,
    "1/4": false,
    "1/2": false,
    "3/4": false,
    "1": false,
  });

  // Phương thức thanh toán
  const [ttTienMat, setTtTienMat] = useState(false);
  const [ttChuyenKhoan, setTtChuyenKhoan] = useState(false);

  // Sơ đồ xe
  const [soDoXeImage, setSoDoXeImage] = useState("");
  const [uploadingSoDoXe, setUploadingSoDoXe] = useState(false);

  const handleSoDoXeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingSoDoXe(true);
      const url = await uploadImageToCloudinary(file);
      setSoDoXeImage(url);
      toast.success("Upload ảnh sơ đồ xe thành công!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Lỗi khi upload ảnh: " + error.message);
    } finally {
      setUploadingSoDoXe(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    const loadData = async () => {
      let showroomName = location.state?.showroom || "";

      if (location.state?.firebaseKey) {
        try {
          const contractRef = ref(
            database,
            `contracts/${location.state.firebaseKey}`
          );
          const snapshot = await get(contractRef);
          if (snapshot.exists()) {
            const contractData = snapshot.val();
            if (contractData.showroom) {
              showroomName = contractData.showroom;
            }
          }
        } catch (error) {
          console.error("Error loading contract data:", error);
        }
      }

      const branchInfo = showroomName ? getBranchByShowroomName(showroomName) : null;
      setBranch(branchInfo);

      if (location.state) {
        const stateData = location.state;
        setData(stateData);

        // Auto-fill từ location.state
        if (stateData.customerName || stateData.tenKh) {
          setKhachHang(stateData.customerName || stateData.tenKh);
        }
        if (stateData.customerAddress || stateData.diaChi) {
          setDiaChi(stateData.customerAddress || stateData.diaChi);
        }
        if (stateData.customerPhone || stateData.soDienThoai) {
          setDienThoai(stateData.customerPhone || stateData.soDienThoai);
        }
        if (stateData.customerEmail || stateData.email) {
          setEmail(stateData.customerEmail || stateData.email);
        }

        const carModel = stateData.hieuxe || stateData.dongXe || stateData.model;
        if (carModel) {
          setHieuxe(carModel);
          setModel(carModel);
        }

        if (stateData.soKhung) setSoKhung(stateData.soKhung);
        if (stateData.soMay) setSoMay(stateData.soMay);
        if (stateData.maMau || stateData.ngoaiThat) setMaMau(stateData.maMau || stateData.ngoaiThat);
        if (stateData.namSX) setNamSX(stateData.namSX);
      } else {
        setData({
          customerName: "",
          customerAddress: "",
          customerPhone: "",
          customerEmail: "",
          hieuxe: "",
          soKhung: "",
          soMay: "",
        });
      }
      setLoading(false);
    };

    loadData();
  }, [location.state]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        style={{ fontFamily: "Times New Roman" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 p-8"
      style={{ fontFamily: "Times New Roman" }}
    >
      <div className="max-w-4xl mx-auto print:max-w-4xl print:mx-auto">
        <div
          ref={printableRef}
          className="flex-1 bg-white p-8 print:pt-0 flex flex-col min-h-screen print:min-h-[calc(100vh-40mm)]"
          id="printable-content"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="w-32">
              <img src={vinfastLogo} alt="VinFast Logo" className="w-full" />
            </div>
            <div className="flex-1 text-center text-xs">
              <p className="font-bold">
                {branch?.name || "CÔNG TY CỔ PHẦN ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG SÀI GÒN"}
              </p>
              <p>{branch?.address || "391 Võ Nguyên Giáp, Phường An Khánh, Thành Phố Thủ Đức, Thành Phố Hồ Chí Minh"}</p>
            </div>
            <div className="w-20"></div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold uppercase">
              PHIẾU YÊU CẦU SỬA CHỮA
            </h1>
          </div>

          {/* Main Form */}
          <div className="text-xs space-y-2">
            {/* Số phiếu */}
            <div className="flex items-center border-b border-black pb-1">
              <span className="font-bold w-24">Số phiếu:</span>
              <span className="flex-1 print:hidden">
                <input
                  type="text"
                  value={soPhieu}
                  onChange={(e) => setSoPhieu(e.target.value)}
                  className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="flex-1 hidden print:inline">{soPhieu}</span>
            </div>

            {/* Thông tin khách hàng */}
            <div className="grid grid-cols-2 gap-x-4 border-b border-black pb-2">
              <div>
                <div className="mb-1">
                  <span className="font-bold">Khách hàng:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={khachHang}
                      onChange={(e) => setKhachHang(e.target.value)}
                      className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">{khachHang}</span>
                </div>
                <div className="mb-1">
                  <span className="font-bold">Địa chỉ:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={diaChi}
                      onChange={(e) => setDiaChi(e.target.value)}
                      className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">{diaChi}</span>
                </div>
                <div className="mb-1">
                  <span className="font-bold">Điện thoại:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={dienThoai}
                      onChange={(e) => setDienThoai(e.target.value)}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">{dienThoai}</span>
                </div>
                <div className="mb-1">
                  <span className="font-bold">Email:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">{email}</span>
                </div>
                <div>
                  <span className="font-bold">Người LL:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={nguoiLL}
                      onChange={(e) => setNguoiLL(e.target.value)}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">{nguoiLL}</span>
                </div>
              </div>
              <div>
                <div className="mb-1">
                  <span className="font-bold">Fax:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={fax}
                      onChange={(e) => setFax(e.target.value)}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">{fax}</span>
                </div>
                <div>
                  <span className="font-bold">MST:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={mst}
                      onChange={(e) => setMst(e.target.value)}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">{mst}</span>
                </div>
              </div>
            </div>

            {/* Thông tin xe */}
            <div className="border-b border-black pb-2">
              <div className="grid grid-cols-2 gap-x-4 mb-1">
                <div>
                  <span className="font-bold">Biển số:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={bienSo}
                      onChange={(e) => setBienSo(e.target.value)}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">{bienSo}</span>
                  <span className="ml-4 font-bold">Hiệu xe:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={hieuxe}
                      onChange={(e) => setHieuxe(e.target.value)}
                      className="border-b border-gray-400 px-1 w-24 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">{hieuxe}</span>
                </div>
                <div>
                  <span className="font-bold">Model:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">{model}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 mb-1">
                <div>
                  <span className="font-bold">Số khung:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={soKhung}
                      onChange={(e) => setSoKhung(e.target.value)}
                      className="border-b border-gray-400 px-1 w-40 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">{soKhung}</span>
                </div>
                <div>
                  <span className="font-bold">Số máy:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={soMay}
                      onChange={(e) => setSoMay(e.target.value)}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">{soMay}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 mb-1">
                <div>
                  <span className="font-bold">Mã màu /NT:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={maMau}
                      onChange={(e) => setMaMau(e.target.value)}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">{maMau}</span>
                </div>
                <div>
                  <span className="font-bold">Năm SX:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={namSX}
                      onChange={(e) => setNamSX(e.target.value)}
                      className="border-b border-gray-400 px-1 w-24 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">{namSX}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 mb-1">
                <div>
                  <span className="font-bold">Loại công việc:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={loaiCongViec}
                      onChange={(e) => setLoaiCongViec(e.target.value)}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">
                    {loaiCongViec}
                  </span>
                </div>
                <div>
                  <span className="font-bold">Số KM:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={soKM}
                      onChange={(e) => setSoKM(e.target.value)}
                      className="border-b border-gray-400 px-1 w-24 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">{soKM}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 mb-1">
                <div>
                  <span className="font-bold">Cố vấn DV:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={coVanDV}
                      onChange={(e) => setCoVanDV(e.target.value)}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">{coVanDV}</span>
                </div>
                <div>
                  <span className="font-bold">Điện thoại:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={dienThoaiDV}
                      onChange={(e) => setDienThoaiDV(e.target.value)}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">
                    {dienThoaiDV}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4">
                <div>
                  <span className="font-bold">T/G xe vào:</span>
                  <span className="ml-2 print:hidden">
                    <input
                      type="text"
                      value={tgXeVao}
                      onChange={(e) => setTgXeVao(e.target.value)}
                      className="border-b border-gray-400 px-1 w-24 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="ml-2 hidden print:inline">{tgXeVao}</span>
                </div>
              </div>
              <div className="text-xs mt-1 italic flex flex-wrap items-center gap-1">
                <span>TG bắt đầu SC:</span>
                <span className="print:hidden">
                  <input
                    type="text"
                    value={tgBatDauSC_Gio}
                    onChange={(e) => setTgBatDauSC_Gio(e.target.value)}
                    className="border-b border-gray-400 px-1 w-12 text-center focus:outline-none focus:border-blue-500"
                    placeholder="giờ"
                  />
                </span>
                <span className="hidden print:inline">{tgBatDauSC_Gio || "......."}</span>
                <span>giờ</span>

                <span className="print:hidden">
                  <input
                    type="text"
                    value={tgBatDauSC_Ngay}
                    onChange={(e) => setTgBatDauSC_Ngay(e.target.value)}
                    className="border-b border-gray-400 px-1 w-20 text-center focus:outline-none focus:border-blue-500"
                    placeholder="ngày/tháng"
                  />
                </span>
                <span className="hidden print:inline">{tgBatDauSC_Ngay || "........./......../............."}</span>

                <span className="ml-4">TG dự kiến giao xe:</span>
                <span className="print:hidden">
                  <input
                    type="text"
                    value={tgDuKienGiao_Gio}
                    onChange={(e) => setTgDuKienGiao_Gio(e.target.value)}
                    className="border-b border-gray-400 px-1 w-12 text-center focus:outline-none focus:border-blue-500"
                    placeholder="giờ"
                  />
                </span>
                <span className="hidden print:inline">{tgDuKienGiao_Gio || "......."}</span>
                <span>giờ</span>

                <span className="print:hidden">
                  <input
                    type="text"
                    value={tgDuKienGiao_Ngay}
                    onChange={(e) => setTgDuKienGiao_Ngay(e.target.value)}
                    className="border-b border-gray-400 px-1 w-20 text-center focus:outline-none focus:border-blue-500"
                    placeholder="ngày/tháng"
                  />
                </span>
                <span className="hidden print:inline">{tgDuKienGiao_Ngay || "........./......../............."}</span>

                <span className="ml-4">TG hoàn tất CV thực tế:</span>
                <span className="print:hidden">
                  <input
                    type="text"
                    value={tgHoanTat_Gio}
                    onChange={(e) => setTgHoanTat_Gio(e.target.value)}
                    className="border-b border-gray-400 px-1 w-12 text-center focus:outline-none focus:border-blue-500"
                    placeholder="giờ"
                  />
                </span>
                <span className="hidden print:inline">{tgHoanTat_Gio || "....."}</span>
                <span>giờ</span>

                <span className="print:hidden">
                  <input
                    type="text"
                    value={tgHoanTat_Ngay}
                    onChange={(e) => setTgHoanTat_Ngay(e.target.value)}
                    className="border-b border-gray-400 px-1 w-20 text-center focus:outline-none focus:border-blue-500"
                    placeholder="ngày/tháng"
                  />
                </span>
                <span className="hidden print:inline">{tgHoanTat_Ngay || "......../......./.........."}</span>
              </div>
            </div>

            {/* Khách hàng yêu cầu */}
            <div className="border-b border-black pb-2">
              <div className="flex items-center gap-8">
                <span className="font-bold">Khách hàng yêu cầu:</span>
                <div className="flex gap-6">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={ruaXe}
                      onChange={(e) => setRuaXe(e.target.checked)}
                      className="print:hidden"
                    />
                    <span className="hidden print:inline">
                      {ruaXe ? "☑" : "☐"}
                    </span>
                    <span>Rửa xe</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={danhBongXe}
                      onChange={(e) => setDanhBongXe(e.target.checked)}
                      className="print:hidden"
                    />
                    <span className="hidden print:inline">
                      {danhBongXe ? "☑" : "☐"}
                    </span>
                    <span>Đánh bóng xe</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={veSinhXe}
                      onChange={(e) => setVeSinhXe(e.target.checked)}
                      className="print:hidden"
                    />
                    <span className="hidden print:inline">
                      {veSinhXe ? "☑" : "☐"}
                    </span>
                    <span>Vệ sinh xe</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Nguyên nhân có thể */}
            <div className="border-b border-black pb-2">
              <p className="font-bold underline mb-2">Nguyên nhân có thể :</p>
              <span className="print:hidden">
                <textarea
                  value={nguyenNhan}
                  onChange={(e) => setNguyenNhan(e.target.value)}
                  className="border border-gray-400 px-2 py-1 w-full h-16 focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline whitespace-pre-line">
                {nguyenNhan}
              </span>
            </div>

            {/* Biện pháp xử lý */}
            <div className="border-b border-black pb-2">
              <p className="font-bold underline mb-2">Biện pháp xử lý</p>
              <span className="print:hidden">
                <textarea
                  value={bienPhap}
                  onChange={(e) => setBienPhap(e.target.value)}
                  className="border border-gray-400 px-2 py-1 w-full h-16 focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline whitespace-pre-line">
                {bienPhap}
              </span>
            </div>

            {/* Kết quả */}
            <div className="border-b border-black pb-2">
              <p className="font-bold underline mb-2">Kết quả :</p>
              <span className="print:hidden">
                <textarea
                  value={ketQua}
                  onChange={(e) => setKetQua(e.target.value)}
                  className="border border-gray-400 px-2 py-1 w-full h-16 focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline whitespace-pre-line">
                {ketQua}
              </span>
            </div>

            {/* Lưu ý */}
            <div className="border-b border-black pb-2">
              <p className="font-bold underline mb-2">Lưu ý :</p>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <span className="print:hidden">
                    <textarea
                      value={luuY}
                      onChange={(e) => setLuuY(e.target.value)}
                      className="border border-gray-400 px-2 py-1 w-full h-24 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline whitespace-pre-line">
                    {luuY}
                  </span>
                </div>
                <div className="w-32 h-32 border border-black flex items-center justify-center relative group">
                  {soDoXeImage ? (
                    <>
                      <img
                        src={soDoXeImage}
                        alt="Sơ đồ xe"
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => setSoDoXeImage("")}
                        className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                        title="Xóa ảnh"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                      <span className="text-xs text-gray-400 text-center px-1">
                        {uploadingSoDoXe ? "Đang tải..." : "Sơ đồ xe (Click tải ảnh)"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSoDoXeUpload}
                        className="hidden"
                        disabled={uploadingSoDoXe}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Footer section */}
            <div className="pt-4">
              <div className="flex justify-between items-start">
                <div className="text-xs max-w-[60%]">
                  <p className="mb-2">
                    Quý khách hàng không nên để tiền bạc, tư trang quí giá, vũ khí quân dụng trên xe khi xe đang sửa chữa
                  </p>

                  {/* Phương thức thanh toán */}
                  <div className="mt-4 border border-black p-2">
                    <p className="font-bold mb-2">Phương thức thanh toán:</p>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={ttTienMat}
                          onChange={(e) => setTtTienMat(e.target.checked)}
                          className="print:hidden"
                        />
                        <span className="hidden print:inline">
                          {ttTienMat ? "☑" : "☐"}
                        </span>
                        <span>Tiền mặt</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={ttChuyenKhoan}
                          onChange={(e) => setTtChuyenKhoan(e.target.checked)}
                          className="print:hidden"
                        />
                        <span className="hidden print:inline">
                          {ttChuyenKhoan ? "☑" : "☐"}
                        </span>
                        <span>Chuyển khoản</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border border-black p-2 text-xs">
                  <p className="mb-2">
                    <strong>Bộ dụng cụ theo xe:</strong>
                  </p>
                  <div className="mb-2">
                    <p className="mb-1">Mức nhiên liệu trên xe:</p>
                    <div className="flex gap-1">
                      {["0", "1/4", "1/2", "3/4", "1"].map((level) => (
                        <label key={level} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={mucNhieuLieu[level]}
                            onChange={(e) =>
                              setMucNhieuLieu({
                                ...mucNhieuLieu,
                                [level]: e.target.checked,
                              })
                            }
                            className="print:hidden mr-1"
                          />
                          <span className="hidden print:inline mr-1">
                            {mucNhieuLieu[level] ? "☑" : "☐"}
                          </span>
                          <span className="text-xs">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature */}
              <div className="mt-2 flex justify-between text-xs">
                <div className="text-center flex-1">
                  <p className="font-bold mb-12">TƯ VẤN BÁN HÀNG</p>
                </div>
                <div className="text-center flex-1">
                  <p className="font-bold mb-12">TP.KINH DOANH</p>
                </div>
                <div className="text-center flex-1">
                  <p className="font-bold mb-12">TỔNG GĐ/GIÁM ĐỐC</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center mt-8 print:hidden flex flex-wrap justify-center gap-3">
        <button
          onClick={handleBack}
          className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
        >
          Quay lại
        </button>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          In Phiếu
        </button>
        <button
          onClick={() => { setDownloadingPdf(true); downloadElementAsPdf(printableRef.current, "pdi-kh").then(() => setDownloadingPdf(false)).catch(() => setDownloadingPdf(false)); }}
          disabled={downloadingPdf}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {downloadingPdf ? "Đang tạo PDF..." : "Tải PDF"}
        </button>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 8mm;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: 297mm !important;
            overflow: hidden !important;
          }

          body * {
            visibility: hidden;
          }

          #printable-content,
          #printable-content * {
            visibility: visible;
          }

          .min-h-screen {
            min-height: 0 !important;
            height: auto !important;
          }

          #printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 194mm !important;
            min-height: 0 !important;
            height: auto !important;
            max-height: 281mm !important;
            overflow: hidden !important;
            padding: 3mm !important;
            margin: 0 !important;
            background: white !important;
            font-family: 'Times New Roman', Times, serif !important;
            font-size: 10pt !important;
            line-height: 1.2 !important;
            box-sizing: border-box !important;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PDI_KH;
