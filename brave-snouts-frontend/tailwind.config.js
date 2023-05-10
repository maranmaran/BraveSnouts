/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: "tw-",
  important: true,
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "100%", // add required value here
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
