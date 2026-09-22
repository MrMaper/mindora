import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";

/** Only weights actually used in UI — keeps first paint light. */
export const peyda = localFont({
  src: [
    { path: "../../public/fonts/peyda/PeydaWeb-Regular.woff2", weight: "400" },
    { path: "../../public/fonts/peyda/PeydaWeb-Medium.woff2", weight: "500" },
    { path: "../../public/fonts/peyda/PeydaWeb-SemiBold.woff2", weight: "600" },
    { path: "../../public/fonts/peyda/PeydaWeb-Bold.woff2", weight: "700" },
  ],
  variable: "--font-peyda",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "monospace"],
});
