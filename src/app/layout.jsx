import { Toaster } from "react-hot-toast";
import { Syne, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "../providers/sessionProvider";
import { GlobalProvider } from "./services/state";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "Tobias",
  description: "Guia de progressão pessoal — campanhas, próximo passo, pomodoro",
  applicationName: "Tobias",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tobias",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport = {
  themeColor: "#0a0908",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const RootLayout = ({ children }) => {
  return (
    <html lang="pt" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">
        <GlobalProvider>
          <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
          <Toaster
            toastOptions={{
              duration: 2000,
              style: {
                background: "#1c1916",
                color: "#e8e2d9",
                border: "1px solid rgba(196,165,116,0.25)",
              },
            }}
          />
          <ServiceWorkerRegister />
        </GlobalProvider>
      </body>
    </html>
  );
};

export default RootLayout;
