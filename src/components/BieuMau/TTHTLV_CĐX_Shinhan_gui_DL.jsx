import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import { getBranchByShowroomName, getDefaultBranch } from "../../data/branchData";
import { formatDate } from "../../utils/formatting";
import vinfastLogo from "../../assets/vinfast.svg";

const TTHTLV_CĐX_Shinhan_gui_DL = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);

  // Helper functions
  const pad = (num) => String(num).padStart(2, "0");

  // Editable fields
  const [ngayKy, setNgayKy] = useState("");
  const [thangKy, setThangKy] = useState("");
  const [namKy, setNamKy] = useState("");

  // Bên Bán (Seller)
  const [congTy, setCongTy] = useState("");
  const [diaChiTruSo, setDiaChiTruSo] = useState("");
  const [maSoDN, setMaSoDN] = useState("");
  const [taiKhoan, setTaiKhoan] = useState("");
  const [nganHangTK, setNganHangTK] = useState("");
  const [daiDien, setDaiDien] = useState("");
  const [chucVu, setChucVu] = useState("");
  const [giayUyQuyen, setGiayUyQuyen] = useState("");
  const [ngayUyQuyen, setNgayUyQuyen] = useState("");
  const [poaNo, setPoaNo] = useState("");
  const [poaDate, setPoaDate] = useState("");

  // Khách Hàng (Customer)
  const [tenKH, setTenKH] = useState("");
  const [diaChiKH, setDiaChiKH] = useState("");
  const [dienThoaiKH, setDienThoaiKH] = useState("");
  const [maSoThueKH, setMaSoThueKH] = useState("");
  const [cccdKH, setCccdKH] = useState("");
  const [ngayCapKH, setNgayCapKH] = useState("");
  const [noiCapKH, setNoiCapKH] = useState("");
  const [daiDienKH, setDaiDienKH] = useState("");
  const [chucVuKH, setChucVuKH] = useState("");

  // Thông tin xe và hợp đồng
  const [soHopDong, setSoHopDong] = useState("");
  const [mauXe, setMauXe] = useState("");
  const [soKhung, setSoKhung] = useState("");
  const [soMay, setSoMay] = useState("");

  // Policy Date
  const [tuNgay, setTuNgay] = useState("");
  const [tuThang, setTuThang] = useState("");

  // Firebase effect
  useEffect(() => {
    const loadData = async () => {
      let showroomName = location.state?.showroom || "";
      let showroomLoadedFromContracts = false;

      // Set default date
      const now = new Date();
      setNgayKy(pad(now.getDate()));
      setThangKy(pad(now.getMonth() + 1));
      setNamKy(now.getFullYear().toString());

      // Load from contracts or exportedContracts
      const contractId = location.state?.firebaseKey || location.state?.contractId;
      
      if (contractId) {
        try {
          // Try exportedContracts first
          let contractData = null;
          const exportedRef = ref(database, `exportedContracts/${contractId}`);
          const exportedSnapshot = await get(exportedRef);
          
          if (exportedSnapshot.exists()) {
            contractData = exportedSnapshot.val();
            console.log("Loaded from exportedContracts:", contractData);
          } else {
            // Try contracts path
            const contractsRef = ref(database, `contracts/${contractId}`);
            const contractsSnapshot = await get(contractsRef);
            if (contractsSnapshot.exists()) {
              contractData = contractsSnapshot.val();
              console.log("Loaded from contracts:", contractData);
            }
          }

          if (contractData) {
            // Load customer info (handle both camelCase and Vietnamese field names)
            setTenKH(contractData.customerName || contractData.khachHang || contractData["Tên KH"] || contractData["Tên Kh"] || "");
            setDiaChiKH(contractData.address || contractData.diaChiKhachHang || contractData["Địa chỉ"] || contractData["Địa Chỉ"] || "");
            setDienThoaiKH(contractData.phone || contractData.soDienThoaiKhachHang || contractData["Số điện thoại"] || contractData["Số Điện Thoại"] || "");
            setCccdKH(contractData.cccd || contractData.CCCD || contractData.soCccdKhachHang || contractData["Căn cước"] || "");
            setMaSoThueKH(contractData.maSoThue || contractData["Mã số thuế"] || contractData.msdn || "");
            
            // Ngày cấp CCCD
            const ngayCap = contractData.ngayCap || contractData.issueDate || contractData["Ngày cấp"] || contractData["Ngày Cấp"] || "";
            setNgayCapKH(formatDate(ngayCap));
            
            // Nơi cấp
            setNoiCapKH(contractData.noiCap || contractData.issuePlace || contractData["Nơi cấp"] || contractData["Nơi Cấp"] || "");

            // Load vehicle info
            setMauXe(contractData.dongXe || contractData.model || contractData.tenXe || contractData["Dòng xe"] || "");
            setSoKhung(contractData.soKhung || contractData["Số Khung"] || contractData.chassisNumber || "");
            setSoMay(contractData.soMay || contractData["Số Máy"] || contractData.engineNumber || "");
            
            // Load contract number (VSO)
            setSoHopDong(contractData.vso || contractData.VSO || contractData.soHopDong || contractData.contractNumber || "");

            // Load showroom/branch info
            if (contractData.showroom) {
              showroomName = contractData.showroom;
              showroomLoadedFromContracts = true;
            }
          }

          // If no showroom in exportedContracts, try to get from contracts path
          if (!showroomLoadedFromContracts) {
            const contractsRef = ref(database, `contracts/${contractId}`);
            const contractsSnapshot = await get(contractsRef);
            if (contractsSnapshot.exists()) {
              const contractsData = contractsSnapshot.val();
              if (contractsData.showroom) {
                showroomName = contractsData.showroom;
                showroomLoadedFromContracts = true;
                console.log("Showroom loaded from contracts:", showroomName);
              }
            }
          }

          // Set branch info if showroom found
          if (showroomLoadedFromContracts && showroomName) {
            const branchInfo = showroomName ? getBranchByShowroomName(showroomName) : null;
            setBranch(branchInfo);
            if (branchInfo) {
              setCongTy(`CHI NHÁNH ${branchInfo.shortName.toUpperCase()} - CÔNG TY CP ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG SÀI GÒN`);
              setDiaChiTruSo(branchInfo.address);
              setMaSoDN(branchInfo.taxCode || "");
              setTaiKhoan(branchInfo.bankAccount || "");
              setNganHangTK(branchInfo.bankName || "");
              setDaiDien(branchInfo.representativeName || "");
              setChucVu(branchInfo.position || "");
            }
          }
        } catch (error) {
          console.error("Error loading contract data:", error);
        }
      }

      // If showroom from location.state and not loaded from contracts
      if (!showroomLoadedFromContracts && location.state?.showroom) {
        const branchInfo = location.state.showroom ? getBranchByShowroomName(location.state.showroom) : null;
        setBranch(branchInfo);
        if (branchInfo) {
          setCongTy(`CHI NHÁNH ${branchInfo.shortName.toUpperCase()} - CÔNG TY CP ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG SÀI GÒN`);
          setDiaChiTruSo(branchInfo.address);
          setMaSoDN(branchInfo.taxCode || "");
          setTaiKhoan(branchInfo.bankAccount || "");
          setNganHangTK(branchInfo.bankName || "");
          setDaiDien(branchInfo.representativeName || "");
          setChucVu(branchInfo.position || "");
        }
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-8">

      {/* Content */}
      <div ref={printableRef} id="printable-content" className="max-w-[210mm] mx-auto p-10 bg-white shadow-lg">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');

          #printable-content {
            font-family: 'Times New Roman', Times, serif !important;
            font-size: 12pt;
            line-height: 1.3;
            color: #000;
          }

          @media print {
            @page {
              margin: 20mm 15mm 20mm 15mm;
              size: A4;
            }

            /* Hide everything by default */
            body * {
              visibility: hidden;
            }

            /* Show only the printable content */
            #printable-content,
            #printable-content * {
              visibility: visible;
            }

            /* Position the printable content to cover the page */
            #printable-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              max-width: none;
              margin: 0;
              padding: 0;
              box-shadow: none;
            }

            body {
              font-family: 'Times New Roman', Times, serif !important;
              font-size: 12pt;
              line-height: 1.3;
              color: #000;
            }
            .print\\:hidden {
              display: none !important;
            }
            .hidden {
              display: none !important;
            }
            .print\\:inline {
              display: inline !important;
            }
            .print\\:block {
              display: block !important;
            }
            .page-break {
              page-break-before: always;
            }
            input {
                font-family: 'Times New Roman', Times, serif !important;
                border: none;
                background: transparent;
            }
            /* Hide placeholder in print */
            input::placeholder {
                color: transparent;
            }
            
            /* Ensure text justification */
            p, li {
                text-align: justify;
            }
          }
          
          /* Screen styles */
          .screen-input {
            border-bottom: 1px dotted #999;
            padding: 0 4px;
            outline: none;
            background: transparent;
            font-family: 'Times New Roman', Times, serif !important;
          }
          .screen-input:focus {
            background: transparent;
            border-bottom: 1px solid blue;
          }
        `}</style>

        {/* Header with logo and title */}
        <div className="text-center mb-6">
          <div className="w-24 mx-auto mb-2">
            <img src={vinfastLogo} alt="VinFast Logo" className="w-full" />
          </div>
          <h1 className="text-lg font-bold uppercase text-[#2F5496] mb-6" style={{ color: '#2F5496' }}>
            THỎA THUẬN HỖ TRỢ LÃI VAY
          </h1>
        </div>

        <div className="text-left leading-relaxed text-[11pt] leading-snug space-y-3">
          <p>
            Thỏa thuận hỗ trợ lãi vay (“<strong>Thỏa Thuận</strong>”) này được ký ngày{" "}
            <span className="inline-block min-w-[30px] text-center">
              <input type="text" value={ngayKy} onChange={(e) => setNgayKy(e.target.value)} className="w-6 text-center screen-input" />
              <span className="hidden print:inline">{ngayKy}</span>
            </span>{" "}
            tháng{" "}
            <span className="inline-block min-w-[30px] text-center">
              <input type="text" value={thangKy} onChange={(e) => setThangKy(e.target.value)} className="w-6 text-center screen-input" />
              <span className="hidden print:inline">{thangKy}</span>
            </span>{" "}
            năm{" "}
            <span className="inline-block min-w-[50px] text-center">
              <input type="text" value={namKy} onChange={(e) => setNamKy(e.target.value)} className="w-10 text-center screen-input" />
              <span className="hidden print:inline">{namKy}</span>
            </span>,
            bởi và giữa:
          </p>

          {/* BÊN BÁN */}
          <div>
            <div className="flex">
              <strong className="min-w-[80px]">CÔNG TY</strong>
              <span>
                / <input type="text" value={congTy} onChange={(e) => setCongTy(e.target.value)} className="w-[500px] font-bold uppercase screen-input" />
                <span className="hidden print:inline font-bold uppercase">{congTy}</span>
              </span>
            </div>
            <div className="flex">
              <span className="min-w-[80px] font-bold text-[#2F5496]" style={{ color: '#2F5496' }}>|Địa chỉ:</span>
              <span className="flex-1">
                <input type="text" value={diaChiTruSo} onChange={(e) => setDiaChiTruSo(e.target.value)} className="w-full screen-input" />
                <span className="hidden print:inline">{diaChiTruSo}</span>
              </span>
            </div>
            <div className="flex">
              <span className="min-w-[140px]">Mã số doanh nghiệp:</span>
              <span className="flex-1">
                <input type="text" value={maSoDN} onChange={(e) => setMaSoDN(e.target.value)} className="w-full screen-input" />
                <span className="hidden print:inline">{maSoDN}</span>
              </span>
            </div>
            <div className="flex">
              <span className="min-w-[80px]">Tài khoản :</span>
              <span className="flex-1">
                <input type="text" value={taiKhoan} onChange={(e) => setTaiKhoan(e.target.value)} className="w-40 screen-input" />
                <span className="hidden print:inline">{taiKhoan}</span>
                <span className="mx-2">tại Ngân hàng</span>
                <input type="text" value={nganHangTK} onChange={(e) => setNganHangTK(e.target.value)} className="w-64 screen-input" />
                <span className="hidden print:inline">{nganHangTK}</span>
              </span>
            </div>
            <div className="flex">
              <span className="min-w-[80px]">Đại diện:</span>
              <span className="flex-1">
                <input type="text" value={daiDien} onChange={(e) => setDaiDien(e.target.value)} className="w-64 font-bold screen-input" />
                <span className="hidden print:inline font-bold">{daiDien}</span>
                <span className="mx-4">Chức vụ / <i className="text-[#00B0F0]" style={{ color: '#00B0F0' }}>Position</i>:</span>
                <input type="text" value={chucVu} onChange={(e) => setChucVu(e.target.value)} className="w-40 screen-input" />
                <span className="hidden print:inline">{chucVu}</span>
              </span>
            </div>
            <div className="flex">
              <span className="flex-1">
                (Theo Giấy ủy quyền số
                <input type="text" value={giayUyQuyen} onChange={(e) => setGiayUyQuyen(e.target.value)} className="w-32 mx-1 text-center screen-input" />
                <span className="hidden print:inline mx-1">{giayUyQuyen}</span>
                ngày
                <input type="text" value={ngayUyQuyen} onChange={(e) => setNgayUyQuyen(e.target.value)} className="w-32 mx-1 text-center screen-input" />
                <span className="hidden print:inline mx-1">{ngayUyQuyen}</span>
                )
              </span>
            </div>
            <div className="flex text-[#00B0F0] italic" style={{ color: '#00B0F0' }}>
              <span className="flex-1">
                (Following Power of Attorney No.
                <input type="text" value={poaNo} onChange={(e) => setPoaNo(e.target.value)} className="w-32 mx-1 text-center border-b border-[#00B0F0] text-[#00B0F0] italic outline-none" />
                <span className="hidden print:inline mx-1 border-b border-[#00B0F0] min-w-[50px]">{poaNo}</span>
                dated
                <input type="text" value={poaDate} onChange={(e) => setPoaDate(e.target.value)} className="w-32 mx-1 text-center border-b border-[#00B0F0] text-[#00B0F0] italic outline-none" />
                <span className="hidden print:inline mx-1 border-b border-[#00B0F0] min-w-[50px]">{poaDate}</span>
                )
              </span>
            </div>
            <div className="mt-1">
              <strong>(“Bên Bán”)</strong>
            </div>
            <div className="text-[#00B0F0] italic" style={{ color: '#00B0F0' }}>
              <strong>(“Seller”)</strong>
            </div>
          </div>

          <div className="font-bold my-4">VÀ</div>

          {/* KHÁCH HÀNG */}
          <div>
            <div className="mb-1">
              <input type="text" value={tenKH} onChange={(e) => setTenKH(e.target.value)} className="w-full font-bold uppercase screen-input" placeholder="TÊN KHÁCH HÀNG" />
              <span className="hidden print:block font-bold uppercase">{tenKH}</span>
            </div>
            <div className="h-[1px] bg-black w-1/2 mb-2"></div>

            <div className="flex mb-1">
              <span className="min-w-[100px]">Địa chỉ:</span>
              <span className="flex-1">
                <input type="text" value={diaChiKH} onChange={(e) => setDiaChiKH(e.target.value)} className="w-full screen-input" />
                <span className="hidden print:inline">{diaChiKH}</span>
              </span>
            </div>
            <div className="flex mb-1">
              <span className="min-w-[100px]">Điện thoại:</span>
              <span className="flex-1">
                <input type="text" value={dienThoaiKH} onChange={(e) => setDienThoaiKH(e.target.value)} className="w-full screen-input" />
                <span className="hidden print:inline">{dienThoaiKH}</span>
              </span>
            </div>
            <div className="flex mb-1">
              <span className="min-w-[100px]">Mã số thuế:</span>
              <span className="flex-1">
                <input type="text" value={maSoThueKH} onChange={(e) => setMaSoThueKH(e.target.value)} className="w-full screen-input" />
                <span className="hidden print:inline">{maSoThueKH}</span>
              </span>
            </div>
            <div className="flex mb-1">
              <span className="min-w-[220px]">Số Căn cước công dân/Thẻ Căn cước:</span>
              <span className="flex-1">
                <input type="text" value={cccdKH} onChange={(e) => setCccdKH(e.target.value)} className="w-40 screen-input" />
                <span className="hidden print:inline">{cccdKH}</span>
                <span className="mx-2">cấp ngày</span>
                <input type="text" value={ngayCapKH} onChange={(e) => setNgayCapKH(e.target.value)} className="w-24 screen-input" />
                <span className="hidden print:inline">{ngayCapKH}</span>
                <span className="mx-2">bởi</span>
                <input type="text" value={noiCapKH} onChange={(e) => setNoiCapKH(e.target.value)} className="w-32 screen-input" />
                <span className="hidden print:inline">{noiCapKH}</span>
              </span>
            </div>

            <div className="flex mb-1 mt-2">
              <span className="min-w-[80px]">Đại diện:</span>
              <span className="flex-1">
                <input type="text" value={daiDienKH} onChange={(e) => setDaiDienKH(e.target.value)} className="w-64 screen-input" />
                <span className="hidden print:inline">{daiDienKH}</span>
                <span className="mx-4">Chức vụ:</span>
                <input type="text" value={chucVuKH} onChange={(e) => setChucVuKH(e.target.value)} className="w-40 screen-input" />
                <span className="hidden print:inline">{chucVuKH}</span>
              </span>
            </div>
            <div className="mt-1">
              <strong>(“Khách Hàng”)</strong>
            </div>
            <div className="mt-1">
              Bên Bán và Khách Hàng sau đây được gọi riêng là <strong>“Bên”</strong> và gọi chung là <strong>“Các Bên”</strong>
            </div>
          </div>

          {/* XÉT RẰNG */}
          <div className="mt-6">
            <h3 className="font-bold uppercase mb-2">XÉT RẰNG</h3>

            <div className="flex mb-2">
              <span className="mr-2">1.</span>
              <div className="text-left leading-relaxed">
                Bên Bán và Khách Hàng đã ký hợp đồng mua bán xe ô tô số
                <input type="text" value={soHopDong} onChange={(e) => setSoHopDong(e.target.value)} className="w-40 mx-1 text-center font-bold screen-input" />
                <span className="hidden print:inline mx-1 font-bold">{soHopDong}</span>
                (sau đây gọi chung là <strong>“Hợp Đồng Mua Bán Xe”</strong>) với thông tin về xe như sau:
                <ul className="list-none pl-4 mt-1">
                  <li>- Mẫu xe:
                    <input type="text" value={mauXe} onChange={(e) => setMauXe(e.target.value)} className="w-64 mx-1 font-bold screen-input" />
                    <span className="hidden print:inline mx-1 font-bold">{mauXe}</span>
                  </li>
                  <li>- Số Khung:
                    <input type="text" value={soKhung} onChange={(e) => setSoKhung(e.target.value)} className="w-64 mx-1 font-bold screen-input" />
                    <span className="hidden print:inline mx-1 font-bold">{soKhung}</span>
                  </li>
                  <li>- Số Máy:
                    <input type="text" value={soMay} onChange={(e) => setSoMay(e.target.value)} className="w-64 mx-1 font-bold screen-input" />
                    <span className="hidden print:inline mx-1 font-bold">{soMay}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex mb-2">
              <span className="mr-2">2.</span>
              <div className="text-left leading-relaxed">
                Khách Hàng thuộc trường hợp được áp dụng chính sách hỗ trợ một khoản tiền tương đương một phần khoản lãi vay của khoản vay mua xe tại Ngân hàng TNHH MTV Shinhan Việt Nam (sau đây gọi là <strong>“Ngân Hàng”</strong>) có ngày Bên Bán xuất hóa đơn giá trị gia tăng bán xe thuộc thời hạn chương trình chính sách hỗ trợ lãi vay của VinFast (<strong>“Chính sách Hỗ trợ lãi vay”</strong>) áp dụng cho các Khách hàng tham gia chương trình Chuyển đổi xanh xuất hóa đơn từ ngày
                <input type="text" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} className="w-8 mx-1 text-center screen-input" placeholder="..." />
                <span className="hidden print:inline mx-1">{tuNgay}</span>/
                <input type="text" value={tuThang} onChange={(e) => setTuThang(e.target.value)} className="w-8 mx-1 text-center screen-input" placeholder="..." />
                <span className="hidden print:inline mx-1">{tuThang}</span>/2025
                đến hết ngày 31/12/2025, giải ngân đến hết ngày 31/12/2025. Công ty TNHH Kinh Doanh Thương Mại Và Dịch Vụ VinFast – Mã số thuế: 0108926276 (<strong>“VinFast Trading”</strong>), Ngân Hàng và Công ty cổ phần Sản xuất và Kinh doanh VinFast – Mã số thuế: 0107894416 (<strong>“VinFast”</strong>) đã ký Thỏa thuận hợp tác (<strong>“Thỏa Thuận Hợp Tác”</strong>) về việc hỗ trợ Khách Hàng vay mua xe ô tô điện VinFast theo Chương trình Chuyển đổi xanh tại Phụ lục số VFT-OT-20240129/PL02 ngày 15/08/2025. Theo đó, Khách Hàng sẽ được VinFast hỗ trợ thanh toán cho Ngân Hàng một khoản tiền chênh lệch giữa số tiền lãi của Ngân Hàng theo các quy định và điều kiện tại Thỏa Thuận Hợp Tác với số tiền lãi Khách Hàng chi trả hàng tháng. Khoản hỗ trợ này sẽ được VinFast chi trả cho Ngân Hàng thông qua VinFast Trading.
              </div>
            </div>

            <div className="flex mb-2">
              <span className="mr-2">3.</span>
              <div className="text-left leading-relaxed">
                Khách Hàng và Ngân Hàng đã hoặc sẽ ký kết một hợp đồng tín dụng (hoặc hợp đồng/thỏa thuận/khế ước khác có bản chất là hợp đồng tín dụng) và hợp đồng thế chấp (hoặc hợp đồng/thỏa thuận có bản chất là giao dịch bảo đảm) và tất cả các thỏa thuận, phụ lục, sửa đổi bổ sung liên quan (sau đây gọi chung là <strong>“Hợp Đồng Tín Dụng”</strong>). Theo đó, Ngân Hàng cho Khách Hàng vay một khoản tiền để mua xe ô tô VinFast theo Hợp Đồng Mua Bán Xe, giải ngân trực tiếp vào tài khoản của Bên Bán theo tiến độ thanh toán của Hợp Đồng Mua Bán Xe;
              </div>
            </div>

            <div className="flex mb-2">
              <span className="mr-2 text-[#2F5496] font-bold" style={{ color: '#2F5496' }}>4.</span>
              <div className="text-left leading-relaxed w-full">
                [Bên bán được VinFast Trading ủy quyền giao kết Thỏa thuận này với Khách hàng để triển khai Chính sách Hỗ trợ lãi vay]
              </div>
            </div>

            <p className="text-left leading-relaxed mb-4">
              Do vậy, để thực hiện Chính Sách Hỗ trợ lãi vay nêu trên, Các Bên thống nhất ký kết Thỏa Thuận với những nội dung như sau:
            </p>
          </div>

          {/* ĐIỀU 1 */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">Điều 1. Thỏa thuận về việc Hỗ Trợ Lãi Vay:</h3>
            <div className="pl-4">
              <div className="mb-2">
                <span className="font-bold">1.1. Chính sách Hỗ trợ lãi vay:</span>
                <ul className="list-none pl-4">
                  <li>- Số tiền vay tối đa bằng 80% giá trị xe trên hợp đồng mua bán xe</li>
                  <li>- Thời hạn vay tối đa bằng 96 tháng</li>
                  <li>- Lãi suất Ngân hàng áp dụng:
                    <ul className="list-disc pl-8">
                      <li>Lãi suất 36 tháng đầu tiên cố định: 6.8%/năm</li>
                      <li>Lãi suất sau 36 tháng đầu tiên: theo quy định của Ngân hàng</li>
                    </ul>
                  </li>
                  <li className="text-left leading-relaxed">- VinFast sẽ hỗ trợ Khách Hàng một khoản tiền (<strong>“Khoản Hỗ Trợ Lãi Vay”</strong>) tương đương khoản chênh lệch giữa (i) số tiền lãi của Ngân Hàng theo các quy định và điều kiện tại Chương Trình Hợp Tác và (ii) số tiền lãi mà Khách Hàng phải thanh toán, tương đương <strong>2%/năm trong 36 tháng đầu tiên</strong> trong thời gian vay (tối đa bằng 96 tháng) kể từ ngày bắt đầu tính lãi theo Hợp Đồng Tín Dụng (<strong>“Thời Gian Hỗ Trợ Lãi Vay”</strong>) hoặc cho đến khi Thời Gian Hỗ Trợ Lãi Vay chấm dứt trước thời hạn theo quy định tại Thỏa Thuận này, tùy thời điểm nào đến trước.</li>
                  <li className="text-left leading-relaxed">Số tiền gốc và lãi Khách Hàng được xác định theo phương pháp gốc trả đều hàng tháng, lãi tính theo dư nợ giảm dần trong đó lãi suất thực tế Khách Hàng phải chi trả như sau:
                    <ul className="list-disc pl-8">
                      <li>Lãi suất 36 tháng đầu tiên cố định: 4.8%/năm</li>
                      <li>Lãi suất sau 36 tháng đầu tiên: theo quy định của Ngân hàng</li>
                      <li className="text-left leading-relaxed"><i>Khoản hỗ trợ lãi vay VinFast trả thay Khách hàng (3):</i> là khoản chênh lệch cao hơn giữa mức lãi cho vay theo Hợp Đồng Tín Dụng mà Khách hàng kí với Ngân hàng (1) – mức lãi vay khách hàng phải trả cho Ngân hàng (2), tương đương 2%/năm trong 36 tháng đầu tiên, bao gồm cả phần lãi phát sinh tăng thêm trong trường hợp ngày trả nợ trùng vào ngày nghỉ lễ, Tết, ngày nghỉ hàng tuần theo quy định pháp luật và quy định của Ngân hàng và được dời sang ngày làm việc kế tiếp.</li>
                    </ul>
                  </li>
                  <li className="text-left leading-relaxed">- Chi tiết phần nợ gốc và lãi Khách hàng cần trả cho Ngân hàng gồm 02 phần:
                    <ul className="list-disc pl-8">
                      <li className="text-left leading-relaxed">Phần 01 do Khách hàng tự chi trả: bao gồm khoản nợ gốc và phần lãi phải trả định kỳ. Theo đó, Khách hàng sẽ thực hiện trả nợ theo định kỳ 01 tháng/lần một số tiền xác định theo phương pháp gốc trả đều hàng tháng, lãi tính theo dư nợ giảm dần.</li>
                      <li className="text-left leading-relaxed">Phần 02 do VinFast/VinFast Trading trả thay: là khoản chênh lệch cao hơn giữa mức lãi vay cho vay theo Hợp Đồng Tín Dụng (1) – mức lãi vay khách hàng phải trả cho Ngân hàng (2) được trả theo kỳ trả lãi 01 tháng/lần vào các ngày 05 hàng tháng và không vượt quá 36 tháng đầu tiên, bao gồm cả phần lãi phát sinh tăng thêm trong trường hợp ngày trả nợ trùng vào ngày nghỉ lễ, Tết, ngày nghỉ hàng tuần theo quy định pháp luật và quy định của Ngân hàng và được dời sang ngày làm việc kế tiếp.</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div className="mb-2">
                <span className="font-bold">1.2. Để tránh hiểu nhầm Các Bên thống nhất rằng: </span>
                <span className="text-left leading-relaxed">Trong mọi trường hợp VinFast cũng như VinFast Trading không chịu trách nhiệm đối với bất kỳ mức lãi nào ngoài mức lãi quy định trên đây vì lý do Khách Hàng không tuân thủ các quy định của Ngân Hàng hay vì bất kỳ lý do gì không phải do lỗi của VinFast/VinFast Trading. Khách Hàng chịu trách nhiệm thanh toán với Ngân Hàng toàn bộ các khoản lãi và chi phí phát sinh trên mức hỗ trợ lãi vay của VinFast Trading quy định ở trên bao gồm các khoản phí trả nợ trước hạn; các khoản lãi quá hạn, lãi phạt do chậm thanh toán gốc, lãi; lãi tăng lên do Khách Hàng vi phạm nghĩa vụ trả nợ hoặc vi phạm nghĩa vụ khác; các khoản tiền hoàn trả ưu đãi do trả nợ trước hạn; tiền bồi thường vi phạm Hợp Đồng Tín Dụng... VinFast cũng như VinFast Trading không có trách nhiệm thông báo, làm rõ, nhắc nợ hay thanh toán thay các khoản tiền này cho Khách Hàng.</span>
              </div>

              <div className="mb-2 text-left leading-relaxed">
                <span className="font-bold">1.3. </span>
                Thời Gian Hỗ Trợ Lãi Vay sẽ tự động chấm dứt trước hạn trong trường hợp Khách Hàng tất toán Khoản Giải Ngân trước hạn, hoặc trong trường hợp Hợp Đồng Tín Dụng chấm dứt trước khi hết Thời Gian Hỗ Trợ Lãi Vay vì bất cứ lý do gì. Hết Thời Gian Hỗ Trợ Lãi Vay hoặc khi Thời Gian Hỗ Trợ Lãi Vay chấm dứt trước hạn, Khách Hàng có nghĩa vụ tiếp tục thực hiện trả nợ lãi cho Ngân Hàng theo đúng quy định tại Hợp Đồng Tín Dụng và quy định của Ngân Hàng.
              </div>
            </div>
          </div>

          {/* ĐIỀU 2 */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">Điều 2. Quyền và nghĩa vụ của các Bên</h3>
            <div className="pl-4">
              <div className="mb-2">
                <span className="font-bold">2.1. Quyền và nghĩa vụ của VinFast Trading:</span>
                <ul className="list-none pl-4">
                  <li className="text-left leading-relaxed mb-1">a) Thực hiện kiểm tra, đối chiếu và xác nhận với Ngân Hàng các Khoản Hỗ Trợ Lãi Vay hỗ trợ cho Khách Hàng ngay trong ngày khi nhận được thông báo của Ngân Hàng có phát sinh các khoản vay của Khách Hàng thông qua email trước khi ký chính thức Thông báo thanh toán Khoản Hỗ Trợ Lãi Vay;</li>
                  <li className="text-left leading-relaxed mb-1">b) Thực hiện việc hỗ trợ Khoản Hỗ Trợ Lãi Vay của Khách Hàng theo Chính sách Hỗ trợ lãi vay theo Thỏa Thuận này;</li>
                  <li className="text-left leading-relaxed mb-1">c) Không chịu trách nhiệm đối với các mâu thuẫn, tranh chấp, khiếu kiện hay khiếu nại nào liên quan đến và/hoặc phát sinh giữa Ngân Hàng, Khách Hàng và các tổ chức, cá nhân khác trong quá trình thực hiện Hợp Đồng Tín Dụng và các thỏa thuận liên quan đến Hợp Đồng Tín Dụng mà không phải do lỗi từ VinFast Trading.</li>
                </ul>
              </div>
              <div className="mb-2">
                <span className="font-bold">2.2. Quyền và nghĩa vụ của Khách Hàng:</span>
                <ul className="list-none pl-4">
                  <li className="text-left leading-relaxed mb-1">a) Được VinFast Trading thực hiện việc hỗ trợ Khoản Hỗ Trợ Lãi Vay và áp dụng Chính sách Hỗ trợ lãi vay theo quy định của Thỏa Thuận này.</li>
                  <li className="text-left leading-relaxed mb-1">b) Tự chi trả, thanh toán nợ gốc, phí trả nợ trước hạn và bất kỳ khoản lãi, lãi quá hạn nào phát sinh ngoài phạm vi Khoản Hỗ Trợ Lãi Vay, Thời Gian Hỗ Trợ Lãi Vay và Chính sách Hỗ trợ lãi vay.</li>
                  <li className="text-left leading-relaxed mb-1">c) Khách Hàng cam kết miễn trừ cho VinFast, VinFast Trading mọi trách nhiệm, nghĩa vụ liên quan đến bất kỳ tranh chấp, mâu thuẫn, khiếu kiện, hay khiếu nại nào phát sinh từ, hoặc liên quan đến Hợp Đồng Tín Dụng.</li>
                  <li className="text-left leading-relaxed mb-1">d) Khách Hàng không được VinFast Trading hỗ trợ Khoản Hỗ Trợ Lãi Vay kể từ thời điểm Khách Hàng ký Văn bản chuyển nhượng Hợp Đồng Mua Bán và/hoặc xe ô tô là đối tượng của hợp đồng mua bán/chuyển nhượng với bất kỳ bên thứ ba nào khác.</li>
                  <li className="text-left leading-relaxed mb-1">e) Trong Thời Gian Hỗ Trợ Lãi Vay, nếu Khách Hàng tất toán Khoản Giải Ngân trước hạn, ký Văn bản chuyển nhượng Hợp Đồng Mua Bán và/hoặc xe ô tô là đối tượng của hợp đồng mua bán/ chuyển nhượng với bất kỳ bên thứ ba nào khác, không thực hiện theo đúng quy định tại Hợp Đồng Tín Dụng đã ký giữa Khách Hàng và Ngân Hàng dẫn đến Ngân Hàng chấm dứt Hợp Đồng Tín Dụng thì VinFast chấm dứt hỗ trợ Khoản Hỗ Trợ Lãi Vay theo Chính sách Hỗ trợ lãi vay theo quy định tại Thỏa Thuận này kể từ thời điểm Hợp Đồng Tín Dụng bị chấm dứt. Khách Hàng vẫn phải có trách nhiệm thực hiện nghĩa vụ đối với Ngân Hàng theo quy định của Hợp Đồng Tín Dụng và các thỏa thuận khác giữa Khách Hàng và Ngân Hàng (nếu có).</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ĐIỀU 3 */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">Điều 3. Điều khoản hỗ trợ Ngân hàng</h3>
            <div className="text-left leading-relaxed mb-2">
              Khách hàng cam kết không có bất kỳ khiếu nại, khiếu kiện nào và đảm bảo Đơn Vị Hỗ Trợ Kỹ Thuật như được định nghĩa phía dưới, cán bộ nhân viên của Đơn Vị Hỗ Trợ Kỹ Thuật không phải chịu bất kỳ trách nhiệm nào đối với bất kỳ tổn thất và thiệt hại nào (nếu có) phát sinh từ hoặc liên quan đến việc thực thi các nội dung nêu tại điểm a, b, c dưới đây:
            </div>
            <ul className="list-none pl-4">
              <li className="text-left leading-relaxed mb-1">a. Khách Hàng cho phép Ngân Hàng thu thập, xử lý các thông tin về xe, vị trí xe, tình trạng xe cho mục đích quản lý tài sản đảm bảo cho khoản vay theo Hợp Đồng Tín Dụng thông qua bên thứ ba là Đơn Vị Hỗ Trợ Kỹ Thuật;</li>
              <li className="text-left leading-relaxed mb-1">b. Trong trường hợp Khách Hàng vi phạm nghĩa vụ trả nợ quá 60 ngày, Ngân Hàng có quyền đề nghị VinFast Trading, nhà sản xuất xe và/ hoặc bất kỳ bên thứ ba khác được VinFast Trading ủy quyền (gọi chung là <strong>“Đơn Vị Hỗ Trợ Kỹ Thuật”</strong>) trích xuất dữ liệu định vị xe của Khách Hàng và Khách Hàng đồng ý để Đơn Vị Hỗ Trợ Kỹ Thuật thu thập, xử lý, cung cấp và chia sẻ dữ liệu này cho Ngân Hàng để phục vụ hoạt động xử lý thu hồi nợ;</li>
              <li className="text-left leading-relaxed mb-1">c. Trong trường hợp Khách Hàng vi phạm nghĩa vụ trả nợ quá 90 ngày, Ngân Hàng có quyền ủy quyền cho Đơn Vị Hỗ Trợ Kỹ Thuật kích hoạt tính năng giới hạn mức SOC (dung lượng pin) của pin tại ngưỡng 30% theo đề nghị của Ngân Hàng, và Khách Hàng đồng ý để Đơn Vị Hỗ Trợ Kỹ Thuật thực hiện các việc này.</li>
            </ul>
          </div>

          {/* ĐIỀU 4 */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">Điều 4. Hiệu lực của Thỏa Thuận</h3>
            <div className="pl-4">
              <div className="flex mb-1">
                <span className="mr-2">4.1.</span>
                <div className="text-left leading-relaxed">
                  Thỏa Thuận này có hiệu lực kể từ ngày ký đến ngày hết hiệu lực của Hợp Đồng Tín Dụng. Thỏa Thuận có thể chấm dứt trước thời hạn theo thỏa thuận của Các Bên hoặc xảy ra các trường hợp quy định tại Điều 2.2.e Thỏa Thuận này.
                </div>
              </div>
              <div className="flex mb-1">
                <span className="mr-2">4.2.</span>
                <div className="text-left leading-relaxed">
                  Khách Hàng không được chuyển nhượng, chuyển giao quyền và nghĩa vụ của mình theo Thỏa Thuận này cho bất kỳ bên thứ ba nào nếu không được chấp thuận trước bằng văn bản của VinFast Trading. Tuy nhiên, Khách Hàng đồng ý rằng VinFast và/hoặc VinFast Trading có quyền chuyển nhượng, chuyển giao các quyền/nghĩa vụ theo Thỏa Thuận này cho bên thứ ba, hoặc trong trường hợp VinFast/VinFast Trading tổ chức lại doanh nghiệp, bao gồm sáp nhập vào một công ty khác hoặc được chia, hoặc tách hoặc được chuyển đổi với điều kiện là việc chuyển nhượng, chuyển giao các quyền/nghĩa vụ đó không gây thiệt hại đến quyền và lợi ích của Khách Hàng theo Thỏa Thuận này và bên nhận chuyển giao các quyền/nghĩa vụ theo Thỏa Thuận này chịu trách nhiệm tiếp tục thực hiện đầy đủ các quyền và nghĩa vụ đối với Khách Hàng theo Thỏa Thuận này.
                </div>
              </div>
              <div className="flex mb-1">
                <span className="mr-2">4.3.</span>
                <div className="text-left leading-relaxed">
                  Mọi sửa đổi, bổ sung Thỏa Thuận này phải được lập thành văn bản và được ký bởi người đại diện hợp pháp của mỗi Bên.
                </div>
              </div>
              <div className="flex mb-1">
                <span className="mr-2">4.4.</span>
                <div className="text-left leading-relaxed">
                  Thỏa Thuận này được điều chỉnh theo các quy định của pháp luật Việt Nam. Mọi tranh chấp phát sinh từ Thỏa Thuận này nếu không được giải quyết bằng thương lượng và hòa giải giữa Các Bên, thì sẽ được giải quyết tại Tòa án có thẩm quyền.
                </div>
              </div>
              <div className="flex mb-1">
                <span className="mr-2">4.5.</span>
                <div className="text-left leading-relaxed">
                  Thỏa Thuận này được lập thành 04 (bốn) bản song ngữ tiếng Việt và tiếng Anh có giá trị như nhau, mỗi Bên giữ 02 (hai) bản để thực hiện. Trong trường hợp có bất kỳ sự không nhất quán hoặc mâu thuẫn nào giữa phiên bản tiếng Việt và phiên bản tiếng Anh, phiên bản tiếng Việt sẽ được ưu tiên.
                </div>
              </div>
            </div>
          </div>

          {/* SIGNATURES */}
          <div className="flex justify-between mt-8 mb-16 px-10">
            <div className="text-center">
              <h3 className="font-bold uppercase">ĐẠI DIỆN BÊN BÁN</h3>
              <p className="text-sm italic mb-20">(Ký và ghi rõ họ tên)</p>
            </div>
            <div className="text-center">
              <h3 className="font-bold uppercase">KHÁCH HÀNG</h3>
              <p className="text-sm italic mb-20">(Ký và ghi rõ họ tên)</p>
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
            In Thỏa thuận hỗ trợ lãi vay Shinhan
          </button>
        </div>
      </div>
    </div>
  );
};

export default TTHTLV_CĐX_Shinhan_gui_DL;
