import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getBranchByShowroomName, getDefaultBranch } from "../../data/branchData";
import { formatCurrency, formatDate } from "../../utils/formatting";
import { PrintStyles } from "./PrintStyles";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";

const GiayXacNhan = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recipientInfo, setRecipientInfo] = useState(
    "Trung tâm thế chấp vùng 9"
  );
  const [branch, setBranch] = useState(null);

  useEffect(() => {
    const loadShowroom = async () => {
      let showroomName = location.state?.showroom || "";

      // Nếu có firebaseKey, thử lấy showroom từ exportedContracts hoặc contracts
      if (location.state?.firebaseKey) {
        try {
          const contractId = location.state.firebaseKey;
          // Thử exportedContracts trước (vì đây là từ trang hợp đồng đã xuất)
          let contractsRef = ref(database, `exportedContracts/${contractId}`);
          let snapshot = await get(contractsRef);

          // Nếu không có trong exportedContracts, thử contracts
          if (!snapshot.exists()) {
            contractsRef = ref(database, `contracts/${contractId}`);
            snapshot = await get(contractsRef);
          }

          if (snapshot.exists()) {
            const contractData = snapshot.val();
            if (contractData.showroom) {
              showroomName = contractData.showroom;
            }
          }
        } catch (err) {
          console.error("Error loading showroom from database:", err);
        }
      }

      // Chỉ set branch khi có showroom được chọn
      const branchInfo = showroomName ? getBranchByShowroomName(showroomName) : null;
      setBranch(branchInfo);

      if (location.state) {
        const incoming = location.state;
        const processedData = {
          customerName: incoming.customerName || incoming.tenKh || incoming["Tên Kh"] || incoming["Tên KH"] || "",
          phone: incoming.phone || incoming.soDienThoai || incoming["Số Điện Thoại"] || "",
          address: incoming.address || incoming.diaChi || incoming["Địa Chỉ"] || "",
          cccd: incoming.cccd || incoming.CCCD || "",
          issueDate: incoming.issueDate || incoming.ngayCap || incoming["Ngày Cấp"] || "",
          issuePlace: incoming.issuePlace || incoming.noiCap || incoming["Nơi Cấp"] || "",
          model: incoming.model || incoming.dongXe || incoming["Dòng xe"] || "",
          contractPrice: incoming.contractPrice || incoming.giaHD || incoming["Giá Hợp Đồng"] || incoming.giaHopDong || "",
          soKhung:
            incoming.soKhung ||
            incoming["Số Khung"] ||
            incoming.chassisNumber ||
            incoming.vin ||
            "",
          soMay:
            incoming.soMay || incoming["Số Máy"] || incoming.engineNumber || "",
          Email: incoming.Email || incoming.email || "",
          representativeName: incoming.representativeName || incoming.tvbh || incoming.TVBH || "",
        };
        setData(processedData);
        if (incoming.recipientInfo) {
          setRecipientInfo(incoming.recipientInfo);
        }
      } else {
        // Dữ liệu mẫu
        setData({
          customerName: "Ông Ma Văn Thuận",
          phone: "0879333668",
          address: "Thôn Tổng Moọc, Yên Lập, Chiêm Hóa, Tuyên Quang",
          cccd: "008094007264",
          issueDate: "21/01/2025",
          issuePlace: "Bộ Công An",
          model: "VINFAST VF 5",
          contractPrice: "540000000",
          soKhung: "",
          soMay: "",
          Email: "",
          representativeName: "",
        });
      }
      setLoading(false);
    };

    loadShowroom();
  }, [location.state]);

  const handleBack = () => {
    navigate(-1);
  };

  // Validate required fields before printing
  const validateBeforePrint = () => {
    const requiredFields = [
      { value: data?.customerName, label: "Tên khách hàng" },
      { value: data?.cccd, label: "Số CCCD" },
      { value: data?.phone, label: "Số điện thoại" },
      { value: data?.model, label: "Dòng xe" },
    ];

    const missingFields = requiredFields.filter(field => !field.value || field.value.trim() === "");

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(f => f.label).join(", ");
      toast.error(`Thiếu thông tin bắt buộc: ${fieldNames}`);
      return false;
    }

    if (!branch) {
      toast.error("Chưa chọn showroom. Vui lòng quay lại và chọn showroom.");
      return false;
    }

    return true;
  };

  const handlePrint = () => {
    if (validateBeforePrint()) {
      window.print();
    }
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

  if (!data) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        style={{ fontFamily: "Times New Roman" }}
      >
        <div className="text-center">
          <p className="text-red-600 mb-4">Không có dữ liệu hợp đồng</p>
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
        <div ref={printableRef} className="flex-1 bg-white" id="printable-content">
          {/* Header */}
          <div className="mb-4">
            <div className="border-2 border-black">
              <div className="flex">
                {/* Bên trái - Thông tin công ty */}
                <div className="flex-1 border-r-2 border-black p-2">
                  {branch ? (
                    <>
                      <p className="text-[10px] font-bold uppercase leading-tight mb-0.5">
                        CÔNG TY CỔ PHẦN ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ
                      </p>
                      <p className="text-[10px] font-bold uppercase leading-tight mb-0.5">
                        ĐÔNG SÀI GÒN - CHI NHÁNH {branch.shortName.toUpperCase()}
                      </p>
                      <p className="text-[10px] font-bold leading-tight">
                        {branch.address}
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] text-gray-400 leading-tight">
                      [Chưa chọn showroom]
                    </p>
                  )}
                </div>

                {/* Bên phải - Quốc hiệu */}
                <div className="flex-1 text-center p-2 flex flex-col justify-center">
                  <p className="text-[10px] font-bold uppercase leading-tight">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </p>
                  <p className="text-[10px] font-bold leading-tight">
                    Độc Lập – Tự Do – Hạnh Phúc
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-center mb-4">GIẤY XÁC NHẬN</h1>

          {/* Recipient */}
          <div className="text-sm mb-3">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-0.5 font-bold w-32">Kính gửi:</td>
                  <td className="py-0.5">
                    <span className="font-bold">
                      Ngân Hàng TMCP Việt Nam Thịnh Vượng –{" "}
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={recipientInfo}
                          onChange={(e) => setRecipientInfo(e.target.value)}
                          className="border-b border-gray-400 px-2 py-1 text-sm font-bold w-64 focus:outline-none focus:border-blue-500"
                          placeholder="Trung tâm thế chấp vùng 9"
                        />
                      </span>
                      <span className="hidden print:inline">{recipientInfo}</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Company Information - Bên Bán */}
          <div className="mb-3 text-sm text-red-600">
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '100px' }} />
                <col style={{ width: '16px' }} />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <td className="py-0.5 font-bold align-top">
                    BÊN BÁN
                  </td>
                  <td className="py-0.5 text-center align-top">:</td>
                  <td className="py-0.5 font-bold">
                    {branch ? branch.name : "[Chưa chọn showroom]"}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top">Địa chỉ</td>
                  <td className="py-0.5 text-center align-top">:</td>
                  <td className="py-0.5">
                    {branch ? branch.address : "[Chưa có địa chỉ]"}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top">Đại diện bởi</td>
                  <td className="py-0.5 text-center align-top">:</td>
                  <td className="py-0.5">
                    <strong>
                      {branch ? `Ông ${branch.representativeName || "Nguyễn Thành Trai"}` : "[Chưa có đại diện]"}
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top">Chức vụ</td>
                  <td className="py-0.5 text-center align-top">:</td>
                  <td className="py-0.5 font-bold">
                    {branch ? (branch.position || "Tổng Giám đốc") : "[Chưa có chức vụ]"}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top">Tài khoản</td>
                  <td className="py-0.5 text-center align-top">:</td>
                  <td className="py-0.5">{branch ? `${branch.bankAccount} – tại ${branch.bankName}` : "[Chưa có tài khoản]"}</td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top">Mã số thuế</td>
                  <td className="py-0.5 text-center align-top">:</td>
                  <td className="py-0.5">{branch ? branch.taxCode : "[Chưa có mã số thuế]"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Customer Information */}
          <div className="mb-3">
            <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '100px' }} />
                <col style={{ width: '16px' }} />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <td className="py-0.5 font-semibold">BÊN MUA</td>
                  <td className="py-0.5 text-center">:</td>
                  <td className="py-0.5 font-bold">{data.customerName}</td>
                </tr>
                <tr>
                  <td className="py-0.5">Địa chỉ</td>
                  <td className="py-0.5 text-center">:</td>
                  <td className="py-0.5">{data.address}</td>
                </tr>
                <tr>
                  <td className="py-0.5">CCCD</td>
                  <td className="py-0.5 text-center">:</td>
                  <td className="py-0.5">
                    Số {data.cccd} cấp ngày {formatDate(data.issueDate)} bởi{" "}
                    {data.issuePlace}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5">Điện thoại</td>
                  <td className="py-0.5 text-center">:</td>
                  <td className="py-0.5">{data.phone}</td>
                </tr>
                <tr>
                  <td className="py-0.5">Email</td>
                  <td className="py-0.5 text-center">:</td>
                  <td className="py-0.5">{data.Email}</td>
                </tr>
                <tr>
                  <td className="py-0.5">Mã số thuế</td>
                  <td className="py-0.5 text-center">:</td>
                  <td className="py-0.5"></td>
                </tr>
                {/* Dòng text "Bên Bán xác nhận..." */}
                <tr>
                  <td colSpan="3" className="py-2">
                    Bên Bán xác nhận Bên Mua có mua 1 chiếc ô tô của Bên Bán :
                  </td>
                </tr>
                {/* Thông tin xe - cùng bảng để căn thẳng hàng */}
                <tr>
                  <td className="py-0.5">Hiệu xe</td>
                  <td className="py-0.5 text-center">:</td>
                  <td className="py-0.5 uppercase">{data.model || ""}</td>
                </tr>
                <tr>
                  <td className="py-0.5">Số khung</td>
                  <td className="py-0.5 text-center">:</td>
                  <td className="py-0.5 uppercase font-bold text-red-600">
                    {data.soKhung || ""}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5">Số máy</td>
                  <td className="py-0.5 text-center">:</td>
                  <td className="py-0.5">{data.soMay || ""}</td>
                </tr>
                <tr>
                  <td className="py-0.5">Giá trị khai báo</td>
                  <td className="py-0.5 text-center">:</td>
                  <td className="py-0.5 font-semibold">
                    {formatCurrency(data.contractPrice)} vnđ
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature */}
          <div className="text-right mt-8">
            <p className="text-sm font-bold mb-8">ĐẠI DIỆN BÊN BÁN</p>
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
            onClick={handlePrint}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            In Giấy Xác Nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default GiayXacNhan;
