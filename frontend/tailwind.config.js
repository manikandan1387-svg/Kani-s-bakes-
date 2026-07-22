/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html",
    ],
    theme: {
        extend: {
            fontFamily: {
                serif: ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                body: ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
                '2xl': '1.25rem',
                '3xl': '1.75rem',
            },
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                cocoa: {
                    DEFAULT: '#3B2416',
                    50: '#F6EEE7',
                    100: '#E4D0BE',
                    200: '#C7A188',
                    300: '#A67858',
                    400: '#7E5A3E',
                    500: '#5A3E28',
                    600: '#3B2416',
                    700: '#2B1A10',
                    800: '#1E120B',
                    900: '#120A06',
                },
                cream: {
                    DEFAULT: '#FBF3E4',
                    50: '#FFFBF3',
                    100: '#FBF3E4',
                    200: '#F6E8CB',
                },
                peach: {
                    DEFAULT: '#F4B183',
                    500: '#F4B183',
                    600: '#EE9A5E',
                    700: '#D9843F',
                },
                gold: {
                    DEFAULT: '#D4AF37',
                    500: '#D4AF37',
                    600: '#B8942A',
                },
            },
            boxShadow: {
                soft: '0 8px 30px rgba(59, 36, 22, 0.08)',
                warm: '0 20px 60px -20px rgba(59, 36, 22, 0.35)',
            },
            keyframes: {
                'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
                'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
                'fade-up': { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
                'slide-in-right': { '0%': { transform: 'translateX(24px)', opacity: 0 }, '100%': { transform: 'translateX(0)', opacity: 1 } },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-up': 'fade-up 0.5s ease-out both',
                'slide-in-right': 'slide-in-right 0.4s ease-out both',
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
