/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  important: true,
  theme: {
    extend: {},
  },
  corePlugins: {
    container: false,
    listStyleType: false,
    listStylePosition: false,
    preflight: false,
  },
};
