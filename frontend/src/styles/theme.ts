/**
 * Theme configuration
 * Define global color, spacing, font, etc. design specifications
 */

export const theme = {
  // Colors
  colors: {
    primary: '#1890ff',
    secondary: '#52c41a',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    info: '#1890ff',
    
    // Background colors
    background: {
      default: '#ffffff',
      paper: '#fafafa',
      gray: '#f5f5f5',
    },
    
    // Text colors
    text: {
      primary: '#262626',
      secondary: '#595959',
      disabled: '#bfbfbf',
      hint: '#8c8c8c',
    },
    
    // Border colors
    border: {
      default: '#d9d9d9',
      light: '#f0f0f0',
    },
    
    // HSA related colors
    hsa: {
      eligible: '#52c41a',
      nonEligible: '#f5222d',
    },
  },

  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  // Font
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px',
      xxxl: '32px',
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Border radius
  borderRadius: {
    sm: '2px',
    md: '4px',
    lg: '8px',
    xl: '16px',
    round: '50%',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },

  // Breakpoints (responsive design)
  breakpoints: {
    xs: '480px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1600px',
  },

  // Z-index levels
  zIndex: {
    dropdown: 1000,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  // Animations
  transitions: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
};

// Ant Design theme configuration
export const antdTheme = {
  token: {
    colorPrimary: theme.colors.primary,
    colorSuccess: theme.colors.success,
    colorWarning: theme.colors.warning,
    colorError: theme.colors.error,
    colorInfo: theme.colors.info,
    
    borderRadius: 4,
    fontFamily: theme.typography.fontFamily,
  },
};

export type Theme = typeof theme;

