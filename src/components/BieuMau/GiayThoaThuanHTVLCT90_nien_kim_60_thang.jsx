import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import {
  getBranchByShowroomName,
  getDefaultBranch,
} from "../../data/branchData";
import { formatCurrency } from "../../utils/formatting";
import { PrintStyles } from "./PrintStyles";

const GiayThoaThuanHTVLCT90_nien_kim_60_thang = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editable fields - Ngày tháng
  const [ngayKy, setNgayKy] = useState("");
  const [thangKy, setThangKy] = useState("");
  const [namKy, setNamKy] = useState("");

  // Bên Bán
  const [congTyBenBan, setCongTyBenBan] = useState(
    "CÔNG TY CỔ PHẦN ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG SÀI GÒN - CHI NHÁNH TRƯỜNG CHINH"
  );
  const [diaChiTruSo, setDiaChiTruSo] = useState(
    "682A Trường Chinh, Phường 15, Tân Bình, TP. Hồ Chí Minh"
  );
  const [maSoDN, setMaSoDN] = useState("");
  const [taiKhoan, setTaiKhoan] = useState("");
  const [nganHangBenBan, setNganHangBenBan] = useState("");
  const [daiDienBenBan, setDaiDienBenBan] = useState("");
  const [chucVuBenBan, setChucVuBenBan] = useState("");
  const [giayUyQuyen, setGiayUyQuyen] = useState("");
  const [ngayUyQuyen, setNgayUyQuyen] = useState("");

  // Khách Hàng
  const [ongBaKH, setOngBaKH] = useState("");
  const [diaChiKH, setDiaChiKH] = useState("");
  const [dienThoaiKH, setDienThoaiKH] = useState("");
  const [maSoThueKH, setMaSoThueKH] = useState("");
  const [canCuocKH, setCanCuocKH] = useState("");
  const [ngayCapKH, setNgayCapKH] = useState("");
  const [noiCapKH, setNoiCapKH] = useState("");

  // Vợ/Chồng
  const [coVoChong, setCoVoChong] = useState(true);
  const [ongBaVC, setOngBaVC] = useState("");
  const [diaChiVC, setDiaChiVC] = useState("");
  const [dienThoaiVC, setDienThoaiVC] = useState("");
  const [maSoThueVC, setMaSoThueVC] = useState("");
  const [canCuocVC, setCanCuocVC] = useState("");
  const [ngayCapVC, setNgayCapVC] = useState("");
  const [noiCapVC, setNoiCapVC] = useState("");

  // Thông tin xe
  const [soHopDong, setSoHopDong] = useState("");
  const [model, setModel] = useState("");
  const [soKhung, setSoKhung] = useState("");
  const [soMay, setSoMay] = useState("");
  const [giaTriXe, setGiaTriXe] = useState("");

  // Thông tin vay
  const [soTienVay, setSoTienVay] = useState("");
  const [soTienVayBangChu, setSoTienVayBangChu] = useState("");
  const [tyLeVay, setTyLeVay] = useState("");
  const [laiSuatNH, setLaiSuatNH] = useState("");
  const [laiSuatSauCoDinh, setLaiSuatSauCoDinh] = useState("");

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

      // Set default date
      const today = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      setNgayKy(pad(today.getDate()));
      setThangKy(pad(today.getMonth() + 1));
      setNamKy(today.getFullYear().toString());

      if (location.state) {
        const stateData = location.state;
        setData(stateData);

        // Auto-fill từ location.state
        if (stateData.customerName) setOngBaKH(stateData.customerName);
        if (stateData.customerAddress) setDiaChiKH(stateData.customerAddress);  
        if (stateData.customerPhone) setDienThoaiKH(stateData.customerPhone);   
        if (stateData.customerCCCD) setCanCuocKH(stateData.customerCCCD);       
        if (stateData.contractNumber) setSoHopDong(stateData.contractNumber);   
        if (stateData.hieuxe) setModel(stateData.hieuxe);
        if (stateData.soKhung) setSoKhung(stateData.soKhung);
        if (stateData.soMay) setSoMay(stateData.soMay);
        if (stateData.totalPrice)
          setGiaTriXe(formatCurrency(stateData.totalPrice.toString()));
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
          totalPrice: "",
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
          className="flex-1 bg-white p-8 print:pt-0 flex flex-col"
          id="printable-content"
        >
          {/* Title */}
          <div className="text-center mb-6">
            <p className="font-bold mb-2">
              PHỤ ĐÍNH 01: MẪU THỎA THUẬN HỖ TRỢ TRẢ THAY
            </p>
            <p className="text-sm italic mb-4">
              (Đính kèm Phụ lục số 10 v/v: Triển khai Chương trình hỗ trợ tiền  
              vay dành cho Khách hàng cá nhân là tài xế vay mua xe ô tô điện    
              VinFast VF5 và Herio Green)
            </p>
            <h1 className="text-xl font-bold uppercase">
              THỎA THUẬN HỖ TRỢ TRẢ THAY
            </h1>
            <p className="text-sm mt-2">
              Thỏa thuận hỗ trợ trả thay ("<strong>Thỏa Thuận</strong>") này    
              được ký ngày{" "}
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
                  <span className="info-label">Địa chỉ trụ sở chính:</span>
                  <div className="info-value">
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={diaChiTruSo}
                        onChange={(e) => setDiaChiTruSo(e.target.value)}
                        className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500 font-bold"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">
                      {diaChiTruSo}
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
                    <span className="ml-4 font-bold">Chức vụ:</span>{" "}
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
                <div className="info-row">
                  <span className="info-label">(Theo Giấy uỷ quyền số:</span>
                  <div className="info-value">
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
                  </div>
                </div>
              </div>
              <p className="mb-2 text-center font-bold mt-4 uppercase">("Bên bán")</p>
              <p className="text-center font-bold mb-2 uppercase">VÀ</p>
            </div>

            {/* Khách Hàng */}
            <div>
              <p className="mb-2">
                <strong>Ông/Bà:</strong>{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={ongBaKH}
                    onChange={(e) => setOngBaKH(e.target.value)}
                    className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500 uppercase"
                  />
                </span>
                <span className="hidden print:inline underline uppercase">{ongBaKH}</span>
              </p>
              <div className="space-y-1">
                <div className="info-row">
                  <span className="info-label">Địa chỉ:</span>
                  <div className="info-value font-bold">
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={diaChiKH}
                        onChange={(e) => setDiaChiKH(e.target.value)}
                        className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">
                      {diaChiKH}
                    </span>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-label">Điện thoại:</span>
                  <div className="info-value font-bold">
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={dienThoaiKH}
                        onChange={(e) => setDienThoaiKH(e.target.value)}
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">
                      {dienThoaiKH}
                    </span>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-label">Mã số thuế:</span>
                  <div className="info-value font-bold">
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={maSoThueKH}
                        onChange={(e) => setMaSoThueKH(e.target.value)}
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">
                      {maSoThueKH}
                    </span>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-label">CCCD/Hộ chiếu:</span>
                  <div className="info-value">
                    Số{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={canCuocKH}
                        onChange={(e) => setCanCuocKH(e.target.value)}
                        className="border-b border-gray-400 px-1 w-40 focus:outline-none focus:border-blue-500 font-bold"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">
                      {canCuocKH}
                    </span>{" "}
                    cấp ngày{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={ngayCapKH}
                        onChange={(e) => setNgayCapKH(e.target.value)}
                        className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{ngayCapKH}</span> bởi{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={noiCapKH}
                        onChange={(e) => setNoiCapKH(e.target.value)}
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{noiCapKH}</span>
                  </div>
                </div>
              </div>

              {/* Vợ/Chồng */}
              <div className="print:hidden mb-2 mt-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={coVoChong}
                    onChange={(e) => setCoVoChong(e.target.checked)}
                    className="mr-2"
                  />
                  Có vợ/chồng
                </label>
              </div>

              {coVoChong && (
                <>
                  <p className="italic mb-2 font-bold mt-4">Có vợ/chồng là</p>       
                  <p className="mb-2">
                    <strong>Ông/Bà:</strong>{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={ongBaVC}
                        onChange={(e) => setOngBaVC(e.target.value)}
                        className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500 uppercase"
                      />
                    </span>
                    <span className="hidden print:inline underline uppercase">
                      {ongBaVC}
                    </span>
                  </p>
                  <div className="space-y-1">
                    <div className="info-row">
                      <span className="info-label">Địa chỉ:</span>
                      <div className="info-value font-bold">
                        <span className="print:hidden">
                          <input
                            type="text"
                            value={diaChiVC}
                            onChange={(e) => setDiaChiVC(e.target.value)}
                            className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                          />
                        </span>
                        <span className="hidden print:inline">
                          {diaChiVC}
                        </span>
                      </div>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Điện thoại:</span>
                      <div className="info-value font-bold">
                        <span className="print:hidden">
                          <input
                            type="text"
                            value={dienThoaiVC}
                            onChange={(e) => setDienThoaiVC(e.target.value)}        
                            className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                          />
                        </span>
                        <span className="hidden print:inline">
                          {dienThoaiVC}
                        </span>
                      </div>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Mã số thuế:</span>
                      <div className="info-value font-bold">
                        <span className="print:hidden">
                          <input
                            type="text"
                            value={maSoThueVC}
                            onChange={(e) => setMaSoThueVC(e.target.value)}
                            className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                          />
                        </span>
                        <span className="hidden print:inline">
                          {maSoThueVC}
                        </span>
                      </div>
                    </div>
                    <div className="info-row">
                      <span className="info-label">CCCD/Hộ chiếu:</span>
                      <div className="info-value">
                        Số{" "}
                        <span className="print:hidden">
                          <input
                            type="text"
                            value={canCuocVC}
                            onChange={(e) => setCanCuocVC(e.target.value)}
                            className="border-b border-gray-400 px-1 w-40 focus:outline-none focus:border-blue-500 font-bold"
                          />
                        </span>
                        <span className="hidden print:inline font-bold">
                          {canCuocVC}
                        </span>{" "}
                        cấp ngày{" "}
                        <span className="print:hidden">
                          <input
                            type="text"
                            value={ngayCapVC}
                            onChange={(e) => setNgayCapVC(e.target.value)}
                            className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                          />
                        </span>
                        <span className="hidden print:inline">{ngayCapVC}</span> bởi{" "}
                        <span className="print:hidden">
                          <input
                            type="text"
                            value={noiCapVC}
                            onChange={(e) => setNoiCapVC(e.target.value)}
                            className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                          />
                        </span>
                        <span className="hidden print:inline">{noiCapVC}</span>     
                      </div>
                    </div>
                  </div>
                </>
              )}

              <p className="mb-2 text-center font-bold mt-4 uppercase">("Khách Hàng")</p>      
            </div>

            <p className="text-left leading-relaxed mt-4">
              <strong>Bên bán</strong> và <strong>Khách Hàng</strong> sau đây   
              được gọi riêng là <strong>"Bên"</strong> và gọi chung là{" "}     
              <strong>"Các Bên"</strong>
            </p>

            {/* XÉT RẰNG */}
            <div>
              <p className="font-bold text-center mb-4 uppercase">XÉT RẰNG:</p>

              <div className="space-y-3">
                <p className="text-left leading-relaxed">
                  1. Khách Hàng là Khách hàng cá nhân vay mua xe ô tô điện      
                  VinFast theo{" "}
                  <em>
                    Chương trình hỗ trợ tiền vay dành cho Khách hàng cá nhân là 
                    tài vay mua ô tô điện VinFast VF5 hoặc Herio Green
                  </em>{" "}
                  và/hoặc là (ii) vợ/chồng của Khách hàng đã ký Hợp đồng mua bán
                  xe ô tô số{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={soHopDong}
                      onChange={(e) => setSoHopDong(e.target.value)}
                      className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500 font-bold"
                    />
                  </span>
                  <span className="hidden print:inline font-bold">{soHopDong}</span> với  
                  Bên bán (sau đây gọi chung là "
                  <strong>Hợp Đồng Mua Bán Xe</strong>") với thông tin về xe như
                  sau:
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
                          className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500 uppercase"
                        />
                      </span>
                      <span className="hidden print:inline uppercase">{model}</span>        
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="info-label w-[100px] min-w-[100px]">- Số Khung:</span>
                    <div className="info-value font-bold uppercase">
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
                    <div className="info-value font-bold uppercase">
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
                  <div className="info-row">
                    <span className="info-label w-[100px] min-w-[100px]">- Giá trị xe:</span>
                    <div className="info-value font-bold">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={giaTriXe}
                          onChange={(e) =>
                            setGiaTriXe(e.target.value)
                          }
                          className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{giaTriXe}</span> VNĐ
                      <span className="ml-1 font-normal">(đã bao gồm ưu đãi/giảm giá)</span>
                    </div>
                  </div>
                </div>

                <p className="text-left leading-relaxed">
                  2. Khách Hàng thuộc trường hợp được áp dụng chính sách hỗ trợ 
                  một khoản tiền tương đương một phần nợ gốc và lãi trong hạn   
                  của khoản vay mua xe tại Ngân hàng Thương Mại Cổ Phần Việt Nam
                  Thịnh Vượng (sau đây gọi là "<strong>Ngân Hàng</strong>") theo
                  chính sách hỗ trợ tiền vay của VinFast được đại diện thực hiện
                  bởi Bên bán ("<strong>Chính sách Hỗ trợ Trả thay</strong>")...
                </p>

                <p className="text-left leading-relaxed">
                  3. Khách Hàng và Ngân Hàng đã hoặc sẽ ký kết một hợp đồng cho 
                  vay (hoặc hợp đồng/thỏa thuận/khế ước khác có bản chất là hợp 
                  đồng cho vay) và hợp đồng thế chấp...
                </p>

                <p className="text-left leading-relaxed">
                  4. Bên bán được VinFast Trading ủy quyền giao kết Thỏa Thuận  
                  này với Khách Hàng để triển khai Chính sách Hỗ trợ Trả thay.  
                </p>
              </div>
            </div>

            <p className="text-left leading-relaxed mt-4">
              Do vậy, để thực hiện Chính sách Hỗ trợ Trả thay nêu trên, Các Bên 
              thống nhất ký kết Thỏa Thuận này với những nội dung như sau:      
            </p>

            {/* ĐIỀU 1 */}
            <div className="mt-6">
              <p className="font-bold mb-3">
                Điều 1. Thỏa thuận về việc Hỗ Trợ Trả Thay
              </p>

              <div className="ml-6 space-y-3">
                <p className="font-bold">1.1. Chính sách Hỗ trợ Trả thay:</p>     

                <div className="ml-6 space-y-2">
                  <p>
                    1) Số tiền Khách Hàng vay Ngân Hàng để thanh toán:{" "}     
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={soTienVay}
                        onChange={(e) =>
                          setSoTienVay(e.target.value)
                        }
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500 font-bold"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">{soTienVay}</span> VNĐ
                    (
                    <em>
                      Bằng chữ:{" "}
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={soTienVayBangChu}
                          onChange={(e) => setSoTienVayBangChu(e.target.value)} 
                          className="border-b border-gray-400 px-1 w-64 focus:outline-none focus:border-blue-500 italic font-bold"
                        />
                      </span>
                      <span className="hidden print:inline font-bold italic">
                        {soTienVayBangChu}
                      </span>
                    </em>
                    ) tương ứng với tỷ lệ vay Ngân Hàng:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={tyLeVay}
                        onChange={(e) => setTyLeVay(e.target.value)}
                        className="border-b border-gray-400 px-1 w-20 focus:outline-none focus:border-blue-500 font-bold"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">{tyLeVay}</span> giá  
                    trị xe
                  </p>
                  <p>
                    2) Ngân Hàng vay: Ngân hàng TMCP Việt Nam Thịnh Vượng ("    
                    <strong>Ngân Hàng</strong>")
                  </p>
                  <p>
                    3) Lãi suất Ngân hàng áp dụng:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={laiSuatNH}
                        onChange={(e) => setLaiSuatNH(e.target.value)}
                        className="border-b border-gray-400 px-1 w-20 focus:outline-none focus:border-blue-500 font-bold"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">{laiSuatNH}</span>    
                    %/năm, cố định trong 24 tháng.
                  </p>
                  <p>
                    4) Lãi suất sau thời gian cố định: Lãi suất cơ sở + Biên độ{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={laiSuatSauCoDinh}
                        onChange={(e) => setLaiSuatSauCoDinh(e.target.value)}   
                        className="border-b border-gray-400 px-1 w-20 focus:outline-none focus:border-blue-500 font-bold"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">
                      {laiSuatSauCoDinh}
                    </span>
                    %/năm. Chi tiết theo ghi nhận tại Hợp Đồng Tín Dụng.        
                  </p>
                  <p>5) Thời hạn vay: 60 tháng.</p>
                  <p className="font-bold">
                    6) VinFast sẽ hỗ trợ trả thay cho Khách Hàng một khoản tiền 
                    như sau:
                  </p>
                  <div className="ml-6 space-y-2">
                    <p className="text-left leading-relaxed">
                      -{" "}
                      <strong>
                        <em>
                          Nếu số tiền gốc và lãi trong hạn mà Khách Hàng phải   
                          trả nợ hàng tháng theo Hợp Đồng Tín Dụng vượt quá     
                          (&gt;) 9.756.128 VNĐ đối với Khách Hàng vay mua xe ô  
                          tô điện VF5 hoặc 9.001.600 VNĐ đối với Khách Hàng vay 
                          mua xe ô tô điện Herio Green
                        </em>
                      </strong>
                      : VinFast hỗ trợ trả thay phần tiền chênh lệch vượt quá số
                      tiền nêu trên (sau đây gọi chung là "
                      <strong>Khoản Hỗ Trợ Tiền Vay</strong>").
                    </p>
                    <p className="text-left leading-relaxed">
                      -{" "}
                      <strong>
                        <em>
                          Nếu số tiền gốc và lãi trong hạn mà Khách Hàng phải   
                          trả nợ hàng tháng theo Hợp Đồng Tín Dụng nhỏ hơn hoặc 
                          bằng (≤) 9.756.128 VNĐ đối với Khách Hàng vay mua ô tô
                          điện VF5 hoặc 9.001.600 VNĐ đối với Khách Hàng vay mua
                          xe ô tô điện Herio Green
                        </em>
                      </strong>
                      : Khách Hàng tự trả nợ đúng theo số tiền thực tế phải trả 
                      theo Hợp Đồng Tín Dụng – nghĩa là VinFast không hỗ trợ trả
                      thay trong các trường hợp này.
                    </p>
                  </div>
                  <p>
                    7) Thời hạn hỗ trợ trả thay (sau đây gọi chung là "
                    <strong>Thời Hạn Hỗ Trợ Trả Thay</strong>"): 36 tháng tính  
                    từ ngày tiếp theo liền kề ngày hết thời gian cố định lãi    
                    suất theo quy định tại Hợp Đồng Tín Dụng hoặc cho đến khi   
                    Thời Hạn Hỗ Trợ Trả Thay chấm dứt trước thời hạn theo quy   
                    định tại Thỏa Thuận này, tùy thời điểm nào đến trước.       
                  </p>
                </div>

                <p className="font-bold mt-4">
                  1.2. Để tránh hiểu nhầm Các Bên thống nhất rằng:
                </p>
                <p className="text-left leading-relaxed ml-6">
                  Trong mọi trường hợp VinFast, VinFast Trading không chịu trách
                  nhiệm đối với bất kỳ số tiền trả nợ nào ngoài số tiền trả thay
                  quy định trên đây vì lý do Khách Hàng không tuân thủ các quy  
                  định của Ngân Hàng hay vì bất kỳ lý do gì không phải do lỗi   
                  của VinFast, VinFast Trading...
                </p>

                <p className="font-bold mt-4">1.3. Thời Hạn Hỗ Trợ Trả Thay:</p>  
                <p className="text-left leading-relaxed ml-6">
                  Thời Hạn Hỗ Trợ Trả Thay sẽ tự động chấm dứt trước hạn trong  
                  trường hợp (i) Hợp Đồng Tín Dụng chấm dứt trước khi hết Thời  
                  Hạn Hỗ Trợ Trả Thay vì bất cứ lý do gì...
                </p>

                <p className="font-bold mt-4">1.4. Điều khoản bổ sung:</p>        
                <p className="text-left leading-relaxed ml-6">
                  Không phụ thuộc vào các thỏa thuận nêu trên, Các Bên đồng ý   
                  rằng, thỏa thuận trả thay theo Thỏa Thuận này là thỏa thuận   
                  riêng giữa các Bên...
                </p>

                <p className="font-bold mt-4">1.5. Cam kết chia sẻ thông tin:</p> 
                <p className="text-left leading-relaxed ml-6">
                  Khách Hàng đồng ý cho phép Ngân Hàng, VinFast, VinFast        
                  Trading, Bên bán được cung cấp các thông tin cá nhân, thông   
                  tin liên quan đến xe ô tô, khoản vay được VinFast, VinFast    
                  Trading cam kết trả thay và các thông tin khác của Khách      
                  Hàng...
                </p>
              </div>
            </div>

            {/* Placeholder for Articles 2, 3, 4 */}
            <div className="mt-6 p-4 border border-gray-300 rounded bg-gray-50 print:border-none print:bg-white print:p-0">
              <p className="text-center italic text-gray-600 mb-2 print:hidden">
                [Điều 2: Quyền và nghĩa vụ của các Bên]
              </p>
              <p className="text-center italic text-gray-600 mb-2 print:hidden">
                [Điều 3: Điều khoản hỗ trợ Ngân Hàng - Vi phạm 10/30 ngày]      
              </p>
              <p className="text-center italic text-gray-600 print:hidden">
                [Điều 4: Hiệu lực của Thỏa Thuận]
              </p>
            </div>
          </div>

          {/* Signature */}
          <div className="mt-16 signature-block">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="text-center font-bold p-4 w-1/2 border-r border-black">
                    <p className="mb-20 signer-title uppercase">ĐẠI DIỆN BÊN BÁN</p>
                  </td>
                  <td className="text-center font-bold p-4 w-1/2">
                    <p className="mb-20 signer-title uppercase">KHÁCH HÀNG</p>
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
      </div>
    </div>
  );
};

export default GiayThoaThuanHTVLCT90_nien_kim_60_thang;
