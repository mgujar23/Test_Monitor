export default {
  content: [
    './index.html',
    './src/ui/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0a0c10',
        'dark-card': '#111318',
        'dark-surface2': '#181c24',
        'dark-border': '#1f2530',
        'dark-text': '#e8edf5',
        'dark-muted': '#6b7a96',
        'dark-dim': '#3a4357',
        'accent-primary': '#00e5a0',
        'accent-secondary': '#00b8ff',
        'accent-warning': '#ff6b35',
        'accent-alert': '#ffd166',
        'passed': '#00e5a0',
        'failed': '#ff6b35',
        'stale': '#ffd166',
      },
      fontFamily: {
        'syne': ["'Syne'", 'sans-serif'],
        'mono': ["'DM Mono'", 'monospace'],
      },
      borderRadius: {
        'DEFAULT': '10px',
      },
    }
  },
  plugins: []
};
