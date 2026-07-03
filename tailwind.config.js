export default {
  content: [
    './index.html',
    './src/ui/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#1a1a1a',
        'dark-card': '#2a2a2a',
        'dark-text': '#e0e0e0',
        'dark-border': '#3a3a3a',
        'failed': '#ff6b6b',
        'stale': '#ffd93d',
        'passed': '#6bcf7f'
      }
    }
  },
  plugins: []
};
