import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getBranchByShowroomName,
  getDefaultBranch,
} from "../../data/branchData";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import {
  uniqueNgoaiThatColors,
  uniqueNoiThatColors,
} from "../../data/calculatorData";
import { vndToWords } from "../../utils/vndToWords";
import { formatCurrency } from "../../utils/formatting";
import CurrencyInput from "../shared/CurrencyInput";
import { PrintStyles } from "./PrintStyles";

const HopDongMuaBanXe = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);

  // Input fields for [---] placeholders
  const [giayUyQuyen1, setGiayUyQuyen1] = useState("");
  const [giayUyQuyen1Ngay, setGiayUyQuyen1Ngay] = useState("");
  const [giayUyQuyen1NgayRaw, setGiayUyQuyen1NgayRaw] = useState("");
  const [giayUyQuyen2, setGiayUyQuyen2] = useState("");
  const [giayUyQuyen2Ngay, setGiayUyQuyen2Ngay] = useState("");
  const [giayUyQuyen2NgayRaw, setGiayUyQuyen2NgayRaw] = useState("");
  const [thoiHanDatCoc, setThoiHanDatCoc] = useState("");
  const [thoiHanDot2, setThoiHanDot2] = useState("");
  const [soTienDot2, setSoTienDot2] = useState("");
  const [soTienDot2BangChu, setSoTienDot2BangChu] = useState("");
  const [soTienVay, setSoTienVay] = useState("");
  const [soTienVayBangChu, setSoTienVayBangChu] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(""); // "trả thẳng" or "trả góp"
  const [soTienDot3, setSoTienDot3] = useState("");
  const [soTienDot3BangChu, setSoTienDot3BangChu] = useState("");
  const [diaDiemGiaoXe, setDiaDiemGiaoXe] = useState("");
  const [thoiGianGiaoXe, setThoiGianGiaoXe] = useState("");
  const [thoiGianGiaoXeRaw, setThoiGianGiaoXeRaw] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [uuDai, setUuDai] = useState("");
  const [isEditingUuDai, setIsEditingUuDai] = useState(false);
  const [taxCodeOrg, setTaxCodeOrg] = useState("");
  const [representativeOrg, setRepresentativeOrg] = useState("");
  const [positionOrg, setPositionOrg] = useState("");
  // Company fields
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyTaxCode, setCompanyTaxCode] = useState("");
  // Customer fields
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  useEffect(() => {
    const loadData = async () => {
      let showroomName = location.state?.showroom || "";

      // Nếu có firebaseKey, thử lấy showroom từ contracts
      if (location.state?.firebaseKey) {
        try {
          const contractId = location.state.firebaseKey;
          const contractsRef = ref(database, `contracts/${contractId}`);
          const snapshot = await get(contractsRef);
          if (snapshot.exists()) {
            const contractData = snapshot.val();
            if (contractData.showroom) {
              showroomName = contractData.showroom;
            }
          }
        } catch (err) {
          // Error handling
        }
      }

      const branchInfo = showroomName ? getBranchByShowroomName(showroomName) : null;
      setBranch(branchInfo);

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

      if (location.state) {
        const incoming = location.state;
        const today = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const todayStr = `${pad(today.getDate())}/${pad(
          today.getMonth() + 1
        )}/${today.getFullYear()}`;

        const processedData = {
          contractNumber: incoming.vso || incoming.contractNumber || "",
          contractDate:
            formatDateString(incoming.createdAt || incoming.ngayXhd) ||
            todayStr,
          customerName:
            incoming.customerName || incoming.tenKh || incoming["Tên Kh"] || "",
          customerAddress:
            incoming.address || incoming.diaChi || incoming["Địa Chỉ"] || "",
          phone:
            incoming.phone ||
            incoming.soDienThoai ||
            incoming["Số Điện Thoại"] ||
            "",
          email: incoming.email || incoming.Email || "",
          cccd: incoming.cccd || incoming.CCCD || "",
          cccdIssueDate:
            formatDateString(
              incoming.issueDate || incoming.ngayCap || incoming["Ngày Cấp"]
            ) || "",
          cccdIssuePlace:
            incoming.issuePlace || incoming.noiCap || incoming["Nơi Cấp"] || "",
          // Thông tin tổ chức (nếu có)
          taxCode: incoming.taxCode || incoming.MSDN || incoming.msdn || "",
          representative: incoming.representative || incoming.daiDien || "",
          position: incoming.position || incoming.chucVu || "",
          giayUyQuyen: incoming.giayUyQuyen || "",
          giayUyQuyenNgay: formatDateString(incoming.giayUyQuyenNgay || ""),
          // Thông tin xe
          model: incoming.model || incoming.dongXe || "",
          variant: incoming.variant || incoming.phienBan || "",
          exterior: incoming.exterior || incoming.ngoaiThat || "",
          interior: incoming.interior || incoming.noiThat || "",
          soKhung:
            incoming.soKhung ||
            incoming["Số Khung"] ||
            incoming.chassisNumber ||
            incoming.vin ||
            "",
          contractPrice: incoming.contractPrice || incoming.giaHopDong || "",
          deposit: incoming.deposit || incoming.giaGiam || "",
          // Chính sách ưu đãi
          uuDai: incoming.uuDai || incoming["Ưu đãi"] || "",
          showroom: incoming.showroom || branchInfo.shortName,
          payment: incoming.payment || incoming.thanhToan || "",
          loanAmount: incoming.loanAmount || incoming.soTienVay || "",
        };
        setData(processedData);
        setUuDai(String(processedData.uuDai || ""));
        setTaxCodeOrg(processedData.taxCode || "");
        setRepresentativeOrg(processedData.representative || "");
        setPositionOrg(processedData.position || "");
        setGiayUyQuyen1(processedData.giayUyQuyen || "");
        setGiayUyQuyen1Ngay(processedData.giayUyQuyenNgay || "");
        setGiayUyQuyen2(processedData.giayUyQuyen || "");
        setGiayUyQuyen2Ngay(processedData.giayUyQuyenNgay || "");
        if (processedData.giayUyQuyenNgay) {
          setGiayUyQuyen2NgayRaw(processedData.giayUyQuyenNgay.includes('/') ?
            (() => {
              const [day, month, year] = processedData.giayUyQuyenNgay.split('/');
              return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            })() : processedData.giayUyQuyenNgay
          );
        }
        // Initialize company fields from branch
        setCompanyName(branchInfo.name || "");
        setCompanyAddress(branchInfo.address || "");
        setCompanyTaxCode(branchInfo.taxCode || "");
        // Initialize bank fields from branch
        setBankAccount(branchInfo.bankAccount || "");
        setBankName(branchInfo.bankName || "");
        // Initialize customer fields from processed data
        setCustomerName(processedData.customerName || "");
        setCustomerAddress(processedData.customerAddress || "");
        setCustomerPhone(processedData.phone || "");
        setCustomerEmail(processedData.email || "");
        // Initialize payment method and loan amount from processed data
        setPaymentMethod(processedData.payment || "");
        if (processedData.loanAmount) {
          setSoTienVay(processedData.loanAmount);
          setSoTienVayBangChu(vndToWords(processedData.loanAmount));
        }
      } else {
        // Default data
        const today = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const todayStr = `${pad(today.getDate())}/${pad(
          today.getMonth() + 1
        )}/${today.getFullYear()}`;
        setData({
          contractNumber: "S00901-VSO-25-09-0039",
          contractDate: todayStr,
          customerName: "NGÔ NGUYỄN HOÀI NAM",
          customerAddress:
            "Số 72/14 Đường tỉnh lộ 7, Ấp Bình Hạ, Thái Mỹ, Củ Chi, Tp Hồ Chí Minh",
          phone: "0901234567",
          email: "example@email.com",
          cccd: "079123456789",
          cccdIssueDate: "01/01/2020",
          cccdIssuePlace: "Bộ Công An",
          soKhung: "RLLVFPNT9SH858285",
          contractPrice: "719040000",
          deposit: "72040000",
          model: "VF 8",
          variant: "Eco",
          exterior: "Đen",
          interior: "Đen",
          uuDai: "",
          showroom: branchInfo.shortName,
        });
        setUuDai("");
        setTaxCodeOrg("");
        setRepresentativeOrg("");
        setPositionOrg("");
        // Initialize company fields from branch
        setCompanyName(branchInfo.name || "");
        setCompanyAddress(branchInfo.address || "");
        setCompanyTaxCode(branchInfo.taxCode || "");
        // Initialize bank fields from branch
        setBankAccount(branchInfo.bankAccount || "");
        setBankName(branchInfo.bankName || "");
        // Initialize customer fields from default data
        setCustomerName("NGÔ NGUYỄN HOÀI NAM");
        setCustomerAddress(
          "Số 72/14 Đường tỉnh lộ 7, Ấp Bình Hạ, Thái Mỹ, Củ Chi, Tp Hồ Chí Minh"
        );
        setCustomerPhone("0901234567");
        setCustomerEmail("example@email.com");
      }
      setLoading(false);
    };

    loadData();
  }, [location.state]);

  // Tự động điền tên showroom vào địa điểm giao xe khi branch được load
  // Chỉ điền khi diaDiemGiaoXe chưa có giá trị để không ghi đè giá trị người dùng đã nhập
  useEffect(() => {
    if (branch && branch.name && !diaDiemGiaoXe) {
      setDiaDiemGiaoXe(branch.name);
    }
  }, [branch, diaDiemGiaoXe]);

  // Tự động điền thông tin ngân hàng khi branch được load
  useEffect(() => {
    if (branch) {
      if (branch.bankAccount && !bankAccount) {
        setBankAccount(branch.bankAccount);
      }
      if (branch.bankName && !bankName) {
        setBankName(branch.bankName);
      }
    }
  }, [branch, bankAccount, bankName]);

  const handleBack = () => {
    navigate(-1);
  };

  // Validate required fields before printing
  const validateBeforePrint = () => {
    const requiredFields = [
      { value: data?.customerName || customerName, label: "Tên khách hàng" },
      { value: data?.cccd, label: "Số CCCD" },
      { value: data?.phone || customerPhone, label: "Số điện thoại" },
      { value: data?.address || customerAddress, label: "Địa chỉ" },
      { value: data?.model, label: "Dòng xe" },
      { value: data?.exterior, label: "Màu ngoại thất" },
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

  // Helper function to format ưu đãi as bulleted list
  const formatUuDaiList = (text) => {
    if (!text) return "[---]";
    // Ensure text is a string
    const textStr = String(text);
    if (!textStr.trim()) return "[---]";

    let lines = [];

    // First, try splitting by newlines
    const newlineSplit = textStr
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");

    if (newlineSplit.length > 1) {
      // If there are multiple lines, use them
      lines = newlineSplit;
    } else {
      // If single line, try splitting by commas
      const singleLine = textStr.trim();
      // Split by comma (with optional space after)
      const commaSplit = singleLine
        .split(/,\s*/)
        .map((item) => item.trim())
        .filter((item) => item !== "");

      if (commaSplit.length > 1) {
        lines = commaSplit;
      } else {
        // If no commas, use the whole line as one item
        lines = [singleLine];
      }
    }

    if (lines.length === 0) return "[---]";

    return (
      <div className="mt-2 space-y-1">
        {lines.map((line, index) => (
          <div key={index}>- {line}</div>
        ))}
      </div>
    );
  };

  // Helper function to convert color code to name
  const getColorName = (colorCode, isExterior = true) => {
    if (!colorCode) return "";
    const colorList = isExterior ? uniqueNgoaiThatColors : uniqueNoiThatColors;
    const found = colorList.find(
      (color) => color.code.toLowerCase() === colorCode.toLowerCase()
    );
    return found ? found.name : colorCode;
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        style={{ fontFamily: "Times New Roman" }}
    >
      <PrintStyles />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!data || !branch) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        style={{ fontFamily: "Times New Roman" }}
    >
      <PrintStyles />
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

  return (
    <div
      className="min-h-screen bg-gray-50 p-8"
      style={{ fontFamily: "Times New Roman" }}
    >
      <PrintStyles />
      <div className="max-w-5xl mx-auto print:max-w-5xl print:mx-auto">
        <div
          ref={printableRef}
          className="bg-white p-8 print:pt-4 print:pb-4 text-value" id="printable-content"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold uppercase mb-2">
              HỢP ĐỒNG MUA BÁN XE ĐIỆN VINFAST
            </h1>
            <div className="text-center text-sm mb-2">
              <span>Số: {data.contractNumber || "[---]"}</span>
            </div>
            <div className="text-sm">
              <span>
                Hợp đồng mua bán xe điện Vinfast ("<strong>Hợp Đồng</strong>")
                được ký ngày{" "}
                {data.contractDate ? data.contractDate.split("/")[0] : "[---]"}{" "}
                tháng{" "}
                {data.contractDate ? data.contractDate.split("/")[1] : "[---]"}{" "}
                năm{" "}
                {data.contractDate ? data.contractDate.split("/")[2] : "[---]"},
                giữa:
              </span>
            </div>
          </div>

          {/* Two Column Layout - CÔNG TY and KHÁCH HÀNG */}
          <div className="grid grid-cols-2 gap-4 mb-2">
            {/* Left Column - CÔNG TY */}
            <div className="border-2 border-black">
              <div className="p-3 text-sm space-y-2">
                <p>
                  <strong>CÔNG TY: </strong>
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-full focus:outline-none focus:border-blue-500 uppercase"
                      placeholder=""
                    />
                  </span>
                  <span className="hidden print:inline uppercase">
                    {companyName || "[---]"}
                  </span>
                </p>
                <p>
                  <strong>Trụ sở chính:</strong>{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </span>
                  <span className="hidden print:inline">
                    {companyAddress || "[---]"}
                  </span>
                </p>
                <p>
                  <strong>MSDN:</strong>{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={companyTaxCode}
                      onChange={(e) => setCompanyTaxCode(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </span>
                  <span className="hidden print:inline">
                    {companyTaxCode || "[---]"}
                  </span>
                </p>
                <p>
                  <strong>Đại diện:</strong> {branch.representativeName}
                </p>
                <p>
                  <strong>Chức vụ:</strong> {branch.position}
                </p>
                <p>
                  <strong>Giấy uỷ quyền:</strong>{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={giayUyQuyen1}
                      onChange={(e) => setGiayUyQuyen1(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </span>
                  <span className="hidden print:inline">
                    {giayUyQuyen1 || "[---]"}
                  </span>{" "}
                  ngày{" "}
                  <span className="print:hidden">
                    <input
                      type="date"
                      value={giayUyQuyen1NgayRaw}
                      onChange={(e) => {
                        setGiayUyQuyen1NgayRaw(e.target.value);
                        if (e.target.value) {
                          setGiayUyQuyen1Ngay(
                            formatDateForDisplay(e.target.value)
                          );
                        } else {
                          setGiayUyQuyen1Ngay("");
                        }
                      }}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </span>
                  <span className="hidden print:inline">
                    {giayUyQuyen1Ngay || "[---/---/---]"}
                  </span>
                </p>
                <p>
                  <strong>Tài khoản:</strong>{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-[35%] focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </span>
                  <span className="hidden print:inline">
                    {bankAccount || (branch?.bankAccount || "[---]")}
                  </span>{" "}
                  tại {" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-[40%] focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </span>
                  <span className="hidden print:inline">
                    {bankName || (branch?.bankName || "[---]")}
                  </span>
                </p>
                <p>
                  <strong>Chủ tài khoản:</strong> {branch.name}
                </p>
                <p className="mt-2">
                  Sau đây gọi là <strong>"Bên Bán"</strong>
                </p>
              </div>
            </div>

            {/* Right Column - KHÁCH HÀNG */}
            <div className="border-2 border-black">
              <div className="p-3 text-sm space-y-2">
                <p>
                  <strong className="uppercase">KHÁCH HÀNG: </strong>
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500 uppercase"
                      placeholder=""
                    />
                  </span>
                  <span className="hidden print:inline">
                    {customerName || "[---]"}
                  </span>
                </p>
                <p>
                  Địa chỉ:{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </span>
                  <span className="hidden print:inline">
                    {customerAddress || "[---]"}
                  </span>
                </p>
                <p>
                  Điện thoại:{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </span>
                  <span className="hidden print:inline">
                    {customerPhone || "[---]"}
                  </span>
                </p>
                <p>
                  Email:{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </span>
                  <span className="hidden print:inline">
                    {customerEmail || "[---]"}
                  </span>
                </p>
                <div className="mt-2">
                  <p className="font-semibold">Nếu là cá nhân:</p>
                  <p className="">
                    CCCD: Số {data.cccd || "[---]"} cấp ngày{" "}
                    {data.cccdIssueDate || "[---]"} bởi{" "}
                    {data.cccdIssuePlace || "[---]"}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="font-semibold">Nếu là tổ chức:</p>
                  <p className="">
                    MSDN:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={taxCodeOrg}
                        onChange={(e) => setTaxCodeOrg(e.target.value)}
                        className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                        placeholder=""
                      />
                    </span>
                    <span className="hidden print:inline">
                      {taxCodeOrg || "[---]"}
                    </span>
                  </p>
                  <p className="">
                    Đại diện:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={representativeOrg}
                        onChange={(e) => setRepresentativeOrg(e.target.value)}
                        className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                        placeholder=""
                      />
                    </span>
                    <span className="hidden print:inline">
                      {representativeOrg || "[---]"}
                    </span>
                  </p>
                  <p className="">
                    Chức vụ:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={positionOrg}
                        onChange={(e) => setPositionOrg(e.target.value)}
                        className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                        placeholder=""
                      />
                    </span>
                    <span className="hidden print:inline">
                      {positionOrg || "[---]"}
                    </span>
                  </p>
                  <p className="">
                    Giấy uỷ quyền:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={giayUyQuyen2}
                        onChange={(e) => setGiayUyQuyen2(e.target.value)}
                        className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                        placeholder=""
                      />
                    </span>
                    <span className="hidden print:inline">
                      {giayUyQuyen2 || "[---]"}
                    </span>{" "}
                    ngày{" "}
                    <span className="print:hidden">
                      <input
                        type="date"
                        value={giayUyQuyen2NgayRaw}
                        onChange={(e) => {
                          setGiayUyQuyen2NgayRaw(e.target.value);
                          if (e.target.value) {
                            setGiayUyQuyen2Ngay(
                              formatDateForDisplay(e.target.value)
                            );
                          } else {
                            setGiayUyQuyen2Ngay("");
                          }
                        }}
                        className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                        placeholder=""
                      />
                    </span>
                    <span className="hidden print:inline">
                      {giayUyQuyen2Ngay || "[---/---/---]"}
                    </span>
                  </p>
                </div>
                <p className="mt-2">
                  Sau đây gọi là <strong>"Khách Hàng"</strong>
                </p>
              </div>
            </div>
          </div>

          {/* General Agreement Statement */}
          <div className="mb-2 text-sm">
            <p className="italic">
              Bên Bán và Khách Hàng sau đây được gọi riêng là{" "}
              <strong>"Bên"</strong> và gọi chung là <strong>"Các Bên"</strong>
            </p>
            <p className="mt-2">
              Các Bên cùng thỏa thuận và thống nhất như sau:
            </p>
          </div>

          {/* Điều 1 */}
          <div className="mb-2 text-sm">
            <h2 className="font-bold">
              Điều 1. Thông tin về xe, giá trị mua bán và thanh toán
            </h2>

            {/* 1.1 */}
            <div className="mb-2">
              <h3 className="">1.1. Thông tin về xe và giá trị mua bán</h3>

              {/* Table */}
              <table className="w-full border-2 border-black text-sm mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th
                      className="border-2 border-black p-2 text-center"
                      style={{ width: "5%" }}
                    >
                      TT
                    </th>
                    <th
                      className="border-2 border-black p-2 text-left"
                      style={{ width: "50%" }}
                    >
                      Mô tả xe
                    </th>
                    <th
                      className="border-2 border-black p-2 text-center"
                      style={{ width: "10%" }}
                    >
                      Số lượng
                    </th>
                    <th
                      className="border-2 border-black p-2 text-right"
                      style={{ width: "17.5%" }}
                    >
                      Đơn Giá (VNĐ)
                    </th>
                    <th
                      className="border-2 border-black p-2 text-right"
                      style={{ width: "17.5%" }}
                    >
                      Thành tiền (VNĐ)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-2 border-black p-2 text-center">
                      1
                    </td>
                    <td className="border-2 border-black p-2">
                      <div className="space-y-1">
                        <p>
                          {/* Print view */}
                          <span className="hidden print:inline">
                            VinFast {data.model || "[---]"} - Phiên bản:{" "}
                            {data.variant || "[---]"} - Màu:{" "}
                            {getColorName(data.exterior, true) ||
                              data.exterior ||
                              "[---]"}
                          </span>
                          {/* Edit view */}
                          <span className="print:hidden">
                            VinFast{" "}
                            <input
                              type="text"
                              value={data.model || ""}
                              onChange={(e) =>
                                setData({ ...data, model: e.target.value })
                              }
                              className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-20 focus:outline-none focus:border-blue-500"
                              placeholder="VF 5"
                            />
                            {" "}- Phiên bản:{" "}
                            <input
                              type="text"
                              value={data.variant || ""}
                              onChange={(e) =>
                                setData({ ...data, variant: e.target.value })
                              }
                              className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-24 focus:outline-none focus:border-blue-500"
                              placeholder="Plus"
                            />
                            {" "}- Màu:{" "}
                            <input
                              type="text"
                              value={getColorName(data.exterior, true) || data.exterior || ""}
                              onChange={(e) =>
                                setData({ ...data, exterior: e.target.value })
                              }
                              className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-32 focus:outline-none focus:border-blue-500"
                              placeholder="Infinity Blanc"
                            />
                          </span>
                        </p>
                        <p>
                          <span className="print:hidden">
                            <input
                              type="text"
                              value={data.gomPin || ""}
                              onChange={(e) =>
                                setData({ ...data, gomPin: e.target.value })
                              }
                              className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                              placeholder="gồm/ không gồm pin"
                            />
                          </span>
                          <span className="hidden print:inline">
                            {data.gomPin || "[gồm/ không gồm pin]"}
                          </span>
                        </p>
                        <p>
                          Số khung:{" "}
                          <span className="print:hidden">
                            <input
                              type="text"
                              value={data.soKhung || ""}
                              onChange={(e) =>
                                setData({ ...data, soKhung: e.target.value })
                              }
                              className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                              placeholder=""
                            />
                          </span>
                          <span className="hidden print:inline">
                            {data.soKhung || "[---]"}
                          </span>
                        </p>
                        <p>Tình trạng: Mới 100%</p>
                        <p>
                          Thông số kỹ thuật: Theo tiêu chuẩn của Nhà sản xuất
                        </p>
                        <p className="">
                          (sau đây gọi là <strong>"Xe"</strong>)
                        </p>
                      </div>
                    </td>
                    <td className="border-2 border-black p-2 text-center">
                      1
                    </td>
                    <td className="border-2 border-black p-2 text-right">
                      {formatCurrency(data.contractPrice) || "[---]"}
                    </td>
                    <td className="border-2 border-black p-2 text-right">
                      {formatCurrency(data.contractPrice) || "[---]"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan="4"
                      className="border-2 border-black p-2 font-bold text-left"
                    >
                      Tổng cộng:
                    </td>
                    <td className="border-2 border-black p-2 font-bold text-right">
                      {formatCurrency(data.contractPrice) || "[---]"}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Số tiền bằng chữ */}
              <p className="italic">
                <strong>Số tiền bằng chữ:</strong>{" "}
                <strong>{vndToWords(data.contractPrice) || "[---]"}</strong>
              </p>

              {/* Price Inclusion Clause */}
              <p className="mb-4 text-left leading-relaxed">
                Giá Xe đã bao gồm thuế tiêu thụ đặc biệt, thuế giá trị gia tăng
                (VAT), nhưng không bao gồm lệ phí trước bạ, chi phí đăng ký, lưu
                hành, bảo hiểm xe, phí dịch vụ thuê pin và các chi phí khác.
              </p>
            </div>

            {/* 1.2 */}
            <div className="mb-4">
              <h3 className="">1.2. Chính sách ưu đãi áp dụng:</h3>
              <div className="print:hidden mb-2">
                {isEditingUuDai ? (
                  <textarea
                    value={uuDai}
                    onChange={(e) => setUuDai(e.target.value)}
                    onBlur={() => setIsEditingUuDai(false)}
                    className="border-2 border-black px-2 py-1 text-sm font-normal w-full focus:outline-none focus:border-blue-500 resize-y min-h-[80px]"
                    placeholder="Nhập các ưu đãi, phân cách bằng dấu phẩy (,) hoặc xuống dòng..."
                    rows={4}
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() => setIsEditingUuDai(true)}
                    className="border-2 border-black px-2 py-1 text-sm font-normal w-full min-h-[80px] cursor-text bg-white"
                  >
                    {uuDai ? (
                      <div className="space-y-1">
                        {(() => {
                          const textStr = String(uuDai);
                          if (!textStr.trim()) return null;

                          let lines = [];
                          const newlineSplit = textStr
                            .split("\n")
                            .map((line) => line.trim())
                            .filter((line) => line !== "");

                          if (newlineSplit.length > 1) {
                            lines = newlineSplit;
                          } else {
                            const singleLine = textStr.trim();
                            const commaSplit = singleLine
                              .split(/,\s*/)
                              .map((item) => item.trim())
                              .filter((item) => item !== "");
                            if (commaSplit.length > 1) {
                              lines = commaSplit;
                            } else {
                              lines = [singleLine];
                            }
                          }

                          return lines.map((line, index) => (
                            <div key={index}>- {line}</div>
                          ));
                        })()}
                      </div>
                    ) : (
                      <span className="text-gray-400">
                        Nhập các ưu đãi, phân cách bằng dấu phẩy (,) hoặc xuống
                        dòng...
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="hidden print:block">{formatUuDaiList(uuDai)}</div>
              <p className="text-left leading-relaxed">
                Thông tin chi tiết được công bố tại website:{" "}
                <a
                  href="https://vinfastauto.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline print:text-black"
                >
                  https://vinfastauto.com
                </a> ("
                <strong>Website</strong>").
              </p>
              <p className="text-left leading-relaxed">
                Với dòng xe VF3, VF 7, VF 8, VF 9, VF MPV7 Khách Hàng cam kết
                rằng, để hưởng ưu đãi miễn phí sạc pin theo chính sách (nếu có),
                Khách Hàng sẽ không sử dụng xe cho mục đích kinh doanh dịch vụ
                dưới bất kỳ hình thức nào (bao gồm nhưng không giới hạn: cho thuê
                xe để cung cấp dịch vụ vận tải, vận tải hành khách hoặc hàng hóa
                có thu phí (không hoặc có sử dụng công nghệ) hoặc các hoạt động
                tương tự…).
              </p>
              <p className="text-left leading-relaxed">
                Trường hợp Khách Hàng chậm trễ thanh toán/nhận Xe hoặc vi phạm
                bất kỳ nghĩa vụ nào trong Hợp Đồng, chính sách ưu đãi có thể
                được điều chỉnh hoặc hủy bỏ tùy thuộc vào quyết định của Bên
                Bán.
              </p>
            </div>

            {/* 1.3 */}
            <div className="mb-4">
              <h3 className="">1.3. Thanh toán tiền mua Xe</h3>
              <div className="space-y-2 text-left leading-relaxed">
                <p>
                  a) <strong>Đợt 1:</strong> Khách Hàng đặt cọc cho Bên Bán số
                  tiền {formatCurrency(data.deposit) || "[---]"} VNĐ (bằng chữ:{" "}
                  {vndToWords(data.deposit) || "[---]"}) trong thời hạn 03 (ba)
                  ngày làm việc kể từ ngày ký Hợp Đồng nhưng không muộn hơn thời
                  hạn áp dụng chính sách ưu đãi theo Điều 1.2. Tiền đặt cọc sẽ
                  được chuyển thành khoản thanh toán mua Xe khi Bên Bán xuất hóa
                  đơn. Nếu Khách Hàng đã đặt cọc theo Đơn đặt hàng và đặt cọc
                  mua xe điện VinFast trước đó, tiền đặt cọc đó sẽ được trừ vào
                  khoản đặt cọc Đợt 1 của Hợp Đồng này.
                </p>
                <p>b) Tiến độ các đợt thanh toán tiếp theo như sau:</p>
                <p className="pl-4 italic">
                  Khách Hàng lựa chọn một trong hai hình thức thanh toán trả
                  thẳng hoặc trả góp.
                </p>
                {/* Trả thẳng section - show when no payment method selected or payment is trả thẳng */}
                {(!paymentMethod || paymentMethod === "trả thẳng") && (
                  <>
                <p className="pl-4">
                  • <span className="underline">Thanh toán trả thẳng:</span>
                </p>
                <p className="pl-8">
                  <strong>Đợt 2:</strong>{" "}
                  {formatCurrency(data.contractPrice - data.deposit) || "[---]"}{" "}
                  VNĐ{" "}
                  <span className="italic">
                    (bằng chữ:{" "}
                    {vndToWords(data.contractPrice - data.deposit) || "[---]"})
                  </span>{" "}
                  Khách Hàng thanh toán trong vòng 07 (bảy) ngày làm việc kể từ
                  ngày Bên Bán thông báo về việc Xe sẵn có để giao cho Khách
                  Hàng.
                </p>
                  </>
                )}
                {/* Trả góp section - show when no payment method selected or payment is trả góp */}
                {(!paymentMethod || paymentMethod === "trả góp") && (
                  <>
                <p className="pl-4">
                  • <span className="underline">Thanh toán trả góp:</span>
                </p>
                <p className="pl-8">
                  <strong>Đợt 2:</strong>{" "}
                  <span className="print:hidden">
                    <CurrencyInput
                      value={soTienDot2}
                      onChange={(val) => {
                        setSoTienDot2(val);
                        if (val) {
                          setSoTienDot2BangChu(vndToWords(val));
                        } else {
                          setSoTienDot2BangChu("");
                        }
                      }}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </span>
                  <span className="hidden print:inline">
                    {soTienDot2 ? formatCurrency(soTienDot2) : "[---]"}
                  </span>{" "}
                  VNĐ{" "}
                  <span className="italic">
                    (bằng chữ:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={soTienDot2BangChu}
                        onChange={(e) => setSoTienDot2BangChu(e.target.value)}
                        className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                        placeholder=""
                      />
                    </span>
                    <span className="hidden print:inline">
                      {soTienDot2BangChu || "[---]"}
                    </span>
                    )
                  </span>{" "}
                  Khách Hàng thanh toán trong vòng 07 (bảy) ngày làm việc kể từ
                  ngày Bên Bán thông báo về việc Xe sẵn có để giao cho Khách
                  Hàng hoặc thanh toán theo thỏa thuận khác giữa Các Bên, Khách
                  Hàng đồng thời bàn giao cho Bên Bán bản gốc Thông Báo Tín Dụng
                  của ngân hàng cam kết cho Khách Hàng vay số tiền{" "}
                  <span className="print:hidden">
                    <CurrencyInput
                      value={soTienVay}
                      onChange={(val) => {
                        setSoTienVay(val);
                        if (val) {
                          setSoTienVayBangChu(vndToWords(val));
                        } else {
                          setSoTienVayBangChu("");
                        }
                      }}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </span>
                  <span className="hidden print:inline">
                    {soTienVay ? formatCurrency(soTienVay) : "[---]"}
                  </span>{" "}
                  VNĐ{" "}
                  <span className="italic">
                    (bằng chữ:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={soTienVayBangChu}
                        onChange={(e) => setSoTienVayBangChu(e.target.value)}
                        className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                        placeholder=""
                      />
                    </span>
                    <span className="hidden print:inline">
                      {soTienVayBangChu || "[---]"}
                    </span>
                    )
                  </span>{" "}
                  để mua Xe.
                </p>
                <p className="pl-8">
                  <strong>Đợt 3:</strong>{" "}
                  <span className="print:hidden">
                    <CurrencyInput
                      value={soTienDot3}
                      onChange={(val) => {
                        setSoTienDot3(val);
                        if (val) {
                          setSoTienDot3BangChu(vndToWords(val));
                        } else {
                          setSoTienDot3BangChu("");
                        }
                      }}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                      placeholder=""
                    />
                  </span>
                  <span className="hidden print:inline">
                    {soTienDot3 ? formatCurrency(soTienDot3) : "[---]"}
                  </span>{" "}
                  VNĐ{" "}
                  <span className="italic">
                    (bằng chữ:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={soTienDot3BangChu}
                        onChange={(e) => setSoTienDot3BangChu(e.target.value)}
                        className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                        placeholder=""
                      />
                    </span>
                    <span className="hidden print:inline">
                      {soTienDot3BangChu || "[---]"}
                    </span>
                    )
                  </span>{" "}
                  Số tiền này phải được ngân hàng cấp Thông Báo Tín Dụng thanh
                  toán vào tài khoản của Bên Bán trong vòng 05 (năm) ngày làm
                  việc kể từ ngày Bên Bán và Khách Hàng bàn giao giấy hẹn trả
                  kết quả đăng ký Xe cho ngân hàng này.
                </p>
                  </>
                )}
              </div>
            </div>

            {/* 1.4 */}
            <div className="mb-4">
              <h3 className="">1.4. Phương thức thanh toán</h3>
              <div className="space-y-2 text-left leading-relaxed">
                Khách Hàng có thể thanh toán cho Bên Bán bằng cách: (i) chuyển
                khoản vào tài khoản của Bên Bán theo thông tin nêu tại phần đầu
                Hợp Đồng. Nội dung chuyển khoản ghi theo cú pháp:{" "}
                <strong>
                  Tên Khách Hàng_Số điện thoại_Số hợp đồng mua bán/Số đơn
                  hàng_Model Xe
                </strong>
                . Phí liên quan đến việc chuyển khoản do Khách Hàng chịu; (ii)
                thanh toán bằng tiền mặt (không áp dụng với mua hàng trực
                tuyến), (iii) thanh toán bằng thẻ ngân hàng (chỉ áp dụng khi
                thanh toán tiền đặt cọc, phí giao dịch bằng thẻ Bên Bán chịu).
              </div>
            </div>
          </div>

          {/* Điều 2 */}
          <div className="mb-6 text-sm">
            <h2 className="font-bold">Điều 2. Thời gian và địa điểm giao Xe</h2>
            <div className="space-y-2 text-left leading-relaxed">
              <p>
                2.1. Thời gian giao Xe:{" "}
                <span className="print:hidden">
                  <input
                    type="date"
                    value={thoiGianGiaoXeRaw}
                    onChange={(e) => {
                      setThoiGianGiaoXeRaw(e.target.value);
                      if (e.target.value) {
                        setThoiGianGiaoXe(formatDateForDisplay(e.target.value));
                      } else {
                        setThoiGianGiaoXe("");
                      }
                    }}
                    className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-auto focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">
                  {thoiGianGiaoXe || "[---/---/---]"}
                </span>
                /theo thông báo của Bên Bán trước ít nhất 07 ngày làm việc (đối
                với mua hàng qua kênh trực tuyến).
              </p>
              <p>
                2.2. Địa điểm giao Xe tại:{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={diaDiemGiaoXe}
                    onChange={(e) => setDiaDiemGiaoXe(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm font-normal w-[80%] focus:outline-none focus:border-blue-500"
                    placeholder=""
                  />
                </span>
                <span className="hidden print:inline">
                  {diaDiemGiaoXe || "[---]"}
                </span>
              </p>
              <p>
                2.3. Trừ trường hợp nêu tại Điều 3, Bên Bán sẽ giao Xe cùng với
                hóa đơn và đầy đủ giấy tờ cho Khách Hàng sau khi nhận đủ 100%
                Tổng giá trị mua bán nêu tại Điều 01 Hợp Đồng.
              </p>
            </div>
          </div>

          {/* Điều 3 */}
          <div className="mb-2 text-sm">
            <h2 className="font-bold">
              Điều 3. Thủ tục mua xe khi Khách Hàng thanh toán bằng hình thức
              trả góp
            </h2>
            <div className="space-y-2 text-left leading-relaxed">
              <p>
                3.1. Khi nhận được thanh toán Đợt 2 và chấp nhận Thông Báo Tín
                Dụng, Bên Bán sẽ xuất hoá đơn cho Khách Hàng. Khách Hàng phải
                làm thủ tục đăng ký Xe trong vòng 05 (năm) ngày làm việc kể từ
                ngày được thông báo. Việc đăng ký Xe phải có sự tham gia của
                nhân sự Bên Bán và Khách Hàng phải tuân thủ hướng dẫn của Bên
                Bán. Khách Hàng ủy quyền cho Bên Bán giữ các giấy hẹn trả kết
                quả trong quá trình thực hiện thủ tục tại cơ quan nhà nước có
                thẩm quyền.
              </p>
              <p>
                3.2. Nếu vì bất cứ lý do gì mà ngân hàng cấp Thông Báo Tín Dụng
                không giải ngân đầy đủ và đúng hạn số tiền còn lại của Đợt 3 cho
                Bên Bán thì:
              </p>
              <p className="">
                a) Trong vòng 10 (mười) ngày làm việc kể từ ngày Bên Bán yêu
                cầu, Khách Hàng sẽ tự mình thanh toán đầy đủ cho Bên Bán toàn bộ
                số tiền còn lại.
              </p>
              <p className="">
                b) Sau thời hạn nêu tại Điều 3.2.(a), nếu Bên Bán không nhận
                được số tiền còn lại của Đợt 3 thì Bên Bán có quyền yêu cầu
                Khách Hàng thực hiện theo phương án do Bên Bán đưa ra. Khách
                Hàng đồng ý ủy quyền cho Bên Bán toàn quyền quyết định đối với
                Xe bao gồm cả thanh lý xe để thu hồi các khoản tiền mà Khách
                Hàng còn nợ. Khoản tiền thu được khi xử lý Xe sẽ ưu tiên thanh
                toán các khoản nợ của Khách Hàng đối với Bên Bán. Khách Hàng sẽ
                chịu mọi chi phí và thiệt hại phát sinh để xử lý Xe, và thanh
                toán cho Bên Bán thù lao ủy quyền bằng 10% giá trị Xe tại thời
                điểm xử lý.
              </p>
            </div>
          </div>

          {/* Điều 4 */}
          <div className="mb-2 text-sm">
            <h2 className="font-bold">Điều 4. Bảo hành</h2>
            <div className="space-y-2 text-left leading-relaxed">
              <p>
                4.1. Chính sách bảo hành: quy định tại sổ bảo hành do Bên Bán
                cung cấp cho Khách Hàng.
              </p>
              <p>
                4.2. Địa điểm bảo hành: tại các Trung tâm dịch vụ sửa chữa xe
                điện VinFast.
              </p>
            </div>
          </div>

          {/* Điều 5 */}
          <div className="mb-2 text-sm">
            <h2 className="font-bold">Điều 5. Trách nhiệm của Các Bên</h2>
            <div className="space-y-2 text-left leading-relaxed">
              <p>
                5.1. Bên Bán có nghĩa vụ cung cấp đầy đủ hóa đơn, chứng từ, tài
                liệu hợp lệ cho Khách Hàng.
              </p>
              <p>
                5.2. Việc thông báo của Bên Bán phải bằng văn bản, email, ứng
                dụng VinFast Trading, cuộc gọi hoặc tin nhắn.
              </p>
              <p>
                5.3. Khách Hàng có trách nhiệm thanh toán và nhận Xe theo đúng
                thời gian đã quy định.
              </p>
              <p>
                5.4. Việc giao/nhận Xe và giấy tờ phải do Khách Hàng trực tiếp
                thực hiện. Nếu Khách Hàng ủy quyền cho người khác, người đó phải
                xuất trình giấy tờ tùy thân kèm giấy ủy quyền hợp lệ
              </p>
              <p>
                5.5. Nếu Khách Hàng chậm nhận Xe, Khách Hàng phải trả cho Bên
                Bán chi phí lưu giữ Xe theo đơn giá Bên Bán thông báo. Nếu Khách
                Hàng đã thanh toán 100% giá trị Hợp Đồng mà chậm nhận Xe quá 30
                (ba mươi) ngày, Khách Hàng đồng ý Bên Bán có toàn quyền định
                đoạt Xe.
              </p>
              <p>
                5.6. Khách Hàng chậm thanh toán sẽ phải trả lãi suất quá hạn
                15%/năm tương ứng với số tiền và số ngày chậm trả.
              </p>
              <p>
                5.7. Khách Hàng hiểu và đồng ý rằng Xe chỉ hoạt động tốt khi
                được sử dụng với pin và thiết bị sạc chính hãng và được sử dụng
                đúng theo tài liệu/hướng dẫn sử dụng và Sổ bảo hành được cung
                cấp tới Khách Hàng và/hoặc đăng tải lên Website. Nếu Khách Hàng
                sử dụng Xe không đúng hướng dẫn, Bên Bán, Công ty TNHH Thương
                mại và Dịch vụ VinFast (<strong>“VinFast Trading”</strong>) và
                Công ty Cổ phần Sản xuất và Kinh doanh VinFast (
                <strong>“Nhà sản xuất”</strong> hay <strong>“VinFast”</strong>)
                được miễn trừ trách nhiệm đối với mọi tổn thất và thiệt hại (nếu
                có) có liên quan.
              </p>
              <p>
                5.8. Xe được tích hợp sẵn chip eSIM (trong trường hợp Xe có chip
                eSIM) nhằm cung cấp các dịch vụ và tính năng thông minh tới
                Khách Hàng. Để sử dụng các dịch vụ này, Khách Hàng cần duy trì
                eSIM. Mọi thông tin tham khảo tại E-brochure trên Website hoặc
                Ứng dụng VinFast.
              </p>
            </div>
          </div>

          {/* Điều 6 */}
          <div className="mb-2 text-sm">
            <h2 className="font-bold">Điều 6. Chuyển rủi ro và quyền sở hữu</h2>
            <div className="space-y-2 text-left leading-relaxed">
              <p>
                Trừ trường hợp Hợp Đồng có quy định khác, toàn bộ quyền sở hữu
                đối với Xe, rủi ro và lợi ích liên quan đến Xe sẽ được chuyển
                giao sang cho Khách Hàng khi, tùy thời điểm nào đến trước: (i)
                Xe được bàn giao cho Khách Hàng hoặc người đại diện hợp pháp
                hoặc; (ii) Khách Hàng thanh toán 100% giá trị Hợp Đồng hoặc;
                (iii) Bên Bán xuất hóa đơn VAT cho Khách Hàng khi thanh toán trả
                góp.
              </p>
            </div>
          </div>

          {/* Điều 7 */}
          <div className="mb-2 text-sm">
            <h2 className="font-bold">Điều 7. Bảo vệ dữ liệu cá nhân</h2>
            <div className="space-y-2 text-left leading-relaxed">
              <p>
                7.1. Cùng với việc thực hiện Hợp Đồng này, VinFast Trading và
                VinFast có thể xử lý dữ liệu cá nhân của Khách Hàng, như các dữ
                liệu về tính năng dịch vụ thông minh giúp Khách Hàng nắm được
                thông số, hành trình, lịch sử hoạt động của Xe cũng như pin,
                tình trạng sạc pin; tính năng cập nhật phần mềm Xe từ xa; tính
                năng cảnh báo mức pin, ước tính thời lượng sử dụng pin; tính
                năng tìm kiếm, định vị và dẫn đường đến trạm sạc gần nhất; chẩn
                đoán, cảnh báo các vấn đề của Xe, và các dữ liệu khác được phân
                loại là dữ liệu cá nhân theo quy định pháp luật hiện hành.
              </p>
              <p>
                7.2. <strong>Đối với Khách Hàng là cá nhân:</strong> Bằng cách
                ký Hợp Đồng, Khách Hàng xác nhận đã đọc, hiểu và cho phép
                VinFast Trading, VinFast xử lý dữ liệu cá nhân của mình cho mục
                đích và phương thức mô tả tại Chính Sách Bảo Vệ Dữ Liệu Cá Nhân
                được công bố tại Website và được điều chỉnh tại từng thời điểm.
              </p>
              <p>
                7.3. <strong>Đối với Khách Hàng là tổ chức:</strong>
                (a) Mỗi Bên sẽ chịu trách nhiệm thu thập sự đồng ý cần thiết từ
                chủ thể dữ liệu cá nhân liên quan đến Hợp Đồng này và tự chịu
                trách nhiệm đối với dữ liệu cá nhân do mình xử lý, (b) Các Bên
                cam kết đưa ra và thực hiện: (i) các quy trình bảo mật để đảm
                bảo bảo vệ Dữ liệu Cá nhân thu được theo Hợp Đồng; và (ii) tuân
                thủ luật về bảo vệ dữ liệu cá nhân.
              </p>
            </div>
          </div>

          {/* Điều 8 */}
          <div className="mb-2 text-sm">
            <h2 className="font-bold">Điều 8. Bất khả kháng</h2>
            <div className="space-y-2 text-left leading-relaxed">
              <p>
                Nếu xảy ra sự kiện bất khả kháng sẽ được Các Bên xử lý theo quy
                định của pháp luật.
              </p>
            </div>
          </div>

          {/* Điều 9 */}
          <div className="mb-2 text-sm">
            <h2 className="font-bold">Điều 9. Hiệu lực và Chấm dứt Hợp Đồng</h2>
            <div className="space-y-2 text-left leading-relaxed">
              <p>
                Hợp Đồng có hiệu lực kể từ ngày ký tại phần đầu của Hợp Đồng và
                chấm dứt trong trường hợp sau:
              </p>
              <p>9.1. Các Bên có thỏa thuận chấm dứt Hợp Đồng;</p>
              <p>
                9.2. Bên Bán có quyền đơn phương chấm dứt Hợp Đồng nếu Khách
                Hàng vi phạm bất kỳ nghĩa vụ nào mà không khắc phục hoặc không
                thể khắc phục toàn bộ trong 10 (mười) ngày kể từ ngày đến hạn
                hoặc được thông báo và Khách Hàng sẽ không được nhận lại khoản
                tiền đặt cọc. Bên Bán, tùy theo quyết định của mình, có quyền
                đơn phương chấm dứt Hợp Đồng mà không phải chịu bất kỳ chế tài
                nào với điều kiện phải thông báo cho Khách Hàng trước ít nhất 07
                (bảy) ngày. Để làm rõ, trong trường hợp chấm dứt như vậy, Bên
                Bán sẽ trả lại khoản tiền đặt cọc cho Khách Hàng và không phải
                trả thêm bất cứ khoản tiền nào khác;
              </p>
            </div>
          </div>

          {/* Điều 10 */}
          <div className="mb-2 text-sm">
            <h2 className="font-bold">Điều 10. Các điều khoản khác</h2>
            <div className="space-y-2 text-left leading-relaxed">
              <p>
                10.1. Nếu không thương lượng được, các tranh chấp về Hợp Đồng sẽ
                được giải quyết tại tòa án có thẩm quyền.
              </p>
              <p>
                10.2. Bằng văn bản thông báo trước 5 (năm) ngày làm việc mà
                không nhận được phản hồi của Khách Hàng trong 5 (năm) ngày làm
                việc kể từ ngày thông báo, Bên Bán hiểu rằng Khách Hàng đồng ý
                cho Bên Bán chuyển giao Hợp Đồng này cho công ty con/liên kết
                của mình hoặc công ty mới thành lập do tái cơ cấu với điều kiện
                không ảnh hưởng đến quyền lợi của Khách Hàng.
              </p>
              <p>
                10.3.Hợp Đồng được lập thành 04 (bốn) bản có giá trị như nhau,
                mỗi Bên giữ 02 (hai) bản.
              </p>
            </div>
          </div>

          {/* Signature Section */}
          <div className="mt-8 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <p className="font-bold">KHÁCH HÀNG</p>
              </div>
              <div className="text-center">
                <p className="font-bold">BÊN BÁN</p>
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
          onClick={handlePrint}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          In Hợp Đồng
        </button>
      </div>

      
    </div>
  );
};

export default HopDongMuaBanXe;
