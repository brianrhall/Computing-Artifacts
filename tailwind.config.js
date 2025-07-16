/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      aspectRatio: {
        'video': '3 / 4',  // Override aspect-video to be 3:4 instead of 16:9
      }
    },
  },
  plugins: [],
}