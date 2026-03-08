import { formatCurrency } from '../../data/calculatorData';

/**
 * Price breakdown summary component
 */
export function PriceSummary({
  basePrice,
  promotionDiscounts,
  vinClubDiscount,
  convertSupportDiscount,
  bhvc2Discount,
  premiumColorDiscount,
  giaXuatHoaDon,
  finalPayable,
  showDetails = true,
}) {
  const PriceRow = ({ label, value, isDiscount, isBold, className = '' }) => (
    <div className={`flex justify-between items-center py-2 ${isBold ? 'font-semibold' : ''} ${className}`}>
      <span className="text-gray-700">{label}</span>
      <span className={isDiscount && value > 0 ? 'text-red-600' : 'text-gray-900'}>
        {isDiscount && value > 0 ? '-' : ''}{formatCurrency(Math.abs(value))}
      </span>
    </div>
  );

  const totalDiscount = promotionDiscounts + (vinClubDiscount || 0) +
    (convertSupportDiscount || 0) + (bhvc2Discount || 0) + (premiumColorDiscount || 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        Tổng hợp giá xe
      </h3>

      <div className="space-y-1">
        <PriceRow label="Giá xe (đã bao gồm VAT)" value={basePrice} isBold />

        {showDetails && promotionDiscounts > 0 && (
          <PriceRow label="Giảm giá theo chương trình" value={promotionDiscounts} isDiscount />
        )}

        {showDetails && vinClubDiscount > 0 && (
          <PriceRow label="Ưu đãi VinClub" value={vinClubDiscount} isDiscount />
        )}

        {showDetails && convertSupportDiscount > 0 && (
          <PriceRow label="Hỗ trợ đổi xe" value={convertSupportDiscount} isDiscount />
        )}

        {showDetails && bhvc2Discount > 0 && (
          <PriceRow label="Quy đổi BHVC 2 năm" value={bhvc2Discount} isDiscount />
        )}

        {showDetails && premiumColorDiscount > 0 && (
          <PriceRow label="Quy đổi màu Premium" value={premiumColorDiscount} isDiscount />
        )}

        {totalDiscount > 0 && (
          <div className="pt-2 mt-2 border-t border-gray-100">
            <PriceRow
              label="Tổng giảm giá"
              value={totalDiscount}
              isDiscount
              className="text-red-600 font-medium"
            />
          </div>
        )}

        <div className="pt-3 mt-3 border-t-2 border-gray-200">
          <PriceRow
            label="Giá xuất hóa đơn"
            value={giaXuatHoaDon || (basePrice - totalDiscount)}
            isBold
          />
        </div>

        {finalPayable !== undefined && finalPayable !== giaXuatHoaDon && (
          <div className="pt-2">
            <div className="flex justify-between items-center py-2 font-semibold text-blue-600">
              <span className="text-gray-700">
                Giá thanh toán thực tế
                <span className="block text-xs font-normal text-gray-500 mt-0.5">= Giá XHD − Phiếu thu 51</span>
              </span>
              <span>{formatCurrency(finalPayable)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PriceSummary;
