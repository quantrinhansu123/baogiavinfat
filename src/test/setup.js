import '@testing-library/jest-dom';

// Mock Firebase
vi.mock('../firebase/config', () => ({
  database: {},
  auth: {}
}));

// Mock console.error to reduce noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes?.('Warning:')) return;
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
