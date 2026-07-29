/** @type {import('tailwindcss').Config} */

/**
 * Every colour resolves to `rgb(var(--token-rgb) / <alpha-value>)`, so Tailwind
 * utilities follow whichever theme `applyTheme()` has written to :root. Nothing
 * in the app hardcodes a hex value — switching themes needs no CSS changes.
 */
const token = (name) => `rgb(var(--color-${name}-rgb) / <alpha-value>)`;
const chart = (index) => `rgb(var(--chart-${index}-rgb) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: token("bg"),
        "canvas-subtle": token("bg-subtle"),
        surface: token("surface"),
        "surface-raised": token("surface-raised"),
        "surface-hover": token("surface-hover"),
        "surface-sunken": token("surface-sunken"),

        line: token("border"),
        "line-strong": token("border-strong"),

        ink: token("text"),
        muted: token("text-secondary"),
        subtle: token("text-tertiary"),
        inverse: token("text-inverse"),

        /*
         * `DEFAULT` is the fill (bars, chart marks, solid buttons).
         * `ink` is the text-safe version — always use it for type, so pastel
         * themes stay readable without every component special-casing them.
         */
        primary: {
          DEFAULT: token("primary"),
          hover: token("primary-hover"),
          active: token("primary-active"),
          soft: token("primary-soft"),
          border: token("primary-border"),
          ink: token("primary-ink"),
          fg: token("on-primary")
        },
        secondary: {
          DEFAULT: token("secondary"),
          soft: token("secondary-soft"),
          ink: token("secondary-ink")
        },
        tertiary: {
          DEFAULT: token("tertiary"),
          soft: token("tertiary-soft"),
          ink: token("tertiary-ink")
        },

        success: {
          DEFAULT: token("success"),
          soft: token("success-soft"),
          ink: token("success-ink")
        },
        warning: {
          DEFAULT: token("warning"),
          soft: token("warning-soft"),
          ink: token("warning-ink")
        },
        danger: {
          DEFAULT: token("danger"),
          soft: token("danger-soft"),
          ink: token("danger-ink")
        },
        info: { DEFAULT: token("info"), soft: token("info-soft"), ink: token("info-ink") },

        income: { DEFAULT: token("income"), ink: token("income-ink") },
        expense: { DEFAULT: token("expense"), ink: token("expense-ink") },

        chart: {
          1: chart(1),
          2: chart(2),
          3: chart(3),
          4: chart(4),
          5: chart(5),
          6: chart(6),
          7: chart(7),
          8: chart(8)
        }
      },

      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-body)"]
      },

      fontSize: {
        caption: ["calc(11px * var(--font-scale, 1))", { lineHeight: "1.45" }],
        small: ["calc(12px * var(--font-scale, 1))", { lineHeight: "1.5" }],
        body: ["calc(14px * var(--font-scale, 1))", { lineHeight: "1.55" }],
        "body-lg": ["calc(15px * var(--font-scale, 1))", { lineHeight: "1.55" }],
        subtitle: ["calc(16px * var(--font-scale, 1))", { lineHeight: "1.4", fontWeight: "600" }],
        title: ["calc(20px * var(--font-scale, 1))", { lineHeight: "1.3", fontWeight: "700" }],
        headline: ["calc(24px * var(--font-scale, 1))", { lineHeight: "1.25", fontWeight: "700" }],
        display: ["calc(30px * var(--font-scale, 1))", { lineHeight: "1.2", fontWeight: "700" }]
      },

      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        xxl: "var(--radius-xxl)"
      },

      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        focus: "var(--shadow-focus)"
      },

      screens: { xs: "480px" },

      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: { "100%": { transform: "translateX(100%)" } }
      },

      animation: {
        "fade-in": "fade-in 180ms cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-up": "slide-up 240ms cubic-bezier(0.4, 0, 0.2, 1)",
        shimmer: "shimmer 1.4s infinite"
      }
    }
  },
  plugins: []
};
