// Calculator Data - Full version with images
// Import VF3 images
import vf3InfinityBlanc from "../assets/vinfast_images/vf3/Infinity Blanc.png";
import vf3CrimsonRed from "../assets/vinfast_images/vf3/Crimson Red.png";
import vf3ZenithGrey from "../assets/vinfast_images/vf3/Zenith Grey.png";
import vf3SummerYellow from "../assets/vinfast_images/vf3/Summer Yellow Body - Infinity Blanc Roof.png";
import vf3SkyBlue from "../assets/vinfast_images/vf3/Sky Blue - Infinity Blanc Roof.png";
import vf3RosePink from "../assets/vinfast_images/vf3/Rose Pink Body - Infinity Blanc Roof.png";
import vf3UrbanMint from "../assets/vinfast_images/vf3/Urban Mint.png";

// Map VF3 image paths to imports
const vf3ImageMap = {
  "vinfast_images/vf3/Infinity Blanc.png": vf3InfinityBlanc,
  "vinfast_images/vf3/Crimson Red.png": vf3CrimsonRed,
  "vinfast_images/vf3/Zenith Grey.png": vf3ZenithGrey,
  "vinfast_images/vf3/Summer Yellow Body - Infinity Blanc Roof.png":
    vf3SummerYellow,
  "vinfast_images/vf3/Sky Blue - Infinity Blanc Roof.png": vf3SkyBlue,
  "vinfast_images/vf3/Rose Pink Body - Infinity Blanc Roof.png": vf3RosePink,
  "vinfast_images/vf3/Urban Mint.png": vf3UrbanMint,
};

// Helper function to get image URL (handles both local imports and remote URLs)
export const getCarImageUrl = (imagePath) => {
  if (imagePath == null) return null;
  const path = typeof imagePath === 'string' ? imagePath.trim() : String(imagePath || '').trim();
  if (!path) return null;
  // If it's a local path (starts with vinfast_images), return the imported image
  if (path.startsWith("vinfast_images/vf3/")) {
    return vf3ImageMap[path] || null;
  }
  // Remote URL (https/http) hoặc đường dẫn khác: trả về nguyên (để <img src> dùng đúng link)
  return path;
};

// Phí đường bộ
export const phi_duong_bo = [
  { loai: "ca_nhan", gia_tri: 1560000 },
  { loai: "cong_ty", gia_tri: 2160000 },
];

// Phí cấp biển số
export const phi_cap_bien_so = [
  { khu_vuc: "ho_chi_minh", ten_khu_vuc: "TP. Hồ Chí Minh", gia_tri: 20000000 },
  { khu_vuc: "tinh_khac", ten_khu_vuc: "Tỉnh thành khác", gia_tri: 1000000 },
];

// Phí kiểm định
export const phi_kiem_dinh = 140000;

// Chi phí dịch vụ đăng ký
export const chi_phi_dich_vu_dang_ky = 3000000;

// Lãi suất vay hàng năm
export const lai_suat_vay_hang_nam = 0.085;

// Ưu đãi VinClub
export const uu_dai_vin_club = [
  { hang: "gold", ten_hang: "Gold", ty_le: 0.005 },
  { hang: "platinum", ten_hang: "Platinum", ty_le: 0.01 },
  { hang: "diamond", ten_hang: "Diamond", ty_le: 0.015 },
];

// Hỗ trợ đổi xe xăng sang xe điện
export const ho_tro_doi_xe = [
  { dong_xe: "vf_3", gia_tri: 5000000 },
  { dong_xe: "vf_5", gia_tri: 10000000 },
  { dong_xe: "vf_6", gia_tri: 15000000 },
  { dong_xe: "vf_7", gia_tri: 50000000 },
  { dong_xe: "vf_8", gia_tri: 70000000 },
  { dong_xe: "vf_9", gia_tri: 100000000 },
  { dong_xe: "minio", gia_tri: 5000000 },
  { dong_xe: "herio", gia_tri: 10000000 },
  { dong_xe: "nerio", gia_tri: 10000000 },
  { dong_xe: "limo", gia_tri: 15000000 },
  { dong_xe: "ec", gia_tri: 3000000 },
];

// Giá trị đặt cọc
export const gia_tri_dat_coc = [
  { dong_xe: "vf_3", gia_tri: 15000000 },
  { dong_xe: "vf_5", gia_tri: 20000000 },
  { dong_xe: "vf_6", gia_tri: 30000000 },
  { dong_xe: "vf_7", gia_tri: 50000000 },
  { dong_xe: "vf_8", gia_tri: 50000000 },
  { dong_xe: "vf_9", gia_tri: 50000000 },
  { dong_xe: "minio", gia_tri: 7000000 },
  { dong_xe: "herio", gia_tri: 10000000 },
  { dong_xe: "nerio", gia_tri: 10000000 },
  { dong_xe: "limo", gia_tri: 15000000 },
  { dong_xe: "ec", gia_tri: 7000000 },
  { dong_xe: "ec_nang_cao", gia_tri: 7000000 },
];

// Quy đổi 2 năm BHVC
export const quy_doi_2_nam_bhvc = [
  { dong_xe: "vf_3", gia_tri: 0 },
  { dong_xe: "vf_5", gia_tri: 0 },
  { dong_xe: "vf_6", gia_tri: 0 },
  { dong_xe: "vf_7", gia_tri: 0 },
  { dong_xe: "vf_8", gia_tri: 0 },
  { dong_xe: "vf_9", gia_tri: 0 },
  { dong_xe: "minio", gia_tri: 0 },
  { dong_xe: "herio", gia_tri: 0 },
  { dong_xe: "nerio", gia_tri: 0 },
  { dong_xe: "limo", gia_tri: 0 },
  { dong_xe: "ec", gia_tri: 0 },
];

