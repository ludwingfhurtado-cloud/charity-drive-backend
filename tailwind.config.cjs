/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#0b0f19",
                secondary: "#121826",
                accent: "#00bcd4",
            },
        },
    },
    plugins: [],
};