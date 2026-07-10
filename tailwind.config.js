/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme-driven tokens — resolved from CSS variables set per theme.
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        effort: 'var(--effort)',
        'on-accent': 'var(--on-accent)',
        success: 'var(--success)',
        danger: 'var(--danger)',
      },
      borderRadius: {
        card: '16px',
        hero: '22px',
        pill: '999px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Anton', 'Arial Narrow Bold', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
