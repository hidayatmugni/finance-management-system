/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0b1118",
        ink: "#f4f7fb",
        muted: "#95a4b8",
        line: "#233041",
        panel: "#121a24",
        primary: "#5b8cff",
        income: "#29c173",
        expense: "#fd4646",
        savings: "#66b6ff",
        warning: "#d7a237"
      },
      boxShadow: {
        card: "0 18px 38px rgba(0, 0, 0, 0.42)"
      },
      borderRadius: {
        xl2: "1.4rem"
      }
    }
  },
  plugins: []
};
