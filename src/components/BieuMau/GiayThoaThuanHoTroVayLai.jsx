import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import {
  getBranchByShowroomName,
  getDefaultBranch,
} from "../../data/branchData";
import logo from "../../assets/images/logo.png";
import { PrintStyles } from "./PrintStyles";
import { downloadElementAsPdf } from "../../utils/pdfExport";

const GiayThoaThuanHoTroVayLai = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);

  // Editable fields - Ngày tháng
  const [ngayKy, setNgayKy] = useState("");
  const [thangKy, setThangKy] = useState("");
  const [namKy, setNamKy] = useState("");

  // Bên Bán
  const [congTyBenBan, setCongTyBenBan] = useState("");
  const [diaChiBenBan, setDiaChiBenBan] = useState("");
  const [maSoDN, setMaSoDN] = useState("");
  const [taiKhoan, setTaiKhoan] = useState("");
  const [nganHangBenBan, setNganHangBenBan] = useState("");
  const [daiDienBenBan, setDaiDienBenBan] = useState("");
  const [chucVuBenBan, setChucVuBenBan] = useState("");
  const [giayUyQuyen, setGiayUyQuyen] = useState("");
  const [ngayUyQuyen, setNgayUyQuyen] = useState("");

  // Khách Hàng
  const [tenKhachHang, setTenKhachHang] = useState("");
  const [diaChiKH, setDiaChiKH] = useState("");
  const [dienThoaiKH, setDienThoaiKH] = useState("");
  const [maSoThue, setMaSoThue] = useState("");
  const [cmtnd, setCmtnd] = useState("");
  const [ngayCapCMT, setNgayCapCMT] = useState("");
  const [noiCapCMT, setNoiCapCMT] = useState("");
  const [daiDienKH, setDaiDienKH] = useState("");
  const [chucVuKH, setChucVuKH] = useState("");

  // Thông tin xe
  const [soHopDong, setSoHopDong] = useState("");
  const [model, setModel] = useState("");
  const [soKhung, setSoKhung] = useState("");
  const [soMay, setSoMay] = useState("");

  // Editable fields - Chính sách
  const [tuNgay, setTuNgay] = useState("");
  const [tuThang, setTuThang] = useState("");

  // Editable percentage fields
  const [soTienVayToiDa, setSoTienVayToiDa] = useState("");
  const [thoiHanVayToiDa, setThoiHanVayToiDa] = useState("");
  const [laiSuat36ThangDau, setLaiSuat36ThangDau] = useState("");
  const [laiSuatKhachHang, setLaiSuatKhachHang] = useState("");

  useEffect(() => {
    const loadData = async () => {
      let showroomName = location.state?.showroom || "";
      let contractData = null;
      let showroomLoadedFromContracts = false;

      // Set default date
      const today = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      setNgayKy(pad(today.getDate()));
      setThangKy(pad(today.getMonth() + 1));
      setNamKy(today.getFullYear().toString());

      // Nếu có firebaseKey, thử lấy showroom từ exportedContracts trước, sau đó mới từ contracts
      if (location.state?.firebaseKey) {
        try {
          const contractId = location.state.firebaseKey;

          // Thử load từ exportedContracts trước (dữ liệu mới nhất)
          const exportedContractsRef = ref(database, `exportedContracts/${contractId}`);
          const exportedSnapshot = await get(exportedContractsRef);

          if (exportedSnapshot.exists()) {
            contractData = exportedSnapshot.val();
            console.log("Loaded from exportedContracts:", contractData);        
            if (contractData.showroom) {
              showroomName = contractData.showroom;
              showroomLoadedFromContracts = true;
              console.log("Showroom loaded from exportedContracts:", showroomName);
            }
          } else {
            // Nếu không có trong exportedContracts, thử load từ contracts      
            const contractsRef = ref(database, `contracts/${contractId}`);      
            const snapshot = await get(contractsRef);
            if (snapshot.exists()) {
              contractData = snapshot.val();
              console.log("Loaded from contracts:", contractData);
              if (contractData.showroom) {
                showroomName = contractData.showroom;
                showroomLoadedFromContracts = true;
                console.log("Showroom loaded from contracts:", showroomName);   
              }
            } else {
              console.log("Contract not found in both exportedContracts and contracts paths");
            }
          }
        } catch (error) {
          console.error("Error loading contract data:", error);
        }
      }

      // Lấy thông tin chi nhánh chỉ khi có showroom
      let branchInfo = null;
      if (showroomName) {
        branchInfo = getBranchByShowroomName(showroomName);
        setBranch(branchInfo);
      } else {
        setBranch(null);
      }

      // Auto-fill thông tin công ty từ branch (chỉ khi có branch)
      if (branchInfo) {
        setCongTyBenBan(branchInfo.name.toUpperCase());
        setDiaChiBenBan(branchInfo.address);
        setMaSoDN(branchInfo.taxCode || "");
        setDaiDienBenBan(branchInfo.representativeName || "");
        setChucVuBenBan(branchInfo.position || "");

        // Auto-fill thông tin ngân hàng từ branch
        setTaiKhoan(branchInfo.bankAccount || "");
        setNganHangBenBan(`${branchInfo.bankName || ""} - ${branchInfo.bankBranch || ""}`);
      } else {
        // Reset thông tin công ty khi không có branch
        setCongTyBenBan("");
        setDiaChiBenBan("");
        setMaSoDN("");
        setDaiDienBenBan("");
        setChucVuBenBan("");
        setTaiKhoan("");
        setNganHangBenBan("");
      }

      // Sử dụng dữ liệu từ database hoặc location.state
      const dataSource = contractData || location.state || {};

      // Auto-fill từ dữ liệu hợp đồng
      if (dataSource && Object.keys(dataSource).length > 0) {
        setData(dataSource);

        // Thông tin khách hàng
        const customerName =
          dataSource.customerName ||
          dataSource["Tên KH"] ||
          dataSource["Tên Kh"] ||
          "";
        if (customerName) setTenKhachHang(customerName);

        const customerAddress =
          dataSource.customerAddress ||
          dataSource.address ||
          dataSource["Địa Chỉ"] ||
          dataSource["Địa chỉ"] ||
          "";
        if (customerAddress) setDiaChiKH(customerAddress);

        const customerPhone =
          dataSource.customerPhone ||
          dataSource.phone ||
          dataSource["Số Điện Thoại"] ||
          dataSource["Số điện thoại"] ||
          "";
        if (customerPhone) setDienThoaiKH(customerPhone);

        // Mã số thuế
        const taxCode =
          dataSource.maSoThue ||
          dataSource.taxCode ||
          dataSource["Mã Số Thuế"] ||
          "";
        if (taxCode) setMaSoThue(taxCode);

        // CCCD - format với ngày cấp và nơi cấp
        const cccdNumber =
          dataSource.cccd ||
          dataSource.CCCD ||
          dataSource.customerCCCD ||
          "";
        const ngayCap =
          dataSource.ngayCap ||
          dataSource.issueDate ||
          dataSource["Ngày Cấp"] ||
          dataSource["Ngày cấp"] ||
          "";
        const noiCap =
          dataSource.noiCap ||
          dataSource.issuePlace ||
          dataSource["Nơi Cấp"] ||
          dataSource["Nơi cấp"] ||
          "";

        if (cccdNumber) {
          setCmtnd(cccdNumber);
          if (ngayCap) setNgayCapCMT(ngayCap);
          if (noiCap) setNoiCapCMT(noiCap);
        }

        // Đại diện và chức vụ khách hàng
        const daiDienKH =
          dataSource.daiDienKH ||
          dataSource.representative ||
          dataSource["Đại Diện"] ||
          "";
        if (daiDienKH) setDaiDienKH(daiDienKH);

        const chucVuKH =
          dataSource.chucVuKH ||
          dataSource.position ||
          dataSource["Chức Vụ"] ||
          "";
        if (chucVuKH) setChucVuKH(chucVuKH);

        // Số hợp đồng (mã hợp đồng)
        const contractNumber =
          dataSource.vso ||
          dataSource["VSO"] ||
          dataSource.soHopDong ||
          dataSource.contractNumber ||
          "";
        if (contractNumber) setSoHopDong(contractNumber);

        // Model xe
        const model =
          dataSource.model ||
          dataSource.dongXe ||
          dataSource["Dòng xe"] ||
          dataSource.hieuxe ||
          "";
        if (model) setModel(model);

        // Số khung
        if (dataSource.soKhung || dataSource["Số Khung"] || dataSource.chassisNumber) {
          setSoKhung(
            dataSource.soKhung ||
            dataSource["Số Khung"] ||
            dataSource.chassisNumber ||
            ""
          );
        }

        // Số máy
        if (dataSource.soMay || dataSource["Số Máy"] || dataSource.engineNumber) {
          setSoMay(
            dataSource.soMay ||
            dataSource["Số Máy"] ||
            dataSource.engineNumber ||
            ""
          );
        }
      } else {
        setData({
          customerName: "",
          customerAddress: "",
          customerPhone: "",
          customerCCCD: "",
          contractNumber: "",
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
      <PrintStyles />
      <div className="max-w-4xl mx-auto print:max-w-4xl print:mx-auto">
        <div
          ref={printableRef}
          className="flex-1 bg-white p-8 print:pt-0 flex flex-col min-h-screen print:min-h-[calc(100vh-40mm)]"
          id="printable-content"
        >
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-32 mx-auto mb-4">
              <img src={logo} alt="VinFast Logo" className="w-full" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold uppercase">
              THỎA THUẬN HỖ TRỢ LÃI VAY
            </h1>
            <p className="text-sm mt-2">
              Thỏa thuận hỗ trợ lãi vay ("<strong>Thỏa Thuận</strong>") này được
              ký ngày{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={ngayKy}
                  onChange={(e) => setNgayKy(e.target.value)}
                  className="border-b border-gray-400 px-1 w-12 text-center focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline mx-1">{ngayKy}</span> tháng{" "}  
              <span className="print:hidden">
                <input
                  type="text"
                  value={thangKy}
                  onChange={(e) => setThangKy(e.target.value)}
                  className="border-b border-gray-400 px-1 w-12 text-center focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline mx-1">{thangKy}</span> năm{" "}   
              <span className="print:hidden">
                <input
                  type="text"
                  value={namKy}
                  onChange={(e) => setNamKy(e.target.value)}
                  className="border-b border-gray-400 px-1 w-16 text-center focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline mx-1">{namKy}</span>, bởi và giữa:
            </p>
          </div>

          {/* Content */}
          <div className="text-sm space-y-4">
            {/* Bên Bán */}
            <div>
              {branch ? (
                <>
                  <p className="font-bold mb-2">
                    CÔNG TY{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={congTyBenBan}
                        onChange={(e) => setCongTyBenBan(e.target.value)}       
                        className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500 uppercase"
                      />
                    </span>
                    <span className="hidden print:inline underline uppercase">
                      {congTyBenBan}
                    </span>
                  </p>
                  <div className="space-y-1">
                    <div className="info-row">
                      <span className="info-label">Địa chỉ:</span>
                      <div className="info-value">
                        <span className="print:hidden">
                          <input
                            type="text"
                            value={diaChiBenBan}
                            onChange={(e) => setDiaChiBenBan(e.target.value)}       
                            className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500 font-bold"
                          />
                        </span>
                        <span className="hidden print:inline font-bold">
                          {diaChiBenBan}
                        </span>
                      </div>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Mã số doanh nghiệp:</span>
                      <div className="info-value">
                        <span className="print:hidden">
                          <input
                            type="text"
                            value={maSoDN}
                            onChange={(e) => setMaSoDN(e.target.value)}
                            className="border-b border-gray-400 px-1 w-64 focus:outline-none focus:border-blue-500 font-bold"
                          />
                        </span>
                        <span className="hidden print:inline font-bold">{maSoDN}</span>
                      </div>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Tài khoản:</span>
                      <div className="info-value">
                        <span className="print:hidden">
                          <input
                            type="text"
                            value={taiKhoan}
                            onChange={(e) => setTaiKhoan(e.target.value)}
                            className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500 font-bold"
                          />
                        </span>
                        <span className="hidden print:inline font-bold">
                          {taiKhoan}
                        </span>{" "}
                        tại Ngân hàng{" "}
                        <span className="print:hidden">
                          <input
                            type="text"
                            value={nganHangBenBan}
                            onChange={(e) => setNganHangBenBan(e.target.value)}     
                            className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500 font-bold"
                          />
                        </span>
                        <span className="hidden print:inline font-bold">
                          {nganHangBenBan}
                        </span>
                      </div>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Đại diện:</span>
                      <div className="info-value">
                        <span className="print:hidden">
                          <input
                            type="text"
                            value={daiDienBenBan}
                            onChange={(e) => setDaiDienBenBan(e.target.value)}      
                            className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                          />
                        </span>
                        <span className="hidden print:inline">{daiDienBenBan}</span>
                      </div>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Chức vụ:</span>
                      <div className="info-value">
                        <span className="print:hidden">
                          <input
                            type="text"
                            value={chucVuBenBan}
                            onChange={(e) => setChucVuBenBan(e.target.value)}       
                            className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                          />
                        </span>
                        <span className="hidden print:inline">{chucVuBenBan}</span> 
                      </div>
                    </div>
                    <p className="mb-2">
                      (Theo Giấy uỷ quyền số{" "}
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={giayUyQuyen}
                          onChange={(e) => setGiayUyQuyen(e.target.value)}        
                          className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500 font-bold"
                        />
                      </span>
                      <span className="hidden print:inline font-bold">
                        {giayUyQuyen}
                      </span>{" "}
                      ngày{" "}
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={ngayUyQuyen}
                          onChange={(e) => setNgayUyQuyen(e.target.value)}        
                          className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500 font-bold"
                        />
                      </span>
                      <span className="hidden print:inline font-bold">
                        {ngayUyQuyen}
                      </span>
                      )
                    </p>
                  </div>
                  <p className="mb-2 font-bold">("Bên Bán")</p>
                  <p className="font-bold mb-2">VÀ</p>
                </>
              ) : (
                <p className="text-gray-500 italic mb-4">[Chưa chọn showroom - Thông tin công ty sẽ hiển thị khi chọn showroom]</p>
              )}
            </div>

            {/* Khách Hàng */}
            <div className="space-y-1">
              <div className="info-row">
                <span className="info-label font-normal">Ông/Bà:</span>
                <div className="info-value">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={tenKhachHang}
                      onChange={(e) => setTenKhachHang(e.target.value)}
                      className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline font-normal">
                    {tenKhachHang}
                  </span>
                </div>
              </div>
              <div className="info-row">
                <span className="info-label">Địa chỉ:</span>
                <div className="info-value">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={diaChiKH}
                      onChange={(e) => setDiaChiKH(e.target.value)}
                      className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500 font-bold"
                    />
                  </span>
                  <span className="hidden print:inline font-bold">
                    {diaChiKH}
                  </span>
                </div>
              </div>
              <div className="info-row">
                <span className="info-label">Điện thoại:</span>
                <div className="info-value">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={dienThoaiKH}
                      onChange={(e) => setDienThoaiKH(e.target.value)}
                      className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500 font-bold"
                    />
                  </span>
                  <span className="hidden print:inline font-bold">
                    {dienThoaiKH}
                  </span>
                </div>
              </div>
              <div className="info-row">
                <span className="info-label">Mã số thuế:</span>
                <div className="info-value">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={maSoThue}
                      onChange={(e) => setMaSoThue(e.target.value)}
                      className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500 font-bold"
                    />
                  </span>
                  <span className="hidden print:inline font-bold">
                    {maSoThue}
                  </span>
                </div>
              </div>
              <div className="info-row">
                <span className="info-label">CMTND/TCC:</span>
                <div className="info-value">
                  Số{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={cmtnd}
                      onChange={(e) => setCmtnd(e.target.value)}
                      className="border-b border-gray-400 px-1 w-40 focus:outline-none focus:border-blue-500 font-bold"
                    />
                  </span>
                  <span className="hidden print:inline font-bold">{cmtnd}</span>{" "}
                  cấp ngày{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={ngayCapCMT}
                      onChange={(e) => setNgayCapCMT(e.target.value)}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{ngayCapCMT}</span> bởi{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={noiCapCMT}
                      onChange={(e) => setNoiCapCMT(e.target.value)}
                      className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{noiCapCMT}</span>        
                </div>
              </div>
              <div className="info-row">
                <span className="info-label">Đại diện:</span>
                <div className="info-value">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={daiDienKH}
                      onChange={(e) => setDaiDienKH(e.target.value)}
                      className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{daiDienKH}</span>        
                  {"    "}
                  <span className="ml-4 font-bold">Chức vụ:</span>{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={chucVuKH}
                      onChange={(e) => setChucVuKH(e.target.value)}
                      className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{chucVuKH}</span>
                </div>
              </div>
              <p className="mb-2 font-bold">("Khách Hàng")</p>
            </div>

            <p className="text-left leading-relaxed">
              Bên Bán và Khách Hàng sau đây được gọi riêng là{" "}
              <strong>"Bên"</strong> và gọi chung là <strong>"Các Bên"</strong> 
            </p>

            {/* XÉT RẰNG */}
            <div>
              <p className="font-bold mb-4">XÉT RẰNG:</p>

              <div className="space-y-3">
                <p className="text-left leading-relaxed">
                  1. Bên Bán và Khách Hàng đã ký hợp đồng mua bán xe ô tô số{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={soHopDong}
                      onChange={(e) => setSoHopDong(e.target.value)}
                      className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{soHopDong}</span> (sau 
                  đây gọi chung là "<strong>Hợp Đồng Mua Bán Xe</strong>") với  
                  thông tin về xe như sau:
                </p>
                <div className="ml-6 space-y-1">
                  <div className="info-row">
                    <span className="info-label w-[100px] min-w-[100px]">- Model:</span>
                    <div className="info-value">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{model}</span>        
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="info-label w-[100px] min-w-[100px]">- Số Khung:</span>
                    <div className="info-value">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={soKhung}
                          onChange={(e) => setSoKhung(e.target.value)}
                          className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{soKhung}</span>      
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="info-label w-[100px] min-w-[100px]">- Số Máy:</span>
                    <div className="info-value">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={soMay}
                          onChange={(e) => setSoMay(e.target.value)}
                          className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{soMay}</span>        
                    </div>
                  </div>
                </div>

                <p className="text-left leading-relaxed">
                  2. Khách Hàng thuộc trường hợp được áp dụng chính sách hỗ trợ 
                  một khoản tiền tương đương một phần khoản lãi vay của khoản   
                  vay mua xe tại Ngân hàng TMCP Kỹ thương Việt Nam (sau đây gọi 
                  là "<strong>Ngân Hàng</strong>") theo chính sách hỗ trợ lãi   
                  vay của VinFast ("<strong>Chính sách Hỗ trợ lãi vay</strong>")
                  áp dụng cho các Khách hàng tham gia chương trình Chuyển đổi   
                  xanh đặt cọc mua xe/xuất hóa đơn từ ngày{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={tuNgay}
                      onChange={(e) => setTuNgay(e.target.value)}
                      className="border-b border-gray-400 px-1 w-8 text-center focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{tuNgay}</span>/        
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={tuThang}
                      onChange={(e) => setTuThang(e.target.value)}
                      className="border-b border-gray-400 px-1 w-8 text-center focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{tuThang}</span>/2025 đến hết
                  ngày 31/12/2025, giải ngân đến hết ngày 31/12/2025...
                </p>

                <p className="text-left leading-relaxed">
                  3. Khách Hàng và Ngân Hàng đã hoặc sẽ ký kết một hợp đồng tín 
                  dụng (hoặc hợp đồng/thỏa thuận/khế ước khác có bản chất là hợp
                  đồng tín dụng) và hợp đồng thế chấp...
                </p>

                <p className="text-left leading-relaxed">
                  4. Bên Bán được Vinfast Trading ủy quyền giao kết Thỏa thuận  
                  này với Khách hàng để triển khai Chính sách Hỗ trợ lãi vay.   
                </p>
              </div>
            </div>

            <p className="text-left leading-relaxed mt-4">
              Do vậy, để thực hiện Chính Sách Hỗ trợ lãi vay nêu trên, Các Bên  
              thống nhất ký kết Thỏa Thuận với những nội dung như sau:
            </p>

            {/* ĐIỀU 1 */}
            <div className="mt-6">
              <p className="font-bold mb-3">
                1. Thỏa thuận về việc Hỗ Trợ Lãi Vay:
              </p>

              <div className="ml-6 space-y-3">
                <p className="font-bold">1. Chính sách Hỗ trợ lãi vay:</p>      

                <div className="ml-6 space-y-2">
                  <p>
                    - Số tiền cho vay tối đa bằng{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={soTienVayToiDa}
                        onChange={(e) => setSoTienVayToiDa(e.target.value)}     
                        className="border-b border-gray-400 px-1 w-12 text-center focus:outline-none focus:border-blue-500"
                        placeholder="70"
                      />
                    </span>
                    <span className="hidden print:inline">{soTienVayToiDa || "___"}</span>% giá trị hợp đồng mua bán xe
                  </p>
                  <p>
                    - Thời hạn vay tối đa bằng{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={thoiHanVayToiDa}
                        onChange={(e) => setThoiHanVayToiDa(e.target.value)}    
                        className="border-b border-gray-400 px-1 w-12 text-center focus:outline-none focus:border-blue-500"
                        placeholder="96"
                      />
                    </span>
                    <span className="hidden print:inline">{thoiHanVayToiDa || "___"}</span> tháng;
                  </p>
                  <p>- Lãi suất Ngân Hàng áp dụng:</p>
                  <div className="ml-6 space-y-1">
                    <p>
                      * Lãi suất 36 tháng đầu tiên cố định (lãi suất trong thời gian ưu đãi):{" "}
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={laiSuat36ThangDau}
                          onChange={(e) => setLaiSuat36ThangDau(e.target.value)}
                          className="border-b border-gray-400 px-1 w-12 text-center focus:outline-none focus:border-blue-500"
                          placeholder="8"
                        />
                      </span>
                      <span className="hidden print:inline font-bold">{laiSuat36ThangDau || "___"}</span><strong>%/năm</strong>
                    </p>
                    <p>
                      * Lãi suất sau 36 tháng đầu tiên đến hết thời gian vay    
                      vốn: Theo lãi suất thực tế Ngân hàng quy định.
                    </p>
                  </div>
                  <p className="text-left leading-relaxed">
                    - VinFast sẽ hỗ trợ Khách Hàng một khoản tiền ("
                    <strong>Khoản Hỗ Trợ Lãi Vay</strong>") tương đương khoản   
                    chênh lệch giữa (i) số tiền lãi của Ngân Hàng theo các quy  
                    định và điều kiện tại Thỏa Thuận Hợp Tác và (ii) số tiền lãi
                    mà Khách Hàng phải thanh toán, trong thời gian vay (tối đa  
                    bằng 96 tháng) kể từ ngày bắt đầu tính lãi theo Hợp Đồng Tín
                    Dụng ("<strong>Thời Hạn Hỗ Trợ Lãi Vay</strong>") hoặc cho  
                    đến khi Thời Hạn Hỗ Trợ Lãi Vay chấm dứt trước thời hạn theo
                    quy định tại Thỏa Thuận này, tùy thời điểm nào đến trước.   
                  </p>
                </div>

                <p className="text-left leading-relaxed mt-3">
                  - Số tiền gốc và lãi Khách Hàng thanh toán định kỳ. Theo đó,  
                  Khách hàng sẽ thực hiện trả nợ theo định kỳ 01 tháng/lần một  
                  số tiền xác định theo phương pháp gốc trả đều hàng tháng with  
                  lãi suất được xác định như sau:
                </p>

                <div className="ml-6 space-y-2">
                  <p>
                    - Lãi suất 36 tháng đầu cố định:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={laiSuatKhachHang}
                        onChange={(e) => setLaiSuatKhachHang(e.target.value)}   
                        className="border-b border-gray-400 px-1 w-12 text-center focus:outline-none focus:border-blue-500"
                        placeholder="6"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">{laiSuatKhachHang || "___"}</span><strong>%/năm</strong>
                  </p>
                  <p>
                    - Lãi suất sau 36 tháng đầu tiên: Theo lãi suất thực tế tại 
                    Ngân hàng quy định.
                  </p>
                </div>

                <p className="font-bold mt-4">
                  2. Để tránh hiểu nhầm Các Bên thống nhất rằng:
                </p>
                <p className="text-left leading-relaxed ml-6">
                  Trong mọi trường hợp VinFast cũng như VinFast Trading không   
                  chịu trách nhiệm đối với bất kỳ mức lãi nào ngoài mức lãi quy 
                  định trên đây vì lý do Khách Hàng không tuân thủ các quy định 
                  của Ngân Hàng hay vì bất kỳ lý do gì không phải do lỗi của    
                  VinFast/VinFast Trading. Khách Hàng chịu trách nhiệm thanh    
                  toán với Ngân Hàng toàn bộ các khoản lãi và chi phí phát sinh 
                  trên mức hỗ trợ lãi vay của VinFast Trading quy định ở trên   
                  bao gồm các khoản phí trả nợ trước hạn; các khoản lãi quá hạn,
                  lãi phạt do chậm thanh toán gốc, lãi; lãi tăng lên do Khách   
                  Hàng vi phạm nghĩa vụ trả nợ hoặc vi phạm nghĩa vụ khác; các  
                  khoản tiền hoàn trả ưu đãi do trả nợ trước hạn; tiền bồi      
                  thường vi phạm Hợp Đồng Tín Dụng.... VinFast cũng như VinFast 
                  Trading không có trách nhiệm thông báo, làm rõ, nhắc nợ hay   
                  thanh toán thay các khoản tiền này cho Khách Hàng.
                </p>

                <p className="font-bold mt-4">3. Thời Hạn Hỗ Trợ Lãi Vay:</p>   
                <p className="text-left leading-relaxed ml-6">
                  Thời Hạn Hỗ Trợ Lãi Vay sẽ tự động chấm dứt trước hạn trong   
                  trường hợp Khách Hàng tất toán Khoản vay trước hạn, hoặc trong
                  trường hợp Hợp Đồng Tín Dụng chấm dứt trước khi hết Thời Hạn  
                  Hỗ Trợ Lãi Vay vì bất cứ lý do gì. Hết Thời Hạn Hỗ Trợ Lãi Vay
                  hoặc khi Thời Hạn Hỗ Trợ Lãi Vay chấm dứt trước hạn, Khách    
                  Hàng có nghĩa vụ tiếp tục thực hiện trả nợ lãi cho Ngân Hàng  
                  theo đúng quy định tại Hợp Đồng Tín Dụng và quy định của Ngân 
                  Hàng.
                </p>
              </div>
            </div>

            {/* ĐIỀU 2 */}
            <div className="mt-6">
              <p className="font-bold mb-3">2. Quyền và nghĩa vụ của các Bên</p>

              <div className="ml-6 space-y-3">
                <p className="font-bold">
                  1. Quyền và nghĩa vụ của VinFast Trading:
                </p>

                <div className="ml-6 space-y-2">
                  <p className="text-left leading-relaxed">
                    1) Thực hiện kiểm tra, đối chiếu và xác nhận với Ngân Hàng  
                    các Khoản Hỗ Trợ Lãi Vay hỗ trợ cho Khách Hàng ngay trong   
                    ngày khi nhận được thông báo của Ngân Hàng có phát sinh các 
                    khoản vay của Khách Hàng thông qua email trước khi ký chính 
                    thức Thông báo thanh toán Khoản Hỗ Trợ Lãi Vay;
                  </p>
                  <p className="text-left leading-relaxed">
                    2) Thực hiện việc hỗ trợ Khoản Hỗ Trợ Lãi Vay của Khách Hàng
                    theo Chính sách Hỗ trợ lãi vay theo Thỏa Thuận này;
                  </p>
                  <p className="text-left leading-relaxed">
                    3) Không chịu trách nhiệm đối với các mâu thuẫn, tranh chấp,
                    khiếu kiện hay khiếu nại nào liên quan đến và/hoặc phát sinh
                    giữa Ngân Hàng, Khách Hàng và các tổ chức, cá nhân khác     
                    trong quá trình thực hiện Hợp Đồng Tín Dụng và các thỏa     
                    thuận liên quan đến Hợp Đồng Tín Dụng mà không phải do lỗi  
                    từ VinFast Trading.
                  </p>
                </div>

                <p className="font-bold mt-4">
                  2. Quyền và nghĩa vụ của Khách Hàng:
                </p>

                <div className="ml-6 space-y-2">
                  <p className="text-left leading-relaxed">
                    1) Được VinFast Trading thực hiện việc hỗ trợ Khoản Hỗ Trợ  
                    Lãi Vay và áp dụng Chính sách Hỗ trợ lãi vay theo quy định  
                    của Thỏa Thuận này.
                  </p>
                  <p className="text-left leading-relaxed">
                    2) Tự chi trả, thanh toán nợ gốc, phí trả nợ trước hạn và   
                    bất kỳ khoản lãi, lãi quá hạn nào phát sinh ngoài phạm vi   
                    Khoản Hỗ Trợ Lãi Vay, Thời Hạn Hỗ Trợ Lãi Vay và Chính sách 
                    Hỗ trợ lãi vay.
                  </p>
                  <p className="text-left leading-relaxed">
                    3) Khách Hàng cam kết miễn trừ cho VinFast, VinFast Trading 
                    mọi trách nhiệm, nghĩa vụ liên quan đến bất kỳ tranh chấp,  
                    mâu thuẫn, khiếu kiện, hay khiếu nại nào phát sinh từ, hoặc 
                    liên quan đến Hợp Đồng Tín Dụng.
                  </p>
                  <p className="text-left leading-relaxed">
                    4) Khách Hàng không được VinFast Trading hỗ trợ Khoản Hỗ Trợ
                    Lãi Vay kể từ thời điểm Khách Hàng ký Văn bản chuyển nhượng 
                    Hợp Đồng Mua Bán và/hoặc xe ô tô là đối tượng của hợp đồng  
                    mua bán/chuyển nhượng với bất kỳ bên thứ ba nào khác.       
                  </p>
                  <p className="text-left leading-relaxed">
                    5) Trong Thời Hạn Hỗ Trợ Lãi Vay, nếu Khách Hàng tất toán   
                    Khoản vay trước hạn, ký Văn bản chuyển nhượng Hợp Đồng Mua  
                    Bán và/hoặc xe ô tô là đối tượng của hợp đồng mua bán/      
                    chuyển nhượng với bất kỳ bên thứ ba nào khác, không thực    
                    hiện theo đúng quy định tại Hợp Đồng Tín Dụng đã ký giữa    
                    Khách Hàng và Ngân Hàng dẫn đến Ngân Hàng chấm dứt Hợp Đồng 
                    Tín Dụng thì VinFast chấm dứt hỗ trợ Khoản Hỗ Trợ Lãi Vay   
                    theo Chính sách Hỗ trợ lãi vay theo quy định tại Thỏa Thuận 
                    này kể từ thời điểm Hợp Đồng Tín Dụng bị chấm dứt. Khách    
                    Hàng vẫn phải có trách nhiệm thực hiện nghĩa vụ đối với Ngân
                    Hàng theo quy định của Hợp Đồng Tín Dụng và các thỏa thuận  
                    khác giữa Khách Hàng và Ngân Hàng (nếu có).
                  </p>
                </div>
              </div>
            </div>

            {/* ĐIỀU 3 */}
            <div className="mt-6">
              <p className="font-bold mb-3">3. Điều khoản hỗ trợ Ngân hàng.</p> 

              <p className="text-left leading-relaxed mb-3">
                Khách hàng cam kết không có bất kỳ khiếu nại, khiếu kiện nào và 
                đảm bảo Đơn Vị Hỗ Trợ Kỹ Thuật như được định nghĩa phía dưới,   
                cán bộ nhân viên của Đơn Vị Hỗ Trợ Kỹ Thuật không phải chịu bất 
                kỳ trách nhiệm nào đối với bất kỳ tổn thất và thiệt hại nào (nếu
                có) phát sinh từ hoặc liên quan đến việc thực thi các nội dung  
                nêu tại điểm a, b, c dưới đây:
              </p>

              <div className="ml-6 space-y-2">
                <p className="text-left leading-relaxed">
                  1. Khách Hàng cho phép Ngân Hàng thu thập, xử lý các thông tin
                  về xe, vị trí xe, tình trạng xe cho mục đích quản lý tài sản  
                  đảm bảo cho khoản vay theo Hợp Đồng Tín Dụng thông qua bên thứ
                  ba là Đơn Vị Hỗ Trợ Kỹ Thuật
                </p>
                <p className="text-left leading-relaxed">
                  2. Trong trường hợp Khách Hàng vi phạm nghĩa vụ trả nợ quá{" "}
                  <strong>30 ngày</strong>, Ngân Hàng có quyền đề nghị VinFast  
                  Trading, nhà sản xuất xe và/ hoặc bất kỳ bên thứ ba khác được 
                  VinFast Trading ủy quyền (gọi chung là "
                  <strong>Đơn Vị Hỗ Trợ Kỹ Thuật</strong>") trích xuất dữ liệu  
                  định vị xe của Khách Hàng và Khách Hàng đồng ý để Đơn Vị Hỗ   
                  Trợ Kỹ Thuật thu thập, xử lý, cung cấp và chia sẻ dữ liệu này 
                  cho Ngân Hàng để phục vụ hoạt động xử lý thu hồi nợ;
                </p>
                <p className="text-left leading-relaxed">
                  3. Trong trường hợp Khách Hàng vi phạm nghĩa vụ trả nợ quá{" "}
                  <strong>60 ngày</strong>, Ngân Hàng có quyền ủy quyền cho Đơn 
                  Vị Hỗ Trợ Kỹ Thuật kích hoạt tính năng giới hạn mức SOC (dung 
                  lượng pin) của pin tại ngưỡng 30% theo đề nghị của Ngân Hàng, 
                  và Khách Hàng đồng ý để Đơn Vị Hỗ Trợ Kỹ Thuật thực hiện các  
                  việc này;
                </p>
              </div>
            </div>

            {/* ĐIỀU 4 */}
            <div className="mt-6">
              <p className="font-bold mb-3">4. Hiệu lực của Thỏa Thuận</p>      

              <div className="ml-6 space-y-2">
                <p className="text-left leading-relaxed">
                  1. Thỏa Thuận này có hiệu lực kể từ ngày ký đến ngày hết hiệu 
                  lực của Hợp Đồng Tín Dụng. Thỏa Thuận có thể chấm dứt trước   
                  thời hạn theo thỏa thuận của Các Bên hoặc xảy ra các trường   
                  hợp quy định tại Điều 2.2.e Thỏa Thuận này.
                </p>
                <p className="text-left leading-relaxed">
                  2. Khách Hàng không được chuyển nhượng, chuyển giao quyền và  
                  nghĩa vụ của mình theo Thỏa Thuận này cho bất kỳ bên thứ ba   
                  nào nếu không được chấp thuận trước bằng văn bản của VinFast  
                  Trading. Tuy nhiên, Khách Hàng đồng ý rằng VinFast và/ hoặc   
                  VinFast Trading có quyền chuyển nhượng, chuyển giao các       
                  quyền/nghĩa vụ theo Thỏa Thuận này cho bên thứ ba, hoặc trong 
                  trường hợp VinFast/ VinFast Trading tổ chức lại doanh nghiệp, 
                  bao gồm sáp nhập vào một công ty khác hoặc được chia, hoặc    
                  tách hoặc được chuyển đổi với điều kiện là việc chuyển nhượng,
                  chuyển giao các quyền/nghĩa vụ đó không gây thiệt hại đến     
                  quyền và lợi ích của Khách Hàng theo Thỏa Thuận này và bên    
                  nhận chuyển giao các quyền/nghĩa vụ theo Thỏa Thuận này chịu  
                  trách nhiệm tiếp tục thực hiện đầy đủ các quyền và nghĩa vụ   
                  đối với Khách hàng theo Thỏa thuận này.
                </p>
                <p className="text-left leading-relaxed">
                  3. Mọi sửa đổi, bổ sung Thỏa Thuận này phải được lập thành văn
                  bản và được ký bởi người đại diện hợp pháp của mỗi Bên.       
                </p>
                <p className="text-left leading-relaxed">
                  4. Thỏa Thuận này được điều chỉnh theo các quy định của pháp  
                  luật Việt Nam. Mọi tranh chấp phát sinh từ Thỏa Thuận này nếu 
                  không được giải quyết bằng thương lượng và hòa giải giữa Các  
                  Bên, thì sẽ được giải quyết tại Tòa án có thẩm quyền.
                </p>
                <p className="text-left leading-relaxed">
                  5. Thỏa Thuận này được lập thành 04 (bốn) bản có giá trị như  
                  nhau, mỗi Bên giữ 02 (hai) bản để thực hiện.
                </p>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="mt-16 signature-block">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="text-center font-bold p-4 w-1/2 border-r border-black">
                    <p className="mb-20 signer-title">ĐẠI DIỆN BÊN BÁN</p>
                  </td>
                  <td className="text-center font-bold p-4 w-1/2">
                    <p className="mb-20 signer-title">KHÁCH HÀNG</p>
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
          In Thỏa Thuận
        </button>
        <button
          onClick={() => { setDownloadingPdf(true); downloadElementAsPdf(printableRef.current, "giay-thoa-thuan-ho-tro-vay-lai").then(() => setDownloadingPdf(false)).catch(() => setDownloadingPdf(false)); }}
          disabled={downloadingPdf}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {downloadingPdf ? "Đang tạo PDF..." : "Tải PDF"}
        </button>
      </div>
    </div>
  );
};

export default GiayThoaThuanHoTroVayLai;