// Thông tin kỹ thuật xe
export const thong_tin_ky_thuat_xe = [
  {
    dong_xe: "vf_3",
    so_cho: 4,
    phi_tnds_ca_nhan: 530000,
    phi_tnds_kinh_doanh: 850000,
    ty_le_bhvc_kinh_doanh: 0.0165,
    ty_le_bhvc_ca_nhan: 0.0165,
  },
  {
    dong_xe: "vf_5",
    so_cho: 5,
    phi_tnds_ca_nhan: 530000,
    phi_tnds_kinh_doanh: 850000,
    ty_le_bhvc_kinh_doanh: 0.0145,
    ty_le_bhvc_ca_nhan: 0.0121,
  },
  {
    dong_xe: "vf_6",
    so_cho: 5,
    phi_tnds_ca_nhan: 530000,
    phi_tnds_kinh_doanh: 850000,
    ty_le_bhvc_kinh_doanh: 0.0145,
    ty_le_bhvc_ca_nhan: 0.01,
  },
  {
    dong_xe: "vf_7",
    so_cho: 5,
    phi_tnds_ca_nhan: 530000,
    phi_tnds_kinh_doanh: 850000,
    ty_le_bhvc_kinh_doanh: 0.0145,
    ty_le_bhvc_ca_nhan: 0.01,
  },
  {
    dong_xe: "vf_8",
    so_cho: 5,
    phi_tnds_ca_nhan: 530000,
    phi_tnds_kinh_doanh: 850000,
    ty_le_bhvc_kinh_doanh: 0.0145,
    ty_le_bhvc_ca_nhan: 0.01,
  },
  {
    dong_xe: "vf_9",
    so_cho: 7,
    phi_tnds_ca_nhan: 950000,
    phi_tnds_kinh_doanh: 1200000,
    ty_le_bhvc_kinh_doanh: 0.0145,
    ty_le_bhvc_ca_nhan: 0.01,
  },
  {
    dong_xe: "minio",
    so_cho: 4,
    phi_tnds_ca_nhan: 530000,
    phi_tnds_kinh_doanh: 850000,
    ty_le_bhvc_kinh_doanh: 0.0145,
    ty_le_bhvc_ca_nhan: 0.01,
  },
  {
    dong_xe: "herio",
    so_cho: 5,
    phi_tnds_ca_nhan: 530000,
    phi_tnds_kinh_doanh: 850000,
    ty_le_bhvc_kinh_doanh: 0.0145,
    ty_le_bhvc_ca_nhan: 0.01,
  },
  {
    dong_xe: "nerio",
    so_cho: 5,
    phi_tnds_ca_nhan: 530000,
    phi_tnds_kinh_doanh: 850000,
    ty_le_bhvc_kinh_doanh: 0.0145,
    ty_le_bhvc_ca_nhan: 0.01,
  },
  {
    dong_xe: "limo",
    so_cho: 7,
    phi_tnds_ca_nhan: 950000,
    phi_tnds_kinh_doanh: 1200000,
    ty_le_bhvc_kinh_doanh: 0.0145,
    ty_le_bhvc_ca_nhan: 0.01,
  },
  {
    dong_xe: "ec",
    so_cho: 2,
    phi_tnds_ca_nhan: 500700,
    phi_tnds_kinh_doanh: 1056300,
    ty_le_bhvc_kinh_doanh: 0.0145,
    ty_le_bhvc_ca_nhan: 0.015,
  },
  {
    dong_xe: "ec_nang_cao",
    so_cho: 2,
    phi_tnds_ca_nhan: 500700,
    phi_tnds_kinh_doanh: 1056300,
    ty_le_bhvc_kinh_doanh: 0.0145,
    ty_le_bhvc_ca_nhan: 0.015,
  },
];

/**
 * Danh sách xe cơ bản (nguồn: file tĩnh).
 * Dùng làm nền cho "Dòng xe áp dụng" ở báo giá / ưu đãi.
 * Danh sách đầy đủ = danh_sach_xe + các model có trong bảng giá (Firebase calculatorConfig/carPriceData).
 * Thêm dòng xe mới: bổ sung vào mảng này HOẶC thêm bản ghi tương ứng trong Quản trị bảng giá.
 */
export const danh_sach_xe = [
  { dong_xe: "vf_3", ten_hien_thi: "VF 3" },
  { dong_xe: "vf_5", ten_hien_thi: "VF 5" },
  { dong_xe: "vf_6", ten_hien_thi: "VF 6" },
  { dong_xe: "vf_7", ten_hien_thi: "VF 7" },
  { dong_xe: "vf_8", ten_hien_thi: "VF 8" },
  { dong_xe: "vf_9", ten_hien_thi: "VF 9" },
  { dong_xe: "minio", ten_hien_thi: "Minio" },
  { dong_xe: "herio", ten_hien_thi: "Herio" },
  { dong_xe: "nerio", ten_hien_thi: "Nerio" },
  { dong_xe: "limo", ten_hien_thi: "Limo" },
  { dong_xe: "ec", ten_hien_thi: "EC" },
  { dong_xe: "ec_nang_cao", ten_hien_thi: "EC Nâng Cao" },
];

