// Test component để kiểm tra EmployeeBarChart
import React from 'react';
import EmployeeBarChart from './EmployeeBarChart';

// Sample data for testing
const sampleSummaryMatrix = {
  models: ["VF 3", "VF 5", "VF 6", "VF 7", "VF 8"],
  rows: [
    {
      employee: "Trần Thị Ngọc Thị",
      kyTotal: 4,
      xuatTotal: 4,
      kyByModel: { "VF 3": 4 },
      xuatByModel: { "VF 3": 4 }
    },
    {
      employee: "Bùi Minh Quý",
      kyTotal: 0,
      xuatTotal: 0,
      kyByModel: {},
      xuatByModel: {}
    },
    {
      employee: "Đào Ngọc Vũ",
      kyTotal: 0,
      xuatTotal: 0,
      kyByModel: {},
      xuatByModel: {}
    }
  ]
};

const TestEmployeeBarChart = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Employee Bar Chart</h1>
      <EmployeeBarChart 
        summaryMatrix={sampleSummaryMatrix} 
        timeRangeText="tháng 12/2025" 
      />
    </div>
  );
};

export default TestEmployeeBarChart;