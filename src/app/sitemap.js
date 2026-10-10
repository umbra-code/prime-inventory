import { SITE_URL } from "@/lib/site";

// The app is a single page.
export default function sitemap() {
  return [{ url: SITE_URL, changeFrequency: "weekly", priority: 1 }];
}
