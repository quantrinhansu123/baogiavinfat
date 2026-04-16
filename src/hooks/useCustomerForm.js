import { useState } from 'react';
import { ref, push, update, remove } from 'firebase/database';
import { database } from '../firebase/config';
import { toast } from 'react-toastify';
import { uniqueNgoaiThatColors, uniqueNoiThatColors } from '../data/calculatorData';
import { provinces } from '../data/provincesData';

const normalizeDateInputValue = (value) => {
  if (!value) return '';
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  const str = String(value).trim();
  if (!str) return '';

  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      if (day && month && year) {
        const dd = day.padStart(2, '0');
        const mm = month.padStart(2, '0');
        const yyyy = year.length === 2 ? `20${year}` : year.padStart(4, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }
  }

  return str;
};

const getColorName = (colorCode, isExterior = true) => {
  if (!colorCode) return colorCode || "-";
  const colorList = isExterior ? uniqueNgoaiThatColors : uniqueNoiThatColors;
  const found = colorList.find(
    (color) => color.code === colorCode || color.name.toLowerCase() === colorCode.toLowerCase()
  );
  return found ? found.name : colorCode;
};

const extractProvince = (address, showroom) => {
  if (!address && !showroom) return '';

  const showroomText = typeof showroom === 'string' ? showroom : String(showroom || '');
  const addressText = typeof address === 'string' ? address : String(address || '');
  const searchText = (addressText || showroomText).toLowerCase();

  for (const province of provinces) {
    if (searchText.includes(province.toLowerCase())) {
      return province;
    }
  }

  if (showroomText) {
    if (showroomText.includes('Hà Nội') || showroomText.includes('Hanoi')) return 'Thành phố Hà Nội';
    if (showroomText.includes('Hồ Chí Minh') || showroomText.includes('Ho Chi Minh') || showroomText.includes('TP.HCM')) return 'Thành phố Hồ Chí Minh';
    if (showroomText.includes('Đà Nẵng')) return 'Thành phố Đà Nẵng';
    if (showroomText.includes('Hải Phòng')) return 'Thành phố Hải Phòng';
    if (showroomText.includes('Cần Thơ')) return 'Thành phố Cần Thơ';
  }

  return '';
};

