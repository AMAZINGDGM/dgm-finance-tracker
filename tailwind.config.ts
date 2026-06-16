import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#030712",
        panel: "#050816",
        card: "#0B1120",
        border: "#1E293B",
        accent: {
          DEFAULT: "#38BDF8",
          soft: "#22D3EE",
          secondary: "#6366F1"
        },
        muted: "#94A3B8",
        income: "#22C55E",
        expense: "#F43F5E",
        warning: "#F59E0B",
        sky: "#38BDF8"
      },
      boxShadow: {
        glow: "0 0 32px rgba(34, 211, 238, 0.18)",
        panel: "0 20px 70px rgba(0, 0, 0, 0.42)"
      },
      backgroundImage: {
        "premium-radial":
          "radial-gradient(circle at 18% 8%, rgba(34, 211, 238, 0.20), transparent 30%), radial-gradient(circle at 82% 0%, rgba(99, 102, 241, 0.18), transparent 30%), linear-gradient(135deg, #030712 0%, #050816 52%, #030712 100%)",
        "glass-line":
          "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))"
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" }
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" }
        }
      },
      animation: {
        shimmer: "shimmer 2.2s linear infinite",
        float: "float 5s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
