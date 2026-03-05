import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getBranchByShowroomName,
  getDefaultBranch,
} from "../../data/branchData";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import { formatCurrency } from "../../utils/formatting";
import { PrintStyles } from "./PrintStyles";
import { downloadElementAsPdf } from "../../utils/pdfExport";

const GiayXacNhanTangBaoHiem = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nganHangName, setNganHangName] = useState(
    "NGÂN HÀNG TMCP VIỆT NAM THỊNH VƯỢNG"
  );
  const [recipientInfo, setRecipientInfo] = useState(
    "TRUNG TÂM THẾ CHẤP VÙNG 9"
  );
  const [insuranceContract, setInsuranceContract] = useState("");
  const [insuranceValue, setInsuranceValue] = useState("");
  const [insuranceStart, setInsuranceStart] = useState("");
  const [insuranceEnd, setInsuranceEnd] = useState("");
  const [branch, setBranch] = useState(null);
  const [startHour, setStartHour] = useState("10");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("09");
  const [endMinute, setEndMinute] = useState("59");



  useEffect(() => {
    const loadData = async () => {
      if (location.state) {
        const incoming = location.state;
        const formatDateString = (val) => {
          if (!val) return null;
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) return val;
          const d = new Date(val);
          if (isNaN(d)) return val;
          const pad = (n) => String(n).padStart(2, "0");
          return `${pad(d.getDate())}/${pad(
            d.getMonth() + 1
          )}/${d.getFullYear()}`;
        };

        const formatDateToVNPartial = (val) => {
          if (!val) return null;
          // if already contains 'tháng' assume it's formatted
          if (/tháng/i.test(val) && /năm/i.test(val)) return val;
          // parse common dd/mm/yyyy or ISO
          let d = null;
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) {
            const [dd, mm, yyyy] = val.split("/");
            return `${dd.padStart(2, "0")} tháng ${mm.padStart(
              2,
              "0"
            )} năm ${yyyy}`;
          }
          d = new Date(val);
          if (isNaN(d)) return val;
          const pad = (n) => String(n).padStart(2, "0");
          return `${pad(d.getDate())} tháng ${pad(
            d.getMonth() + 1
          )} năm ${d.getFullYear()}`;
        };

        // Lấy thông tin chi nhánh
        let showroomName = incoming.showroom || "";
        let contractDataFromDB = null;

        // Nếu có firebaseKey, thử lấy dữ liệu từ exportedContracts hoặc contracts
        if (incoming.firebaseKey) {
          try {
            const contractId = incoming.firebaseKey;
            // Thử exportedContracts trước (vì đây là từ trang hợp đồng đã xuất)
            let contractsRef = ref(database, `exportedContracts/${contractId}`);
            let snapshot = await get(contractsRef);

            // Nếu không có trong exportedContracts, thử contracts
            if (!snapshot.exists()) {
              contractsRef = ref(database, `contracts/${contractId}`);
              snapshot = await get(contractsRef);
            }

            if (snapshot.exists()) {
              contractDataFromDB = snapshot.val();
              if (contractDataFromDB.showroom) {
                showroomName = contractDataFromDB.showroom;
              }
            }
          } catch (err) {
            console.error("Error loading contract from database:", err);        
          }
        }

        // Chỉ set branch khi có showroom được chọn
        const branchInfo = showroomName ? getBranchByShowroomName(showroomName) : null;
        setBranch(branchInfo);

        // Map dữ liệu từ incoming và contractDataFromDB
        // Ưu tiên contractDataFromDB nếu có, sau đó mới đến incoming
        const getValue = (field, dbField = null) => {
          if (contractDataFromDB) {
            // Thử các tên field khác nhau từ database
            const dbValue = dbField
              ? contractDataFromDB[dbField] || contractDataFromDB[field]        
              : contractDataFromDB[field];
            if (dbValue) return dbValue;
          }
          return incoming[field] || incoming[dbField] || "";
        };

        const processedData = {
          customerName:
            getValue("customerName", "Tên KH") ||
            getValue("tenKh", "Tên Kh") ||
            "",
          contractNumber:
            getValue("vso", "VSO") ||
            getValue("contractNumber", "") || "",
          createdAt:
            formatDateToVNPartial(
              getValue("createdAt", "ngày xhd") ||
              getValue("ngayXhd", "ngày XHD")
            ) || "",
          model:
            getValue("model", "Dòng xe") ||
            getValue("dongXe", "Dòng Xe") ||
            "",
          vin:
            getValue("vin", "Số Khung") ||
            getValue("soKhung", "soKhung") ||
            getValue("chassisNumber", "") ||
            "",
          engineNumber:
            getValue("engineNumber", "Số Máy") ||
            getValue("soMay", "soMay") ||
            "",
          vehicleValue:
            getValue("vehicleValue", "Giá Hợp Đồng") ||
            getValue("contractPrice", "giaHopDong") ||
            getValue("giaHopDong", "") ||
            "",
          insuranceValue:
            getValue("insuranceValue", "") || "",
          insuranceContract:
            getValue("insuranceContract", "") || "",
          insuranceStart:
            getValue("insuranceStart", "") || "",
          insuranceEnd:
            getValue("insuranceEnd", "") || "",
          customerAddress:
            getValue("customerAddress", "Địa Chỉ") ||
            getValue("address", "diaChi") ||
            getValue("diaChi", "") ||
            "",
          showroom: showroomName || "",
        };
        setData(processedData);
        // Initialize editable fields from data
        setInsuranceContract(processedData.insuranceContract);
        setInsuranceValue(processedData.insuranceValue);
        setInsuranceStart(convertToDateInput(processedData.insuranceStart));    
        setInsuranceEnd(convertToDateInput(processedData.insuranceEnd));        
        if (incoming.recipientInfo) {
          setRecipientInfo(incoming.recipientInfo);
        }
        if (incoming.nganHangName) {
          setNganHangName(incoming.nganHangName);
        }
      } else {
        // Không có dữ liệu, không set branch mặc định
        setBranch(null);
        const defaultData = {
          customerName: "",
          contractNumber: "",
          createdAt: "",
          model: "",
          vin: "",
          engineNumber: "",
          vehicleValue: "",
          insuranceValue: "",
          insuranceContract: "",
          insuranceStart: "",
          insuranceEnd: "",
          customerAddress: "",
          showroom: "",
        };
        setData(defaultData);
        // Initialize editable fields from default data
        setInsuranceContract(defaultData.insuranceContract);
        setInsuranceValue(defaultData.insuranceValue);
        setInsuranceStart(defaultData.insuranceStart);
        setInsuranceEnd(defaultData.insuranceEnd);
      }
      setLoading(false);
    };

    loadData();
  }, [location.state]);

  // Helper function to convert dd/mm/yyyy to yyyy-mm-dd (for input date)       
  const convertToDateInput = (dateString) => {
    if (!dateString) return "";
    // If already in yyyy-mm-dd format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    // If in dd/mm/yyyy format, convert to yyyy-mm-dd
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      const [dd, mm, yyyy] = dateString.split("/");
      return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    // Try to parse as date
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      // If can't parse, return empty
    }
    return "";
  };

  // Helper function to convert yyyy-mm-dd to dd/mm/yyyy (for display)
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    // If already in dd/mm/yyyy format, return as is
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) return dateString;        
    // If in yyyy-mm-dd format, convert to dd/mm/yyyy
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [yyyy, mm, dd] = dateString.split("-");
      return `${dd}/${mm}/${yyyy}`;
    }
    // Try to parse as date
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (e) {
      // If can't parse, return empty
    }
    return dateString;
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Current date formatted for header
  const today = new Date();
  const headerDate = `Tp.HCM, ngày ${today.getDate()} tháng ${
    today.getMonth() + 1
  } năm ${today.getFullYear()}`;

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

  if (!data) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"    
        style={{ fontFamily: "Times New Roman" }}
      >
        <div className="text-center">
          <p className="text-red-600 mb-4">Không có dữ liệu</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 p-8"
      style={{ fontFamily: "Times New Roman" }}
    >
      <PrintStyles />
      <div className="flex gap-6 max-w-4xl mx-auto print:max-w-4xl print:mx-auto">
        <div ref={printableRef} className="flex-1 bg-white p-8" id="printable-content">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {branch ? (
                  <>
                    <p className="font-bold text-sm mb-1 uppercase">
                      CN {branch.shortName?.toUpperCase()} - CÔNG TY
                    </p>
                    <p className="font-bold text-sm mb-1 uppercase">
                      CP ĐẦU TƯ TM VÀ DV Ô TÔ
                    </p>
                    <p className="font-bold text-sm uppercase">ĐÔNG SÀI GÒN</p>
                  </>
                ) : (
                  <p className="font-bold text-sm text-gray-400">
                    [Chưa chọn showroom]
                  </p>
                )}
              </div>

              <div className="flex-1 text-center">
                <p className="font-bold text-sm mb-1 uppercase">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="font-bold text-sm mb-1 uppercase">
                  Độc lập – Tự do – Hạnh phúc
                </p>
                <p className="italic text-sm mt-4">{headerDate}</p>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-center mb-8 uppercase">
            GIẤY XÁC NHẬN TẶNG BẢO HIỂM
          </h1>

          {/* Recipient */}
          <div className="mb-6">
            <div className="font-bold mb-1 text-center flex flex-col items-center">
              <p><strong>Kính gởi:</strong></p>
              <div className="max-w-lg">
                <span className="print:hidden">
                  <input
                    type="text"
                    value={nganHangName}
                    onChange={(e) => setNganHangName(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm font-bold w-full focus:outline-none focus:border-blue-500 text-center"
                    placeholder="NGÂN HÀNG TMCP VIỆT NAM THỊNH VƯỢNG"
                  />
                </span>
                <span className="hidden print:inline uppercase">{nganHangName}</span>     
              </div>
              <div className="max-w-md">
                –{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={recipientInfo}
                    onChange={(e) => setRecipientInfo(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm font-bold w-full focus:outline-none focus:border-blue-500 text-center"
                    placeholder="TRUNG TÂM THẾ CHẤP VÙNG 9"
                  />
                </span>
                <span className="hidden print:inline uppercase">{recipientInfo}</span>    
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="mb-6 text-sm space-y-1">
            {branch ? (
              <>
                <div className="info-row grid-cols-[120px_1fr]">
                  <span className="info-label w-[120px]">Bằng bản này:</span>
                  <div className="info-value uppercase font-bold">
                    {branch.name}
                  </div>
                </div>

                <div className="info-row grid-cols-[120px_1fr]">
                  <span className="info-label w-[120px]">Địa chỉ:</span>
                  <div className="info-value">
                    {branch.address}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="info-row grid-cols-[120px_1fr]">
                  <span className="info-label w-[120px]">Bằng bản này:</span>
                  <div className="info-value text-gray-400">
                    [Chưa chọn showroom]
                  </div>
                </div>
                <div className="info-row grid-cols-[120px_1fr]">
                  <span className="info-label w-[120px]">Địa chỉ:</span>
                  <div className="info-value text-gray-400">
                    [Chưa có địa chỉ]
                  </div>
                </div>
              </>
            )}

            <p className="mt-4 mb-4">
              Xác nhận tặng bảo hiểm vật chất xe cho khách{" "}
              <strong>{data.customerName}</strong> theo hợp đồng mua bán số{" "}
              {data.contractNumber} được kí ngày {data.createdAt}.
            </p>

            <div className="space-y-1 mt-4">
              <div className="info-row grid-cols-[200px_1fr]">
                <span className="info-label w-[200px]">Người được bảo hiểm:</span>
                <div className="info-value font-bold uppercase">{data.customerName}</div>
              </div>
              <div className="info-row grid-cols-[200px_1fr]">
                <span className="info-label w-[200px]">Địa chỉ:</span>
                <div className="info-value font-bold">{data.customerAddress || ""}</div>
              </div>
              <div className="info-row grid-cols-[200px_1fr]">
                <span className="info-label w-[200px]">Hiệu xe:</span>
                <div className="info-value font-bold">{data?.model || ""}</div>
              </div>
              <div className="info-row grid-cols-[200px_1fr]">
                <span className="info-label w-[200px]">Số khung:</span>
                <div className="info-value font-bold uppercase">{data?.vin || ""}</div>
              </div>
              <div className="info-row grid-cols-[200px_1fr]">
                <span className="info-label w-[200px]">Số máy:</span>
                <div className="info-value font-bold uppercase">{data?.engineNumber || ""}</div>
              </div>
              <div className="info-row grid-cols-[200px_1fr]">
                <span className="info-label w-[200px]">Giá trị xe:</span>
                <div className="info-value font-bold">{formatCurrency(data?.vehicleValue || "")} vnđ</div>
              </div>
              <div className="info-row grid-cols-[200px_1fr]">
                <span className="info-label w-[200px]">Giá trị hợp đồng bảo hiểm:</span>
                <div className="info-value font-bold">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={insuranceValue}
                      onChange={(e) => setInsuranceValue(e.target.value)}       
                      className="border-b border-gray-400 px-2 py-1 text-sm font-bold w-full max-w-md focus:outline-none focus:border-blue-500"
                      placeholder={data.insuranceValue}
                    />
                  </span>
                  <span className="hidden print:inline">
                    {formatCurrency(insuranceValue || data.insuranceValue)} vnđ
                  </span>
                </div>
              </div>
              <div className="info-row grid-cols-[200px_1fr]">
                <span className="info-label w-[200px]">Số hợp đồng bảo hiểm:</span>
                <div className="info-value font-bold">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={insuranceContract}
                      onChange={(e) => setInsuranceContract(e.target.value)}    
                      className="border-b border-gray-400 px-2 py-1 text-sm font-bold w-full max-w-md focus:outline-none focus:border-blue-500"
                      placeholder={data.insuranceContract}
                    />
                  </span>
                  <span className="hidden print:inline">
                    {insuranceContract || data.insuranceContract}
                  </span>
                </div>
              </div>
              <div className="info-row grid-cols-[200px_1fr]">
                <span className="info-label w-[200px]">Thời hạn bảo hiểm:</span>
                <div className="info-value font-bold">
                  Từ{" "}
                  <span className="print:hidden inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={startHour}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                        setStartHour(val);
                      }}
                      className="border-b border-gray-400 px-1 py-1 text-sm w-10 text-center focus:outline-none focus:border-blue-500"
                    />
                    <span>giờ</span>
                    <input
                      type="text"
                      value={startMinute}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                        setStartMinute(val);
                      }}
                      className="border-b border-gray-400 px-1 py-1 text-sm w-10 text-center focus:outline-none focus:border-blue-500"
                    />
                    <span>phút</span>
                  </span>
                  <span className="hidden print:inline">
                    {startHour || "10"} giờ {startMinute || "00"} phút
                  </span>
                  , ngày{" "}
                  <span className="print:hidden">
                    <input
                      type="date"
                      value={insuranceStart}
                      onChange={(e) => setInsuranceStart(e.target.value)}       
                      className="border-b border-gray-400 px-2 py-1 text-sm font-bold w-auto max-w-md focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">
                    {formatDateDisplay(insuranceStart) || formatDateDisplay(data?.insuranceStart) || ""}
                  </span>{" "}
                  đến{" "}
                  <span className="print:hidden inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={endHour}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                        setEndHour(val);
                      }}
                      className="border-b border-gray-400 px-1 py-1 text-sm w-10 text-center focus:outline-none focus:border-blue-500"
                    />
                    <span>giờ</span>
                    <input
                      type="text"
                      value={endMinute}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                        setEndMinute(val);
                      }}
                      className="border-b border-gray-400 px-1 py-1 text-sm w-10 text-center focus:outline-none focus:border-blue-500"
                    />
                    <span>phút</span>
                  </span>
                  <span className="hidden print:inline">
                    {endHour || "09"} giờ {endMinute || "59"} phút
                  </span>
                  , ngày{" "}
                  <span className="print:hidden">
                    <input
                      type="date"
                      value={insuranceEnd}
                      onChange={(e) => setInsuranceEnd(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-bold w-auto max-w-md focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">
                    {formatDateDisplay(insuranceEnd) || formatDateDisplay(data?.insuranceEnd) || ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="mt-12 flex justify-end signature-block">
            <div className="w-78 text-center">
              <p className="italic text-right mb-4">
                TP. Hồ Chí Minh, ngày {today.getDate()} tháng{" "}
                {today.getMonth() + 1} năm {today.getFullYear()}
              </p>
              <p className="font-bold signer-title uppercase">TỔNG GIÁM ĐỐC</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-7xl mx-auto mt-8 print:hidden">
        <div className="text-center flex flex-wrap justify-center gap-3">
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
            onClick={() => { setDownloadingPdf(true); downloadElementAsPdf(printableRef.current, "giay-xac-nhan-tang-bao-hiem").then(() => setDownloadingPdf(false)).catch(() => setDownloadingPdf(false)); }}
            disabled={downloadingPdf}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloadingPdf ? "Đang tạo PDF..." : "Tải PDF"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GiayXacNhanTangBaoHiem;
