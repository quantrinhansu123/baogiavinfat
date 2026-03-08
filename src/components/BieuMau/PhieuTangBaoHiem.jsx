import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import {
  getBranchByShowroomName,
  getDefaultBranch,
} from "../../data/branchData";

const PhieuTangBaoHiem = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);

  // Editable fields
  const [soPhieu, setSoPhieu] = useState("");
  const [ngayBanHanh, setNgayBanHanh] = useState("");
  const [tenNguoiDeNghi, setTenNguoiDeNghi] = useState("");
  const [boPhan, setBoPhan] = useState("Kinh doanh – Tư vấn bán hàng");

  // Table rows (có thể có nhiều bảo hiểm)
  const [tableRows, setTableRows] = useState([
    {
      stt: "1",
      tenKhachHang: "",
      soKhung: "",
      loaiXe: "",
      tnds: "",
      vcx: "",
      donViBaoHiem: "",
    },
  ]);

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

      const branchInfo = showroomName ? getBranchByShowroomName(showroomName) : null;
      setBranch(branchInfo);

      // Set default date
      const today = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      setNgayBanHanh(
        `${pad(today.getDate())}/${pad(
          today.getMonth() + 1
        )}/${today.getFullYear()}`
      );

      // Get user info from localStorage
      const userName = localStorage.getItem("username") || "";
      setTenNguoiDeNghi(userName);

      if (location.state) {
        const stateData = location.state;
        setData(stateData);

        // Auto-fill first row
        const newRows = [...tableRows];
        newRows[0] = {
          stt: "1",
          tenKhachHang: stateData.customerName || stateData.tenKh || "",
          soKhung: stateData.soKhung || "",
          loaiXe: stateData.hieuxe || stateData.model || stateData.dongXe || "",
          tnds: "",
          vcx: "",
          donViBaoHiem: "",
        };
        setTableRows(newRows);
      } else {
        setData({
          customerName: "",
          soKhung: "",
          hieuxe: "",
        });
      }
      setLoading(false);
    };

    loadData();
  }, [location.state]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleRowChange = (index, field, value) => {
    const newRows = [...tableRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setTableRows(newRows);
  };

  const addRow = () => {
    setTableRows([
      ...tableRows,
      {
        stt: String(tableRows.length + 1),
        tenKhachHang: "",
        soKhung: "",
        loaiXe: "",
        tnds: "",
        vcx: "",
        donViBaoHiem: "",
      },
    ]);
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
      <div className="max-w-4xl mx-auto print:max-w-4xl print:mx-auto">
        <div
          ref={printableRef}
          className="flex-1 bg-white p-8 print:pt-0 flex flex-col min-h-screen print:min-h-[calc(100vh-40mm)]"
          id="printable-content"
        >
          {/* Header Table */}
          <div className="mb-6">
            <table className="w-full border-2 border-black">
              <tbody>
                <tr>
                  <td
                    className="border-r-2 border-black p-2 align-middle text-center font-bold text-xs"
                    style={{ width: "30%" }}
                  >
                    CHI NHÁNH TRƯỜNG
                    <br />
                    CHINH-CÔNG TY CỔ
                    <br />
                    PHẦN ĐẦU TƯ TMDV Ô<br />
                    TÔ ĐÔNG SÀI GÒN
                  </td>
                  <td
                    className="border-r-2 border-black p-2 align-middle text-center"
                    style={{ width: "40%" }}
                  >
                    <h1 className="font-bold text-lg">PHIẾU ĐỀ NGHỊ</h1>
                    <p className="font-bold text-base mt-1">TẶNG BẢO HIỂM</p>
                  </td>
                  <td
                    className="p-2 align-middle text-sm"
                    style={{ width: "30%" }}
                  >
                    <div className="mb-2">
                      <span>Số: </span>
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={soPhieu}
                          onChange={(e) => setSoPhieu(e.target.value)}
                          className="border-b border-gray-400 px-1 w-20 focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{soPhieu}</span>
                    </div>
                    <div>
                      <span>Ngày ban hành: </span>
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={ngayBanHanh}
                          onChange={(e) => setNgayBanHanh(e.target.value)}
                          className="border-b border-gray-400 px-1 w-24 focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{ngayBanHanh}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <p className="text-sm">
              Về việc :{" "}
              <strong className="text-red-600">ĐỀ NGHỊ TẶNG BẢO HIỂM</strong>
            </p>
          </div>

          {/* Kính gửi */}
          <div className="text-sm space-y-2 mb-4">
            <p className="italic">
              <strong>Kính gửi:</strong> - <strong>Ban Giám đốc;</strong>
            </p>
            <p className="ml-16 italic">
              - <strong>Phòng Tài chính - Kế toán.</strong>
            </p>
          </div>

          {/* Main content */}
          <div className="text-sm space-y-2 mb-4">
            <p className="ml-8">
              - Kính đề nghị Ban Giám đốc duyệt tặng Bảo hiểm
            </p>
            <p>Tên người đề nghị:</p>
            <p>
              Bộ phận:{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={boPhan}
                  onChange={(e) => setBoPhan(e.target.value)}
                  className="border-b border-gray-400 px-2 py-1 text-sm w-64 focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{boPhan}</span>
            </p>
            <p>Đề nghị tặng bảo hiểm theo nội dung sau đây:</p>
          </div>

          {/* Table */}
          <div className="mb-6">
            <table className="w-full border-2 border-black text-xs">
              <thead>
                <tr className="border-b-2 border-black">
                  <th
                    className="border-r border-black p-2 font-bold text-center"
                    style={{ width: "5%" }}
                  >
                    STT
                  </th>
                  <th
                    className="border-r border-black p-2 font-bold text-center"
                    style={{ width: "20%" }}
                  >
                    Tên khách
                    <br />
                    hàng
                  </th>
                  <th
                    className="border-r border-black p-2 font-bold text-center"
                    style={{ width: "20%" }}
                  >
                    Số khung
                  </th>
                  <th
                    className="border-r border-black p-2 font-bold text-center"
                    style={{ width: "15%" }}
                  >
                    Loại xe
                  </th>
                  <th
                    className="border-r border-black p-2 font-bold text-center"
                    colSpan={2}
                  >
                    Loại Bảo hiểm
                  </th>
                  <th
                    className="p-2 font-bold text-center"
                    style={{ width: "15%" }}
                  >
                    Đơn vị Bảo
                    <br />
                    hiểm
                  </th>
                </tr>
                <tr className="border-b border-black">
                  <th className="border-r border-black p-1"></th>
                  <th className="border-r border-black p-1"></th>
                  <th className="border-r border-black p-1"></th>
                  <th className="border-r border-black p-1"></th>
                  <th
                    className="border-r border-black p-1 text-center font-bold"
                    style={{ width: "10%" }}
                  >
                    TNDS
                  </th>
                  <th
                    className="border-r border-black p-1 text-center font-bold"
                    style={{ width: "10%" }}
                  >
                    VCX
                  </th>
                  <th className="p-1"></th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, index) => (
                  <tr key={index} className="border-b border-black">
                    <td className="border-r border-black p-2 text-center">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={row.stt}
                          onChange={(e) =>
                            handleRowChange(index, "stt", e.target.value)
                          }
                          className="border-b border-gray-400 px-1 w-full text-center focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{row.stt}</span>
                    </td>
                    <td className="border-r border-black p-2">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={row.tenKhachHang}
                          onChange={(e) =>
                            handleRowChange(
                              index,
                              "tenKhachHang",
                              e.target.value
                            )
                          }
                          className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">
                        {row.tenKhachHang}
                      </span>
                    </td>
                    <td className="border-r border-black p-2">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={row.soKhung}
                          onChange={(e) =>
                            handleRowChange(index, "soKhung", e.target.value)
                          }
                          className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{row.soKhung}</span>
                    </td>
                    <td className="border-r border-black p-2">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={row.loaiXe}
                          onChange={(e) =>
                            handleRowChange(index, "loaiXe", e.target.value)
                          }
                          className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{row.loaiXe}</span>
                    </td>
                    <td className="border-r border-black p-2 text-center">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={row.tnds}
                          onChange={(e) =>
                            handleRowChange(index, "tnds", e.target.value)
                          }
                          className="border-b border-gray-400 px-1 w-full text-center focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{row.tnds}</span>
                    </td>
                    <td className="border-r border-black p-2 text-center">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={row.vcx}
                          onChange={(e) =>
                            handleRowChange(index, "vcx", e.target.value)
                          }
                          className="border-b border-gray-400 px-1 w-full text-center focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{row.vcx}</span>
                    </td>
                    <td className="p-2">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={row.donViBaoHiem}
                          onChange={(e) =>
                            handleRowChange(
                              index,
                              "donViBaoHiem",
                              e.target.value
                            )
                          }
                          className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">
                        {row.donViBaoHiem}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add row button */}
            <button
              onClick={addRow}
              className="mt-2 px-4 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 print:hidden"
            >
              + Thêm dòng
            </button>
          </div>

          {/* Signature Section */}
          <div className="mt-12">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="text-center font-bold p-4 w-1/3">
                    <p className="mb-20">GIÁM ĐỐC</p>
                  </td>
                  <td className="text-center font-bold p-4 w-1/3">
                    <p className="mb-20">TRƯỞNG BỘ PHẬN</p>
                  </td>
                  <td className="text-center font-bold p-4 w-1/3">
                    <p className="mb-20">NGƯỜI ĐỀ NGHỊ</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-auto text-right text-sm italic">
            <p>VinFast Đông Sài Gòn</p>
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
          In Phiếu
        </button>
      </div>

      <style>{`
        @media print {
          @page {
            margin: 5mm 20mm 5mm 20mm;
          }

          body * {
            visibility: hidden;
          }

          #printable-content,
          #printable-content * {
            visibility: visible;
          }

          #printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            min-height: calc(100vh - 10mm);
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            font-family: 'Times New Roman', Times, serif !important;
            display: flex !important;
            flex-direction: column !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: hidden !important;
            font-family: 'Times New Roman', Times, serif !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PhieuTangBaoHiem;
