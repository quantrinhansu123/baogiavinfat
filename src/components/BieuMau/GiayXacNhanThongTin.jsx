import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getBranchByShowroomName } from "../../data/branchData";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";

const GiayXacNhanThongTin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for branch info
  const [branch, setBranch] = useState(null);

  // Editable fields for table
  const [thongTinHDMB, setThongTinHDMB] = useState("");
  const [thongTinTBPD, setThongTinTBPD] = useState("");
  const [thongTinGiayXN, setThongTinGiayXN] = useState("");

  // Helper function to get shortName from branch
  const getShowroomShortName = () => {
    return branch?.shortName || "[Chưa chọn showroom]";
  };

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
            if (contractData.showroom && contractData.showroom.trim() !== "") {
              showroomName = contractData.showroom;
              showroomLoadedFromContracts = true;

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
              if (contractData.showroom && contractData.showroom.trim() !== "") {
                showroomName = contractData.showroom;
                showroomLoadedFromContracts = true;

                // Cập nhật branch info ngay khi load được showroom từ contracts
                const branchInfo = getBranchByShowroomName(showroomName);
                setBranch(branchInfo);
              } else {
                // Nếu showroom rỗng hoặc null, đảm bảo branch = null
                showroomLoadedFromContracts = true;
                setBranch(null);
              }
            }
          }
        } catch (error) {
          console.error("Error loading showroom from database:", error);
        }
      }

      // Set branch info nếu chưa load được từ contracts
      if (!showroomLoadedFromContracts) {
        if (showroomName && showroomName.trim() !== "") {
          const branchInfo = getBranchByShowroomName(showroomName);
          setBranch(branchInfo);
        } else {
          // Đảm bảo branch = null khi không có showroom
          setBranch(null);
        }
      }
      
      // Load dữ liệu từ exportedContracts để lấy thông tin model
      let modelValue = "";
      if (location.state?.firebaseKey) {
        try {
          const contractRef = ref(database, `exportedContracts/${location.state.firebaseKey}`);
          const snapshot = await get(contractRef);
          if (snapshot.exists()) {
            const contractData = snapshot.val();
            modelValue = contractData.dongXe || contractData.model || contractData["Dòng xe"] || "";
          }
        } catch (error) {
          console.error("Error loading contract data from exportedContracts:", error);
        }
      }

      if (location.state) {
        const incoming = location.state;
        const processedData = {
          contractNumber: incoming.vso || "S00901-VSO-24-10-0042",
          customerName: incoming.customerName || incoming.tenKh || incoming["Tên KH"] || "BÙI THỊ KIM OANH",
          contractDate: incoming.contractDate || incoming.createdAt || "2022-10-08",
          model: incoming.model || incoming.dongXe || modelValue || "VINFAST VF5",
          variant: incoming.variant || "VF 5",
          showroom: incoming.showroom || showroomName,
        };
        setData(processedData);
        
        // Set editable fields
        const model = processedData.model;
        setThongTinHDMB(model);
        setThongTinTBPD(`VINFAST, ${model}`);
        setThongTinGiayXN(model);
      } else {
        setData({
          contractNumber: "S00901-VSO-24-10-0042",
          customerName: "BÙI THỊ KIM OANH",
          contractDate: "2022-10-08",
          model: "VINFAST VF5",
          variant: "S",
          showroom: showroomName,
        });
        
        // Set default editable fields
        setThongTinHDMB("VINFAST VF5");
        setThongTinTBPD("VINFAST, VINFAST VF5");
        setThongTinGiayXN("VINFAST VF5");
      }
      setLoading(false);
    };
    
    loadData();
  }, [location.state]);

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return { formatted: "8 tháng 10 năm 2024" };
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return { formatted: "8 tháng 10 năm 2024" };

      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      return {
        formatted: `${day} tháng ${month} năm ${year}`
      };
    } catch {
      return { formatted: "8 tháng 10 năm 2024" };
    }
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return "08/10/2024";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "08/10/2024";
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch {
      return "08/10/2024";
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: 'Times New Roman' }}>
        <div className="text-center">
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: 'Times New Roman' }}>
        <div className="text-center">
          <p className="text-gray-600 mb-4">Không có dữ liệu hợp đồng</p>
          <button
            onClick={handleBack}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const dateInfo = formatDateForDisplay(data.contractDate);

  return (
    <div className="min-h-screen bg-white p-8" style={{ fontFamily: 'Times New Roman' }}>
      <div ref={printableRef} className="max-w-4xl mx-auto bg-white" id="printable-content">


        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-lg font-bold mb-2">GIẤY XÁC NHẬN THÔNG TIN</h1>
          <p className="text-sm mb-2">Áp dụng đối với trường hợp cần xác nhận thông tin PTVT</p>
          <p className="text-xs text-red-600 font-semibold print:hidden">CHO PHÉP SỬA TAY</p>
          <p className="text-sm mb-8 hidden print:block text-red-600 font-semibold">CHO PHÉP SỬA TAY</p>
        </div>

        {/* Nội dung */}
        <div className="space-y-6 text-sm">
          {/* Đoạn văn bản */}
          <div className="space-y-4">
            <p>
              Căn cứ vào Hợp đồng mua bán số <strong>{data.contractNumber}</strong> giữa <strong>{branch ? `CHI NHÁNH ${branch.shortName?.toUpperCase()}-CÔNG TY CP ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG SÀI GÒN` : "[Chưa chọn showroom]"}</strong> và Ông/Bà <strong>{data.customerName}</strong> về việc thỏa thuận ký kết hợp đồng mua bán xe ngày {formatDateShort(data.contractDate)}
            </p>
            
            <p>
              Xác nhận ô tô trong hợp đồng mua bán nêu trên và một số thông tin bên dưới là cùng một số loại xe của nhà sản xuất.
            </p>
          </div>

          {/* Bảng thông tin */}
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr>
                <th className="border border-black px-2 py-1">STT</th>
                <th className="border border-black px-2 py-1">Đặc điểm của xe</th>
                <th className="border border-black px-2 py-1">Thông tin trên HĐMB và nghị quyết</th>
                <th className="border border-black px-2 py-1">Thông tin trên TBPD</th>
                <th className="border border-black px-2 py-1">Thông tin trên giấy xác nhận SK, SM</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1 text-center">1</td>
                <td className="border border-black px-2 py-1">Số Loại (Model Code)</td>
                <td className="border border-black px-2 py-1 text-center">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={thongTinHDMB}
                      onChange={(e) => setThongTinHDMB(e.target.value)}
                      className="w-full text-center text-sm px-1 py-1 bg-blue-50 border border-blue-300 rounded focus:outline-none focus:border-blue-500 focus:bg-white editable-field min-w-[80px]"
                      placeholder="Nhập thông tin HĐMB"
                      title="Có thể sửa tay"
                    />
                  </span>
                  <span className="hidden print:inline">{thongTinHDMB || ""}</span>
                </td>
                <td className="border border-black px-2 py-1 text-center">
                  <input
                    type="text"
                    value={thongTinTBPD}
                    onChange={(e) => setThongTinTBPD(e.target.value)}
                    className="w-full text-center text-sm px-1 py-1 bg-blue-50 border border-blue-300 rounded focus:outline-none focus:border-blue-500 focus:bg-white editable-field"
                    placeholder="Nhập thông tin TBPĐ"
                  />
                </td>
                <td className="border border-black px-2 py-1 text-center">
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

          {/* Cam kết trách nhiệm */}
          <p className="mt-6">
            Tôi hoàn toàn chịu trách nhiệm cho các xác nhận nêu trên, trong trường hợp phát hiện ra các sai phạm và gây thiệt hại cho VPBank sẽ chịu mọi hình thức xử lý kỷ luật theo quy định của VPBank từng thời kỳ.
          </p>

          {/* Ngày tháng và chữ ký */}
          <div className="mt-12">
            <p className="text-right mb-4 italic">TP. Hồ Chí Minh, ngày {dateInfo.formatted}</p>
            <div className="text-left leading-relaxed w-[280px] ml-auto">
              <p className="font-bold">{branch ? `CÔNG TY CỔ PHẦN ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG SÀI GÒN - CHI NHÁNH ${branch.shortName?.toUpperCase()}` : "[Chưa chọn showroom]"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nút hành động */}
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
            margin: 20mm;
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
            font-family: 'Times New Roman', Times, serif !important;
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

export default GiayXacNhanThongTin;