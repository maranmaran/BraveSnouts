/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    container: false,
    listStyleType: false,
    listStylePosition: false,
    preflight: false,
  },
};
