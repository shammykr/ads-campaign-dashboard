/**
 * Design tokens shared by every component. All foreground/background pairs
 * used for text meet WCAG 2.1 AA (>= 4.5:1); borders on form controls meet
 * the 3:1 non-text contrast requirement (SC 1.4.11).
 */
export const theme = {
  colors: {
    bg: '#f4f5f7',
    surface: '#ffffff',
    surfaceAlt: '#f9fafb',
    text: '#1a1d23', // 16.1:1 on white
    textMuted: '#4a5160', // 8.1:1 on white
    border: '#d5d9e0', // decorative dividers only
    borderStrong: '#6b7280', // 4.8:1 – form control outlines
    primary: '#1f5fbf', // 6.2:1 with white text
    primaryHover: '#184c99',
    primarySubtle: '#e6eefa',
    danger: '#b42318', // 6.5:1 on white
    dangerSubtle: '#fdecea',
    focus: '#1f5fbf',
    status: {
      active: { bg: '#dcf3e6', fg: '#0f5132', dot: '#198754' },
      paused: { bg: '#fff1d6', fg: '#6b4100', dot: '#b7791f' },
      draft: { bg: '#e8eaee', fg: '#363c47', dot: '#6b7280' },
      ended: { bg: '#ece6f5', fg: '#4b2d7f', dot: '#6f42c1' },
    },
    chart: {
      actual: '#1f5fbf',
      ideal: '#6b7280',
      daily: '#9cbbe8',
    },
  },
  space: (n: number) => `${n * 4}px`,
  radius: { sm: '4px', md: '8px', lg: '12px' },
  font: {
    family: `system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
    mono: `ui-monospace, SFMono-Regular, Menlo, monospace`,
    size: { xs: '12px', sm: '13px', md: '14px', lg: '16px', xl: '20px', xxl: '24px' },
    weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
    lineHeight: 1.45,
  },
  shadow: {
    sm: '0 1px 2px rgba(16, 24, 40, 0.06)',
    lg: '0 12px 32px rgba(16, 24, 40, 0.18)',
  },
} as const;

export type Theme = typeof theme;
