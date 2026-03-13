import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatCurrency } from '../../data/calculatorData';
import CurrencyInput from '../shared/CurrencyInput';

/**
 * On-road costs (registration, insurance, fees) component
 */
export function OnRoadCosts({
  registrationLocation,
  onLocationChange,
  plateFee,
  plateFeeAuto,
  isPlateFeeManual,
  onPlateFeeChange,
  onPlateFeeReset,
  liabilityInsurance,
  liabilityInsuranceAuto,
  isLiabilityInsuranceManual,
  onLiabilityChange,
  onLiabilityReset,
  roadFee,
  roadFeeAuto,
  isRoadFeeManual,
  onRoadFeeChange,
  onRoadFeeReset,
  inspectionFee,
  inspectionFeeAuto,
  isInspectionFeeManual,
  onInspectionFeeChange,
  onInspectionFeeReset,
  bodyInsurance,
  bodyInsuranceFee,
  isBodyInsuranceManual,
  onBodyInsuranceChange,
  onBodyInsuranceReset,
  registrationFee,
  onRegistrationFeeChange,
  totalOnRoadCost,
}) {
  const locationOptions = [
    { value: 'hcm', label: 'TP. Hồ Chí Minh' },
    { value: 'hanoi', label: 'Hà Nội' },
    { value: 'danang', label: 'Đà Nẵng' },
    { value: 'cantho', label: 'Cần Thơ' },
    { value: 'haiphong', label: 'Hải Phòng' },
    { value: 'other', label: 'Tỉnh thành khác' },
  ];

  const [notes, setNotes] = useState({});

  const handleNoteChange = (key, value) => {
    setNotes((prev) => ({ ...prev, [key]: value }));
  };

  const FeeRow = ({
    label,
    value,
    autoValue,
    isManual,
    onChange,
    onReset,
    note,
    onNoteChange,
    editable = true,
  }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 gap-3">
      <span className="text-gray-700 text-sm flex-1">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={note || ''}
          onChange={(e) => onNoteChange && onNoteChange(e.target.value)}
          placeholder="Ghi chú"
          className="w-32 text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        {editable ? (
          <>
            <CurrencyInput
              value={isManual ? value : autoValue}
              onChange={onChange}
              className="w-32 text-right text-sm px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {isManual && (
              <button
                onClick={onReset}
                className="text-xs text-blue-600 hover:text-blue-800"
                title="Khôi phục mặc định"
              >
                ↺
              </button>
            )}
          </>
        ) : (
          <span className="font-medium">{formatCurrency(value)}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        Chi phí lăn bánh
      </h3>

      {/* Location Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Khu vực đăng ký
        </label>
        <div className="relative">
          <select
            value={registrationLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {locationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Fee Rows */}
      <div className="space-y-1">
        <FeeRow
          label="Phí biển số"
          value={plateFee}
          autoValue={plateFeeAuto}
          isManual={isPlateFeeManual}
          onChange={onPlateFeeChange}
          onReset={onPlateFeeReset}
          note={notes.plateFee}
          onNoteChange={(val) => handleNoteChange('plateFee', val)}
        />
        <FeeRow
          label="Phí đường bộ (12 tháng)"
          value={roadFee}
          autoValue={roadFeeAuto}
          isManual={isRoadFeeManual}
          onChange={onRoadFeeChange}
          onReset={onRoadFeeReset}
          note={notes.roadFee}
          onNoteChange={(val) => handleNoteChange('roadFee', val)}
        />
        <FeeRow
          label="Bảo hiểm TNDS"
          value={liabilityInsurance}
          autoValue={liabilityInsuranceAuto}
          isManual={isLiabilityInsuranceManual}
          onChange={onLiabilityChange}
          onReset={onLiabilityReset}
          note={notes.liabilityInsurance}
          onNoteChange={(val) => handleNoteChange('liabilityInsurance', val)}
        />
        <FeeRow
          label="Phí kiểm định"
          value={inspectionFee}
          autoValue={inspectionFeeAuto}
          isManual={isInspectionFeeManual}
          onChange={onInspectionFeeChange}
          onReset={onInspectionFeeReset}
          note={notes.inspectionFee}
          onNoteChange={(val) => handleNoteChange('inspectionFee', val)}
        />
        <FeeRow
          label="Bảo hiểm vật chất (1.4%)"
          value={isBodyInsuranceManual ? bodyInsuranceFee : bodyInsurance}
          autoValue={bodyInsurance}
          isManual={isBodyInsuranceManual}
          onChange={onBodyInsuranceChange}
          onReset={onBodyInsuranceReset}
          note={notes.bodyInsurance}
          onNoteChange={(val) => handleNoteChange('bodyInsurance', val)}
        />
        <FeeRow
          label="Phí dịch vụ đăng ký"
          value={registrationFee}
          autoValue={registrationFee}
          isManual={false}
          onChange={onRegistrationFeeChange}
          editable={true}
          note={notes.registrationFee}
          onNoteChange={(val) => handleNoteChange('registrationFee', val)}
        />
      </div>

      {/* Total */}
      <div className="mt-4 pt-3 border-t-2 border-gray-200 flex justify-between items-center">
        <span className="font-semibold text-gray-800">Tổng chi phí lăn bánh</span>
        <span className="text-xl font-bold text-blue-600">
          {formatCurrency(totalOnRoadCost)}
        </span>
      </div>
    </div>
  );
}

export default OnRoadCosts;
