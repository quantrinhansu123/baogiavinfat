import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import {
  getBranchByShowroomName,
} from "../../data/branchData";
import { formatDate } from "../../utils/formatting";
import { downloadElementAsPdf } from "../../utils/pdfExport";

const GiayXacNhanKieuLoai = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);

  // Editable fields
  const [hopDongSo, setHopDongSo] = useState("S00901-VSO-25-09-0039");
  const [customerName, setCustomerName] = useState("Ngô Nguyên Hoài Nam");
  const [ngayKy, setNgayKy] = useState("29/09/2025");
  const [soLoai, setSoLoai] = useState("LIMO GREEN");
  const [thongTinHDMB, setThongTinHDMB] = useState("LIMO GREEN");
  const [thongTinTBPD, setThongTinTBPD] = useState("LIMO GREEN");
  const [thongTinGiayXN, setThongTinGiayXN] = useState("LIMO GREEN");
  const [ngayThang, setNgayThang] = useState("18");
  const [thangNam, setThangNam] = useState("11");
  const [nam, setNam] = useState("2025");

  useEffect(() => {
    const loadData = async () => {
      let showroomName = location.state?.showroom || "";
      let showroomLoadedFromContracts = false;

      // Nếu có firebaseKey, thử lấy showroom từ exportedContracts trước, sau đó mới từ contracts
      if (location.state?.firebaseKey) {
        try {
          const contractId = location.state.firebaseKey;
          
          // Thử load từ exportedContracts trước (dữ liệu mới nhất)
          const exportedContractsRef = ref(database, `exportedContracts/${contractId}`);
          const exportedSnapshot = await get(exportedContractsRef);
          
          if (exportedSnapshot.exists()) {
            const contractData = exportedSnapshot.val();
            console.log("Loaded from exportedContracts:", contractData);
            console.log("Showroom in exportedContracts:", contractData.showroom);
            if (contractData.showroom && contractData.showroom.trim() !== "") {
              showroomName = contractData.showroom;
              showroomLoadedFromContracts = true;
              console.log("Showroom loaded from exportedContracts:", showroomName);

              // Cập nhật branch info ngay khi load được showroom từ exportedContracts
              const branchInfo = getBranchByShowroomName(showroomName);
              setBranch(branchInfo);
            } else {
              // Nếu showroom rỗng hoặc null, đảm bảo branch = null
              showroomLoadedFromContracts = true;
              setBranch(null);
            }
          } else {
            // Nếu không có trong exportedContracts, thử load từ contracts
            const contractsRef = ref(database, `contracts/${contractId}`);
            const snapshot = await get(contractsRef);
            if (snapshot.exists()) {
              const contractData = snapshot.val();
              console.log("Loaded from contracts:", contractData);
              if (contractData.showroom && contractData.showroom.trim() !== "") {
                showroomName = contractData.showroom;
                showroomLoadedFromContracts = true;
                console.log("Showroom loaded from contracts:", showroomName);

                // Cập nhật branch info ngay khi load được showroom từ contracts
                const branchInfo = getBranchByShowroomName(showroomName);
                setBranch(branchInfo);
              } else {
                // Nếu showroom rỗng hoặc null, đảm bảo branch = null
                showroomLoadedFromContracts = true;
                setBranch(null);
              }
            } else {
              console.log("Contract not found in both exportedContracts and contracts paths");
            }
          }
        } catch (error) {
          console.error("Error loading showroom from database:", error);
        }
      } else {
        // Nếu không có firebaseKey, chỉ dùng location.state
        console.log("No firebaseKey, using only location.state");
      }

      // Set branch info nếu chưa load được từ contracts
      if (!showroomLoadedFromContracts) {
        if (showroomName && showroomName.trim() !== "") {
          const branchInfo = getBranchByShowroomName(showroomName);
          setBranch(branchInfo);
          console.log("Setting branch from location.state:", branchInfo);
        } else {
          // Đảm bảo branch = null khi không có showroom
          setBranch(null);
          console.log("No showroom from location.state, setting branch to null");
        }
      }

      // Set default date to today
      const today = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      setNgayThang(pad(today.getDate()));
      setThangNam(pad(today.getMonth() + 1));
      setNam(today.getFullYear().toString());

      // Load dữ liệu từ exportedContracts
      if (location.state?.firebaseKey) {
        try {
          const contractRef = ref(
            database,
            `exportedContracts/${location.state.firebaseKey}`
          );
          const snapshot = await get(contractRef);
          if (snapshot.exists()) {
            const contractData = snapshot.val();
            console.log("Loaded from exportedContracts:", contractData);

            // Showroom đã được load ở phần trên

            // Số hợp đồng (VSO)
            if (contractData.vso || contractData.VSO || contractData.contractNumber) {
              setHopDongSo(
                contractData.vso || contractData.VSO || contractData.contractNumber || ""
              );
            }

            // Tên khách hàng
            if (contractData.customerName || contractData["Tên KH"] || contractData["Tên Kh"]) {
              setCustomerName(
                contractData.customerName ||
                  contractData["Tên KH"] ||
                  contractData["Tên Kh"] ||
                  ""
              );
            }

            // Ngày ký (ngày hợp đồng)
            if (
              contractData["ngày xhd"] ||
              contractData.ngayXhd ||
              contractData.createdDate ||
              contractData.contractDate
            ) {
              const ngayHD =
                contractData["ngày xhd"] ||
                contractData.ngayXhd ||
                contractData.createdDate ||
                contractData.contractDate ||
                "";
              if (ngayHD) {
                setNgayKy(formatDate(ngayHD));
              }
            }

            // Hiệu xe / Model - áp dụng cho tất cả các trường
            if (contractData.dongXe || contractData.model || contractData["Dòng xe"]) {
              const modelValue =
                contractData.dongXe ||
                contractData.model ||
                contractData["Dòng xe"] ||
                "";
              setSoLoai(modelValue);
              setThongTinHDMB(modelValue);
              setThongTinTBPD(`VINFAST, ${modelValue}`);
              setThongTinGiayXN(modelValue);
            }
          }
        } catch (error) {
          console.error("Error loading contract data from exportedContracts:", error);
        }
      }

      if (location.state) {
        const stateData = location.state;
        setData(stateData);

        // Auto-fill từ location.state nếu có (override database nếu cần)
        if (stateData.contractNumber) setHopDongSo(stateData.contractNumber);
        if (stateData.customerName) setCustomerName(stateData.customerName);
        if (stateData.contractDate) setNgayKy(stateData.contractDate);
        if (stateData.hieuxe) {
          setSoLoai(stateData.hieuxe);
          setThongTinHDMB(stateData.hieuxe);
          setThongTinTBPD(stateData.hieuxe);
          setThongTinGiayXN(stateData.hieuxe);
        }
      } else {
        // Default data structure
        setData({
          contractNumber: "",
          contractDate: "",
          customerName: "",
          hieuxe: "",
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
          className="flex-1 bg-white p-8 flex flex-col"
          id="printable-content"
        >
          {/* Debug info - chỉ hiển thị khi không in */}
          <div className="print:hidden bg-yellow-100 p-3 mb-4 rounded border">
            <p className="text-sm"><strong>Debug Info:</strong></p>
            <p className="text-xs">Showroom từ location.state: {location.state?.showroom || "null"}</p>
            <p className="text-xs">Branch hiện tại: {branch ? branch.name : "null"}</p>
            <p className="text-xs">Firebase Key: {location.state?.firebaseKey || "null"}</p>
          </div>

          {/* Title */}
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold uppercase mb-2">
              GIẤY XÁC NHẬN THÔNG TIN
            </h1>
            <p className="text-sm italic">
              Áp dụng đối với trường hợp cần xác nhận thông tin PTYT
            </p>
          </div>

          {/* Main Content */}
          <div className="text-sm space-y-4">
            {/* Paragraph 1 */}
            <p className="text-left leading-relaxed leading-relaxed">
              Căn cứ vào Hợp đồng mua bán số:{" "}
              <strong>
                <span className="print:hidden">
                  <input
                    type="text"
                    value={hopDongSo}
                    onChange={(e) => setHopDongSo(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-64 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{hopDongSo}</span>
              </strong>{" "}
              giữa{" "}
              <strong>
                {branch ? (
                  `CHI NHÁNH ${branch.shortName?.toUpperCase()}-CÔNG TY CP ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG SÀI GÒN`
                ) : (
                  "[Chưa chọn showroom]"
                )}
              </strong>{" "}
              và Ông/ Bà{" "}
              <strong>
                <span className="print:hidden">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-64 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{customerName}</span>
              </strong>{" "}
              về việc thỏa thuận ký kết hợp đồng mua bán xe ngày{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={ngayKy}
                  onChange={(e) => setNgayKy(e.target.value)}
                  className="border-b border-gray-400 px-2 py-1 text-sm w-32 focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{ngayKy}</span>
            </p>

            {/* Paragraph 2 */}
            <p className="text-left leading-relaxed leading-relaxed">
              Xác nhận ô tô trong hợp đồng mua bán nêu trên và một số thông tin
              bên dưới là cùng một số loại xe của nhà sản xuất.
            </p>

            {/* Table */}
            <div className="my-6">
              <table className="w-full border-2 border-black">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="border-r border-black p-2 text-center w-16">
                      STT
                    </th>
                    <th className="border-r border-black p-2 text-center">
                      Đặc điểm của xe
                    </th>
                    <th className="border-r border-black p-2 text-center">
                      Thông tin trên HĐMB
                      <br />
                      và phi quyết
                    </th>
                    <th className="border-r border-black p-2 text-center">
                      Thông tin trên TBPĐ
                    </th>
                    <th className="p-2 text-center">
                      Thông tin trên giấy xác
                      <br />
                      nhận SK, SM
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-r border-t-2 border-black p-2 text-center">
                      1
                    </td>
                    <td className="border-r border-t-2 border-black p-2">
                      Số Loại (Model Code)
                    </td>
                    <td className="border-r border-t-2 border-black p-2 text-center">
                      <input
                        type="text"
                        value={thongTinHDMB}
                        onChange={(e) => setThongTinHDMB(e.target.value)}
                        className="w-full text-center text-sm px-1 py-1 bg-blue-50 border border-blue-300 rounded focus:outline-none focus:border-blue-500 focus:bg-white editable-field"
                        placeholder="Nhập thông tin HĐMB"
                      />
                    </td>
                    <td className="border-r border-t-2 border-black p-2 text-center">
                      <input
                        type="text"
                        value={thongTinTBPD}
                        onChange={(e) => setThongTinTBPD(e.target.value)}
                        className="w-full text-center text-sm px-1 py-1 bg-blue-50 border border-blue-300 rounded focus:outline-none focus:border-blue-500 focus:bg-white editable-field"
                        placeholder="Nhập thông tin TBPĐ"
                      />
                    </td>
                    <td className="border-t-2 border-black p-2 text-center">
                      <input
                        type="text"
                        value={thongTinGiayXN}
                        onChange={(e) => setThongTinGiayXN(e.target.value)}
                        className="w-full text-center text-sm px-1 py-1 bg-blue-50 border border-blue-300 rounded focus:outline-none focus:border-blue-500 focus:bg-white editable-field"
                        placeholder="Nhập thông tin giấy XN"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Paragraph 3 */}
            <p className="text-left leading-relaxed leading-relaxed">
              Tôi hoàn toàn chịu trách nhiệm cho các xác nhận nêu trên, trong
              trường hợp phát hiện ra các sai phạm và gây thiệt hại cho VPBank
              sẽ chịu mọi hình thức xử lý ký luật theo quy định của VPBank tùng
              thời kỳ.
            </p>

            {/* Date and Signature */}
            <div className="mt-6 text-center">
              <p className="text-sm mb-6">
                TP. Hồ Chí Minh, Ngày{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={ngayThang}
                    onChange={(e) => setNgayThang(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-12 text-center focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline date-blank">{ngayThang || "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}</span> tháng{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={thangNam}
                    onChange={(e) => setThangNam(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-12 text-center focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline date-blank">{thangNam || "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}</span> năm{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={nam}
                    onChange={(e) => setNam(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-16 text-center focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline date-blank">{nam || "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}</span>
              </p>

              <div className="text-center">
                <p className="font-bold text-sm mb-8 uppercase">
                  {branch ? (
                    <>
                      CÔNG TY CỔ PHẦN ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG SÀI
                      <br />
                      GÒN- CHI NHÁNH {branch.shortName?.toUpperCase()}
                    </>
                  ) : (
                    "[Chưa chọn showroom]"
                  )}
                </p>
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
          In Giấy Xác Nhận
        </button>
        <button
          onClick={() => { setDownloadingPdf(true); downloadElementAsPdf(printableRef.current, "giay-xac-nhan-kieu-loai").then(() => setDownloadingPdf(false)).catch(() => setDownloadingPdf(false)); }}
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

          .editable-field {
            border: none !important;
            background: transparent !important;
            text-align: center !important;
            outline: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .date-blank {
            border-bottom: 1px solid black !important;
            padding: 0 12px !important;
            margin: 0 4px !important;
            display: inline !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GiayXacNhanKieuLoai;
