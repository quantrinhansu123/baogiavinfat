import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import vinfastLogo from "../../assets/vinfast.svg";
import { downloadElementAsPdf } from "../../utils/pdfExport";

const PhieuDeNghiLapPhuKien = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const printableRef = useRef(null);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form fields
    const [tenNguoiDeNghi, setTenNguoiDeNghi] = useState("");
    const [phong, setPhong] = useState("");
    const [deNghiLapPhuKienXe, setDeNghiLapPhuKienXe] = useState("");
    const [bienSoSoKhung, setBienSoSoKhung] = useState("");

    // Table data - 12 rows
    const [rows, setRows] = useState(
        Array(12).fill().map((_, index) => ({
            stt: index + 1,
            tenPhuKien: "",
            giaBanTang: "",
            ghiChu: ""
        }))
    );

    const [tong, setTong] = useState("");

    useEffect(() => {
        const loadData = async () => {
            if (location.state) {
                const stateData = location.state;

                // Auto-fill logic
                if (stateData.customerName || stateData.tenKh) {
                    setTenNguoiDeNghi(stateData.customerName || stateData.tenKh);
                }

                // Auto-fill car info
                const carModel = stateData.hieuxe || stateData.dongXe || stateData.model;
                if (carModel) {
                    setDeNghiLapPhuKienXe(carModel);
                }

                if (stateData.soKhung) {
                    setBienSoSoKhung(stateData.soKhung);
                }

                // Auto-fill accessories from quaTang
                const quaTang = stateData.quaTang || stateData["Quà tặng"] || "";
                if (quaTang) {
                    // Split by comma or semicolon and populate rows
                    const items = quaTang.split(/[,;]/).map(item => item.trim()).filter(item => item);
                    if (items.length > 0) {
                        setRows(prev => {
                            const newRows = [...prev];
                            items.forEach((item, index) => {
                                if (index < newRows.length) {
                                    newRows[index] = {
                                        stt: index + 1,
                                        tenPhuKien: item,
                                        giaBanTang: "Tặng",
                                        ghiChu: ""
                                    };
                                }
                            });
                            return newRows;
                        });
                    }
                }
            }
            setLoading(false);
        };

        loadData();
    }, [location.state]);

    const handleRowChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8" style={{ fontFamily: "Times New Roman" }}>
            <div className="max-w-4xl mx-auto print:max-w-4xl print:mx-auto">
                <div className="bg-white p-8 print:p-0 min-h-screen print:min-h-0" id="printable-content">

                    {/* Header */}
                    <div className="flex items-center mb-8">
                        <div className="w-48">
                            <img src={vinfastLogo} alt="VinFast Logo" className="w-full" />
                        </div>
                        <div className="flex-1 text-center">
                            <h1 className="text-2xl font-bold uppercase">PHIẾU ĐỀ NGHỊ LẮP PHỤ KIỆN</h1>
                        </div>
                    </div>

                    {/* Info Fields */}
                    <div className="mb-6 space-y-2 text-base">
                        <div className="flex items-center">
                            <span className="font-bold w-48">Tên người đề nghị:</span>
                            <span className="flex-1 print:hidden">
                                <input
                                    type="text"
                                    value={tenNguoiDeNghi}
                                    onChange={(e) => setTenNguoiDeNghi(e.target.value)}
                                    className="w-full border-b border-gray-300 focus:outline-none focus:border-blue-500 px-2"
                                />
                            </span>
                            <span className="flex-1 hidden print:inline border-b border-dotted border-gray-400">{tenNguoiDeNghi}</span>
                        </div>

                        <div className="flex items-center">
                            <span className="font-bold w-48">Phòng:</span>
                            <span className="flex-1 print:hidden">
                                <input
                                    type="text"
                                    value={phong}
                                    onChange={(e) => setPhong(e.target.value)}
                                    className="w-full border-b border-gray-300 focus:outline-none focus:border-blue-500 px-2"
                                />
                            </span>
                            <span className="flex-1 hidden print:inline border-b border-dotted border-gray-400">{phong}</span>
                        </div>

                        <div className="flex items-center">
                            <span className="font-bold w-48">Đề nghị lắp phụ kiện xe:</span>
                            <span className="flex-1 print:hidden">
                                <input
                                    type="text"
                                    value={deNghiLapPhuKienXe}
                                    onChange={(e) => setDeNghiLapPhuKienXe(e.target.value)}
                                    className="w-full border-b border-gray-300 focus:outline-none focus:border-blue-500 px-2"
                                />
                            </span>
                            <span className="flex-1 hidden print:inline border-b border-dotted border-gray-400">{deNghiLapPhuKienXe}</span>
                        </div>

                        <div className="flex items-center">
                            <span className="font-bold w-48">Biển số (Số khung):</span>
                            <span className="flex-1 print:hidden">
                                <input
                                    type="text"
                                    value={bienSoSoKhung}
                                    onChange={(e) => setBienSoSoKhung(e.target.value)}
                                    className="w-full border-b border-gray-300 focus:outline-none focus:border-blue-500 px-2"
                                />
                            </span>
                            <span className="flex-1 hidden print:inline border-b border-dotted border-gray-400">{bienSoSoKhung}</span>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mb-8">
                        <table className="w-full border-collapse border border-black">
                            <thead>
                                <tr className="bg-gray-50 print:bg-transparent">
                                    <th className="border border-black p-2 w-16 text-center">Stt</th>
                                    <th className="border border-black p-2 text-center">Tên phụ kiện</th>
                                    <th className="border border-black p-2 w-48 text-center">Giá bán/Tặng</th>
                                    <th className="border border-black p-2 w-48 text-center">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr key={index}>
                                        <td className="border border-black p-2 text-center">{row.stt}</td>
                                        <td className="border border-black p-1">
                                            <input
                                                type="text"
                                                value={row.tenPhuKien}
                                                onChange={(e) => handleRowChange(index, 'tenPhuKien', e.target.value)}
                                                className="w-full h-full focus:outline-none print:hidden bg-transparent"
                                            />
                                            <span className="hidden print:block min-h-[1.5em]">{row.tenPhuKien}</span>
                                        </td>
                                        <td className="border border-black p-1">
                                            <input
                                                type="text"
                                                value={row.giaBanTang}
                                                onChange={(e) => handleRowChange(index, 'giaBanTang', e.target.value)}
                                                className="w-full h-full focus:outline-none print:hidden bg-transparent text-center"
                                            />
                                            <span className="hidden print:block min-h-[1.5em] text-center">{row.giaBanTang}</span>
                                        </td>
                                        <td className="border border-black p-1">
                                            <input
                                                type="text"
                                                value={row.ghiChu}
                                                onChange={(e) => handleRowChange(index, 'ghiChu', e.target.value)}
                                                className="w-full h-full focus:outline-none print:hidden bg-transparent"
                                            />
                                            <span className="hidden print:block min-h-[1.5em]">{row.ghiChu}</span>
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <td colSpan="2" className="border border-black p-2 font-bold text-center">Tổng</td>
                                    <td className="border border-black p-1">
                                        <input
                                            type="text"
                                            value={tong}
                                            onChange={(e) => setTong(e.target.value)}
                                            className="w-full h-full focus:outline-none print:hidden bg-transparent text-center font-bold"
                                        />
                                        <span className="hidden print:block min-h-[1.5em] text-center font-bold">{tong}</span>
                                    </td>
                                    <td className="border border-black p-2"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Signatures */}
                    <div className="flex justify-between mt-12 mb-24">
                        <div className="text-center w-1/3">
                            <p className="font-bold uppercase mb-24">TỔNG GIÁM ĐỐC</p>
                        </div>
                        <div className="text-center w-1/3">
                            <p className="font-bold uppercase mb-24">TRƯỞNG BỘ PHẬN</p>
                        </div>
                        <div className="text-center w-1/3">
                            <p className="font-bold uppercase mb-24">NGƯỜI ĐỀ NGHỊ</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Action Buttons */}
            <div className="text-center mt-8 print:hidden flex flex-wrap justify-center gap-3 pb-8">
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
                <button
                    onClick={() => { setDownloadingPdf(true); downloadElementAsPdf(printableRef.current, "phieu-de-nghi-lap-phu-kien").then(() => setDownloadingPdf(false)).catch(() => setDownloadingPdf(false)); }}
                    disabled={downloadingPdf}
                    className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {downloadingPdf ? "Đang tạo PDF..." : "Tải PDF"}
                </button>
            </div>

            <style>{`
        @media print {
          @page {
            size: A4;
            margin: 8mm;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: 297mm !important;
            overflow: hidden !important;
          }

          body * {
            visibility: hidden;
          }

          #printable-content,
          #printable-content * {
            visibility: visible;
          }

          .min-h-screen {
            min-height: 0 !important;
            height: auto !important;
          }

          #printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 194mm !important;
            min-height: 0 !important;
            height: auto !important;
            max-height: 281mm !important;
            overflow: hidden !important;
            padding: 5mm !important;
            margin: 0 !important;
            background: white !important;
            font-family: 'Times New Roman', Times, serif !important;
            font-size: 11pt !important;
            line-height: 1.3 !important;
            box-sizing: border-box !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          input {
            border: none !important;
            background: transparent !important;
          }
        }
      `}</style>
        </div>
    );
};

export default PhieuDeNghiLapPhuKien;
