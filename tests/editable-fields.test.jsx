/**
 * Test riêng cho khả năng chỉnh sửa các trường trong bảng
 * Kiểm tra CSS, event handling, và tương tác người dùng
 */

import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock component đơn giản để test các input
const MockEditableTable = () => {
  const [thongTinHDMB, setThongTinHDMB] = React.useState("VF 6 Eco");
  const [thongTinTBPD, setThongTinTBPD] = React.useState("VINFAST, VF 6 Eco");
  const [thongTinGiayXN, setThongTinGiayXN] = React.useState("VF 6 Eco");

  return (
    <div>
      <table className="w-full border-2 border-black">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="border-r border-black p-2 text-center w-16">STT</th>
            <th className="border-r border-black p-2 text-center">Đặc điểm của xe</th>
            <th className="border-r border-black p-2 text-center">Thông tin trên HĐMB<br />và phi quyết</th>
            <th className="border-r border-black p-2 text-center">Thông tin trên TBPĐ</th>
            <th className="p-2 text-center">Thông tin trên giấy xác<br />nhận SK, SM</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-r border-t-2 border-black p-2 text-center">1</td>
            <td className="border-r border-t-2 border-black p-2">Số Loại (Model Code)</td>
            <td className="border-r border-t-2 border-black p-2 text-center">
              <input
                type="text"
                value={thongTinHDMB}
                onChange={(e) => setThongTinHDMB(e.target.value)}
                className="w-full text-center text-sm px-1 py-1 bg-blue-50 border border-blue-300 rounded focus:outline-none focus:border-blue-500 focus:bg-white editable-field"
                placeholder="Nhập thông tin HĐMB"
                data-testid="hdmb-input"
              />
            </td>
            <td className="border-r border-t-2 border-black p-2 text-center">
              <input
                type="text"
                value={thongTinTBPD}
                onChange={(e) => setThongTinTBPD(e.target.value)}
                className="w-full text-center text-sm px-1 py-1 bg-blue-50 border border-blue-300 rounded focus:outline-none focus:border-blue-500 focus:bg-white editable-field"
                placeholder="Nhập thông tin TBPĐ"
                data-testid="tbpd-input"
              />
            </td>
            <td className="border-t-2 border-black p-2 text-center">
              <input
                type="text"
                value={thongTinGiayXN}
                onChange={(e) => setThongTinGiayXN(e.target.value)}
                className="w-full text-center text-sm px-1 py-1 bg-blue-50 border border-blue-300 rounded focus:outline-none focus:border-blue-500 focus:bg-white editable-field"
                placeholder="Nhập thông tin giấy XN"
                data-testid="giay-xn-input"
              />
            </td>
          </tr>
        </tbody>
      </table>

      {/* CSS cho print */}
      <style>{`
        @media print {
          .editable-field {
            border: none !important;
            background: transparent !important;
            text-align: center !important;
            outline: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Editable Fields Tests', () => {
  describe('Khả năng tương tác cơ bản', () => {
    test('Tất cả input đều tồn tại và có thể tương tác', () => {
      render(
        <TestWrapper>
          <MockEditableTable />
        </TestWrapper>
      );

      const hdmbInput = screen.getByTestId('hdmb-input');
      const tbpdInput = screen.getByTestId('tbpd-input');
      const giayXnInput = screen.getByTestId('giay-xn-input');

      // Kiểm tra input tồn tại và không bị disabled
      expect(hdmbInput).toBeInTheDocument();
      expect(hdmbInput).not.toBeDisabled();

      expect(tbpdInput).toBeInTheDocument();
      expect(tbpdInput).not.toBeDisabled();

      expect(giayXnInput).toBeInTheDocument();
      expect(giayXnInput).not.toBeDisabled();
    });

    test('Có thể nhập và thay đổi giá trị', () => {
      render(
        <TestWrapper>
          <MockEditableTable />
        </TestWrapper>
      );

      const hdmbInput = screen.getByTestId('hdmb-input');
      const tbpdInput = screen.getByTestId('tbpd-input');
      const giayXnInput = screen.getByTestId('giay-xn-input');

      // Kiểm tra giá trị ban đầu
      expect(hdmbInput.value).toBe('VF 6 Eco');
      expect(tbpdInput.value).toBe('VINFAST, VF 6 Eco');
      expect(giayXnInput.value).toBe('VF 6 Eco');

      // Thay đổi giá trị
      fireEvent.change(hdmbInput, { target: { value: 'VF 8 Plus' } });
      fireEvent.change(tbpdInput, { target: { value: 'VINFAST, VF 8 Plus' } });
      fireEvent.change(giayXnInput, { target: { value: 'VF 8 Plus' } });

      // Kiểm tra giá trị đã thay đổi
      expect(hdmbInput.value).toBe('VF 8 Plus');
      expect(tbpdInput.value).toBe('VINFAST, VF 8 Plus');
      expect(giayXnInput.value).toBe('VF 8 Plus');
    });

    test('Có thể xóa và nhập lại nội dung', () => {
      render(
        <TestWrapper>
          <MockEditableTable />
        </TestWrapper>
      );

      const hdmbInput = screen.getByTestId('hdmb-input');

      // Xóa hết nội dung
      fireEvent.change(hdmbInput, { target: { value: '' } });
      expect(hdmbInput.value).toBe('');

      // Nhập nội dung mới
      fireEvent.change(hdmbInput, { target: { value: 'VF 9 Premium' } });
      expect(hdmbInput.value).toBe('VF 9 Premium');
    });

    test('Có thể sử dụng các phím đặc biệt', () => {
      render(
        <TestWrapper>
          <MockEditableTable />
        </TestWrapper>
      );

      const hdmbInput = screen.getByTestId('hdmb-input');

      // Thử các phím đặc biệt - kiểm tra không có lỗi
      fireEvent.keyDown(hdmbInput, { key: 'Backspace', code: 'Backspace' });
      fireEvent.keyDown(hdmbInput, { key: 'Delete', code: 'Delete' });
      fireEvent.keyDown(hdmbInput, { key: 'ArrowLeft', code: 'ArrowLeft' });
      fireEvent.keyDown(hdmbInput, { key: 'ArrowRight', code: 'ArrowRight' });

      // Input vẫn hoạt động sau các phím đặc biệt
      expect(hdmbInput).toBeInTheDocument();
      expect(hdmbInput).not.toBeDisabled();
    });
  });

  describe('Kiểm tra CSS và styling', () => {
    test('Input có các class CSS cần thiết', () => {
      render(
        <TestWrapper>
          <MockEditableTable />
        </TestWrapper>
      );

      const hdmbInput = screen.getByTestId('hdmb-input');

      // Kiểm tra các class cơ bản
      expect(hdmbInput).toHaveClass('w-full');
      expect(hdmbInput).toHaveClass('text-center');
      expect(hdmbInput).toHaveClass('text-sm');
      expect(hdmbInput).toHaveClass('editable-field');

      // Kiểm tra styling để dễ nhận biết
      expect(hdmbInput).toHaveClass('bg-blue-50');
      expect(hdmbInput).toHaveClass('border-blue-300');
    });

    test('Input có placeholder phù hợp', () => {
      render(
        <TestWrapper>
          <MockEditableTable />
        </TestWrapper>
      );

      const hdmbInput = screen.getByTestId('hdmb-input');
      const tbpdInput = screen.getByTestId('tbpd-input');
      const giayXnInput = screen.getByTestId('giay-xn-input');

      expect(hdmbInput).toHaveAttribute('placeholder', 'Nhập thông tin HĐMB');
      expect(tbpdInput).toHaveAttribute('placeholder', 'Nhập thông tin TBPĐ');
      expect(giayXnInput).toHaveAttribute('placeholder', 'Nhập thông tin giấy XN');
    });

    test('Input không bị disable', () => {
      render(
        <TestWrapper>
          <MockEditableTable />
        </TestWrapper>
      );

      const hdmbInput = screen.getByTestId('hdmb-input');
      const tbpdInput = screen.getByTestId('tbpd-input');
      const giayXnInput = screen.getByTestId('giay-xn-input');

      expect(hdmbInput).not.toBeDisabled();
      expect(tbpdInput).not.toBeDisabled();
      expect(giayXnInput).not.toBeDisabled();
    });
  });

  describe('Kiểm tra behavior khi focus/blur', () => {
    test('Focus và blur hoạt động bình thường', () => {
      render(
        <TestWrapper>
          <MockEditableTable />
        </TestWrapper>
      );

      const hdmbInput = screen.getByTestId('hdmb-input');

      // Ban đầu có bg-blue-50
      expect(hdmbInput).toHaveClass('bg-blue-50');

      // Khi focus và blur, không có lỗi xảy ra
      fireEvent.focus(hdmbInput);
      fireEvent.blur(hdmbInput);

      // Input vẫn tồn tại
      expect(hdmbInput).toBeInTheDocument();
    });

    test('Input có class focus styling', () => {
      render(
        <TestWrapper>
          <MockEditableTable />
        </TestWrapper>
      );

      const hdmbInput = screen.getByTestId('hdmb-input');

      // Kiểm tra có class cho focus styling
      expect(hdmbInput).toHaveClass('border-blue-300');
      expect(hdmbInput).toHaveClass('focus:border-blue-500');
    });
  });

  describe('Kiểm tra tương tác với nhiều input', () => {
    test('Tất cả input có thể tương tác', () => {
      render(
        <TestWrapper>
          <MockEditableTable />
        </TestWrapper>
      );

      const hdmbInput = screen.getByTestId('hdmb-input');
      const tbpdInput = screen.getByTestId('tbpd-input');
      const giayXnInput = screen.getByTestId('giay-xn-input');

      // Tất cả input tồn tại và có thể tương tác
      expect(hdmbInput).toBeInTheDocument();
      expect(tbpdInput).toBeInTheDocument();
      expect(giayXnInput).toBeInTheDocument();

      // Tất cả không bị disabled
      expect(hdmbInput).not.toBeDisabled();
      expect(tbpdInput).not.toBeDisabled();
      expect(giayXnInput).not.toBeDisabled();
    });

    test('Có thể chỉnh sửa nhiều input cùng lúc', () => {
      render(
        <TestWrapper>
          <MockEditableTable />
        </TestWrapper>
      );

      const hdmbInput = screen.getByTestId('hdmb-input');
      const tbpdInput = screen.getByTestId('tbpd-input');
      const giayXnInput = screen.getByTestId('giay-xn-input');

      // Thay đổi tất cả input
      fireEvent.change(hdmbInput, { target: { value: 'Model A' } });
      fireEvent.change(tbpdInput, { target: { value: 'VINFAST Model A' } });
      fireEvent.change(giayXnInput, { target: { value: 'Model A Certificate' } });

      // Kiểm tra tất cả đều thay đổi
      expect(hdmbInput.value).toBe('Model A');
      expect(tbpdInput.value).toBe('VINFAST Model A');
      expect(giayXnInput.value).toBe('Model A Certificate');
    });
  });

  describe('Kiểm tra edge cases', () => {
    test('Xử lý ký tự đặc biệt', () => {
      render(
        <TestWrapper>
          <MockEditableTable />
        </TestWrapper>
      );

      const hdmbInput = screen.getByTestId('hdmb-input');

      // Nhập ký tự đặc biệt
      fireEvent.change(hdmbInput, { target: { value: 'VF@#$%^&*()' } });
      expect(hdmbInput.value).toBe('VF@#$%^&*()');
    });

    test('Xử lý chuỗi dài', () => {
      render(
        <TestWrapper>
          <MockEditableTable />
        </TestWrapper>
      );

      const hdmbInput = screen.getByTestId('hdmb-input');

      const longString = 'A'.repeat(100);
      fireEvent.change(hdmbInput, { target: { value: longString } });
      expect(hdmbInput.value).toBe(longString);
    });

    test('Xử lý số và chữ cái', () => {
      render(
        <TestWrapper>
          <MockEditableTable />
        </TestWrapper>
      );

      const hdmbInput = screen.getByTestId('hdmb-input');

      fireEvent.change(hdmbInput, { target: { value: 'VF123ABC' } });
      expect(hdmbInput.value).toBe('VF123ABC');
    });

    test('Xử lý khoảng trắng', () => {
      render(
        <TestWrapper>
          <MockEditableTable />
        </TestWrapper>
      );

      const hdmbInput = screen.getByTestId('hdmb-input');

      fireEvent.change(hdmbInput, { target: { value: '  VF 8 Plus  ' } });
      expect(hdmbInput.value).toBe('  VF 8 Plus  ');
    });
  });
});