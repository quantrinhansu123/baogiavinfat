/**
 * Shared print styles for all BieuMau components
 * Includes both screen and print styles for consistent formatting
 */
export function PrintStyles() {
  return (
    <style>{`
      /* ========== SCREEN STYLES ========== */
      /* Utility classes for BieuMau colon alignment and formatting */
      .info-row {
        display: grid;
        grid-template-columns: 180px 1fr;
        gap: 8px;
        align-items: baseline;
        margin-bottom: 4px;
      }
      .info-label {
        font-weight: bold;
        white-space: nowrap;
      }
      .info-value {
        flex: 1;
        word-break: break-word;
      }

      /* Table formatting */
      table.border-table {
        border-collapse: collapse;
        width: 100%;
      }
      table.border-table th, table.border-table td {
        border: 1px solid black;
      }
      th {
        vertical-align: middle;
        text-align: center;
        padding: 8px 12px;
      }
      td {
        padding: 6px 10px;
        vertical-align: middle;
      }

      /* Text overflow handling */
      .text-value {
        word-break: break-word;
        white-space: normal;
        overflow-wrap: anywhere;
      }

      /* List formatting */
      .list-item {
        display: flex;
        gap: 10px;
        padding-left: 20px;
      }
      .bullet {
        flex-shrink: 0;
        min-width: 20px;
      }

      /* Signature block */
      .signature-block {
        min-height: 80px;
        margin-top: 30px;
      }
      .signer-title {
        margin-bottom: 60px;
      }

      /* ========== PRINT STYLES ========== */
      @media print {
        @page {
          margin: 15mm 20mm;
          size: A4 portrait;
        }
        body * { visibility: hidden; }
        #printable-content, #printable-content * { visibility: visible; }
        #printable-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 210mm;
          max-width: 210mm;
          margin: 0;
          padding: 5mm 10mm !important;
          box-shadow: none;
          font-family: 'Times New Roman', serif !important;
          box-sizing: border-box;
          overflow: hidden;
        }
        .print\\:hidden { display: none !important; }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          font-family: 'Times New Roman', serif !important;
        }
        table { page-break-inside: avoid; }
      }
    `}</style>
  );
}
