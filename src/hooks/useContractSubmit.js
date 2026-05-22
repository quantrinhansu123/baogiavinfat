import { ref, update, push, set } from 'firebase/database';
import { database } from '../firebase/config';
import { toast } from 'react-toastify';
import { validateRequiredFields, isValidCCCD, isValidPhone } from '../utils/validation';
import { sanitizeContractData } from '../utils/sanitize';

export function useContractSubmit(navigate) {
  const handleSubmit = async (contract, contractData, isEditMode) => {
    // Required fields validation
    const requiredFields = ['customerName', 'phone', 'cccd', 'address', 'model'];
    const validation = validateRequiredFields(contract, requiredFields);

    if (!validation.valid) {
      const fieldNames = {
        customerName: 'Tên khách hàng',
        phone: 'Số điện thoại',
        cccd: 'CCCD',
        address: 'Địa chỉ',
        model: 'Dòng xe'
      };
      const missingNames = validation.missing.map(f => fieldNames[f] || f);
      toast.error(`Vui lòng điền: ${missingNames.join(', ')}`);
      return;
    }

    // CCCD format validation (12 digits)
    if (contract.cccd && !isValidCCCD(contract.cccd)) {
      toast.error('CCCD không hợp lệ. Vui lòng nhập đúng 12 chữ số.');
      return;
    }

    // Phone format validation (VN format)
    if (!isValidPhone(contract.phone)) {
      toast.error('Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng VN.');
      return;
    }

    try {
      const safeValue = (val) => val !== undefined && val !== null ? val : "";

      // Auto-calculate tiền đối ứng = Giá hợp đồng - Số tiền vay
      const parseValue = (val) => {
        if (!val) return 0;
        if (typeof val === "string") {
          return parseFloat(val.replace(/[^\d]/g, "")) || 0;
        }
        return typeof val === "number" ? val : 0;
      };

      const contractPriceNum = parseValue(contract.contractPrice);
      const loanAmountNum = parseValue(contract.loanAmount);
      let calculatedTienDoiUng = contract.tienDoiUng;

      // Nếu có giá hợp đồng và số tiền vay, tự động tính tiền đối ứng
      if (contractPriceNum > 0 && loanAmountNum > 0) {
        const tienDoiUngNum = contractPriceNum - loanAmountNum;
        calculatedTienDoiUng = tienDoiUngNum > 0 ? tienDoiUngNum.toString() : "0";
      } else if (contractPriceNum > 0 && (contract.payment === "trả thẳng" || contract.payment === "tra thang")) {
        // Nếu trả thẳng (không vay), tiền đối ứng = giá hợp đồng
        calculatedTienDoiUng = contractPriceNum.toString();
      }

      if (isEditMode && contractData.firebaseKey) {
        // Get old status to check if we need to sync with exportedContracts
        const oldStatus = contractData.status || contractData.trangThai || "";
        const newStatus = safeValue(contract.status) || "mới";
        const oldStatusLower = oldStatus.toLowerCase();
        const newStatusLower = newStatus.toLowerCase();

        // Update existing contract
        const contractRef = ref(database, `contracts/${contractData.firebaseKey}`);
        const updateData = {
          id: contract.id || "",
          createdDate: contract.createdAt || contract.createdDate || "",
          tvbh: safeValue(contract.tvbh),
          showroom: safeValue(contract.showroom),
          vso: safeValue(contract.vso),
          customerName: safeValue(contract.customerName),
          phone: safeValue(contract.phone),
          email: safeValue(contract.email),
          address: safeValue(contract.address),
          cccd: safeValue(contract.cccd),
          ngayCap: safeValue(contract.issueDate),
          noiCap: safeValue(contract.issuePlace),
          dongXe: safeValue(contract.model),
          phienBan: safeValue(contract.variant),
          ngoaiThat: safeValue(contract.exterior),
          noiThat: safeValue(contract.interior),
          giaHD: safeValue(contract.contractPrice),
          soTienCoc: safeValue(contract.deposit),
          tienDoiUng: safeValue(calculatedTienDoiUng),
          "Tiền đối ứng": safeValue(calculatedTienDoiUng),
          thanhToan: safeValue(contract.payment),
          soTienVay: safeValue(contract.loanAmount),
          nganHang: safeValue(contract.bank),
          uuDai: Array.isArray(contract.uuDai) ? contract.uuDai : [],
          quaTang: safeValue(contract.quaTang),
          quaTangKhac: safeValue(contract.quaTangKhac),
          soTienPhaiThu: safeValue(contract.soTienPhaiThu),
          trangThai: newStatus,
          khachHangLa: safeValue(contract.khachHangLa),
          msdn: safeValue(contract.msdn),
          daiDien: safeValue(contract.daiDien),
          chucVu: safeValue(contract.chucVu),
          giayUyQuyen: safeValue(contract.giayUyQuyen),
          giayUyQuyenNgay: safeValue(contract.giayUyQuyenNgay),
        };

        console.log("Update data being sent to Firebase:", updateData);
        console.log("Loan amount in update data:", updateData.soTienVay);

        // Sanitize data before Firebase write
        const sanitizedUpdateData = sanitizeContractData(updateData);

        // Use multi-path atomic update for contracts and exportedContracts
        const updates = {};
        updates[`contracts/${contractData.firebaseKey}`] = sanitizedUpdateData;

        // Sync with exportedContracts based on status change
        const exportKey = contractData.firebaseKey;

        // If changing from non-"xuất" to "xuất": add to exportedContracts
        if (oldStatusLower !== "xuất" && newStatusLower === "xuất") {
          const now = new Date();
          const ngayXhd = now.toISOString().split("T")[0];

          const exportedData = {
            id: safeValue(contract.id),
            stt: safeValue(contractData.stt),
            "ngày xhd": ngayXhd,
            tvbh: safeValue(contract.tvbh),
            showroom: safeValue(contract.showroom),
            VSO: safeValue(contract.vso),
            "Tên Kh": safeValue(contract.customerName),
            "Số Điện Thoại": safeValue(contract.phone),
            Email: safeValue(contract.email || ""),
            "Địa Chỉ": safeValue(contract.address || ""),
            CCCD: safeValue(contract.cccd),
            "Ngày Cấp": safeValue(contract.issueDate),
            "Nơi Cấp": safeValue(contract.issuePlace),
            "Dòng xe": safeValue(contract.model),
            "Phiên Bản": safeValue(contract.variant),
            "Ngoại Thất": safeValue(contract.exterior),
            "Nội Thất": safeValue(contract.interior),
            "Giá Niêm Yết": safeValue(contract.contractPrice),
            "Giá Giảm": safeValue(contract.giamGia || ""),
            "Giá Hợp Đồng": safeValue(contract.contractPrice),
            "Tiền đặt cọc": safeValue(contract.deposit),
            tienDatCoc: safeValue(contract.deposit),
            "Tiền đối ứng": safeValue(calculatedTienDoiUng),
            tienDoiUng: safeValue(calculatedTienDoiUng),
            "Số Khung": safeValue(contractData.soKhung || contractData.chassisNumber || contractData["Số Khung"] || ""),
            "Số Máy": safeValue(contractData.soMay || contractData.engineNumber || contractData["Số Máy"] || ""),
            "Tình Trạng": safeValue(contractData.tinhTrangXe || contractData.vehicleStatus || contractData["Tình Trạng Xe"] || ""),
            "ngân hàng": safeValue(contract.bank || ""),
            thanhToan: safeValue(contract.payment || ""),
            soTienVay: safeValue(contract.loanAmount || ""),
            "ưu đãi": (() => {
              const uuDaiValue = contract.uuDai || "";
              if (Array.isArray(uuDaiValue)) {
                return uuDaiValue.length > 0 ? uuDaiValue.join("\n") : "";
              }
              return safeValue(uuDaiValue);
            })(),
            "Quà tặng": safeValue(contract.quaTang),
            "Quà tặng khác": safeValue(contract.quaTangKhac),
            "Số tiền vay": safeValue(contract.soTienVay),
            "Số tiền phải thu": safeValue(contract.soTienPhaiThu),
            quaTang: safeValue(contract.quaTang),
            quaTangKhac: safeValue(contract.quaTangKhac),
            soTienPhaiThu: safeValue(contract.soTienPhaiThu),
          };

          const sanitizedExportedData = sanitizeContractData(exportedData);
          updates[`exportedContracts/${exportKey}`] = sanitizedExportedData;
        }
        // If changing from "xuất" to non-"xuất": remove from exportedContracts
        else if (oldStatusLower === "xuất" && newStatusLower !== "xuất") {
          updates[`exportedContracts/${exportKey}`] = null;
        }

        // Execute atomic multi-path update
        await update(ref(database), updates);

        toast.success("Cập nhật hợp đồng thành công!");
      } else {
        // Create new contract with collision-resistant ID
        const id = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const contractsRef = ref(database, "contracts");
        const newContractData = {
          id: id || "",
          createdDate: contract.createdAt || "",
          tvbh: safeValue(contract.tvbh),
          showroom: safeValue(contract.showroom),
          vso: safeValue(contract.vso),
          customerName: safeValue(contract.customerName),
          phone: safeValue(contract.phone),
          email: safeValue(contract.email),
          address: safeValue(contract.address),
          cccd: safeValue(contract.cccd),
          ngayCap: safeValue(contract.issueDate),
          noiCap: safeValue(contract.issuePlace),
          dongXe: safeValue(contract.model),
          phienBan: safeValue(contract.variant),
          ngoaiThat: safeValue(contract.exterior),
          noiThat: safeValue(contract.interior),
          giaHD: safeValue(contract.contractPrice),
          soTienCoc: safeValue(contract.deposit),
          tienDoiUng: safeValue(calculatedTienDoiUng),
          "Tiền đối ứng": safeValue(calculatedTienDoiUng),
          thanhToan: safeValue(contract.payment),
          soTienVay: safeValue(contract.loanAmount),
          nganHang: safeValue(contract.bank),
          uuDai: Array.isArray(contract.uuDai) ? contract.uuDai : [],
          quaTang: safeValue(contract.quaTang),
          quaTangKhac: safeValue(contract.quaTangKhac),
          soTienPhaiThu: safeValue(contract.soTienPhaiThu),
          trangThai: safeValue(contract.status) || "mới",
          khachHangLa: safeValue(contract.khachHangLa),
          msdn: safeValue(contract.msdn),
          daiDien: safeValue(contract.daiDien),
          chucVu: safeValue(contract.chucVu),
          giayUyQuyen: safeValue(contract.giayUyQuyen),
          giayUyQuyenNgay: safeValue(contract.giayUyQuyenNgay),
        };

        console.log("New contract data being sent to Firebase:", newContractData);
        console.log("Loan amount in new contract:", newContractData.soTienVay);

        const sanitizedNewContractData = sanitizeContractData(newContractData);
        const newRef = await push(contractsRef, sanitizedNewContractData);

        // If new contract status is "xuất", also add to exportedContracts
        const newStatus = safeValue(contract.status) || "mới";
        if (newStatus.toLowerCase() === "xuất") {
          const exportKey = newRef.key;
          if (exportKey) {
            const now = new Date();
            const ngayXhd = now.toISOString().split("T")[0];

            const exportedData = {
              id: id || "",
              stt: "",
              "ngày xhd": ngayXhd,
              tvbh: safeValue(contract.tvbh),
              showroom: safeValue(contract.showroom),
              VSO: safeValue(contract.vso),
              "Tên Kh": safeValue(contract.customerName),
              "Số Điện Thoại": safeValue(contract.phone),
              Email: safeValue(contract.email || ""),
              "Địa Chỉ": safeValue(contract.address || ""),
              CCCD: safeValue(contract.cccd),
              "Ngày Cấp": safeValue(contract.issueDate),
              "Nơi Cấp": safeValue(contract.issuePlace),
              "Dòng xe": safeValue(contract.model),
              "Phiên Bản": safeValue(contract.variant),
              "Ngoại Thất": safeValue(contract.exterior),
              "Nội Thất": safeValue(contract.interior),
              "Giá Niêm Yết": safeValue(contract.contractPrice),
              "Giá Giảm": safeValue(contract.giamGia || ""),
              "Giá Hợp Đồng": safeValue(contract.contractPrice),
              "Tiền đặt cọc": safeValue(contract.deposit),
              tienDatCoc: safeValue(contract.deposit),
              "Tiền đối ứng": safeValue(calculatedTienDoiUng),
              tienDoiUng: safeValue(calculatedTienDoiUng),
              "Số Khung": "",
              "Số Máy": "",
              "Tình Trạng": "",
              "ngân hàng": safeValue(contract.bank || ""),
              thanhToan: safeValue(contract.payment || ""),
              soTienVay: safeValue(contract.loanAmount || ""),
              "ưu đãi": (() => {
                const uuDaiValue = contract.uuDai || "";
                if (Array.isArray(uuDaiValue)) {
                  return uuDaiValue.length > 0 ? uuDaiValue.join("\n") : "";
                }
                return safeValue(uuDaiValue);
              })(),
              "Quà tặng": safeValue(contract.quaTang),
              "Quà tặng khác": safeValue(contract.quaTangKhac),
              "Số tiền vay": safeValue(contract.soTienVay),
              "Số tiền phải thu": safeValue(contract.soTienPhaiThu),
              quaTang: safeValue(contract.quaTang),
              quaTangKhac: safeValue(contract.quaTangKhac),
              soTienPhaiThu: safeValue(contract.soTienPhaiThu),
            };

            const exportedContractRef = ref(database, `exportedContracts/${exportKey}`);
            const sanitizedExportedData = sanitizeContractData(exportedData);
            await set(exportedContractRef, sanitizedExportedData);
          }
        }

        toast.success("Thêm hợp đồng thành công!");
      }

      // Navigate back to contracts page with reload flag
      setTimeout(() => {
        navigate("/hop-dong", { state: { reload: true } });
      }, 500);
    } catch (err) {
      console.error("Error saving contract:", err);
      toast.error("Đã xảy ra lỗi khi lưu hợp đồng: " + err.message);
    }
  };

  return { handleSubmit };
}
