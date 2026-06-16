/**
 * Chuẩn hóa dữ liệu hợp đồng từ state / Firebase sang một object thống nhất cho in.
 */
export function mapHopDongIncomingState(incoming) {
  if (!incoming) return null;

  const uuDaiRaw =
    incoming.uuDai || incoming["Ưu đãi"] || incoming["ưu đãi"] || "";

  return {
    contractNumber:
      incoming.vso ||
      incoming.contractNumber ||
      incoming.VSO ||
      "",
    contractDate:
      incoming.createdAt ||
      incoming.createdDate ||
      incoming.ngayXhd ||
      "",
    customerName:
      incoming.customerName ||
      incoming.tenKh ||
      incoming["Tên KH"] ||
      incoming["Tên Kh"] ||
      "",
    customerAddress:
      incoming.address ||
      incoming.diaChi ||
      incoming["Địa Chỉ"] ||
      incoming["Địa chỉ"] ||
      "",
    phone:
      incoming.phone ||
      incoming.soDienThoai ||
      incoming["Số Điện Thoại"] ||
      "",
    email: incoming.email || incoming.Email || "",
    cccd: incoming.cccd || incoming.CCCD || "",
    ngaySinh: incoming.ngaySinh || incoming["Ngày sinh"] || "",
    issueDate:
      incoming.issueDate || incoming.ngayCap || incoming["Ngày Cấp"] || "",
    issuePlace:
      incoming.issuePlace || incoming.noiCap || incoming["Nơi Cấp"] || "",
    khachHangLa: incoming.khachHangLa || "",
    msdn: incoming.msdn || incoming.taxCode || incoming.MSDN || "",
    daiDien: incoming.daiDien || incoming.representative || "",
    chucVu: incoming.chucVu || incoming.position || "",
    giayUyQuyen: incoming.giayUyQuyen || "",
    giayUyQuyenNgay: incoming.giayUyQuyenNgay || "",
    model:
      incoming.model || incoming.dongXe || incoming["Dòng xe"] || "",
    variant:
      incoming.variant ||
      incoming.phienBan ||
      incoming["Phiên Bản"] ||
      "",
    exterior:
      incoming.exterior ||
      incoming.ngoaiThat ||
      incoming["Ngoại Thất"] ||
      "",
    interior:
      incoming.interior || incoming.noiThat || incoming["Nội Thất"] || "",
    soKhung:
      incoming.soKhung ||
      incoming["Số Khung"] ||
      incoming.chassisNumber ||
      "",
    soMay:
      incoming.soMay || incoming["Số Máy"] || incoming.engineNumber || "",
    namSanXuat:
      incoming.namSanXuat ||
      incoming["Năm sản xuất"] ||
      incoming.year ||
      "",
    contractPrice:
      incoming.contractPrice ||
      incoming.giaHD ||
      incoming.giaHopDong ||
      incoming["Giá HD"] ||
      incoming["Giá Hợp Đồng"] ||
      "",
    deposit:
      incoming.deposit ||
      incoming.soTienCoc ||
      incoming["Số tiền cọc"] ||
      "",
    payment:
      incoming.payment ||
      incoming.thanhToan ||
      incoming["thanh toán"] ||
      "",
    loanAmount:
      incoming.loanAmount ||
      incoming.soTienVay ||
      incoming.tienVay ||
      incoming["Số tiền vay"] ||
      "",
    bank: incoming.bank || incoming.nganHang || incoming["ngân hàng"] || "",
    uuDai: uuDaiRaw,
    giamGia:
      incoming.giamGia || incoming["Giảm giá"] || incoming["giảm giá"] || "",
    quaTang: incoming.quaTang || incoming["Quà tặng"] || "",
    quaTangKhac: incoming.quaTangKhac || incoming["Quà tặng khác"] || "",
    showroom:
      incoming.showroom || incoming.Showroom || incoming["Showroom"] || "",
    tinhTrangXe:
      incoming.tinhTrangXe ||
      incoming.vehicleStatus ||
      incoming["Tình Trạng Xe"] ||
      "Mới 100%",
    thoiGianGiaoXe: incoming.thoiGianGiaoXe || incoming.ngayGiaoXe || "",
    tvbh: incoming.tvbh || incoming.TVBH || "",
    firebaseKey: incoming.firebaseKey || incoming.id || "",
  };
}

/**
 * Chuẩn hóa dữ liệu hợp đồng để truyền sang trang in (Mẫu 1 / Mẫu 2).
 */
export function buildHopDongPrintData(contract, stt) {
  const mapped = mapHopDongIncomingState({
    ...contract,
    stt: stt ?? contract.stt,
  });

  const uuDaiValue = mapped.uuDai;
  const uuDaiArray = Array.isArray(uuDaiValue)
    ? uuDaiValue
    : uuDaiValue
      ? [uuDaiValue]
      : [];

  return {
    ...mapped,
    id: contract.id,
    stt: stt ?? contract.stt,
    createdAt: mapped.contractDate,
    TVBH: mapped.tvbh,
    vso: mapped.contractNumber,
    address: mapped.customerAddress,
    taxCode: mapped.msdn,
    representative: mapped.daiDien,
    position: mapped.chucVu,
    dongXe: mapped.model,
    phienBan: mapped.variant,
    ngoaiThat: mapped.exterior,
    noiThat: mapped.interior,
    giaHopDong: mapped.contractPrice,
    giaHD: mapped.contractPrice,
    soTienCoc: mapped.deposit,
    thanhToan: mapped.payment,
    soTienVay: mapped.loanAmount,
    nganHang: mapped.bank,
    uuDai: uuDaiArray,
    "Ưu đãi": uuDaiArray,
    "ưu đãi": uuDaiArray,
    status: contract.status,
    year: mapped.namSanXuat,
    "Số Khung": mapped.soKhung,
    "Số Máy": mapped.soMay,
    chassisNumber: mapped.soKhung,
    engineNumber: mapped.soMay,
    representativeName: mapped.tvbh,
    "Quà tặng": mapped.quaTang,
    "Quà tặng khác": mapped.quaTangKhac,
    "Giảm giá": mapped.giamGia,
  };
}
