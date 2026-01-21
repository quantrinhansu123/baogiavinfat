// Test component để kiểm tra PendingContractsTable
import PendingContractsTable from './PendingContractsTable';

// Sample data for testing
const sampleContracts = [
  {
    TVBH: "Trần Thị Ngọc Thị",
    model: "VF 3",
    status: "mới", // Tồn
    createdAt: "2024-12-01"
  },
  {
    TVBH: "Trần Thị Ngọc Thị", 
    model: "VF 3",
    status: "xuất", // Đã xuất
    createdAt: "2024-12-02"
  },
  {
    TVBH: "Trần Thị Ngọc Thị",
    model: "VF 5", 
    status: "mới", // Tồn
    createdAt: "2024-12-03"
  },
  {
    TVBH: "Bùi Minh Quý",
    model: "VF 7",
    status: "hủy", // Đã hủy
    createdAt: "2024-12-04"
  },
  {
    TVBH: "Đào Ngọc Vũ",
    model: "VF 8",
    status: "mới", // Tồn
    createdAt: "2024-12-05"
  }
];

const sampleSummaryMatrix = {
  models: ["VF 3", "VF 5", "VF 6", "VF 7", "VF 8"],
  rows: []
};

const sampleAllEmployees = [
  "Trần Thị Ngọc Thị",
  "Bùi Minh Quý", 
  "Đào Ngọc Vũ",
  "Nguyễn Thị Linh",
  "Mạng Quang Phúc"
];

const TestPendingContractsTable = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Pending Contracts Table</h1>
      <PendingContractsTable 
        summaryMatrix={sampleSummaryMatrix}
        timeRangeText="tháng 12/2024"
        contracts={sampleContracts}
        allEmployees={sampleAllEmployees}
        selectedEmployee="all"
      />
    </div>
  );
};

export default TestPendingContractsTable;