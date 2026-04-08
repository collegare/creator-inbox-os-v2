/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          bg:            'var(--c-bg)',
          'bg-warm':     'var(--c-bg-warm)',
          surface:       'var(--c-surface)',
          'surface-alt': 'var(--c-surface-alt)',
          primary:       'var(--c-primary)',
          'primary-h':   'var(--c-primary-hover)',
          'primary-l':   'var(--c-primary-light)',
          'primary-soft':'var(--c-primary-soft)',
          text:          'var(--c-text)',
          'text-sec':    'var(--c-text-sec)',
          'text-muted':  'var(--c-text-muted)',
          border:        'var(--c-border)',
          'border-l':    'var(--c-border-light)',
          success:       'var(--c-success)',
          'success-bg':  'var(--c-success-bg)',
          warning:       'var(--c-warning)',
          'warning-bg':  'var(--c-warning-bg)',
          danger:        'var(--c-danger)',
          'danger-bg':   'var(--c-danger-bg)',
          info:          'var(--c-info)',
          'info-bg':     'var(--c-info-bg)',
        },
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
      boxShadow: {
        sm:  '0 1px 3px rgba(45,41,38,0.06)',
        md:  '0 4px 12px rgba(45,41,38,0.08)',
        lg:  '0 8px 30px rgba(45,41,38,0.1)',
        xl:  '0 12px 40px rgba(45,41,38,0.14)',
      },
    },
  },
  plugins: [],
};
