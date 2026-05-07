import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6C63FF', 50: '#F0EFFF', 100: '#E2E0FF', 500: '#6C63FF', 600: '#4D42FF' },
        secondary: { DEFAULT: '#FF6584', 50: '#FFF0F3', 500: '#FF6584' },
      },
    },
  },
  plugins: [],
}
export default config
