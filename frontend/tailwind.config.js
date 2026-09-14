/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    // Preflight off: this app still has styled-components + @atlaskit/css-reset.
    // Re-enable once the migration is complete.
    corePlugins: {
        preflight: false,
    },
    content: ['./src/**/*.{ts,tsx}', './App.tsx', './index.tsx'],
    theme: {
        extend: {
            // Nimble bridge: CSS vars hold OKLCH components (src/styles/globals.css),
            // mirroring the styled-components tokens in src/styles/colors.ts.
            // The <alpha-value> template keeps opacity modifiers (bg-primary/90) working.
            colors: {
                border: 'oklch(var(--border) / <alpha-value>)',
                hairline: 'oklch(var(--hairline) / <alpha-value>)', // #f0f0f1 — row dividers, list/details seam
                'gt-pink': 'oklch(var(--gt-pink) / <alpha-value>)', // #db2979 — selected-row bar, now-line
                input: 'oklch(var(--input) / <alpha-value>)',
                ring: 'oklch(var(--ring) / <alpha-value>)',
                background: 'oklch(var(--background) / <alpha-value>)',
                foreground: 'oklch(var(--foreground) / <alpha-value>)',
                primary: {
                    DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
                    foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
                    hover: 'oklch(var(--primary-hover) / <alpha-value>)',
                    highlight: 'oklch(var(--primary-highlight) / <alpha-value>)',
                },
                secondary: {
                    DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
                    foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
                },
                destructive: {
                    DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
                    foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
                    hover: 'oklch(var(--destructive-hover) / <alpha-value>)',
                },
                muted: {
                    DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
                    foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
                },
                accent: {
                    DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
                    foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
                },
                popover: {
                    DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
                    foreground: 'oklch(var(--popover-foreground) / <alpha-value>)',
                },
                card: {
                    DEFAULT: 'oklch(var(--card) / <alpha-value>)',
                    foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
                },
                'gt-yellow': 'oklch(0.83 0.16 85 / <alpha-value>)', // Colors.semantic.highlight.base
                'gt-blue-faint': 'oklch(0.94 0.03 250 / <alpha-value>)', // Colors.semantic.blue.faint
                'gt-gold': 'oklch(0.72 0.14 85 / <alpha-value>)', // Colors.semantic.highlight.hover
                success: {
                    DEFAULT: 'oklch(0.62 0.14 145 / <alpha-value>)', // Colors.semantic.success.base
                    hover: 'oklch(0.52 0.13 145 / <alpha-value>)',
                },
            },
            borderRadius: {
                lg: 'var(--radius)', // 10px — Border.radius.medium
                md: 'calc(var(--radius) - 4px)', // 6px — Border.radius.small
                sm: 'calc(var(--radius) - 6px)', // 4px — Border.radius.xs
            },
            // Nimble idiom: near-flat elevation — hairline borders do the separation,
            // shadows stay shallow and neutral (mirrors src/styles/shadows.ts).
            boxShadow: {
                'gt-xs': '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
                'gt-sm': '0px 1px 2px 0px rgba(0, 0, 0, 0.06)',
                'gt-m': '0px 1px 3px 0px rgba(0, 0, 0, 0.08)',
                'gt-l': '0px 10px 24px -6px rgba(0, 0, 0, 0.12), 0px 2px 6px -2px rgba(0, 0, 0, 0.06)',
                'gt-button': '0px 1px 2px 0px rgba(0, 0, 0, 0.06)',
                'gt-button-hover': '0px 1px 3px 0px rgba(0, 0, 0, 0.08)',
            },
            fontFamily: {
                sans: [
                    'Geist Variable',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Segoe UI',
                    'Helvetica',
                    'Roboto',
                    'Arial',
                    'sans-serif',
                ],
            },
            // Nimble type ramp (mirrors src/styles/typography.ts): small controlled
            // scale, 13px body, emphasis via weight steps, negative-or-zero tracking.
            fontSize: {
                'title-lg': [
                    '17px',
                    {
                        lineHeight: '22px',
                        letterSpacing: '-0.01em',
                        fontWeight: '600',
                    },
                ],
                'title-md': [
                    '15px',
                    {
                        lineHeight: '20px',
                        letterSpacing: '-0.01em',
                        fontWeight: '600',
                    },
                ],
                'title-sm': [
                    '13px',
                    {
                        lineHeight: '18px',
                        letterSpacing: '-0.005em',
                        fontWeight: '600',
                    },
                ],
                'body-lg': [
                    '13px',
                    {
                        lineHeight: '19px',
                        letterSpacing: '-0.005em',
                    },
                ],
                'body-md': [
                    '13px',
                    {
                        lineHeight: '19px',
                        letterSpacing: '-0.005em',
                    },
                ],
                'body-sm': [
                    '12px',
                    {
                        lineHeight: '17px',
                        letterSpacing: '0',
                    },
                ],
                'label-lg': [
                    '13px',
                    {
                        lineHeight: '18px',
                        letterSpacing: '-0.005em',
                        fontWeight: '500',
                    },
                ],
                'label-md': [
                    '12px',
                    {
                        lineHeight: '16px',
                        letterSpacing: '0',
                        fontWeight: '500',
                    },
                ],
                'label-sm': [
                    '11px',
                    {
                        lineHeight: '14px',
                        letterSpacing: '0',
                        fontWeight: '500',
                    },
                ],
            },
            fontWeight: {
                medium: '500',
            },
            backdropBlur: {
                'gt-xs': '8px',
                'gt-s': '16px',
            },
            keyframes: {
                'accordion-down': {
                    from: {
                        height: '0',
                    },
                    to: {
                        height: 'var(--radix-accordion-content-height)',
                    },
                },
                'accordion-up': {
                    from: {
                        height: 'var(--radix-accordion-content-height)',
                    },
                    to: {
                        height: '0',
                    },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
}