/** Chuẩn hóa tên model thành code dùng cho dongXe: "VF 3" -> "vf_3", "VF Lạc Hồng" -> "vf_lac_hong". Export để dùng thống nhất khi lọc/lưu ưu đãi. */
export function modelNameToCode(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/**
 * Danh sách đầy đủ "Dòng xe áp dụng": danh_sach_xe + mọi model có trong bảng giá (carPriceData).
 * Nguồn: (1) danh_sach_xe ở file này, (2) trường model từ từng bản ghi carPriceData (Firebase).
 * @param {Array} carPriceData - Mảng bảng giá (từ context/Firebase), có thể null/undefined
 * @returns {Array<{ code: string, name: string }>}
 */
export function getAvailableDongXeForPromotion(carPriceData) {
  const byCode = new Map();
  danh_sach_xe.forEach((x) =>
    byCode.set(x.dong_xe, { code: x.dong_xe, name: x.ten_hien_thi || x.dong_xe })
  );
  const list = Array.isArray(carPriceData) ? carPriceData : [];
  const seenModels = new Set();
  list.forEach((entry) => {
    const model = String(entry.model || "").trim();
    if (!model || seenModels.has(model)) return;
    seenModels.add(model);
    const code = modelNameToCode(model);
    if (code && !byCode.has(code)) byCode.set(code, { code, name: model });
  });
  return Array.from(byCode.values());
}

// Dữ liệu giá xe với car_image_url đầy đủ
export const carPriceData = [
  {
    model: "VF 3",
    trim: "Base",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 299000000,
    car_image_url: "vinfast_images/vf3/Infinity Blanc.png",
  },
  {
    model: "VF 3",
    trim: "Base",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 299000000,
    car_image_url: "vinfast_images/vf3/Crimson Red.png",
  },
  {
    model: "VF 3",
    trim: "Base",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 299000000,
    car_image_url: "vinfast_images/vf3/Zenith Grey.png",
  },
  {
    model: "VF 3",
    trim: "Base",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 307000000,
    car_image_url: "vinfast_images/vf3/Urban Mint.png",
  },
  {
    model: "VF 3",
    trim: "Base",
    exterior_color: "181Y",
    interior_color: "CI11",
    price_vnd: 307000000,
    car_image_url: "vinfast_images/vf3/Sky Blue - Infinity Blanc Roof.png",
  },
  {
    model: "VF 3",
    trim: "Base",
    exterior_color: "181U",
    interior_color: "CI11",
    price_vnd: 307000000,
    car_image_url:
      "vinfast_images/vf3/Summer Yellow Body - Infinity Blanc Roof.png",
  },
  {
    model: "VF 3",
    trim: "Base",
    exterior_color: "1821",
    interior_color: "CI11",
    price_vnd: 307000000,
    car_image_url:
      "vinfast_images/vf3/Rose Pink Body - Infinity Blanc Roof.png",
  },
  {
    model: "VF 3",
    trim: "Base-TC2",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 302000000,
    car_image_url: "vinfast_images/vf3/Infinity Blanc.png",
  },
  {
    model: "VF 3",
    trim: "Base-TC2",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 302000000,
    car_image_url: "vinfast_images/vf3/Crimson Red.png",
  },
  {
    model: "VF 3",
    trim: "Base-TC2",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 302000000,
    car_image_url: "vinfast_images/vf3/Zenith Grey.png",
  },
  {
    model: "VF 3",
    trim: "Base-TC2",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 310000000,
    car_image_url: "vinfast_images/vf3/Urban Mint.png",
  },
  {
    model: "VF 3",
    trim: "Base-TC2",
    exterior_color: "181Y",
    interior_color: "CI11",
    price_vnd: 310000000,
    car_image_url: "vinfast_images/vf3/Sky Blue - Infinity Blanc Roof.png",
  },
  {
    model: "VF 3",
    trim: "Base-TC2",
    exterior_color: "181U",
    interior_color: "CI11",
    price_vnd: 310000000,
    car_image_url:
      "vinfast_images/vf3/Summer Yellow Body - Infinity Blanc Roof.png",
  },
  {
    model: "VF 3",
    trim: "Base-TC2",
    exterior_color: "1821",
    interior_color: "CI11",
    price_vnd: 310000000,
    car_image_url:
      "vinfast_images/vf3/Rose Pink Body - Infinity Blanc Roof.png",
  },
  {
    model: "VF 5",
    trim: "Plus",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 529000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw15a07f69/images/VF5/GA12V/CE18.webp",
  },
  {
    model: "VF 5",
    trim: "Plus",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 529000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw3ceb9d0f/images/VF5/GA12V/CE1M.webp",
  },
  {
    model: "VF 5",
    trim: "Plus",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 529000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw571c8451/images/VF5/GA12V/CE1V.webp",
  },
  {
    model: "VF 5",
    trim: "Plus",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 529000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw93093fe2/images/VF5/GA12V/CE11.webp",
  },
  {
    model: "VF 5",
    trim: "Plus",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 537000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwf17afb72/images/VF5/GA12V/CE1W.webp",
  },
  {
    model: "VF 5",
    trim: "Plus",
    exterior_color: "181Y",
    interior_color: "CI11",
    price_vnd: 537000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw6a8286c7/images/VF5/GA12V/181Y.webp",
  },
  {
    model: "VF 5",
    trim: "Plus",
    exterior_color: "181U",
    interior_color: "CI11",
    price_vnd: 537000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw501ea74b/images/VF5/GA12V/181U.webp",
  },
  // VF 6 Plus TC 2 - Black interior (CI11)
  {
    model: "VF 6",
    trim: "Plus TC 2",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 745000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw66b28186/images/VF6/JB12V/CE18.webp",
  },
  {
    model: "VF 6",
    trim: "Plus TC 2",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 745000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwb1100c8f/images/VF6/JB12V/CE1M.webp",
  },
  {
    model: "VF 6",
    trim: "Plus TC 2",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 745000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw1a6f13c2/images/VF6/JB12V/CE1V.webp",
  },
  {
    model: "VF 6",
    trim: "Plus TC 2",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 745000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw93093fe2/images/VF6/JB12V/CE11.webp",
  },
  {
    model: "VF 6",
    trim: "Plus TC 2",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 753000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw7b58dad2/images/VF6/JB12V/CE1W.webp",
  },

  // VF 6 Plus TC 2 - Brown interior (CI18)
  {
    model: "VF 6",
    trim: "Plus TC 2",
    exterior_color: "CE18",
    interior_color: "CI18",
    price_vnd: 745000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw66b28186/images/VF6/JB12V/CE18.webp",
  },
  {
    model: "VF 6",
    trim: "Plus TC 2",
    exterior_color: "CE1M",
    interior_color: "CI18",
    price_vnd: 745000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwb1100c8f/images/VF6/JB12V/CE1M.webp",
  },
  {
    model: "VF 6",
    trim: "Plus TC 2",
    exterior_color: "CE1V",
    interior_color: "CI18",
    price_vnd: 745000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw1a6f13c2/images/VF6/JB12V/CE1V.webp",
  },
  {
    model: "VF 6",
    trim: "Plus TC 2",
    exterior_color: "CE11",
    interior_color: "CI18",
    price_vnd: 745000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw93093fe2/images/VF6/JB12V/CE11.webp",
  },
  {
    model: "VF 6",
    trim: "Plus TC 2",
    exterior_color: "CE1W",
    interior_color: "CI18",
    price_vnd: 753000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw7b58dad2/images/VF6/JB12V/CE1W.webp",
  },

  // VF 6 Plus TC 2 - Beige interior (CI13)
  {
    model: "VF 6",
    trim: "Plus TC 2",
    exterior_color: "CE11",
    interior_color: "CI13",
    price_vnd: 745000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw93093fe2/images/VF6/JB12V/CE11.webp",
  },
  {
    model: "VF 6",
    trim: "Plus TC 2",
    exterior_color: "CE1M",
    interior_color: "CI13",
    price_vnd: 745000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwb1100c8f/images/VF6/JB12V/CE1M.webp",
  },

  // VF 6 Eco - 5 colors (only Black interior)
  {
    model: "VF 6",
    trim: "Eco",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 689000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw66b28186/images/VF6/JB12V/CE18.webp",
  },
  {
    model: "VF 6",
    trim: "Eco",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 689000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwb1100c8f/images/VF6/JB12V/CE1M.webp",
  },
  {
    model: "VF 6",
    trim: "Eco",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 689000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw1a6f13c2/images/VF6/JB12V/CE1V.webp",
  },
  {
    model: "VF 6",
    trim: "Eco",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 689000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw93093fe2/images/VF6/JB12V/CE11.webp",
  },
  {
    model: "VF 6",
    trim: "Eco",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 697000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwf17afb72/images/VF6/JB12V/CE1W.webp",
  },

  // VF 6 Plus - Black interior (CI11)
  {
    model: "VF 6",
    trim: "Plus",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 749000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw66b28186/images/VF6/JB12V/CE18.webp",
  },
  {
    model: "VF 6",
    trim: "Plus",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 749000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwb1100c8f/images/VF6/JB12V/CE1M.webp",
  },
  {
    model: "VF 6",
    trim: "Plus",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 749000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw1a6f13c2/images/VF6/JB12V/CE1V.webp",
  },
  {
    model: "VF 6",
    trim: "Plus",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 749000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw93093fe2/images/VF6/JB12V/CE11.webp",
  },
  {
    model: "VF 6",
    trim: "Plus",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 757000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwf17afb72/images/VF6/JB12V/CE1W.webp",
  },

  // VF 6 Plus - Brown interior (CI18)
  {
    model: "VF 6",
    trim: "Plus",
    exterior_color: "CE18",
    interior_color: "CI18",
    price_vnd: 749000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw66b28186/images/VF6/JB12V/CE18.webp",
  },
  {
    model: "VF 6",
    trim: "Plus",
    exterior_color: "CE1M",
    interior_color: "CI18",
    price_vnd: 749000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwb1100c8f/images/VF6/JB12V/CE1M.webp",
  },
  {
    model: "VF 6",
    trim: "Plus",
    exterior_color: "CE1V",
    interior_color: "CI18",
    price_vnd: 749000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw1a6f13c2/images/VF6/JB12V/CE1V.webp",
  },
  {
    model: "VF 6",
    trim: "Plus",
    exterior_color: "CE11",
    interior_color: "CI18",
    price_vnd: 749000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw93093fe2/images/VF6/JB12V/CE11.webp",
  },
  {
    model: "VF 6",
    trim: "Plus",
    exterior_color: "CE1W",
    interior_color: "CI18",
    price_vnd: 757000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwf17afb72/images/VF6/JB12V/CE1W.webp",
  },

  // VF 6 Plus - Beige interior (CI13)
  {
    model: "VF 6",
    trim: "Plus",
    exterior_color: "CE11",
    interior_color: "CI13",
    price_vnd: 749000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw93093fe2/images/VF6/JB12V/CE11.webp",
  },
  {
    model: "VF 6",
    trim: "Plus",
    exterior_color: "CE1M",
    interior_color: "CI13",
    price_vnd: 749000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwb1100c8f/images/VF6/JB12V/CE1M.webp",
  },
  // VF 7 Eco - 5 colors (only Black interior)
  {
    model: "VF 7",
    trim: "Eco",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 799000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4880850d/images/VF7/GC12V/CE18.webp",
  },
  {
    model: "VF 7",
    trim: "Eco",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 799000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwe99d5f22/images/VF7/GC12V/CE1M.webp",
  },
  {
    model: "VF 7",
    trim: "Eco",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 799000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4486ff28/images/VF7/GC12V/CE1V.webp",
  },
  {
    model: "VF 7",
    trim: "Eco",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 799000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw06ef2b07/images/VF7/GC12V/CE11.webp",
  },
  {
    model: "VF 7",
    trim: "Eco",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 811000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwebf3fab6/images/VF7/GC12V/CE1W.webp",
  },

  // VF 7 Eco TC 2 - Black interior (CI11)
  {
    model: "VF 7",
    trim: "Eco TC 2",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 789000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4880850d/images/VF7/GC12V/CE18.webp",
  },
  {
    model: "VF 7",
    trim: "Eco TC 2",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 789000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwe99d5f22/images/VF7/GC12V/CE1M.webp",
  },
  {
    model: "VF 7",
    trim: "Eco TC 2",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 789000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4486ff28/images/VF7/GC12V/CE1V.webp",
  },
  {
    model: "VF 7",
    trim: "Eco TC 2",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 789000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw06ef2b07/images/VF7/GC12V/CE11.webp",
  },
  {
    model: "VF 7",
    trim: "Eco TC 2",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 789000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwebf3fab6/images/VF7/GC12V/CE1W.webp",
  },

  // VF 7 Eco HUD TC2 - Black interior (CI11)
  {
    model: "VF 7",
    trim: "Eco HUD TC2",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 799000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4880850d/images/VF7/GC12V/CE18.webp",
  },
  {
    model: "VF 7",
    trim: "Eco HUD TC2",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 799000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwe99d5f22/images/VF7/GC12V/CE1M.webp",
  },
  {
    model: "VF 7",
    trim: "Eco HUD TC2",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 799000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4486ff28/images/VF7/GC12V/CE1V.webp",
  },
  {
    model: "VF 7",
    trim: "Eco HUD TC2",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 799000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw06ef2b07/images/VF7/GC12V/CE11.webp",
  },
  {
    model: "VF 7",
    trim: "Eco HUD TC2",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 799000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwebf3fab6/images/VF7/GC12V/CE1W.webp",
  },

  // VF 7 Eco HUD - Black interior (CI11)
  {
    model: "VF 7",
    trim: "Eco HUD",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 809000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4880850d/images/VF7/GC12V/CE18.webp",
  },
  {
    model: "VF 7",
    trim: "Eco HUD",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 809000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwe99d5f22/images/VF7/GC12V/CE1M.webp",
  },
  {
    model: "VF 7",
    trim: "Eco HUD",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 809000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4486ff28/images/VF7/GC12V/CE1V.webp",
  },
  {
    model: "VF 7",
    trim: "Eco HUD",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 809000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw06ef2b07/images/VF7/GC12V/CE11.webp",
  },
  {
    model: "VF 7",
    trim: "Eco HUD",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 809000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwebf3fab6/images/VF7/GC12V/CE1W.webp",
  },

  // VF 7 Plus-1 Cầu - Black interior (CI11)
  {
    model: "VF 7",
    trim: "Plus-1 Cầu",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 949000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4880850d/images/VF7/GC12V/CE18.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-1 Cầu",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 949000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwe99d5f22/images/VF7/GC12V/CE1M.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-1 Cầu",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 949000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4486ff28/images/VF7/GC12V/CE1V.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-1 Cầu",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 949000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw06ef2b07/images/VF7/GC12V/CE11.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-1 Cầu",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 961000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwebf3fab6/images/VF7/GC12V/CE1W.webp",
  },

  // VF 7 Plus-2 Cầu - Black interior (CI11)
  {
    model: "VF 7",
    trim: "Plus-2 Cầu",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 999000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4880850d/images/VF7/GC12V/CE18.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-2 Cầu",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 999000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwe99d5f22/images/VF7/GC12V/CE1M.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-2 Cầu",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 999000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4486ff28/images/VF7/GC12V/CE1V.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-2 Cầu",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 999000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw06ef2b07/images/VF7/GC12V/CE11.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-2 Cầu",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 1021000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwebf3fab6/images/VF7/GC12V/CE1W.webp",
  },

  // VF 7 Plus-1 Cầu - Brown interior (CI18) - No Red
  {
    model: "VF 7",
    trim: "Plus-1 Cầu",
    exterior_color: "CE18",
    interior_color: "CI18",
    price_vnd: 949000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4880850d/images/VF7/GC12V/CE18.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-1 Cầu",
    exterior_color: "CE1V",
    interior_color: "CI18",
    price_vnd: 949000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4486ff28/images/VF7/GC12V/CE1V.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-1 Cầu",
    exterior_color: "CE11",
    interior_color: "CI18",
    price_vnd: 949000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw06ef2b07/images/VF7/GC12V/CE11.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-1 Cầu",
    exterior_color: "CE1W",
    interior_color: "CI18",
    price_vnd: 961000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwebf3fab6/images/VF7/GC12V/CE1W.webp",
  },

  // VF 7 Plus-2 Cầu - Brown interior (CI18) - No Red
  {
    model: "VF 7",
    trim: "Plus-2 Cầu",
    exterior_color: "CE18",
    interior_color: "CI18",
    price_vnd: 999000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4880850d/images/VF7/GC12V/CE18.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-2 Cầu",
    exterior_color: "CE1V",
    interior_color: "CI18",
    price_vnd: 999000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4486ff28/images/VF7/GC12V/CE1V.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-2 Cầu",
    exterior_color: "CE11",
    interior_color: "CI18",
    price_vnd: 999000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw06ef2b07/images/VF7/GC12V/CE11.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-2 Cầu",
    exterior_color: "CE1W",
    interior_color: "CI18",
    price_vnd: 1021000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwebf3fab6/images/VF7/GC12V/CE1W.webp",
  },
  // VF 7 Plus-2 Cầu-TK - Brown interior (CI18)
  {
    model: "VF 7",
    trim: "Plus-2 Cầu-TK",
    exterior_color: "CE1W",
    interior_color: "CI18",
    price_vnd: 1041000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw7b58dad2/images/VF7/GC12V/CE1W.webp",
  },

  // VF 7 Plus-1 Cầu-TK - Black interior (CI11)
  {
    model: "VF 7",
    trim: "Plus-1 Cầu-TK",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 969000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4880850d/images/VF7/GC12V/CE18.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-1 Cầu-TK",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 969000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwe99d5f22/images/VF7/GC12V/CE1M.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-1 Cầu-TK",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 969000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4486ff28/images/VF7/GC12V/CE1V.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-1 Cầu-TK",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 969000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw06ef2b07/images/VF7/GC12V/CE11.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-1 Cầu-TK",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 981000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwebf3fab6/images/VF7/GC12V/CE1W.webp",
  },

  // VF 7 Plus-2 Cầu-TK - Black interior (CI11)
  {
    model: "VF 7",
    trim: "Plus-2 Cầu-TK",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 1019000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4880850d/images/VF7/GC12V/CE18.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-2 Cầu-TK",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 1019000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwe99d5f22/images/VF7/GC12V/CE1M.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-2 Cầu-TK",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 1019000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4486ff28/images/VF7/GC12V/CE1V.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-2 Cầu-TK",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 1019000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw06ef2b07/images/VF7/GC12V/CE11.webp",
  },
  {
    model: "VF 7",
    trim: "Plus-2 Cầu-TK",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 1041000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwebf3fab6/images/VF7/GC12V/CE1W.webp",
  },
  // VF 8 Eco-AWD - 9 colors (only Black interior)
  {
    model: "VF 8",
    trim: "Eco-AWD",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 1069000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwafc3ac80/images/VF8/ND31V/CE18.webp",
  },
  {
    model: "VF 8",
    trim: "Eco-AWD",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 1069000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw65f5fd6d/images/VF8/ND31V/CE1M.webp",
  },
  {
    model: "VF 8",
    trim: "Eco-AWD",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 1069000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw19321e63/images/VF8/ND31V/CE1V.webp",
  },
  {
    model: "VF 8",
    trim: "Eco-AWD",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 1069000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw19321e63/images/VF8/ND31V/CE11.webp",
  },
  {
    model: "VF 8",
    trim: "Eco-AWD",
    exterior_color: "CE22",
    interior_color: "CI11",
    price_vnd: 1069000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw5aa8e062/images/VF8/ND31V/CE22.webp",
  },
  {
    model: "VF 8",
    trim: "Eco-AWD",
    exterior_color: "2927",
    interior_color: "CI11",
    price_vnd: 1081000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw19366c63/images/VF8/ND31V/2927.webp",
  },
  {
    model: "VF 8",
    trim: "Eco-AWD",
    exterior_color: "2911",
    interior_color: "CI11",
    price_vnd: 1081000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw5ab1cf86/images/VF8/ND31V/2911.webp",
  },
  {
    model: "VF 8",
    trim: "Eco-AWD",
    exterior_color: "1V18",
    interior_color: "CI11",
    price_vnd: 1081000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwf71b68ce/images/VF8/ND31V/1V18.webp",
  },
  {
    model: "VF 8",
    trim: "Eco-AWD",
    exterior_color: "171V",
    interior_color: "CI11",
    price_vnd: 1081000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw2ab390ed/images/VF8/ND32V/171V.webp",
  },

  // VF 8 Eco - 9 colors (only Black interior)
  {
    model: "VF 8",
    trim: "Eco",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 1019000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwafc3ac80/images/VF8/ND31V/CE18.webp",
  },
  {
    model: "VF 8",
    trim: "Eco",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 1019000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw65f5fd6d/images/VF8/ND31V/CE1M.webp",
  },
  {
    model: "VF 8",
    trim: "Eco",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 1019000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw19321e63/images/VF8/ND31V/CE1V.webp",
  },
  {
    model: "VF 8",
    trim: "Eco",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 1019000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw19321e63/images/VF8/ND31V/CE11.webp",
  },
  {
    model: "VF 8",
    trim: "Eco",
    exterior_color: "CE22",
    interior_color: "CI11",
    price_vnd: 1019000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw5aa8e062/images/VF8/ND31V/CE22.webp",
  },
  {
    model: "VF 8",
    trim: "Eco",
    exterior_color: "2927",
    interior_color: "CI11",
    price_vnd: 1031000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw19366c63/images/VF8/ND31V/2927.webp",
  },
  {
    model: "VF 8",
    trim: "Eco",
    exterior_color: "2911",
    interior_color: "CI11",
    price_vnd: 1031000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw5ab1cf86/images/VF8/ND31V/2911.webp",
  },
  {
    model: "VF 8",
    trim: "Eco",
    exterior_color: "1V18",
    interior_color: "CI11",
    price_vnd: 1031000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwf71b68ce/images/VF8/ND31V/1V18.webp",
  },
  {
    model: "VF 8",
    trim: "Eco",
    exterior_color: "171V",
    interior_color: "CI11",
    price_vnd: 1031000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwa349f493/images/VF8/ND31V/171V.webp",
  },

  // VF 8 Plus - Black interior (CI11)
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 1199000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwafc3ac80/images/VF8/ND31V/CE18.webp",
  },
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 1199000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw65f5fd6d/images/VF8/ND31V/CE1M.webp",
  },
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 1199000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw19321e63/images/VF8/ND31V/CE1V.webp",
  },
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 1199000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw19321e63/images/VF8/ND31V/CE11.webp",
  },
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "CE22",
    interior_color: "CI11",
    price_vnd: 1199000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw90acd258/images/VF8/ND32V/CE22.webp",
  },
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "2927",
    interior_color: "CI11",
    price_vnd: 1211000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw428731ae/images/VF8/ND32V/2927.webp",
  },
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "2911",
    interior_color: "CI11",
    price_vnd: 1211000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwfb700bee/images/VF8/ND32V/2911.webp",
  },
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "1V18",
    interior_color: "CI11",
    price_vnd: 1211000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwb82fddcc/images/VF8/ND32V/1V18.webp",
  },
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "171V",
    interior_color: "CI11",
    price_vnd: 1211000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw2ab390ed/images/VF8/ND32V/171V.webp",
  },

  // VF 8 Plus - Brown interior (CI12)
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "CE18",
    interior_color: "CI12",
    price_vnd: 1199000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwafc3ac80/images/VF8/ND31V/CE18.webp",
  },
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "CE1M",
    interior_color: "CI12",
    price_vnd: 1199000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw65f5fd6d/images/VF8/ND31V/CE1M.webp",
  },
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "CE1V",
    interior_color: "CI12",
    price_vnd: 1199000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw19321e63/images/VF8/ND31V/CE1V.webp",
  },
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "CE11",
    interior_color: "CI12",
    price_vnd: 1199000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw19321e63/images/VF8/ND31V/CE11.webp",
  },
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "CE22",
    interior_color: "CI12",
    price_vnd: 1199000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw90acd258/images/VF8/ND32V/CE22.webp",
  },
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "2927",
    interior_color: "CI12",
    price_vnd: 1211000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw428731ae/images/VF8/ND32V/2927.webp",
  },
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "2911",
    interior_color: "CI12",
    price_vnd: 1211000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwfb700bee/images/VF8/ND32V/2911.webp",
  },
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "1V18",
    interior_color: "CI12",
    price_vnd: 1211000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwb82fddcc/images/VF8/ND32V/1V18.webp",
  },
  {
    model: "VF 8",
    trim: "Plus",
    exterior_color: "171V",
    interior_color: "CI12",
    price_vnd: 1211000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw2ab390ed/images/VF8/ND32V/171V.webp",
  },
  // VF 9 Eco - 6 colors (only Black interior, no White)
  {
    model: "VF 9",
    trim: "Eco",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 1499000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw1cc6342e/images/VF9/NE3NV/CE1M.webp",
  },
  {
    model: "VF 9",
    trim: "Eco",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 1499000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw24a20061/images/VF9/NE3NV/CE1V.webp",
  },
  {
    model: "VF 9",
    trim: "Eco",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 1499000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw12ed4303/images/VF9/NE3LV/CE11.webp",
  },
  {
    model: "VF 9",
    trim: "Eco",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 1499000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw609cbf4b/images/VF9/NE3NV/CE1W.webp",
  },
  {
    model: "VF 9",
    trim: "Eco",
    exterior_color: "CE22",
    interior_color: "CI11",
    price_vnd: 1511000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw621d859a/images/VF9/NE3LV/CE22.webp",
  },
  {
    model: "VF 9",
    trim: "Eco",
    exterior_color: "CE17",
    interior_color: "CI11",
    price_vnd: 1511000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwd6d61ae2/images/VF9/NE3LV/CE17.webp",
  },

  // VF 9 Plus (7 seats) - Black interior (CI11)
  {
    model: "VF 9",
    trim: "Plus",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 1699000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw183abd3c/images/VF9/NE3MV/CE18.webp",
  },
  {
    model: "VF 9",
    trim: "Plus",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 1699000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw16af6f0b/images/VF9/NE3MV/CE1M.webp",
  },
  {
    model: "VF 9",
    trim: "Plus",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 1699000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwca1c6f4e/images/VF9/NE3MV/CE1V.webp",
  },
  {
    model: "VF 9",
    trim: "Plus",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 1699000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwe9e01aa8/images/VF9/NE3MV/CE11.webp",
  },
  {
    model: "VF 9",
    trim: "Plus",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 1699000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw26c1a638/images/VF9/NE3MV/CE1W.webp",
  },
  {
    model: "VF 9",
    trim: "Plus",
    exterior_color: "CE22",
    interior_color: "CI11",
    price_vnd: 1711000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw7d370ba5/images/VF9/NE3MV/CE22.webp",
  },
  {
    model: "VF 9",
    trim: "Plus",
    exterior_color: "CE17",
    interior_color: "CI11",
    price_vnd: 1711000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwd6d89ae3/images/VF9/NE3MV/CE17.webp",
  },

  // VF 9 Plus (7 seats) - Brown interior (CI12)
  {
    model: "VF 9",
    trim: "Plus",
    exterior_color: "CE18",
    interior_color: "CI12",
    price_vnd: 1699000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw183abd3c/images/VF9/NE3MV/CE18.webp",
  },
  {
    model: "VF 9",
    trim: "Plus",
    exterior_color: "CE1M",
    interior_color: "CI12",
    price_vnd: 1699000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw16af6f0b/images/VF9/NE3MV/CE1M.webp",
  },
  {
    model: "VF 9",
    trim: "Plus",
    exterior_color: "CE1V",
    interior_color: "CI12",
    price_vnd: 1699000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwca1c6f4e/images/VF9/NE3MV/CE1V.webp",
  },
  {
    model: "VF 9",
    trim: "Plus",
    exterior_color: "CE11",
    interior_color: "CI12",
    price_vnd: 1699000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwe9e01aa8/images/VF9/NE3MV/CE11.webp",
  },
  {
    model: "VF 9",
    trim: "Plus",
    exterior_color: "CE1W",
    interior_color: "CI12",
    price_vnd: 1699000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw26c1a638/images/VF9/NE3MV/CE1W.webp",
  },
  {
    model: "VF 9",
    trim: "Plus",
    exterior_color: "CE22",
    interior_color: "CI12",
    price_vnd: 1711000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw7d370ba5/images/VF9/NE3MV/CE22.webp",
  },
  {
    model: "VF 9",
    trim: "Plus",
    exterior_color: "CE17",
    interior_color: "CI12",
    price_vnd: 1711000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwd6d89ae3/images/VF9/NE3MV/CE17.webp",
  },

  // VF 9 Plus-6 Chỗ - Black interior (CI11)
  {
    model: "VF 9",
    trim: "Plus-6 Chỗ",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 1731000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwd1845889/images/VF9/NE3NV/CE18.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-6 Chỗ",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 1731000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw1cc6342e/images/VF9/NE3NV/CE1M.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-6 Chỗ",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 1731000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw24a20061/images/VF9/NE3NV/CE1V.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-6 Chỗ",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 1731000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw9f28c7cd/images/VF9/NE3NV/CE11.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-6 Chỗ",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 1731000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw609cbf4b/images/VF9/NE3NV/CE1W.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-6 Chỗ",
    exterior_color: "CE22",
    interior_color: "CI11",
    price_vnd: 1743000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dweca0851a/images/VF9/NE3NV/CE22.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-6 Chỗ",
    exterior_color: "CE17",
    interior_color: "CI11",
    price_vnd: 1743000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw9386fa1c/images/VF9/NE3NV/CE17.webp",
  },

  // VF 9 Plus-6 Chỗ - Brown interior (CI12)
  {
    model: "VF 9",
    trim: "Plus-6 Chỗ",
    exterior_color: "CE18",
    interior_color: "CI12",
    price_vnd: 1731000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwd1845889/images/VF9/NE3NV/CE18.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-6 Chỗ",
    exterior_color: "CE1M",
    interior_color: "CI12",
    price_vnd: 1731000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw1cc6342e/images/VF9/NE3NV/CE1M.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-6 Chỗ",
    exterior_color: "CE1V",
    interior_color: "CI12",
    price_vnd: 1731000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw24a20061/images/VF9/NE3NV/CE1V.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-6 Chỗ",
    exterior_color: "CE11",
    interior_color: "CI12",
    price_vnd: 1731000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw9f28c7cd/images/VF9/NE3NV/CE11.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-6 Chỗ",
    exterior_color: "CE1W",
    interior_color: "CI12",
    price_vnd: 1731000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw609cbf4b/images/VF9/NE3NV/CE1W.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-6 Chỗ",
    exterior_color: "CE22",
    interior_color: "CI12",
    price_vnd: 1743000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dweca0851a/images/VF9/NE3NV/CE22.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-6 Chỗ",
    exterior_color: "CE17",
    interior_color: "CI12",
    price_vnd: 1743000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw9386fa1c/images/VF9/NE3NV/CE17.webp",
  },

  // VF 9 Plus-6 Chỗ - Beige interior (CI13) - Only 1 color
  {
    model: "VF 9",
    trim: "Plus-6 Chỗ",
    exterior_color: "CE22",
    interior_color: "CI13",
    price_vnd: 1743000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dweca0851a/images/VF9/NE3NV/CE22.webp",
  },

  // VF 9 Plus-TK (Tran Kinh) - Brown interior (CI12)
  {
    model: "VF 9",
    trim: "Plus-TK",
    exterior_color: "CE18",
    interior_color: "CI12",
    price_vnd: 1728000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw183abd3c/images/VF9/NE3MV/CE18.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-TK",
    exterior_color: "CE1M",
    interior_color: "CI12",
    price_vnd: 1728000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw16af6f0b/images/VF9/NE3MV/CE1M.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-TK",
    exterior_color: "CE1V",
    interior_color: "CI12",
    price_vnd: 1728000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwca1c6f4e/images/VF9/NE3MV/CE1V.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-TK",
    exterior_color: "CE11",
    interior_color: "CI12",
    price_vnd: 1728000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwe9e01aa8/images/VF9/NE3MV/CE11.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-TK",
    exterior_color: "CE1W",
    interior_color: "CI12",
    price_vnd: 1728000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw26c1a638/images/VF9/NE3MV/CE1W.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-TK",
    exterior_color: "CE22",
    interior_color: "CI12",
    price_vnd: 1740000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw7d370ba5/images/VF9/NE3MV/CE22.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-TK",
    exterior_color: "CE17",
    interior_color: "CI12",
    price_vnd: 1740000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwd6d89ae3/images/VF9/NE3MV/CE17.webp",
  },

  // VF 9 Plus-TK (Tran Kinh) - Black interior (CI11)
  {
    model: "VF 9",
    trim: "Plus-TK",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 1728000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw183abd3c/images/VF9/NE3MV/CE18.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-TK",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 1728000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw16af6f0b/images/VF9/NE3MV/CE1M.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-TK",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 1728000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwca1c6f4e/images/VF9/NE3MV/CE1V.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-TK",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 1728000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwe9e01aa8/images/VF9/NE3MV/CE11.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-TK",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 1728000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw26c1a638/images/VF9/NE3MV/CE1W.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-TK",
    exterior_color: "CE22",
    interior_color: "CI11",
    price_vnd: 1740000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw7d370ba5/images/VF9/NE3MV/CE22.webp",
  },
  {
    model: "VF 9",
    trim: "Plus-TK",
    exterior_color: "CE17",
    interior_color: "CI11",
    price_vnd: 1740000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwd6d89ae3/images/VF9/NE3MV/CE17.webp",
  },
  {
    model: "VF 9",
    trim: "Eco",
    exterior_color: "CE1M",
    interior_color: "CI13",
    price_vnd: 1499000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw1cc6342e/images/VF9/NE3NV/CE1M.webp",
  },
  {
    model: "VF 9",
    trim: "Eco",
    exterior_color: "CE1V",
    interior_color: "CI11",
    price_vnd: 1499000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw24a20061/images/VF9/NE3NV/CE1V.webp",
  },
  {
    model: "VF 9",
    trim: "Eco",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 1499000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw12ed4303/images/VF9/NE3LV/CE11.webp",
  },
  {
    model: "VF 9",
    trim: "Eco",
    exterior_color: "CE11",
    interior_color: "CI13",
    price_vnd: 1499000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw12ed4303/images/VF9/NE3LV/CE11.webp",
  },
  {
    model: "VF 9",
    trim: "Eco",
    exterior_color: "CE1W",
    interior_color: "CI11",
    price_vnd: 1499000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw12ed4303/images/VF9/NE3LV/CE11.webp",
  },
  {
    model: "VF 9",
    trim: "Eco",
    exterior_color: "CE22",
    interior_color: "CI11",
    price_vnd: 1511000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw621d859a/images/VF9/NE3LV/CE22.webp",
  },
  {
    model: "VF 9",
    trim: "Eco",
    exterior_color: "CE22",
    interior_color: "CI13",
    price_vnd: 1511000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw621d859a/images/VF9/NE3LV/CE22.webp",
  },
  {
    model: "VF 9",
    trim: "Eco",
    exterior_color: "CE17",
    interior_color: "CI11",
    price_vnd: 1511000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwd6d61ae2/images/VF9/NE3LV/CE17.webp",
  },

  // Green Series - Minio (13 unique variants)
  {
    model: "Minio",
    trim: "Green",
    exterior_color: "CE11",
    interior_color: "CI1M",
    price_vnd: 269000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwf23fb6a1/images/MinioGreen/TH12V/CE11.webp",
  },
  {
    model: "Minio",
    trim: "Green",
    exterior_color: "CE1M",
    interior_color: "CI1M",
    price_vnd: 269000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw9691ed87/images/MinioGreen/TH12V/CE1M.webp",
  },
  {
    model: "Minio",
    trim: "Green",
    exterior_color: "CE17",
    interior_color: "CI1M",
    price_vnd: 269000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw0dc5937a/images/MinioGreen/TH12V/CE17.webp",
  },
  {
    model: "Minio",
    trim: "Green",
    exterior_color: "1U11",
    interior_color: "CI1M",
    price_vnd: 272000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4070a884/images/MinioGreen/TH12V/1U11.webp",
  },
  {
    model: "Minio",
    trim: "Green",
    exterior_color: "181M",
    interior_color: "CI1M",
    price_vnd: 272000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwa4154af5/images/MinioGreen/TH12V/181M.webp",
  },
  {
    model: "Minio",
    trim: "Green",
    exterior_color: "1117",
    interior_color: "CI1M",
    price_vnd: 272000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw6a02a423/images/MinioGreen/TH12V/1117.webp",
  },
  {
    model: "Minio",
    trim: "Green",
    exterior_color: "181U",
    interior_color: "CI1M",
    price_vnd: 272000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw8509640a/images/MinioGreen/TH12V/181U.webp",
  },
  {
    model: "Minio",
    trim: "Green",
    exterior_color: "CE2I",
    interior_color: "CI1M",
    price_vnd: 277000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwd9828d8e/images/MinioGreen/TH12V/CE2I.webp",
  },
  {
    model: "Minio",
    trim: "Green",
    exterior_color: "CE2K",
    interior_color: "CI1M",
    price_vnd: 277000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwdb061a35/images/MinioGreen/TH12V/CE2K.webp",
  },
  {
    model: "Minio",
    trim: "Green",
    exterior_color: "182K",
    interior_color: "CI1M",
    price_vnd: 280000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwf543b132/images/MinioGreen/TH12V/182K.webp",
  },
  {
    model: "Minio",
    trim: "Green",
    exterior_color: "1P2K",
    interior_color: "CI1M",
    price_vnd: 280000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw6b4005ab/images/MinioGreen/TH12V/1P2K.webp",
  },
  {
    model: "Minio",
    trim: "Green",
    exterior_color: "182I",
    interior_color: "CI1M",
    price_vnd: 280000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw43f70966/images/MinioGreen/TH12V/182I.webp",
  },
  {
    model: "Minio",
    trim: "Green",
    exterior_color: "1U2I",
    interior_color: "CI1M",
    price_vnd: 280000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwab6f48f3/images/MinioGreen/TH12V/1U2I.webp",
  },

  // Green Series - Herio (5 unique variants)
  {
    model: "Herio",
    trim: "Green",
    exterior_color: "111U",
    interior_color: "CI11",
    price_vnd: 499000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw60980a19/images/HerioGreen/GA1QV/111U.webp",
  },
  {
    model: "Herio",
    trim: "Green",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 499000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw78e40e3b/images/HerioGreen/GA1QV/CE11.webp",
  },
  {
    model: "Herio",
    trim: "Green",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 499000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw60980a19/images/HerioGreen/GA1QV/CE1M.webp",
  },
  {
    model: "Herio",
    trim: "Green",
    exterior_color: "CE17",
    interior_color: "CI11",
    price_vnd: 499000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast-vn-Library/default/dwa8b7a4d9/images/HerioGreen/GA1QV/CE17.webp",
  },
  {
    model: "Herio",
    trim: "Green",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 499000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw60980a19/images/HerioGreen/GA1QV/CE18.webp",
  },

  // Green Series - Nerio (4 unique variants)
  {
    model: "Nerio",
    trim: "Green",
    exterior_color: "111U",
    interior_color: "CI11",
    price_vnd: 668000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwd7020583/images/NerioGreen/GK1DV/111U.webp",
  },
  {
    model: "Nerio",
    trim: "Green",
    exterior_color: "CE11",
    interior_color: "CI11",
    price_vnd: 668000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw69d29b94/images/NerioGreen/GK1DV/CE11.webp",
  },
  {
    model: "Nerio",
    trim: "Green",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 668000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwd7020583/images/NerioGreen/GK1DV/CE1M.webp",
  },
  {
    model: "Nerio",
    trim: "Green",
    exterior_color: "CE17",
    interior_color: "CI11",
    price_vnd: 668000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw2309112d/images/NerioGreen/GK1DV/CE17.webp",
  },

  // Green Series - Limo (6 unique variants)
  {
    model: "Limo",
    trim: "Green",
    exterior_color: "CE17",
    interior_color: "CI1H",
    price_vnd: 749000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwe5430911/images/LimoGreen/SL1VV/CE17.webp",
  },
  {
    model: "Limo",
    trim: "Green",
    exterior_color: "CE1M",
    interior_color: "CI1H",
    price_vnd: 749000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw2c17d02e/images/LimoGreen/SL1VV/CE1M.webp",
  },
  {
    model: "Limo",
    trim: "Green",
    exterior_color: "181U",
    interior_color: "CI1H",
    price_vnd: 749000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw501ea74b/images/LimoGreen/SL1VV/181U.webp",
  },
  {
    model: "Limo",
    trim: "Green",
    exterior_color: "CE11",
    interior_color: "CI1H",
    price_vnd: 749000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw253b7a82/images/LimoGreen/SL1VV/CE11.webp",
  },
  {
    model: "Limo",
    trim: "Green",
    exterior_color: "CE18",
    interior_color: "CI1H",
    price_vnd: 749000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw7b58dad2/images/LimoGreen/SL1VV/CE18.webp",
  },
  {
    model: "Limo",
    trim: "Green",
    exterior_color: "CE2I",
    interior_color: "CI1H",
    price_vnd: 749000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw0833b90f/images/LimoGreen/SL1VV/CE2I.webp",
  },

  // EC Van (4 unique variants)
  {
    model: "EC",
    trim: "Van",
    exterior_color: "CE2I",
    interior_color: "CI11",
    price_vnd: 285000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw0833b90f/images/ECVAN/TG10V/CE2I.webp",
  },
  {
    model: "EC",
    trim: "Van",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 285000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwf77a99e9/images/ECVAN/TG10V/CE1M.webp",
  },
  {
    model: "EC",
    trim: "Van",
    exterior_color: "111U",
    interior_color: "CI11",
    price_vnd: 285000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw501ea74b/images/ECVAN/TG10V/111U.webp",
  },
  {
    model: "EC",
    trim: "Van",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 285000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw5c48778b/images/ECVAN/TG10V/CE18.webp",
  },
  {
    model: "EC Nâng Cao",
    trim: "Van",
    exterior_color: "CE2I",
    interior_color: "CI11",
    price_vnd: 305000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw0833b90f/images/ECVAN/TG10V/CE2I.webp",
  },
  {
    model: "EC Nâng Cao",
    trim: "Van",
    exterior_color: "CE1M",
    interior_color: "CI11",
    price_vnd: 305000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwf77a99e9/images/ECVAN/TG10V/CE1M.webp",
  },
  {
    model: "EC Nâng Cao",
    trim: "Van",
    exterior_color: "111U",
    interior_color: "CI11",
    price_vnd: 305000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw501ea74b/images/ECVAN/TG10V/111U.webp",
  },
  {
    model: "EC Nâng Cao",
    trim: "Van",
    exterior_color: "CE18",
    interior_color: "CI11",
    price_vnd: 305000000,
    car_image_url:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw5c48778b/images/ECVAN/TG10V/CE18.webp",
  },
];

