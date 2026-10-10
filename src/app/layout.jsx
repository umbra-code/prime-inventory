import { SITE_DESCRIPTION, SITE_FEATURES, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
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

// Link previews (Discord, WhatsApp, X…) use opengraph-image.png next to this
// file; metadataBase makes its URL absolute.
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["Warframe", "Prime parts", "Prime sets", "inventory tracker", "relics", "ducats", "Prime Resurgence", "mastery"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "black-translucent" },
};

// Structured data: tells search engines this is a free web app, not an article.
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  inLanguage: ["en", "es"],
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: SITE_FEATURES,
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
        <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
        {/* The app renders in the browser; this is what is left without JavaScript. */}
        <noscript>
          <style>{'#app-loading { display: none; }'}</style>
          <div className='mx-auto max-w-2xl px-6 py-10'>
            <h1 className='font-display text-2xl font-bold uppercase tracking-[0.08em]'>{SITE_NAME}</h1>
            <p className='mt-3'>{SITE_DESCRIPTION}</p>
            <ul className='mt-4 list-disc space-y-1 pl-5'>
              {SITE_FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <p className='mt-4 font-semibold'>Prime Inventory needs JavaScript to run. Enable it and reload the page.</p>
          </div>
        </noscript>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          {children}
        </ThemeProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
