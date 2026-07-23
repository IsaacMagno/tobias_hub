/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0908",
          900: "#12100e",
          800: "#1c1916",
          700: "#2a2520",
          600: "#3d3630",
        },
        ash: {
          400: "#9a9188",
          300: "#c4bbb0",
          200: "#e8e2d9",
        },
        copper: {
          DEFAULT: "#c4a574",
          dim: "#8a7349",
          bright: "#e0c896",
        },
        ember: {
          DEFAULT: "#b54a2e",
          soft: "#d4785c",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "ink-radial":
          "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(196,165,116,0.12), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(181,74,46,0.06), transparent 45%)",
      },
    },
  },
  plugins: [],
};
