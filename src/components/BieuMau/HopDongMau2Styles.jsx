/**
 * Print styles for Hợp đồng mua bán xe — Mẫu 2 (A4 chuẩn văn bản)
 */
export function HopDongMau2Styles() {
  return (
    <style>{`
      .hd-mau2-screen {
        background-color: #e0e2e5;
        font-family: "Times New Roman", Times, serif;
        font-size: 13pt;
        line-height: 1.45;
        color: #000;
        min-height: 100vh;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .hd-mau2-page {
        background: #fff;
        width: 210mm;
        min-height: 297mm;
        padding: 20mm 25mm 20mm 30mm;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        box-sizing: border-box;
        text-align: justify;
        font-weight: normal;
      }
      .hd-mau2-page h1 {
        font-size: 15pt;
        font-weight: bold;
        text-align: center;
        text-transform: uppercase;
        margin: 0 0 6px 0;
      }
      .hd-mau2-page h2 {
        font-size: 13pt;
        font-weight: bold;
        margin: 14px 0 8px 0;
        text-decoration: none;
      }
      .hd-mau2-page p { margin: 0 0 8px 0; font-weight: normal; }
      .hd-mau2-text-center { text-align: center; }
      .hd-mau2-text-right { text-align: right; }
      .hd-mau2-b { font-weight: bold; }
      .hd-mau2-i { font-style: italic; font-weight: normal; }
      .hd-mau2-bi { font-weight: bold; font-style: italic; }
      .hd-mau2-u { text-decoration: underline; }
      .hd-mau2-mt-10 { margin-top: 10px; }
      .hd-mau2-mb-20 { margin-bottom: 20px; }
      .hd-mau2-sub { font-weight: bold; margin: 8px 0; }
      .hd-mau2-clause-num { font-weight: normal; }
      .hd-mau2-party-title {
        font-weight: bold;
        text-align: center;
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      .hd-mau2-party-footer {
        font-style: italic;
        text-align: center;
        margin-top: 10px;
      }
      .hd-mau2-info-grid {
        display: table;
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 14px;
      }
      .hd-mau2-info-col {
        display: table-cell;
        width: 50%;
        border: 1px solid #000;
        padding: 10px;
        vertical-align: top;
      }
      .hd-mau2-info-col ul {
        margin: 0;
        padding-left: 0;
        list-style-type: none;
      }
      .hd-mau2-info-col li { margin-bottom: 4px; font-weight: normal; }
      .hd-mau2-contract-table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0 12px 0;
      }
      .hd-mau2-contract-table th,
      .hd-mau2-contract-table td {
        border: 1px solid #000;
        padding: 5px 7px;
        vertical-align: top;
        font-weight: normal;
      }
      .hd-mau2-contract-table th {
        text-align: center;
        font-weight: bold;
        background-color: #1f3864;
        color: #fff;
      }
      .hd-mau2-contract-table .hd-mau2-td-bold {
        font-weight: bold;
      }
      .hd-mau2-contract-table .hd-mau2-total-row td {
        font-weight: bold;
        text-align: center;
      }
      .hd-mau2-vehicle-label { font-weight: bold; }
      .hd-mau2-custom-list {
        padding-left: 22px;
        margin: 4px 0 8px 0;
      }
      .hd-mau2-custom-list li { margin-bottom: 4px; font-weight: normal; }
      .hd-mau2-pay-option { text-decoration: underline; font-weight: normal; }
      .hd-mau2-signature-section {
        display: flex;
        justify-content: space-between;
        margin-top: 28px;
        margin-bottom: 50px;
      }
      .hd-mau2-signature-box {
        width: 45%;
        text-align: center;
      }
      .hd-mau2-page-footer {
        margin-top: 24px;
        padding-top: 8px;
        border-top: 1px solid #999;
        color: #666;
        font-size: 9pt;
        display: flex;
        justify-content: space-between;
        text-transform: uppercase;
        font-weight: normal;
      }
      .hd-mau2-page-break { page-break-before: always; }
      @media print {
        body { background: none !important; }
        .hd-mau2-screen {
          background: none;
          padding: 0;
          margin: 0;
          display: block;
        }
        .hd-mau2-page {
          box-shadow: none;
          width: 100%;
          min-height: auto;
          padding: 0;
        }
        .hd-mau2-page-break { page-break-before: always; }
        body * { visibility: hidden; }
        #printable-content, #printable-content * { visibility: visible; }
        #printable-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .print\\:hidden { display: none !important; }
      }
    `}</style>
  );
}
