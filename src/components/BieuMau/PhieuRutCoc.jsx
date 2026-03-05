import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import {
  getBranchByShowroomName,
  getDefaultBranch,
} from "../../data/branchData";
import { PrintStyles } from "./PrintStyles";
import { downloadElementAsPdf } from "../../utils/pdfExport";

const PhieuRutCoc = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);

  // Editable fields
  const [soPhieu, setSoPhieu] = useState("");
  const [ngayDeNghi, setNgayDeNghi] = useState("");
  const [nguoiDeNghi, setNguoiDeNghi] = useState("");
  const [boPhan, setBoPhan] = useState("P.KD");
  const [phieuCLXX, setPhieuCLXX] = useState("");
  const [thoiGianGiaoXe, setThoiGianGiaoXe] = useState("");

  // Header fields
  const [headerLeft, setHeaderLeft] = useState("");
  const [headerSuffix, setHeaderSuffix] = useState("PHIẾU CLXX");

  // Table rows (có thể có nhiều xe)
  const [tableRows, setTableRows] = useState([
    { stt: "1", soKhung: "", soHopDong: "", model: "" },
    { stt: "", soKhung: "", soHopDong: "", model: "" },
    { stt: "", soKhung: "", soHopDong: "", model: "" },
    { stt: "", soKhung: "", soHopDong: "", model: "" },
  ]);

  // Generate header text from branch
  const getHeaderText = (branchInfo) => {
    if (!branchInfo) return "CN TRƯỜNG CHINH -\nCÔNG TY CỔ PHẦN\nĐẦU TƯ TMDV Ô TÔ\nĐÔNG SÀI GÒN";
    if (branchInfo.id === 1) {
      return "CÔNG TY CỔ PHẦN\nĐẦU TƯ TMDV Ô TÔ\nĐÔNG SÀI GÒN";
    }
    return `CN ${branchInfo.shortName.toUpperCase()} -\nCÔNG TY CỔ PHẦN\nĐẦU TƯ TMDV Ô TÔ\nĐÔNG SÀI GÒN`;
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

      // Set header from branch
      setHeaderLeft(getHeaderText(branchInfo));

      // Set default date
      const today = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      setNgayDeNghi(
        `${pad(today.getDate())}/${pad(
          today.getMonth() + 1
        )}/${today.getFullYear()}`
      );

      if (location.state) {
        const stateData = location.state;
        setData(stateData);

        if (stateData.tvbh) setNguoiDeNghi(stateData.tvbh);

        // Auto-fill first row with contract data
        const soKhung = stateData.soKhung || stateData.chassisNumber || "";     
        const soHopDong = stateData.vso || stateData.contractNumber || "";      
        const model = stateData.hieuxe || stateData.dongXe || stateData.model || "";

        if (soKhung || soHopDong || model) {
          setTableRows(prev => {
            const newRows = [...prev];
            newRows[0] = { stt: "1", soKhung, soHopDong, model };
            return newRows;
          });
        }
      } else {
        setData({
          contractNumber: "",
          soKhung: "",
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

  const handleRowChange = (index, field, value) => {
    const newRows = [...tableRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setTableRows(newRows);
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
      <PrintStyles />
      <div className="max-w-4xl mx-auto print:max-w-4xl print:mx-auto">
        <div
          ref={printableRef}
          className="flex-1 bg-white p-8 print:pt-0 flex flex-col min-h-screen print:min-h-[calc(100vh-40mm)]"
          id="printable-content"
        >
          {/* Header Table */}
          <div className="mb-6">
            <table className="w-full border-2 border-black border-table">
              <tbody>
                <tr>
                  <td
                    className="border-r-2 border-black font-bold text-sm text-center align-middle"
                    style={{ width: "30%", height: "90px", padding: "8px" }}    
                  >
                    <div
                      className="print:hidden w-full h-full flex items-center justify-center"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => setHeaderLeft(e.target.innerText)}
                      style={{
                        outline: "none",
                        whiteSpace: "pre-line",
                        lineHeight: "1.3"
                      }}
                    >
                      {headerLeft}
                    </div>
                    <div className="hidden print:flex items-center justify-center h-full whitespace-pre-line leading-tight">
                      {headerLeft}
                    </div>
                  </td>
                  <td
                    className="border-r-2 border-black p-2 align-middle text-center font-bold text-lg"
                    style={{ width: "40%" }}
                  >
                    PHIẾU ĐỀ XUẤT
                    <br />
                    <span className="text-base flex items-center justify-center gap-1">
                      RÚT
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={headerSuffix}
                          onChange={(e) => setHeaderSuffix(e.target.value)}     
                          className="border-b border-gray-400 px-1 w-32 text-center font-bold focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{headerSuffix}</span>
                    </span>
                  </td>
                  <td
                    className="p-2 align-middle text-sm"
                    style={{ width: "30%" }}
                  >
                    <div className="info-row grid-cols-[40px_1fr]">
                      <span className="info-label w-[40px]">Số: </span>
                      <div className="info-value whitespace-nowrap">
                        <span className="print:hidden">
                          <input
                            type="text"
                            value={soPhieu}
                            onChange={(e) => setSoPhieu(e.target.value)}
                            className="border-b border-gray-400 px-1 w-24 focus:outline-none focus:border-blue-500"
                          />
                        </span>
                        <span className="hidden print:inline">{soPhieu}</span>
                      </div>
                    </div>
                    <div className="mt-2 info-row grid-cols-[100px_1fr]">
                      <span className="info-label w-[100px] italic">Ngày đề nghị: </span>
                      <div className="info-value italic whitespace-nowrap">
                        <span className="print:hidden">
                          <input
                            type="text"
                            value={ngayDeNghi}
                            onChange={(e) => setNgayDeNghi(e.target.value)}       
                            className="border-b border-gray-400 px-1 w-28 focus:outline-none focus:border-blue-500"
                          />
                        </span>
                        <span className="hidden print:inline">{ngayDeNghi}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Kính gửi */}
          <div className="text-sm space-y-3 mb-4">
            <p className="italic">
              <strong>Kính gửi:</strong> - <strong>Ban Giám đốc;</strong>       
            </p>
            <p className="ml-16 italic">
              - <strong>Phòng Tài chính - Kế toán.</strong>
            </p>
          </div>

          {/* Thông tin người đề nghị */}
          <div className="text-sm space-y-1 mb-4">
            <div className="info-row grid-cols-[180px_1fr]">
              <span className="info-label w-[180px]">Họ và tên người đề nghị:</span>
              <div className="info-value font-bold">
                <span className="print:hidden">
                  <input
                    type="text"
                    value={nguoiDeNghi}
                    onChange={(e) => setNguoiDeNghi(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-64 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{nguoiDeNghi}</span>      
              </div>
            </div>
            <div className="info-row grid-cols-[180px_1fr]">
              <span className="info-label w-[180px]">Bộ phận:</span>
              <div className="info-value">
                <span className="print:hidden">
                  <input
                    type="text"
                    value={boPhan}
                    onChange={(e) => setBoPhan(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-32 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{boPhan}</span>
              </div>
            </div>
            <div className="info-row grid-cols-[180px_1fr]">
              <span className="info-label w-[180px]">Đề xuất rút:</span>
              <div className="info-value">
                <span className="print:hidden">
                  <input
                    type="text"
                    value={phieuCLXX}
                    onChange={(e) => setPhieuCLXX(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-32 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{phieuCLXX}</span>
              </div>
            </div>
            <div className="info-row grid-cols-[180px_1fr]">
              <span className="info-label w-[180px]">Dự kiến giao xe:</span>
              <div className="info-value">
                <span className="print:hidden">
                  <input
                    type="text"
                    value={thoiGianGiaoXe}
                    onChange={(e) => setThoiGianGiaoXe(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-64 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{thoiGianGiaoXe}</span>     
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mb-6">
            <table className="w-full border-2 border-black text-sm border-table">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="border-r border-black p-2 font-bold text-center w-12">
                    STT
                  </th>
                  <th className="border-r border-black p-2 font-bold text-center">
                    Số khung
                  </th>
                  <th className="border-r border-black p-2 font-bold text-center">
                    Số hợp đồng
                  </th>
                  <th className="p-2 font-bold text-center">Model</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, index) => (
                  <tr
                    key={index}
                    className={
                      index < tableRows.length - 1
                        ? "border-b border-black"
                        : ""
                    }
                  >
                    <td className="border-r border-black p-2 text-center">      
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={row.stt}
                          onChange={(e) =>
                            handleRowChange(index, "stt", e.target.value)       
                          }
                          className="border-b border-gray-400 px-1 w-full text-center focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{row.stt}</span>    
                    </td>
                    <td className="border-r border-black p-2 text-center font-bold text-red-600">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={row.soKhung}
                          onChange={(e) =>
                            handleRowChange(index, "soKhung", e.target.value)   
                          }
                          className="border-b border-gray-400 px-1 w-full text-center focus:outline-none focus:border-blue-500 font-bold text-red-600"
                        />
                      </span>
                      <span className="hidden print:inline">{row.soKhung}</span>
                    </td>
                    <td className="border-r border-black p-2 text-center font-bold text-red-600">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={row.soHopDong}
                          onChange={(e) =>
                            handleRowChange(index, "soHopDong", e.target.value) 
                          }
                          className="border-b border-gray-400 px-1 w-full text-center focus:outline-none focus:border-blue-500 font-bold text-red-600"
                        />
                      </span>
                      <span className="hidden print:inline">
                        {row.soHopDong}
                      </span>
                    </td>
                    <td className="p-2 text-center font-bold text-red-600">     
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={row.model}
                          onChange={(e) =>
                            handleRowChange(index, "model", e.target.value)     
                          }
                          className="border-b border-gray-400 px-1 w-full text-center focus:outline-none focus:border-blue-500 font-bold text-red-600"
                        />
                      </span>
                      <span className="hidden print:inline">{row.model}</span>  
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signature Section */}
          <div className="mt-8 mb-4 signature-block">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="text-center font-bold p-4 w-1/4">
                    <p className="mb-20 signer-title">Người đề nghị</p>
                  </td>
                  <td className="text-center font-bold p-4 w-1/4">
                    <p className="mb-20 signer-title">TP. Kế toán</p>
                  </td>
                  <td className="text-center font-bold p-4 w-1/4">
                    <p className="mb-20 signer-title">TP. Kinh doanh</p>
                  </td>
                  <td className="text-center font-bold p-4 w-1/4">
                    <p className="mb-20 signer-title">Tổng Giám Đốc</p>
                  </td>
                </tr>
              </tbody>
            </table>
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
          onClick={() => {
            setDownloadingPdf(true);
            downloadElementAsPdf(printableRef.current, "phieu-rut-coc").then(() => setDownloadingPdf(false)).catch(() => setDownloadingPdf(false));
          }}
          disabled={downloadingPdf}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {downloadingPdf ? "Đang tạo PDF..." : "Tải PDF"}
        </button>
      </div>
    </div>
  );
};

export default PhieuRutCoc;
