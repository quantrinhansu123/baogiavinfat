import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import { toast } from "react-toastify";
import { getBranchByShowroomName } from "../../data/branchData";
import {
  uniqueNgoaiThatColors,
  uniqueNoiThatColors,
} from "../../data/calculatorData";
import { formatCurrency, uuDaiToLines } from "../../utils/formatting";
import { mapHopDongIncomingState } from "../../utils/buildHopDongPrintData";
import { vndToWords } from "../../utils/vndToWords";
import { HopDongMau2Styles } from "./HopDongMau2Styles";

const formatDateVi = (dateStr) => {
  if (!dateStr) return null;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("/");
    return `${parseInt(day, 10)} tháng ${parseInt(month, 10)} năm ${year}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return "";
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const getColorName = (colorCode, isExterior = true) => {
  if (!colorCode) return "";
  const colorList = isExterior ? uniqueNgoaiThatColors : uniqueNoiThatColors;
  const found = colorList.find(
    (color) => color.code.toLowerCase() === String(colorCode).toLowerCase()
  );
  return found ? found.name : colorCode;
};

const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return 0;
  const num =
    typeof value === "string"
      ? parseInt(value.replace(/\D/g, ""), 10)
      : Number(value);
  return isNaN(num) ? 0 : num;
};

const HopDongMuaBanXeMau2 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        let incoming = location.state;
        if (!incoming) {
          setLoading(false);
          return;
        }

        const contractKey = incoming.firebaseKey || incoming.id;
        if (contractKey) {
          try {
            const snapshot = await get(
              ref(database, `contracts/${contractKey}`)
            );
            if (snapshot.exists()) {
              incoming = {
                ...snapshot.val(),
                ...incoming,
                firebaseKey: contractKey,
              };
            }
          } catch (error) {
            console.error("Error loading contract from Firebase:", error);
          }
        }

        const mapped = mapHopDongIncomingState(incoming);
        const branchInfo = mapped?.showroom
          ? getBranchByShowroomName(mapped.showroom)
          : null;
        setBranch(branchInfo);
        setData(mapped);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location.state]);

  const handleBack = () => navigate(-1);

  const handlePrint = () => {
    if (!data?.customerName) {
      toast.error("Thiếu tên khách hàng");
      return;
    }
    if (!branch) {
      toast.error("Chưa chọn showroom");
      return;
    }
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <HopDongMau2Styles />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <HopDongMau2Styles />
        <div className="text-center">
          <p className="mb-4">Không có dữ liệu hợp đồng</p>
          <button
            type="button"
            onClick={handleBack}
            className="bg-gray-600 text-white px-6 py-2 rounded"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const price = toNumber(data.contractPrice);
  const deposit = toNumber(data.deposit);
  const loanAmount = toNumber(data.loanAmount);
  const isTraGop =
    data.payment && String(data.payment).toLowerCase().includes("góp");
  const dot2TraThang = Math.max(price - deposit, 0);
  const dot2TraGop = Math.max(price - deposit - loanAmount, 0);
  const promotionLines = uuDaiToLines(data.uuDai);
  const contractDateText =
    formatDateVi(formatDateShort(data.contractDate)) ||
    "... ngày ... tháng ... năm ...";
  const issueDateText = formatDateShort(data.issueDate);
  const exteriorName = getColorName(data.exterior, true);
  const interiorName = getColorName(data.interior, false);
  const deliveryAddress = branch?.address || "[Chưa chọn showroom]";

  return (
    <div className="hd-mau2-screen">
      <HopDongMau2Styles />

      <div className="print:hidden mb-4 flex gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Quay lại
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          In hợp đồng (Mẫu 2)
        </button>
      </div>

      <div id="printable-content" className="hd-mau2-page">
        <h1>HỢP ĐỒNG MUA BÁN XE Ô TÔ ĐIỆN VINFAST</h1>
        <p className="hd-mau2-text-center">
          Số: {data.contractNumber || "[---]"}
        </p>
        <p className="hd-mau2-text-center hd-mau2-i hd-mau2-mb-20">
          Hợp đồng mua bán xe điện VinFast (<span className="hd-mau2-b">“Hợp Đồng”</span>) được ký ngày{" "}
          {contractDateText}, giữa:
        </p>

        <div className="hd-mau2-info-grid">
          <div className="hd-mau2-info-col">
            <p className="hd-mau2-party-title">
              {branch?.name || "[Chưa chọn showroom]"}
            </p>
            <ul>
              <li>Trụ sở chính: {branch?.address || "[---]"}</li>
              <li>MSDN: {branch?.taxCode || "[---]"}</li>
              <li>
                Tài khoản số: {branch?.bankAccount || "[---]"} -{" "}
                {branch?.bankName || "[---]"}
                {branch?.bankBranch ? ` - ${branch.bankBranch}` : ""}
              </li>
              <li>
                Đại diện:{" "}
                {branch?.representativeName ||
                  ".............................................................."}
              </li>
              <li>
                Chức vụ:{" "}
                {branch?.position ||
                  "..............................................................."}
              </li>
            </ul>
            <p className="hd-mau2-party-footer">
              Sau đây gọi là <span className="hd-mau2-b">“Bên Bán”</span>
            </p>
          </div>
          <div className="hd-mau2-info-col">
            <p className="hd-mau2-party-title">
              KHÁCH HÀNG: {data.customerName || "[---]"}
            </p>
            <ul>
              <li>Địa chỉ: {data.customerAddress || "[---]"}</li>
              <li>Điện thoại: {data.phone || "[---]"}</li>
              <li>Email: {data.email || "[---]"}</li>
              {data.khachHangLa === "Công ty" ? (
                <>
                  <li>MSDN: {data.msdn || "[---]"}</li>
                  <li>
                    Đại diện: {data.daiDien || "[---]"} — {data.chucVu || "[---]"}
                  </li>
                </>
              ) : (
                <>
                  <li>Nếu là cá nhân:</li>
                  <li style={{ paddingLeft: 15 }}>
                    - CCCD: {data.cccd || "[---]"}
                    {issueDateText ? ` cấp ngày ${issueDateText}` : ""}
                    {data.issuePlace ? ` tại ${data.issuePlace}` : ""}
                  </li>
                  {data.ngaySinh && (
                    <li style={{ paddingLeft: 15 }}>
                      - Ngày sinh: {formatDateShort(data.ngaySinh)}
                    </li>
                  )}
                </>
              )}
            </ul>
            <p className="hd-mau2-party-footer">
              Sau đây gọi là <span className="hd-mau2-b">“Khách Hàng”</span>
            </p>
          </div>
        </div>

        <p className="hd-mau2-i">
          Bên Bán và Khách Hàng sau đây được gọi riêng là{" "}
          <span className="hd-mau2-b">“Bên”</span> và gọi chung là{" "}
          <span className="hd-mau2-b">“Các Bên”</span>.
        </p>
        <p>
          <span className="hd-mau2-b">Các Bên</span> cùng thỏa thuận và thống nhất như sau:
        </p>

        <h2>Điều 1. Thông tin về xe, giá trị mua bán và thanh toán</h2>
        <p className="hd-mau2-sub">1.1 Thông tin về xe và giá trị mua bán</p>

        <table className="hd-mau2-contract-table">
          <thead>
            <tr>
              <th style={{ width: "5%" }}>TT</th>
              <th style={{ width: "45%" }}>Mô tả xe</th>
              <th style={{ width: "10%" }}>Số lượng</th>
              <th style={{ width: "20%" }}>Đơn giá (VNĐ)</th>
              <th style={{ width: "20%" }}>Thành tiền (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="hd-mau2-text-center">1</td>
              <td>
                <span className="hd-mau2-b">
                  VinFast {data.model || "[---]"}
                  {data.variant ? ` - Phiên bản: ${data.variant}` : ""}
                </span>
                <br />
                <span className="hd-mau2-vehicle-label">- Màu ngoại thất:</span>{" "}
                {exteriorName || "[---]"} (Bao gồm pin)
                <br />
                <span className="hd-mau2-vehicle-label">- Màu nội thất:</span>{" "}
                {interiorName || "[---]"}
                <br />
                <span className="hd-mau2-vehicle-label">- Năm sản xuất:</span>{" "}
                {data.namSanXuat || "[---]"}
                {data.soKhung ? (
                  <>
                    <br />
                    <span className="hd-mau2-vehicle-label">- Số khung:</span>{" "}
                    {data.soKhung}
                  </>
                ) : null}
                {data.soMay ? (
                  <>
                    <br />
                    <span className="hd-mau2-vehicle-label">- Số máy:</span>{" "}
                    {data.soMay}
                  </>
                ) : null}
                <br />
                <span className="hd-mau2-vehicle-label">- Tình trạng:</span>{" "}
                {data.tinhTrangXe || "Mới 100%"}
                <br />
                <span className="hd-mau2-vehicle-label">- Thông số kỹ thuật:</span>{" "}
                Theo tiêu chuẩn của Nhà sản xuất
                <br />
                <span className="hd-mau2-i">(sau đây gọi là “Xe”)</span>
              </td>
              <td className="hd-mau2-text-center hd-mau2-td-bold">01</td>
              <td className="hd-mau2-text-right hd-mau2-td-bold">
                {price ? formatCurrency(price) : "[---]"}
              </td>
              <td className="hd-mau2-text-right hd-mau2-td-bold">
                {price ? formatCurrency(price) : "[---]"}
              </td>
            </tr>
            <tr className="hd-mau2-total-row">
              <td colSpan={5}>
                Tổng cộng: {price ? `${formatCurrency(price)} VNĐ` : "[---]"}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="hd-mau2-text-center">
          <span className="hd-mau2-bi">Số tiền bằng chữ:</span>{" "}
          <span className="hd-mau2-i">
            {price ? vndToWords(price) : "[---]"}.
          </span>
        </p>
        <p>
          <span className="hd-mau2-b">Giá Xe</span> đã bao gồm thuế tiêu thụ đặc biệt,
          thuế giá trị gia tăng (VAT), nhưng không bao gồm lệ phí trước bạ, chi phí
          đăng ký, lưu hành, bảo hiểm xe, phí dịch vụ thuê pin và các chi phí khác.
        </p>
        <p>
          1.2 Các chính sách ưu đãi áp dụng:{" "}
          <span className="hd-mau2-u">
            Chi tiết như Phụ lục đính kèm Hợp đồng này
          </span>
          .
        </p>
        <p>
          Thông tin chi tiết về chính sách ưu đãi được công bố tại website:{" "}
          https://vinfastauto.com (<span className="hd-mau2-b">“Website”</span>).
        </p>
        <p>
          Trường hợp Khách Hàng chậm trễ thanh toán/nhận Xe hoặc vi phạm bất kỳ
          nghĩa vụ nào trong Hợp Đồng, chính sách ưu đãi có thể được điều chỉnh
          hoặc hủy bỏ tùy thuộc vào quyết định của Bên Bán.
        </p>

        <p className="hd-mau2-sub hd-mau2-mt-10">1.3 Thanh toán tiền mua Xe</p>
        <p>
          <span className="hd-mau2-b">a) Đợt 1:</span> Khách Hàng thanh toán trước cho
          Bên Bán số tiền{" "}
          <span className="hd-mau2-b">
            {deposit ? `${formatCurrency(deposit)} VNĐ` : "[---] VNĐ"}
          </span>{" "}
          <span className="hd-mau2-i">
            {deposit ? `(bằng chữ: ${vndToWords(deposit)})` : ""}
          </span>{" "}
          trong vòng 03 (ba) ngày làm việc kể từ ngày ký Hợp Đồng. Nếu Khách Hàng đã
          đặt cọc theo thỏa thuận trước đó, số tiền đặt cọc sẽ được chuyển thành khoản
          thanh toán trước tại đợt 1 của Hợp Đồng này.
        </p>
        <p>
          <span className="hd-mau2-b">b) Tiến độ các đợt thanh toán tiếp theo như sau:</span>
        </p>
        <p className="hd-mau2-i">
          Khách Hàng lựa chọn một trong hai hình thức thanh toán trả thẳng hoặc trả
          góp.
        </p>
        <ul className="hd-mau2-custom-list">
          {!isTraGop && (
            <li>
              <span className="hd-mau2-pay-option">Thanh toán trả thẳng:</span>
              <ul className="hd-mau2-custom-list">
                <li>
                  <span className="hd-mau2-b">
                    Đợt 2:{" "}
                    {dot2TraThang ? `${formatCurrency(dot2TraThang)}` : "[---]"}{" "}
                    VNĐ
                  </span>
                  <span className="hd-mau2-i">
                    {dot2TraThang
                      ? ` (bằng chữ: ${vndToWords(dot2TraThang)}).`
                      : "."}
                  </span>{" "}
                  Khách Hàng thanh toán trong vòng 07 (bảy) ngày làm việc kể từ ngày
                  Bên Bán thông báo về việc Xe sẵn có để giao cho Khách Hàng.
                </li>
              </ul>
            </li>
          )}
          {isTraGop && (
            <li>
              <span className="hd-mau2-pay-option">Thanh toán trả góp:</span>
              <ul className="hd-mau2-custom-list">
                <li>
                  <span className="hd-mau2-b">
                    Đợt 2:{" "}
                    {dot2TraGop ? `${formatCurrency(dot2TraGop)}` : "[---]"} VNĐ
                  </span>
                  <span className="hd-mau2-i">
                    {dot2TraGop
                      ? ` (bằng chữ: ${vndToWords(dot2TraGop)}).`
                      : "."}
                  </span>{" "}
                  Khách Hàng thanh toán trong vòng 07 (bảy) ngày làm việc kể từ ngày
                  Bên Bán thông báo về việc Xe sẵn có để giao cho Khách Hàng, đồng
                  thời bàn giao cho Bên Bán Thông Báo Tín Dụng của ngân hàng cam kết
                  cho Khách Hàng vay số tiền{" "}
                  <span className="hd-mau2-b">
                    {loanAmount ? `${formatCurrency(loanAmount)} VNĐ` : "[---] VNĐ"}
                  </span>{" "}
                  <span className="hd-mau2-i">
                    {loanAmount
                      ? `(Bằng chữ: ${vndToWords(loanAmount)})`
                      : ""}
                  </span>{" "}
                  để mua Xe (<span className="hd-mau2-b">“Thông Báo Tín Dụng”</span>).
                </li>
                <li>
                  <span className="hd-mau2-b">
                    Đợt 3:{" "}
                    {loanAmount ? `${formatCurrency(loanAmount)} VNĐ` : "[---] VNĐ"}
                  </span>
                  <span className="hd-mau2-i">
                    {loanAmount
                      ? ` (Bằng chữ: ${vndToWords(loanAmount)}).`
                      : "."}
                  </span>{" "}
                  Số tiền nêu trên phải được ngân hàng cấp Thông Báo Tín Dụng thanh
                  toán trực tiếp vào tài khoản của Bên Bán trong vòng 05 (năm) ngày
                  làm việc kể từ ngày Bên Bán và Khách Hàng bàn giao giấy hẹn trả
                  kết quả đăng ký Xe cho ngân hàng.
                </li>
              </ul>
            </li>
          )}
        </ul>

        <p>
          <span className="hd-mau2-b">c) Phương thức thanh toán:</span> Khách Hàng có
          thể thanh toán cho Bên Bán bằng chuyển khoản vào tài khoản của Bên Bán theo
          thông tin nêu tại phần đầu Hợp Đồng. Nội dung chuyển khoản ghi theo cú pháp:{" "}
          <span className="hd-mau2-bi">
            Tên Khách Hàng_Số điện thoại_Số hợp đồng mua bán/Số đơn hàng_Model Xe
          </span>
          .
        </p>

        <div className="hd-mau2-page-footer">
          <span>
            HỢP ĐỒNG MUA BÁN XE ĐIỆN VINFAST_VER 2.0 (*Áp dụng đối với khách hàng lẻ*)
          </span>
          <span>Trang 1 của 5</span>
        </div>

        <h2>Điều 2. Thời gian và địa điểm giao Xe</h2>
        <ul className="hd-mau2-custom-list">
          <li>
            Thời gian giao Xe:{" "}
            {data.thoiGianGiaoXe ? (
              <span className="hd-mau2-b">{data.thoiGianGiaoXe}</span>
            ) : (
              "Theo thông báo của Bên Bán trước ít nhất 07 ngày làm việc."
            )}
          </li>
          <li>
            Địa điểm giao Xe:{" "}
            <span className="hd-mau2-b">{branch?.name || "[---]"}.</span>{" "}
            <span className="hd-mau2-b">{deliveryAddress}</span>
          </li>
        </ul>
        <p>
          Bên Bán sẽ giao Xe cùng với hóa đơn và đầy đủ giấy tờ cho Khách Hàng
          sau khi nhận đủ 100% tổng giá trị mua bán nêu tại Điều 1 Hợp Đồng.
        </p>

        <h2>Điều 3. Thủ tục mua Xe khi Khách Hàng thanh toán bằng hình thức trả góp</h2>
        <p>
          <span className="hd-mau2-clause-num">3.1</span> Khi nhận được thanh toán
          Đợt 2 và chấp nhận Thông Báo Tín Dụng, Bên Bán sẽ xuất hoá đơn cho Khách
          Hàng. Khách Hàng phải làm thủ tục đăng ký Xe trong vòng 05 (năm) ngày làm
          việc kể từ ngày được thông báo.
        </p>
        <p>
          <span className="hd-mau2-clause-num">3.2</span> Nếu ngân hàng không giải
          ngân đầy đủ và đúng hạn số tiền còn lại của Đợt 3 cho Bên Bán thì Khách
          Hàng sẽ tự thanh toán đầy đủ trong vòng 10 (mười) ngày làm việc kể từ ngày
          Bên Bán yêu cầu.
        </p>

        <h2>Điều 4. Bảo hành</h2>
        <ul className="hd-mau2-custom-list">
          <li>
            <span className="hd-mau2-b">Chính sách bảo hành:</span> quy định tại sổ
            bảo hành do Bên Bán cung cấp cho Khách Hàng.
          </li>
          <li>
            <span className="hd-mau2-b">Địa điểm bảo hành:</span> tại các Trung tâm
            dịch vụ sửa chữa xe điện VinFast.
          </li>
        </ul>

        <h2>Điều 5. Trách nhiệm của Các Bên</h2>
        <ul className="hd-mau2-custom-list">
          <li>Bên Bán có nghĩa vụ cung cấp đầy đủ hóa đơn, chứng từ hợp lệ.</li>
          <li>Khách Hàng có trách nhiệm thanh toán và nhận Xe đúng thời gian.</li>
          <li>
            Khách Hàng chậm thanh toán sẽ phải trả lãi suất quá hạn 15%/năm.
          </li>
        </ul>

        <h2>Điều 6. Chuyển rủi ro và quyền sở hữu</h2>
        <p>
          Quyền sở hữu và rủi ro liên quan đến Xe được chuyển giao cho Khách Hàng
          khi Xe được bàn giao.
        </p>

        <h2>Điều 7. Bảo vệ dữ liệu cá nhân</h2>
        <p>
          <span className="hd-mau2-clause-num">7.1</span> Cùng với việc thực hiện Hợp
          Đồng này, VinFast Trading và VinFast có thể xử lý dữ liệu cá nhân của
          Khách Hàng theo Chính Sách Bảo Vệ Dữ Liệu Cá Nhân được công bố tại Website.
        </p>
        <p>
          <span className="hd-mau2-b">Đối với Khách Hàng là cá nhân:</span> Bằng việc
          ký Hợp Đồng, Khách Hàng xác nhận đã đọc, hiểu và cho phép VinFast Trading,
          VinFast xử lý dữ liệu cá nhân của mình theo Chính Sách Bảo Vệ Dữ Liệu Cá
          Nhân được công bố tại Website.
        </p>
        <p>
          <span className="hd-mau2-b">Đối với Khách Hàng là tổ chức:</span> Mỗi Bên
          sẽ chịu trách nhiệm thu thập sự đồng ý cần thiết từ chủ thể dữ liệu cá nhân
          liên quan đến Hợp Đồng này.
        </p>

        <h2>Điều 8. Bất khả kháng</h2>
        <p>Sự kiện bất khả kháng sẽ được Các Bên xử lý theo quy định pháp luật.</p>

        <h2>Điều 9. Hiệu lực và Chấm dứt Hợp Đồng</h2>
        <ul className="hd-mau2-custom-list">
          <li>Các Bên có thể thỏa thuận chấm dứt Hợp Đồng.</li>
          <li>
            Hợp Đồng được lập thành 04 (bốn) bản có giá trị như nhau, mỗi Bên giữ
            02 (hai) bản.
          </li>
        </ul>

        <h2>Điều 10. Các điều khoản khác</h2>
        <p>
          Tranh chấp không thương lượng được sẽ giải quyết tại tòa án có thẩm
          quyền.
        </p>

        <div className="hd-mau2-signature-section">
          <div className="hd-mau2-signature-box">
            <p className="hd-mau2-b">ĐẠI DIỆN BÊN BÁN</p>
            <p className="hd-mau2-i">(Ký, ghi rõ họ tên và đóng dấu)</p>
            <div style={{ height: 120 }} />
            <p className="hd-mau2-b">
              {branch?.representativeName || "................................................."}
            </p>
          </div>
          <div className="hd-mau2-signature-box">
            <p className="hd-mau2-b">KHÁCH HÀNG</p>
            <p className="hd-mau2-i">(Ký, ghi rõ họ tên)</p>
            <div style={{ height: 120 }} />
            <p className="hd-mau2-b">
              {data.customerName || "................................................."}
            </p>
          </div>
        </div>

        <div className="hd-mau2-page-footer">
          <span>
            HỢP ĐỒNG MUA BÁN XE ĐIỆN VINFAST_VER 2.0 (*Áp dụng đối với khách hàng lẻ*)
          </span>
          <span>Trang 4 của 5</span>
        </div>

        <div className="hd-mau2-page-break" />
        <hr style={{ borderTop: "2px solid #000", margin: "30px 0" }} />

        <h1>PHỤ LỤC HỢP ĐỒNG</h1>
        <p className="hd-mau2-text-center hd-mau2-i hd-mau2-mb-20">
          (Đính kèm Hợp đồng mua bán xe ô tô điện VinFast Số:{" "}
          {data.contractNumber || "[---]"})
        </p>
        <p className="hd-mau2-b hd-mau2-text-center" style={{ fontSize: "13pt" }}>
          CÁC CHÍNH SÁCH ƯU ĐÃI ÁP DỤNG
        </p>

        <table className="hd-mau2-contract-table">
          <thead>
            <tr>
              <th style={{ width: "10%" }}>STT</th>
              <th style={{ width: "60%" }}>Tên chính sách / Chương trình ưu đãi</th>
              <th style={{ width: "30%" }}>Giá trị (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            {promotionLines.length > 0 ? (
              promotionLines.map((line, index) => (
                <tr key={index}>
                  <td className="hd-mau2-text-center">{index + 1}</td>
                  <td>{line}</td>
                  <td className="hd-mau2-text-right">
                    {promotionLines.length === 1 && toNumber(data.giamGia)
                      ? formatCurrency(toNumber(data.giamGia))
                      : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="hd-mau2-text-center">1</td>
                <td>[Chưa có chính sách ưu đãi]</td>
                <td className="hd-mau2-text-right">—</td>
              </tr>
            )}
          </tbody>
        </table>

        <p className="hd-mau2-i hd-mau2-mt-10">
          * Các chính sách ưu đãi này được áp dụng và tuân thủ theo các điều
          khoản và điều kiện được quy định tại Hợp đồng chính và các văn bản
          thông báo của VinFast tại từng thời điểm.
        </p>

        <div className="hd-mau2-page-footer">
          <span>
            HỢP ĐỒNG MUA BÁN XE ĐIỆN VINFAST_VER 2.0 (*Áp dụng đối với khách hàng lẻ*)
          </span>
          <span>Trang 5 của 5</span>
        </div>
      </div>
    </div>
  );
};

export default HopDongMuaBanXeMau2;
