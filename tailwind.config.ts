import type { Config } from "tailwindcss";

// Placeholder brand tokens — replica-design / replica-brand replace these.
// Deliberately NOT Splitwise green.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4f46e5", // indigo — own colour, not the original's
          dark: "#4338ca",
          soft: "#eef2ff",
        },
        owe: "#e2662c",   // you owe (warm)
        owed: "#1f9d6b",  // you are owed (green)
        ink: "#1f2430",
        muted: "#6b7280",
        line: "#e5e7eb",
      },
      borderRadius: { xl: "0.9rem" },
    },
  },
  plugins: [],
};
export default config;
