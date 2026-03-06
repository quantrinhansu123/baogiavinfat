// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    screens: {
      xs: "375px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      spacing: {
        "safe-top": "env(safe-area-inset-top, 0px)",
        "safe-bottom": "env(safe-area-inset-bottom, 0px)",
        "safe-left": "env(safe-area-inset-left, 0px)",
        "safe-right": "env(safe-area-inset-right, 0px)",
      },
      minHeight: {
        "screen-mobile": "100dvh",
      },
      colors: {
        // PRIMARY: XÁM METALLIC (từ logo "V")
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',   // Xám trung bình - MÀU CHÍNH
          600: '#475569',   // Xám đậm hơn
          700: '#334155',   // Dùng cho text, button
          800: '#1e293b',
          900: '#0f172a',   // Background dark
        },
        // SECONDARY: XANH VINFAST (chỉ làm accent)
        secondary: {
          500: '#3b82f6',   // VinFast Blue - chỉ dùng điểm nhấn
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // ACCENT: Đỏ (CTA), Bạc (metallic), Xanh lá (success)
        accent: {
          red: '#dc2626',
          silver: '#e5e7eb',
          success: '#10b981',
        },
        // neutral-white: dùng cho Header/Footer (text trên nền primary)
        neutral: {
          white: '#ffffff',
        },
      },
    },
  },
  plugins: [],
};