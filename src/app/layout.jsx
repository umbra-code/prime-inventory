import { cn } from "@/lib/utils";
import { Cinzel, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { ServiceWorkerRegistration } from "@/components/layout/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face for the brand, set and relic names and figures.
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const DESCRIPTION = "Track your Warframe Prime parts, mastery, ducats and the relics you still need.";

// Link previews (Discord, WhatsApp, X…) use opengraph-image.png next to this
// file; metadataBase makes its URL absolute.
export const metadata = {
  metadataBase: new URL("https://prime-inventory-lovat.vercel.app"),
  title: "Prime Inventory",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Prime Inventory",
    title: "Prime Inventory",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "Prime Inventory", statusBarStyle: "black-translucent" },
};

// The Orokin backgrounds (--oro-bg), so the browser bar matches the page.
export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0b09" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={cn(geistSans.variable, geistMono.variable, cinzel.variable, "antialiased")}
      >
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          {children}
        </ThemeProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
