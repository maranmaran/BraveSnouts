/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{html,ts}'],
    important: true,
    theme: {
        extend: {},
        screens: {
            '2xl': { max: '1535px' },
            xl: { max: '1279px' },
            lg: { max: '1023px' },
            md: { max: '767px' },
            sm: { max: '639px' },
        },
    },
    corePlugins: {
        container: false,
        listStyleType: false,
        listStylePosition: false,
        preflight: false,
    },
    plugins: ['prettier-plugin-tailwindcss', '@tailwindcss/typography'],
}
