import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C63FF',
          50: '#F0EFFF',
          100: '#E2E0FF',
          200: '#C5C1FF',
          300: '#A8A2FF',
          400: '#8B83FF',
          500: '#6C63FF',
          600: '#4D42FF',
          700: '#2E21FF',
          800: '#1200FF',
          900: '#0F00D9',
        },
        secondary: {
          DEFAULT: '#FF6584',
          50: '#FFF0F3',
          100: '#FFE1E7',
          200: '#FFC3CF',
          300: '#FFA5B7',
          400: '#FF879F',
          500: '#FF6584',
          600: '#FF3761',
          700: '#FF0940',
          800: '#DA0034',
          900: '#AC0029',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
