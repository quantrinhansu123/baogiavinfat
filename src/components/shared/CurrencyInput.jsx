import { useRef, useState } from 'react';

// Giới hạn tối đa: 100 tỷ VND
const MAX_VND = 100_000_000_000;

/**
 * CurrencyInput - Input component cho tiền tệ
 * - Tự động format với dấu phân cách hàng nghìn
 * - Hỗ trợ IME tiếng Việt (Unikey/EVKey)
 * - Giới hạn giá trị tối đa: 100 tỷ VND
 */
const CurrencyInput = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Nhập số tiền",
  className = "",
  ...props
}) => {
  const inputRef = useRef(null);
  const [isComposing, setIsComposing] = useState(false);
  const [tempValue, setTempValue] = useState('');

  // Format number với dấu phân cách hàng nghìn
  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === '' || val === 0) return '';
    const num = typeof val === 'string' ? val.replace(/[^\d]/g, '') : String(val);
    if (!num || num === '0') return '';
    return new Intl.NumberFormat('vi-VN').format(Number(num));
  };

  // Parse input để lấy số thuần (với giới hạn tối đa)
  const parseCurrency = (val) => {
    if (!val) return 0;
    const num = String(val).replace(/[^\d]/g, '');
    const parsed = num ? parseInt(num, 10) : 0;
    return Math.min(parsed, MAX_VND);
  };

  // Xử lý thay đổi
  const handleChange = (e) => {
    const inputValue = e.target.value;
    
    if (isComposing) {
      // Đang dùng IME - lưu tạm, không format
      setTempValue(inputValue);
      return;
    }
    
    // Không dùng IME - format ngay
    processAndFormat(inputValue);
  };

  // Xử lý và format giá trị
  const processAndFormat = (inputValue) => {
    const input = inputRef.current;
    const cursorPos = input?.selectionStart || 0;
    
    // Lọc chỉ giữ số
    const numericOnly = inputValue.replace(/[^\d]/g, '');
    const parsed = parseCurrency(numericOnly);
    
    // Gọi onChange
    if (onChange) {
      onChange(parsed);
    }
    
    // Tính vị trí cursor mới
    const charsBeforeCursor = inputValue.slice(0, cursorPos).replace(/[^\d]/g, '').length;
    const formatted = formatCurrency(parsed);
    
    let newCursorPos = 0;
    let digitCount = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        digitCount++;
        if (digitCount === charsBeforeCursor) {
          newCursorPos = i + 1;
          break;
        }
      }
    }
    if (digitCount < charsBeforeCursor) {
      newCursorPos = formatted.length;
    }
    
    setTimeout(() => {
      if (input) {
        input.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // IME bắt đầu (user đang gõ tiếng Việt)
  const handleCompositionStart = () => {
    setIsComposing(true);
    setTempValue(formatCurrency(value));
  };

  // IME kết thúc - xử lý và format
  const handleCompositionEnd = (e) => {
    setIsComposing(false);
    processAndFormat(e.target.value);
    setTempValue('');
  };

  // Khi focus - select all
  const handleFocus = (e) => {
    setTimeout(() => e.target.select(), 0);
  };

  // Khi blur - đảm bảo format đúng, kể cả đang composing (với clamp)
  const handleBlur = (e) => {
    if (isComposing) {
      setIsComposing(false);
      setTempValue('');
    }
    // Lấy giá trị hiện tại từ input và format lại
    const inputValue = e.target.value;
    const numericOnly = inputValue.replace(/[^\d]/g, '');
    const parsed = numericOnly ? Math.min(parseInt(numericOnly, 10), MAX_VND) : 0;
    if (onChange && parsed !== value) {
      onChange(parsed);
    }
  };

  // Hiển thị: nếu đang composing thì show tempValue, không thì show formatted
  const displayValue = isComposing ? tempValue : formatCurrency(value);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={displayValue}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
};

export default CurrencyInput;
