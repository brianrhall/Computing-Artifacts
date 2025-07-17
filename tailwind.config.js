/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      aspectRatio: {
        'portrait': '3 / 4',  // Portrait orientation for artifacts
        'banner': '16 / 9',   // Wide banner for exhibit headers
      }
    },
  },
  plugins: [],
}