export function useCustomerForm(employees, contracts, reloadCustomers) {
  const [formData, setFormData] = useState({
    ngay: new Date().toISOString().split('T')[0],
    tenKhachHang: '',
    soDienThoai: '',
    khachHangLa: '',
    tinhThanh: '',
    dongXe: '',
    phienBan: '',
    mauSac: '',
    noiThat: '',
    nhuCau: '',
    thanhToan: '',
    nguon: 'Hợp đồng',
    mucDo: '',
    tinhTrang: '',
    noiDung: '',
    selectedContractId: '',
    tvbh: '',
    msdn: '',
    daiDien: '',
    chucVu: '',
    giayUyQuyen: '',
    giayUyQuyenNgay: '',
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const getTVBHFromUserEmail = () => {
    const userEmail = localStorage.getItem('userEmail') || '';
    if (!userEmail) return '';

    const employee = employees.find(emp =>
      emp.email && emp.email.toLowerCase() === userEmail.toLowerCase()
    );

    return employee ? employee.TVBH : '';
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value,
      };

      if (field === 'khachHangLa' && value !== 'Công ty') {
        updated.msdn = '';
        updated.daiDien = '';
        updated.chucVu = '';
        updated.giayUyQuyen = '';
        updated.giayUyQuyenNgay = '';
      }

      return updated;
    });
  };

  const handleContractSelect = (contractId) => {
    const selectedContract = contracts.find(c => c.firebaseKey === contractId || c.id === contractId);
    if (selectedContract) {
      const province = extractProvince(selectedContract.address, selectedContract.showroom);
      const colorName = getColorName(selectedContract.ngoaiThat, true);
      const interiorColorName = getColorName(selectedContract.noiThat, false);
      const hasTaxCode = Boolean(selectedContract.taxCode || selectedContract.MSDN || selectedContract.taxCodeOrg);
      const inferredType = selectedContract.khachHangLa || (hasTaxCode ? 'Công ty' : 'Cá nhân');

      setFormData(prev => {
        const updated = {
          ...prev,
          selectedContractId: contractId,
          tenKhachHang: selectedContract.customerName || '',
          soDienThoai: selectedContract.phone || '',
          tinhThanh: province,
          dongXe: selectedContract.dongXe || '',
          phienBan: selectedContract.phienBan || '',
          mauSac: colorName,
          noiThat: interiorColorName,
          thanhToan: selectedContract.thanhToan || '',
          tvbh: selectedContract.tvbh || '',
          khachHangLa: inferredType,
        };

        if (inferredType === 'Công ty') {
          updated.msdn = selectedContract.taxCode || selectedContract.MSDN || selectedContract.taxCodeOrg || prev.msdn || '';
          updated.daiDien = selectedContract.representative || prev.daiDien || '';
          updated.chucVu = selectedContract.position || prev.chucVu || '';
        } else {
          updated.msdn = '';
          updated.daiDien = '';
          updated.chucVu = '';
          updated.giayUyQuyen = '';
          updated.giayUyQuyenNgay = '';
        }

        return updated;
      });
    }
  };

  const resetForm = () => {
    setFormData({
      ngay: new Date().toISOString().split('T')[0],
      tenKhachHang: '',
      soDienThoai: '',
      khachHangLa: '',
      tinhThanh: '',
      dongXe: '',
      phienBan: '',
      mauSac: '',
      noiThat: '',
      nhuCau: '',
      thanhToan: '',
      nguon: 'Hợp đồng',
      mucDo: '',
      tinhTrang: '',
      noiDung: '',
      selectedContractId: '',
      tvbh: '',
      msdn: '',
      daiDien: '',
      chucVu: '',
      giayUyQuyen: '',
      giayUyQuyenNgay: '',
    });
  };

  const openAddModal = () => {
    const tvbh = getTVBHFromUserEmail();
    resetForm();
    setFormData(prev => ({ ...prev, tvbh }));
    setIsAddModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      ngay: customer.ngay || new Date().toISOString().split('T')[0],
      tenKhachHang: customer.tenKhachHang || '',
      soDienThoai: customer.soDienThoai || '',
      khachHangLa: customer.khachHangLa || '',
      tinhThanh: customer.tinhThanh || '',
      dongXe: customer.dongXe || '',
      phienBan: customer.phienBan || '',
      mauSac: customer.mauSac || '',
      noiThat: customer.noiThat || '',
      nhuCau: customer.nhuCau || '',
      thanhToan: customer.thanhToan || '',
      nguon: customer.nguon || 'Hợp đồng',
      mucDo: customer.mucDo || '',
      tinhTrang: customer.tinhTrang || '',
      noiDung: customer.noiDung || '',
      selectedContractId: customer.selectedContractId || '',
      tvbh: customer.tvbh || '',
      msdn: customer.msdn || '',
      daiDien: customer.daiDien || '',
      chucVu: customer.chucVu || '',
      giayUyQuyen: customer.giayUyQuyen || '',
      giayUyQuyenNgay: normalizeDateInputValue(customer.giayUyQuyenNgay || ''),
    });
    setIsEditModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSave = async (allCustomers) => {
    if (!formData.tenKhachHang || !formData.soDienThoai) {
      toast.error('Vui lòng điền tên khách hàng và số điện thoại!');
      return;
    }

    try {
      const isCompany = formData.khachHangLa === 'Công ty';
      const customerData = {
        ngay: formData.ngay,
        tenKhachHang: formData.tenKhachHang,
        soDienThoai: formData.soDienThoai,
        khachHangLa: formData.khachHangLa || '',
        tinhThanh: formData.tinhThanh,
        dongXe: formData.dongXe,
        phienBan: formData.phienBan,
        mauSac: formData.mauSac,
        noiThat: formData.noiThat,
        nhuCau: formData.nhuCau || '',
        thanhToan: formData.thanhToan,
        nguon: formData.nguon || 'Hợp đồng',
        mucDo: formData.mucDo || '',
        tinhTrang: formData.tinhTrang || '',
        noiDung: formData.noiDung || '',
        selectedContractId: formData.selectedContractId || '',
        tvbh: formData.tvbh || '',
      };

      if (isCompany) {
        customerData.msdn = formData.msdn || '';
        customerData.daiDien = formData.daiDien || '';
        customerData.chucVu = formData.chucVu || '';
        customerData.giayUyQuyen = formData.giayUyQuyen || '';
        customerData.giayUyQuyenNgay = formData.giayUyQuyenNgay || '';
      } else {
        customerData.msdn = '';
        customerData.daiDien = '';
        customerData.chucVu = '';
        customerData.giayUyQuyen = '';
        customerData.giayUyQuyenNgay = '';
      }

      if (isEditModalOpen && editingCustomer) {
        const customerRef = ref(database, `customers/${editingCustomer.firebaseKey}`);
        await update(customerRef, {
          ...customerData,
          stt: editingCustomer.stt,
        });
        toast.success('Cập nhật khách hàng thành công!');
        closeEditModal();
      } else {
        const maxStt = allCustomers.length > 0 ? Math.max(...allCustomers.map(c => c.stt || 0)) : 0;
        const customerRef = ref(database, 'customers');
        await push(customerRef, {
          ...customerData,
          stt: maxStt + 1,
        });
        toast.success('Thêm khách hàng thành công!');
        closeAddModal();
      }

      await reloadCustomers();
    } catch (err) {
      console.error('Error saving customer:', err);
      toast.error('Lỗi khi lưu khách hàng: ' + err.message);
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${customer.tenKhachHang}"?`)) {
      return;
    }

    try {
      const customerRef = ref(database, `customers/${customer.firebaseKey}`);
      await remove(customerRef);
      toast.success('Xóa khách hàng thành công!');
      await reloadCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast.error('Lỗi khi xóa khách hàng: ' + err.message);
    }
  };

  return {
    formData,
    setFormData,
    isAddModalOpen,
    isEditModalOpen,
    editingCustomer,
    handleInputChange,
    handleContractSelect,
    openAddModal,
    openEditModal,
    closeAddModal,
    closeEditModal,
    handleSave,
    handleDelete,
  };
}
