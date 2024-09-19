/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    placeholderColor: {
      primary: '#737373 ',
    },
    fontFamily: {
      display: ['Open Sans', 'sans-serif'],
      body: ['Open Sans', 'sans-serif'],
    },
    extend: {
      colors: {
        primary: '#4ACAEA',
        secondary: '#438BFF',
        dark1: '#1A1A1A',
        lightGray: '#D7D7D7',
        red: '#FF543E',
        blueLight: '#98E2F5',
        gray: '#737373',
        blueDark: '#26627F',
        lighterGray: '#F2F2F2',
        darkerGray: '#EAEAEA',
        blue: '#438BFF',
      },
      fontSize: {
        14: '14px',
      },
      backgroundColor: {
        'main-bg': '#F5F5F5',
        'main-dark-bg': '#20232A',
        'secondary-dark-bg': '#33373E',
        'light-gray': '#F7F7F7',
        'half-transparent': 'rgba(0, 0, 0, 0.5)',
      },
      display: {
        hidden: 'none',
      },
      borderWidth: {
        1: '1px',
      },
      borderColor: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
      width: {
        400: '400px',
        760: '760px',
        780: '780px',
        800: '800px',
        1000: '1000px',
        1200: '1200px',
        1400: '1400px',
      },
      height: {
        80: '80px',
      },
      minHeight: {
        590: '590px',
      },
      backgroundImage: {
        'hero-pattern': "url('https://i.ibb.co/MkvLDfb/Rectangle-4389.png')",
      },
    },
  },
  plugins: [],
}
