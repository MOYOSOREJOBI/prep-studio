export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                ink: "#030303",
                panel: "#0b0b0b",
                line: "rgba(255,255,255,0.08)",
                soft: "rgba(255,255,255,0.6)",
                accent: "#f5f5f5",
                danger: "#ff8f8f",
                success: "#acf1c1",
                note: "#d14c4c"
            },
            boxShadow: {
                hairline: "0 0 0 1px rgba(255,255,255,0.06)"
            },
            fontFamily: {
                sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
            },
            keyframes: {
                pulseLine: {
                    "0%, 100%": { opacity: "0.4" },
                    "50%": { opacity: "1" }
                }
            },
            animation: {
                pulseLine: "pulseLine 1.4s ease-in-out infinite"
            }
        }
    },
    plugins: []
};
