import type { Config } from "tailwindcss";

// Splitwise-style identity (our own hues): friendly green, warm coral for
// "you owe", green for "you are owed", charcoal text, white sidebar on light grey.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f4f6f5",
        surface: "#ffffff",
        ink: "#3a3f45",
        muted: "#8a9199",
        line: "#e7eae9",
        brand: { DEFAULT: "#17a67b", dark: "#128063", soft: "#e4f5ef" }, // teal-green
        owe: "#e2603c",   // you owe (warm coral)
        owed: "#19a06a",  // you are owed (green)
      },
      borderRadius: { xl: "0.75rem" },
    },
  },
  plugins: [],
};
export default config;
