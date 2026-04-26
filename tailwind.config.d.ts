declare const _default: {
    content: string[];
    theme: {
        extend: {
            colors: {
                ink: string;
                panel: string;
                line: string;
                soft: string;
                accent: string;
                danger: string;
                success: string;
                note: string;
            };
            boxShadow: {
                hairline: string;
            };
            fontFamily: {
                sans: [string, string, string, string];
                mono: [string, string, string, string];
            };
            keyframes: {
                pulseLine: {
                    "0%, 100%": {
                        opacity: string;
                    };
                    "50%": {
                        opacity: string;
                    };
                };
            };
            animation: {
                pulseLine: string;
            };
        };
    };
    plugins: any[];
};
export default _default;
