import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import {
  getBranchByShowroomName,
  getDefaultBranch,
} from "../../data/branchData";
import { formatCurrency, formatDate } from "../../utils/formatting";
import { downloadElementAsPdf } from "../../utils/pdfExport";

const GiayXacNhanSKSM = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);

  // Editable fields
  const [maSoThue, setMaSoThue] = useState("");
  const [hieuxe, setHieuxe] = useState("");
  const [soKhung, setSoKhung] = useState("");
  const [soMay, setSoMay] = useState("");
  const [giaTriKhaiBao, setGiaTriKhaiBao] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCCCD, setCustomerCCCD] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [taiKhoan, setTaiKhoan] = useState("");
  const [nganHangNhan, setNganHangNhan] = useState("");

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
            if (contractData.showroom) {
              showroomName = contractData.showroom;
              showroomLoadedFromContracts = true;
              console.log("Showroom loaded from exportedContracts:", showroomName);

              // Cập nhật branch info ngay khi load được showroom từ exportedContracts
              const branchInfo = showroomName ? getBranchByShowroomName(showroomName) : null;
              setBranch(branchInfo);

              // Set mã số thuế từ branch
              if (branchInfo && branchInfo.taxCode) {
                setMaSoThue(branchInfo.taxCode);
              }

              // Set tài khoản từ branch
              if (branchInfo && branchInfo.bankAccount) {
                setTaiKhoan(
                  `${branchInfo.bankAccount} – tại ${
                    branchInfo.bankName || "VP Bank"
                  }`
                );
              }
            }
          } else {
            // Nếu không có trong exportedContracts, thử load từ contracts
            const contractsRef = ref(database, `contracts/${contractId}`);
            const snapshot = await get(contractsRef);
            if (snapshot.exists()) {
              const contractData = snapshot.val();
              console.log("Loaded from contracts:", contractData);
              if (contractData.showroom) {
                showroomName = contractData.showroom;
                showroomLoadedFromContracts = true;
                console.log("Showroom loaded from contracts:", showroomName);

                // Cập nhật branch info ngay khi load được showroom từ contracts
                const branchInfo = showroomName ? getBranchByShowroomName(showroomName) : null;
                setBranch(branchInfo);

                // Set mã số thuế từ branch
                if (branchInfo && branchInfo.taxCode) {
                  setMaSoThue(branchInfo.taxCode);
                }

                // Set tài khoản từ branch
                if (branchInfo && branchInfo.bankAccount) {
                  setTaiKhoan(
                    `${branchInfo.bankAccount} – tại ${
                      branchInfo.bankName || "VP Bank"
                    }`
                  );
                }
              }
            } else {
              console.log("Contract not found in both exportedContracts and contracts paths");
            }
          }
        } catch (error) {
          console.error("Error loading showroom from database:", error);
        }
      }

      // Set branch info nếu chưa load được từ contracts và có showroom
      if (!showroomLoadedFromContracts && showroomName) {
        const branchInfo = getBranchByShowroomName(showroomName);
        if (branchInfo) {
          setBranch(branchInfo);

          // Set mã số thuế từ branch
          if (branchInfo.taxCode) {
            setMaSoThue(branchInfo.taxCode);
          }

          // Set tài khoản từ branch
          if (branchInfo.bankAccount) {
            setTaiKhoan(
              `${branchInfo.bankAccount} – tại ${
                branchInfo.bankName || "VP Bank"
              }`
            );
          }
        }
      }

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

            // Hiệu xe
            if (
              contractData.dongXe ||
              contractData.model ||
              contractData["Dòng xe"]
            ) {
              setHieuxe(
                contractData.dongXe ||
                  contractData.model ||
                  contractData["Dòng xe"] ||
                  ""
              );
            }

            // Số khung
            if (
              contractData.soKhung ||
              contractData["Số Khung"] ||
              contractData.chassisNumber
            ) {
              setSoKhung(
                contractData.soKhung ||
                  contractData["Số Khung"] ||
                  contractData.chassisNumber ||
                  ""
              );
            }

            // Số máy
            if (
              contractData.soMay ||
              contractData["Số Máy"] ||
              contractData.engineNumber
            ) {
              setSoMay(
                contractData.soMay ||
                  contractData["Số Máy"] ||
                  contractData.engineNumber ||
                  ""
              );
            }

            // Giá trị khai báo
            if (
              contractData.giaHopDong ||
              contractData["Giá Hợp Đồng"] ||
              contractData.contractPrice ||
              contractData.giaHD ||
              contractData["Giá HD"]
            ) {
              const price =
                contractData.giaHopDong ||
                contractData["Giá Hợp Đồng"] ||
                contractData.contractPrice ||
                contractData.giaHD ||
                contractData["Giá HD"] ||
                "";
              if (price) {
                setGiaTriKhaiBao(formatCurrency(price.toString()));
              }
            }

            // Thông tin khách hàng
            // Tên khách hàng
            if (
              contractData.customerName ||
              contractData["Tên KH"] ||
              contractData["Tên Kh"]
            ) {
              setCustomerName(
                contractData.customerName ||
                  contractData["Tên KH"] ||
                  contractData["Tên Kh"] ||
                  ""
              );
            }

            // Địa chỉ khách hàng
            if (
              contractData.address ||
              contractData["Địa Chỉ"] ||
              contractData["Địa chỉ"]
            ) {
              setCustomerAddress(
                contractData.address ||
                  contractData["Địa Chỉ"] ||
                  contractData["Địa chỉ"] ||
                  ""
              );
            }

            // Email
            if (contractData.email || contractData.Email) {
              setCustomerEmail(contractData.email || contractData.Email || "");
            }

            // Điện thoại
            if (
              contractData.phone ||
              contractData["Số Điện Thoại"] ||
              contractData["Số điện thoại"]
            ) {
              setCustomerPhone(
                contractData.phone ||
                  contractData["Số Điện Thoại"] ||
                  contractData["Số điện thoại"] ||
                  ""
              );
            }

            // CCCD - format với ngày cấp và nơi cấp
            const cccdNumber =
              contractData.cccd ||
              contractData.CCCD ||
              contractData.customerCCCD ||
              "";
            const ngayCap =
              contractData.ngayCap ||
              contractData.issueDate ||
              contractData["Ngày Cấp"] ||
              contractData["Ngày cấp"] ||
              "";
            const noiCap =
              contractData.noiCap ||
              contractData.issuePlace ||
              contractData["Nơi Cấp"] ||
              contractData["Nơi cấp"] ||
              "";

            if (cccdNumber) {
              let cccdFormatted = `Số ${cccdNumber}`;
              if (ngayCap) {
                cccdFormatted += ` cấp ngày ${formatDate(ngayCap)}`;
              }
              if (noiCap) {
                cccdFormatted += `  bởi ${noiCap}`;
              }
              setCustomerCCCD(cccdFormatted);
            }
          }
        } catch (error) {
          console.error(
            "Error loading contract data from exportedContracts:",
            error
          );
        }
      }

      if (location.state) {
        const stateData = location.state;
        setData(stateData);

        // Auto-fill từ location.state nếu có (override database nếu cần)
        if (stateData.soKhung) setSoKhung(stateData.soKhung);
        if (stateData.soMay) setSoMay(stateData.soMay);
        if (stateData.hieuxe) setHieuxe(stateData.hieuxe);
        if (stateData.customerName) setCustomerName(stateData.customerName);
        if (stateData.customerAddress)
          setCustomerAddress(stateData.customerAddress);
        if (stateData.customerCCCD) setCustomerCCCD(stateData.customerCCCD);
        if (stateData.customerPhone) setCustomerPhone(stateData.customerPhone);
        if (stateData.customerEmail) setCustomerEmail(stateData.customerEmail);
        if (stateData.contractPrice)
          setGiaTriKhaiBao(formatCurrency(stateData.contractPrice));
      } else {
        // Default data structure
        setData({
          contractNumber: "",
          contractDate: "",
          customerName: "",
          customerAddress: "",
          soKhung: "",
          soMay: "",
          hieuxe: "",
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
          <div className="mb-4 print:mb-3">
            <table className="w-full border-2 border-black">
              <tbody>
                <tr>
                  {/* Left Column - Company info */}
                  <td
                    className="border-r-2 border-black p-3 align-top"
                    style={{ width: "50%" }}
                  >
                    <div className="text-sm leading-relaxed">
                      {branch ? (
                        <>
                          <span className="font-bold text-red-600 mb-2">
                            CÔNG TY CỔ PHẦN ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG
                            SÀI GÒN- CHI NHÁNH{" "}
                            {branch.shortName?.toUpperCase()}
                          </span>
                          <p className="font-bold text-red-600">
                            {branch.address}
                          </p>
                        </>
                      ) : (
                        <span className="font-bold text-red-600 mb-2">
                          [Chưa chọn showroom]
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Right Column - Title */}
                  <td
                    className="p-3 align-middle text-center"
                    style={{ width: "50%" }}
                  >
                    <div className="font-bold text-xs">
                      <p className="mb-1">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                      <p className="mt-4">Độc Lập – Tự Do – Hạnh Phúc</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Title */}
          <div className="text-center mb-4 print:mb-3">
            <h1 className="text-xl font-bold uppercase mb-2 print:mb-1">GIẤY XÁC NHẬN</h1>
          </div>

          {/* Main Content */}
          <div className="text-sm space-y-2 print:space-y-1">
            {/* Kính gửi */}
            <div className="flex items-start">
              <span className="font-bold inline-block w-20">Kính gửi:</span>
              <span className="font-bold flex-1">
                <span className="print:hidden">
                  <input
                    type="text"
                    value={nganHangNhan}
                    onChange={(e) => setNganHangNhan(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{nganHangNhan}</span>
              </span>
            </div>

            {/* Bên bán */}
            <div className="space-y-1 mt-2 print:mt-1">
              <div className="flex items-start">
                <span className="font-bold text-red-600 inline-block w-20">BÊN BÁN</span>
                <span className="inline-block w-4 text-center">:</span>
                <span className="font-bold text-red-600 flex-1">
                  {branch?.name || "[Chưa chọn showroom]"}
                </span>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-20">Địa chỉ</span>
                <span className="inline-block w-4 text-center">:</span>
                <span className="flex-1">
                  {branch?.address || "[Chưa có địa chỉ]"}
                </span>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-20">Đại diện bởi</span>
                <span className="inline-block w-4 text-center">:</span>
                <span className="flex-1">
                  <strong>Ông Nguyễn Thành Trai</strong>
                  <span className="ml-8">Chức vụ:</span>
                  <strong className="ml-2">Tổng Giám đốc</strong>
                </span>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-20">Tài khoản</span>
                <span className="inline-block w-4 text-center">:</span>
                <span className="flex-1">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={taiKhoan}
                      onChange={(e) => setTaiKhoan(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-64 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{taiKhoan}</span>
                </span>
              </div>
            </div>

            {/* Bên mua */}
            <div className="space-y-1 mt-2 print:mt-1">
              <div className="flex items-start">
                <span className="font-bold inline-block w-20">BÊN MUA</span>
                <span className="inline-block w-4 text-center">:</span>
                <span className="font-bold flex-1">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{customerName}</span>
                </span>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-20">Địa chỉ</span>
                <span className="inline-block w-4 text-center">:</span>
                <span className="flex-1">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{customerAddress}</span>
                </span>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-20">CCCD</span>
                <span className="inline-block w-4 text-center">:</span>
                <span className="flex-1">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={customerCCCD}
                      onChange={(e) => setCustomerCCCD(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{customerCCCD}</span>
                </span>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-20">Điện thoại</span>
                <span className="inline-block w-4 text-center">:</span>
                <span className="flex-1">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{customerPhone}</span>
                </span>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-20">Email</span>
                <span className="inline-block w-4 text-center">:</span>
                <span className="flex-1">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-64 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{customerEmail}</span>
                </span>
              </div>
            </div>

            {/* Mã số thuế */}
            <div className="mt-2 print:mt-1">
              <div className="flex items-start">
                <span className="font-bold inline-block w-20">Mã số thuế</span>
                <span className="inline-block w-4 text-center">:</span>
                <span className="font-bold text-red-600 flex-1">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={maSoThue}
                      onChange={(e) => setMaSoThue(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{maSoThue}</span>
                </span>
              </div>
              <p className="text-sm mt-1 print:mt-0">
                Bên Bán xác nhận Bên Mua có mua 1 chiếc ô tô của Bên Bán
              </p>
            </div>

            {/* Thông tin xe */}
            <div className="space-y-1 mt-2 print:mt-1">
              <div className="flex items-start">
                <span className="inline-block w-32">Hiệu xe</span>
                <span className="inline-block w-4 text-center">:</span>
                <span className="font-bold flex-1">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={hieuxe}
                      onChange={(e) => setHieuxe(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{hieuxe}</span>
                </span>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-32">Số khung</span>
                <span className="inline-block w-4 text-center">:</span>
                <span className="font-bold text-red-600 flex-1">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={soKhung}
                      onChange={(e) => setSoKhung(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-64 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{soKhung}</span>
                </span>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-32">Số máy</span>
                <span className="inline-block w-4 text-center">:</span>
                <span className="flex-1">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={soMay}
                      onChange={(e) => setSoMay(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-64 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{soMay}</span>
                </span>
              </div>
            </div>

            {/* Giá trị khai báo */}
            <div className="mt-2 print:mt-1 flex items-start">
              <span className="inline-block w-32">Giá trị khai báo</span>
              <span className="inline-block w-4 text-center">:</span>
              <span className="font-bold flex-1">
                <span className="print:hidden">
                  <input
                    type="text"
                    value={giaTriKhaiBao}
                    onChange={(e) => setGiaTriKhaiBao(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{giaTriKhaiBao}</span>
              </span>
            </div>
          </div>

          {/* Signature Section - flex-grow pushes footer to bottom */}
          <div className="mt-4 print:mt-2 flex-grow flex flex-col">
            <div className="text-right mr-16">
              <p className="font-bold text-sm">ĐẠI DIỆN BÊN BÁN</p>
              <div className="h-16 print:h-12"></div>
            </div>
          </div>

          {/* Footer - stays at bottom */}
          <div className="pt-4 w-full text-right mr-16 border-t border-black">
            <p className="text-sm italic">
              Biểu mẫu QTTCKT-BM06 ban hành lần 1 ngày 01/7/2014
            </p>
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
          onClick={() => { setDownloadingPdf(true); downloadElementAsPdf(printableRef.current, "giay-xac-nhan-sksm").then(() => setDownloadingPdf(false)).catch(() => setDownloadingPdf(false)); }}
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
            margin: 10mm;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: 277mm !important;
            max-height: 277mm !important;
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
            width: 190mm !important;
            height: 277mm !important;
            max-height: 277mm !important;
            display: flex !important;
            flex-direction: column !important;
            padding: 5mm !important;
            margin: 0 !important;
            background: white !important;
            font-family: 'Times New Roman', Times, serif !important;
            font-size: 10pt !important;
            line-height: 1.2 !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Prevent page breaks */
          #printable-content * {
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GiayXacNhanSKSM;
