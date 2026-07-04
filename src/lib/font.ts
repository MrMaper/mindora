import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";

export const peyda = localFont({
  src: [
    { path: "../../public/fonts/peyda/PeydaWeb-Thin.woff2", weight: "100" },
    { path: "../../public/fonts/peyda/PeydaWeb-ExtraLight.woff2", weight: "200" },
    { path: "../../public/fonts/peyda/PeydaWeb-Light.woff2", weight: "300" },
    { path: "../../public/fonts/peyda/PeydaWeb-Regular.woff2", weight: "400" },
    { path: "../../public/fonts/peyda/PeydaWeb-Medium.woff2", weight: "500" },
    { path: "../../public/fonts/peyda/PeydaWeb-SemiBold.woff2", weight: "600" },
    { path: "../../public/fonts/peyda/PeydaWeb-Bold.woff2", weight: "700" },
    { path: "../../public/fonts/peyda/PeydaWeb-ExtraBold.woff2", weight: "800" },
    { path: "../../public/fonts/peyda/PeydaWeb-Black.woff2", weight: "900" },
    { path: "../../public/fonts/peyda/PeydaWeb-ExtraBlack.woff2", weight: "950" },
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
  preload: true,
  fallback: ["ui-monospace", "monospace"],
});