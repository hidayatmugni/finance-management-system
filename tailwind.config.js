/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0f0f10",
        ink: "#f1f5f9",
        muted: "#8e949e",
        line: "#2a2a2c",
        panel: "#171717",
        primary: "#16b364",
        income: "#19c06c",
        expense: "#f04452",
        savings: "#1f8a56",
        warning: "#f5b546"
      },
      boxShadow: {
        card: "0 8px 20px rgba(0, 0, 0, 0.22)"
      },
      borderRadius: {
        xl2: "1rem"
      }
    }
  },
  plugins: []
};
