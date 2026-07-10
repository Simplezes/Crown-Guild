/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: '#08070a',
          soft: '#0f0d11',
          panel: '#151217',
          raised: '#1e1a20',
        },
        ember: {
          DEFAULT: '#c9a24a',
          bright: '#e8cc7d',
          dim: '#8a723a',
        },
        blood: {
          DEFAULT: '#9a3b3b',
          bright: '#d3554f',
        },
        mist: {
          DEFAULT: '#c9c2b8',
          dim: '#8a8378',
          faint: '#5c564e',
        },
        tempered: '#b45ff0',
      },
      fontFamily: {
        display: ['Marcellus', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        rim: 'inset 0 1px 0 0 rgba(255,255,255,0.04)',
        lift: '0 12px 32px -12px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
