import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import {
  getBranchByShowroomName,
  getDefaultBranch,
} from "../../data/branchData";
import { formatCurrency } from "../../utils/formatting";

const GiayXacNhanTangBaoHiemVPBank = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);

  // Editable fields
  const [ngayThang, setNgayThang] = useState("");
  const [thangNam, setThangNam] = useState("");
  const [nam, setNam] = useState("");
  const [kinhGui, setKinhGui] = useState("");
  const [bangBanNay, setBangBanNay] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [tenKhachHang, setTenKhachHang] = useState("");
  const [soHopDong, setSoHopDong] = useState("");
  const [ngayKy, setNgayKy] = useState("");
  const [thangKy, setThangKy] = useState("");
  const [namKy, setNamKy] = useState("");
  const [nguoiDuocBaoHiem, setNguoiDuocBaoHiem] = useState("");
  const [diaChiBH, setDiaChiBH] = useState("");
  const [hieuXe, setHieuXe] = useState("");
  const [soKhung, setSoKhung] = useState("");
  const [soMay, setSoMay] = useState("");
  const [giaTriXe, setGiaTriXe] = useState("");
  const [giaTriHopDongBH, setGiaTriHopDongBH] = useState("");
  const [soHopDongBH, setSoHopDongBH] = useState("");
  const [thoiHanBHTu, setThoiHanBHTu] = useState("");
  const [thoiHanBHDen, setThoiHanBHDen] = useState("");
  const [ngayCuoi, setNgayCuoi] = useState("");
  const [thangCuoi, setThangCuoi] = useState("");
  const [namCuoi, setNamCuoi] = useState("");

  useEffect(() => {
    const loadData = async () => {
      let showroomName = location.state?.showroom || "";

      // Nếu có firebaseKey, thử lấy showroom từ contracts
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

      // Set default date to today
      const today = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      setNgayThang(pad(today.getDate()));
      setThangNam(pad(today.getMonth() + 1));
      setNam(today.getFullYear().toString());
      setNgayCuoi(pad(today.getDate()));
      setThangCuoi(pad(today.getMonth() + 1));
      setNamCuoi(today.getFullYear().toString());

      if (location.state) {
        const stateData = location.state;
        setData(stateData);

        // Auto-fill từ location.state nếu có
        if (stateData.customerName) {
          setTenKhachHang(stateData.customerName);
          setNguoiDuocBaoHiem(stateData.customerName);
        }
        if (stateData.contractNumber) setSoHopDong(stateData.contractNumber);
        if (stateData.customerAddress) {
          setDiaChi(stateData.customerAddress);
          setDiaChiBH(stateData.customerAddress);
        }
        if (stateData.hieuxe) setHieuXe(stateData.hieuxe);
        if (stateData.soKhung) setSoKhung(stateData.soKhung);
        if (stateData.soMay) setSoMay(stateData.soMay);
        if (stateData.contractPrice) {
          setGiaTriXe(formatCurrency(stateData.contractPrice));
          setGiaTriHopDongBH(formatCurrency(stateData.contractPrice));
        }

        // Parse contract date if available
        if (stateData.contractDate) {
          const dateParts = stateData.contractDate.split("/");
          if (dateParts.length === 3) {
            setNgayKy(dateParts[0]);
            setThangKy(dateParts[1]);
            setNamKy(dateParts[2]);
          }
        }
      } else {
        // Default data structure
        setData({
          contractNumber: "",
          contractDate: "",
          customerName: "",
          customerAddress: "",
          hieuxe: "",
          soKhung: "",
          soMay: "",
          contractPrice: "",
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
          <div className="mb-6">
            <table className="w-full">
              <tbody>
                <tr>
                  {/* Left Column - Company info */}
                  <td
                    className="align-top text-center"
                    style={{ width: "50%" }}
                  >
                    <div className="text-sm font-bold leading-relaxed">
                      <p className="mb-1">CN TRƯỜNG CHINH - CÔNG TY</p>
                      <p className="mb-1">CP ĐẦU TƯ TM VÀ DV Ô TÔ</p>
                      <p className="mb-3">ĐÔNG SÀI GÒN</p>
                    </div>
                  </td>

                  {/* Right Column - Title */}
                  <td
                    className="align-top text-center"
                    style={{ width: "50%" }}
                  >
                    <div className="text-sm font-bold leading-relaxed">
                      <p className="mb-1">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                      <p className="mb-3">Độc lập – Tự do – Hạnh phúc</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Date */}
          <div className="text-center text-sm italic mb-6">
            <p>
              Tp.Hồ Chí Minh, ngày{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={ngayThang}
                  onChange={(e) => setNgayThang(e.target.value)}
                  className="border-b border-gray-400 px-1 text-sm w-8 text-center focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{ngayThang}</span> tháng{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={thangNam}
                  onChange={(e) => setThangNam(e.target.value)}
                  className="border-b border-gray-400 px-1 text-sm w-8 text-center focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{thangNam}</span> năm{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={nam}
                  onChange={(e) => setNam(e.target.value)}
                  className="border-b border-gray-400 px-1 text-sm w-12 text-center focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{nam}</span>
            </p>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold uppercase">
              GIẤY XÁC NHẬN TẶNG BẢO HIỂM
            </h1>
          </div>

          {/* Main Content */}
          <div className="text-sm space-y-3">
            {/* Kính gửi */}
            <p className="font-bold">Kính gửi:</p>

            <p>
              Bằng bản này :{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={bangBanNay}
                  onChange={(e) => setBangBanNay(e.target.value)}
                  className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{bangBanNay}</span>
            </p>

            <p>
              Địa chỉ:{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={diaChi}
                  onChange={(e) => setDiaChi(e.target.value)}
                  className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{diaChi}</span>
            </p>

            <p className="leading-relaxed">
              Xác nhận tặng bảo hiểm vật chất xe cho khách{" "}
              <strong>
                <span className="print:hidden">{"<<"}</span>
                <span className="print:hidden">
                  <input
                    type="text"
                    value={tenKhachHang}
                    onChange={(e) => setTenKhachHang(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-64 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{tenKhachHang}</span>
                <span className="print:hidden">{">>"}</span>
              </strong>
              theo hợp đồng mua bán số{" "}
              <strong>
                <span className="print:hidden">{"<<"}</span>
                <span className="print:hidden">
                  <input
                    type="text"
                    value={soHopDong}
                    onChange={(e) => setSoHopDong(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{soHopDong}</span>
                <span className="print:hidden">{">>"}</span>
              </strong>{" "}
              được kí ngày{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={ngayKy}
                  onChange={(e) => setNgayKy(e.target.value)}
                  className="border-b border-gray-400 px-1 text-sm w-8 text-center focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{ngayKy}</span> tháng{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={thangKy}
                  onChange={(e) => setThangKy(e.target.value)}
                  className="border-b border-gray-400 px-1 text-sm w-8 text-center focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{thangKy}</span> năm{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={namKy}
                  onChange={(e) => setNamKy(e.target.value)}
                  className="border-b border-gray-400 px-1 text-sm w-12 text-center focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{namKy}</span>
            </p>

            <p>
              Người được bảo hiểm:{" "}
              <strong>
                <span className="print:hidden">{"<<"}</span>
                <span className="print:hidden">
                  <input
                    type="text"
                    value={nguoiDuocBaoHiem}
                    onChange={(e) => setNguoiDuocBaoHiem(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-64 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{nguoiDuocBaoHiem}</span>
                <span className="print:hidden">{">>"}</span>
              </strong>
            </p>

            <p>
              Địa chỉ:{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={diaChiBH}
                  onChange={(e) => setDiaChiBH(e.target.value)}
                  className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{diaChiBH}</span>
            </p>

            <p>
              Hiệu xe:{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={hieuXe}
                  onChange={(e) => setHieuXe(e.target.value)}
                  className="border-b border-gray-400 px-2 py-1 text-sm w-64 focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{hieuXe}</span>
            </p>

            <p>
              Số khung:{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={soKhung}
                  onChange={(e) => setSoKhung(e.target.value)}
                  className="border-b border-gray-400 px-2 py-1 text-sm w-64 focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{soKhung}</span>
            </p>

            <p>
              Số máy:{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={soMay}
                  onChange={(e) => setSoMay(e.target.value)}
                  className="border-b border-gray-400 px-2 py-1 text-sm w-64 focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{soMay}</span>
            </p>

            <p>
              Giá trị xe : VND{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={giaTriXe}
                  onChange={(e) =>
                    setGiaTriXe(e.target.value.replace(/\D/g, ""))
                  }
                  className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">
                {formatCurrency(giaTriXe)}
              </span>
            </p>

            <p>
              Giá trị hợp đồng bảo hiểm : VND{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={giaTriHopDongBH}
                  onChange={(e) =>
                    setGiaTriHopDongBH(e.target.value.replace(/\D/g, ""))
                  }
                  className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">
                {formatCurrency(giaTriHopDongBH)}
              </span>
            </p>

            <p>
              Số hợp đồng bảo hiểm :{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={soHopDongBH}
                  onChange={(e) => setSoHopDongBH(e.target.value)}
                  className="border-b border-gray-400 px-2 py-1 text-sm w-64 focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{soHopDongBH}</span>
            </p>

            <p>
              Thời hạn bảo hiểm{" "}
              <strong>
                <span className="underline">Từ</span>
              </strong>{" "}
              <strong>
                <span className="underline">giờ</span>
              </strong>{" "}
              <strong>
                <span className="underline">phút</span>
              </strong>
              , ngày{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={thoiHanBHTu}
                  onChange={(e) => setThoiHanBHTu(e.target.value)}
                  className="border-b border-gray-400 px-2 py-1 text-sm w-32 focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{thoiHanBHTu}</span>{" "}
              <strong>
                <span className="underline">đến</span>
              </strong>{" "}
              <strong>
                <span className="underline">giờ</span>
              </strong>{" "}
              <strong>
                <span className="underline">phút</span>
              </strong>
              , ngày{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={thoiHanBHDen}
                  onChange={(e) => setThoiHanBHDen(e.target.value)}
                  className="border-b border-gray-400 px-2 py-1 text-sm w-32 focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{thoiHanBHDen}</span>
            </p>
          </div>

          {/* Footer - Date and Signature */}
          <div className="mt-12 text-center">
            <p className="text-sm mb-2">
              TP. Hồ Chí Minh, ngày{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={ngayCuoi}
                  onChange={(e) => setNgayCuoi(e.target.value)}
                  className="border-b border-gray-400 px-1 text-sm w-8 text-center focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{ngayCuoi}</span> tháng{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={thangCuoi}
                  onChange={(e) => setThangCuoi(e.target.value)}
                  className="border-b border-gray-400 px-1 text-sm w-8 text-center focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{thangCuoi}</span> năm{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={namCuoi}
                  onChange={(e) => setNamCuoi(e.target.value)}
                  className="border-b border-gray-400 px-1 text-sm w-12 text-center focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{namCuoi}</span> .
            </p>
            <p className="font-bold text-sm mb-20 mt-4">TỔNG GIÁM ĐỐC</p>
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
          In Giấy Xác Nhận
        </button>
      </div>

      <style>{`
        @media print {
          @page {
            margin: 5mm 20mm 5mm 20mm;
          }

          body * {
            visibility: hidden;
          }

          #printable-content,
          #printable-content * {
            visibility: visible;
          }

          #printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            min-height: calc(100vh - 10mm);
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            font-family: 'Times New Roman', Times, serif !important;
            display: flex !important;
            flex-direction: column !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: hidden !important;
            font-family: 'Times New Roman', Times, serif !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GiayXacNhanTangBaoHiemVPBank;
