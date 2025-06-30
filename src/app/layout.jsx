import { cn } from "@/lib/utils";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Prime Inventory",
  description:
    "A simple inventory management system for Prime items in Warframe",
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body
        className={cn(geistSans.variable, geistMono.variable, "antialiased")}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
