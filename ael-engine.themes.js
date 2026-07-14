/**
 * AEL Theme System v1.1.0
 * Provides Theme Engine for customizing appearance through theme.json.
 */
(function () {
  "use strict";

  // ── Default Theme ────────────────────────────────────────────────────────
  
  const DEFAULT_THEME = {
    name: "default",
    colors: {
      primary: "#0074FF",
      secondary: "#FFD700",
      accent: "#00FFCC",
      background: "#0B1220",
      surface: "rgba(255,255,255,0.05)",
      surfaceHover: "rgba(255,255,255,0.10)",
      text: "#E0E0E0",
      textSecondary: "#A0A0A0",
      textMuted: "#666666",
      border: "rgba(255,255,255,0.12)",
      success: "#00FF88",
      warning: "#FFD700",
      error: "#FF4444",
      info: "#0074FF",
      purple: "#6C47FF",
      pink: "#FF4D8D",
      green: "#00FF88",
      red: "#FF4444",
      gold: "#FFD700",
      teal: "#00FFCC",
      blue: "#0074FF"
    },
    typography: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem"
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700"
      },
      lineHeight: {
        tight: "1.25",
        normal: "1.5",
        relaxed: "1.75"
      }
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem",
      "2xl": "3rem",
      "3xl": "4rem"
    },
    borderRadius: {
      none: "0",
      sm: "0.25rem",
      md: "0.5rem",
      lg: "0.75rem",
      xl: "1rem",
      full: "9999px"
    },
    shadows: {
      sm: "0 1px 2px rgba(0,0,0,0.3)",
      md: "0 4px 6px rgba(0,0,0,0.3)",
      lg: "0 10px 15px rgba(0,0,0,0.3)",
      xl: "0 20px 25px rgba(0,0,0,0.3)",
      glow: "0 0 20px rgba(0,116,255,0.3)"
    },
    transitions: {
      fast: "150ms ease",
      normal: "250ms ease",
      slow: "350ms ease"
    },
    components: {
      header: {
        background: "rgba(11,18,32,0.95)",
        blur: "20px",
        height: "80px"
      },
      sidebar: {
        width: "300px",
        background: "rgba(11,18,32,0.98)",
        borderRight: "1px solid rgba(255,255,255,0.12)"
      },
      card: {
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "0.75rem",
        padding: "1.5rem",
        hoverBackground: "rgba(255,255,255,0.08)",
        hoverBorder: "rgba(255,255,255,0.2)"
      },
      search: {
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "0.5rem",
        focusBorder: "#0074FF",
        focusShadow: "0 0 0 3px rgba(0,116,255,0.3)"
      },
      button: {
        background: "#0074FF",
        hoverBackground: "#005FD4",
        color: "#FFFFFF",
        borderRadius: "0.5rem",
        padding: "0.5rem 1rem"
      },
      code: {
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "0.375rem",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
      }
    }
  };

  // ── Theme Engine ─────────────────────────────────────────────────────────
  
  let currentTheme = { ...DEFAULT_THEME };
  let customThemes = {};

  function loadTheme(themeData) {
    if (!themeData || typeof themeData !== 'object') {
      console.error('AEL Theme: Invalid theme data.');
      return false;
    }

    // Merge with defaults
    currentTheme = mergeDeep(DEFAULT_THEME, themeData);
    
    // Apply CSS variables
    applyTheme(currentTheme);
    
    // Emit theme change event
    if (window.AEL?.events) {
      window.AEL.events.emit('theme:changed', { theme: currentTheme });
    }

    return true;
  }

  function loadThemeFromFile(themePath) {
    return fetch(themePath)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load theme: ${res.status}`);
        return res.json();
      })
      .then(themeData => {
        loadTheme(themeData);
        return true;
      })
      .catch(err => {
        console.error('AEL Theme:', err);
        return false;
      });
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    
    // Colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--ael-color-${key}`, value);
    });

    // Typography
    root.style.setProperty('--ael-font-family', theme.typography.fontFamily);
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--ael-font-size-${key}`, value);
    });

    // Spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--ael-spacing-${key}`, value);
    });

    // Border radius
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--ael-radius-${key}`, value);
    });

    // Shadows
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--ael-shadow-${key}`, value);
    });

    // Transitions
    Object.entries(theme.transitions).forEach(([key, value]) => {
      root.style.setProperty(`--ael-transition-${key}`, value);
    });

    // Components
    Object.entries(theme.components).forEach(([component, props]) => {
      Object.entries(props).forEach(([prop, value]) => {
        root.style.setProperty(`--ael-${component}-${prop}`, value);
      });
    });
  }

  function resetTheme() {
    currentTheme = { ...DEFAULT_THEME };
    applyTheme(currentTheme);
  }

  function getTheme() {
    return { ...currentTheme };
  }

  function getThemeValue(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], currentTheme);
  }

  // ── Utility ──────────────────────────────────────────────────────────────
  
  function mergeDeep(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) Object.assign(output, { [key]: source[key] });
          else output[key] = mergeDeep(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  // ── Export to window.AEL ─────────────────────────────────────────────────

  window.AEL = window.AEL || {};
  window.AEL.theme = {
    load: loadTheme,
    loadFile: loadThemeFromFile,
    get: getTheme,
    getValue: getThemeValue,
    reset: resetTheme,
    DEFAULT: DEFAULT_THEME
  };

  // Apply default theme on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyTheme(DEFAULT_THEME));
  } else {
    applyTheme(DEFAULT_THEME);
  }

})();