// Màu ngoại thất với icon URLs từ shop.vinfastauto.com
export const uniqueNgoaiThatColors = [
  {
    code: "CE18",
    name: "Infinity Blanc",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw301d5100/images/deposit/exterior/CE18.webp",
  },
  {
    code: "CE1M",
    name: "Crimson Red",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw2082ad33/images/deposit/exterior/CE1M.webp",
  },
  {
    code: "CE1V",
    name: "Zenith Grey",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwb6055fb1/images/deposit/exterior/CE1V.webp",
  },
  {
    code: "181U",
    name: "Summer Yellow Body - Infinity Blanc Roof",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw501ea74b/images/deposit/exterior/181U.webp",
  },
  {
    code: "181Y",
    name: "Sky Blue - Infinity Blanc Roof",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwd21e2648/images/deposit/exterior/181Y.webp",
  },
  {
    code: "1821",
    name: "Rose Pink Body - Infinity Blanc Roof",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw27ac3178/images/deposit/exterior/1821.webp",
  },
  {
    code: "CE1W",
    name: "Urban Mint",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw7b58dad2/images/deposit/exterior/CE1W.webp",
  },
  {
    code: "111U",
    name: "Summer Yellow Body - Jet Black Roof",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwe1117c5e/images/deposit/exterior/111U.webp",
  },
  {
    code: "CE17",
    name: "Desat Silver",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw28c4ad7c/images/deposit/exterior/CE17.webp",
  },
  {
    code: "CE11",
    name: "Jet Black",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwf37040d4/images/deposit/exterior/CE11.webp",
  },
  {
    code: "CE22",
    name: "Ivy Green",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw67b9e4f6/images/deposit/exterior/CE22.webp",
  },
  {
    code: "2927",
    name: "Crimson Velvet - Mystery Bronze Roof",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwe1cc46f0/images/deposit/exterior/2927.webp",
  },
  {
    code: "171V",
    name: "Zenith Grey - Desat Silver Roof",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwec479253/images/deposit/exterior/171V.webp",
  },
  {
    code: "1V18",
    name: "Infinity Blanc - Zenith Grey Roof",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dweeb8f089/images/deposit/exterior/1V18.webp",
  },
  {
    code: "2911",
    name: "Jet Black - Mystery Bronze Roof",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwb5ed246f/images/deposit/exterior/2911.webp",
  },
  {
    code: "1U11",
    name: "Jet Black Body - Summer Yellow Roof",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw9f8344b4/images/deposit/exterior/1U11.webp",
  },
  {
    code: "181M",
    name: "Crimson Red Body - Infinity Blanc Roof",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwd44dfddd/images/deposit/exterior/181M.webp",
  },
  {
    code: "1117",
    name: "Desat Silver Body - Jet Black Roof",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwee4df7b2/images/deposit/exterior/1117.webp",
  },
  {
    code: "CE2I",
    name: "Tropical Jade",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw0833b90f/images/deposit/exterior/CE2I.webp",
  },
  {
    code: "CE2K",
    name: "Rose Metallic",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwc356da37/images/deposit/exterior/CE2K.webp",
  },
  {
    code: "182K",
    name: "Rose Metallic Body - Infinity Blanc Roof",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw4aaf29c5/images/deposit/exterior/182K.webp",
  },
  {
    code: "1P2K",
    name: "Rose Metallic Body - Aqua Blue Roof",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwe33018bd/images/deposit/exterior/1P2K.webp",
  },
  {
    code: "182I",
    name: "Tropical Jade Body - Infinity Blanc Roof",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw45a6f569/images/deposit/exterior/182I.webp",
  },
  {
    code: "1U2I",
    name: "Tropical Jade Body - Summer Yellow Roof",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw3ffea806/images/deposit/exterior/1U2I.webp",
  },
];

// Màu nội thất với icon URLs từ shop.vinfastauto.com
export const uniqueNoiThatColors = [
  {
    code: "CI11",
    name: "Black",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw9a153245/images/deposit/interior/CI11.webp",
  },
  {
    code: "CI13",
    name: "Cotton Beige",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw6b5810a9/images/deposit/interior/CI13.webp",
  },
  {
    code: "CI18",
    name: "Mocca Brown",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw8df6787c/images/deposit/interior/CI18.webp",
  },
  {
    code: "CI12",
    name: "Saddle Brown",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw65203801/images/deposit/interior/CI12.webp",
  },
  {
    code: "CI1H",
    name: "Black",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw5f5eff9b/images/deposit/interior/CI1H.webp",
  },
  {
    code: "CI1M",
    name: "Grey",
    icon: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw33eb76b4/images/deposit/interior/CI1M.webp",
  },
];

// Helper functions
export const getDataByKey = (array, key, value) => {
  return array.find((item) => item[key] === value) || null;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
};
