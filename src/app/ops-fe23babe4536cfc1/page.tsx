import type { Metadata } from "next";
import AdminDashboard from "./AdminDashboard";

// Hidden owner dashboard: not linked anywhere, not in the sitemap or IndexNow, and marked noindex.
// Anyone who knows the URL can view it (by request there is no login); it shows traffic numbers only, no secrets.
export const metadata: Metadata = { title: "Owner dashboard", robots: { index: false, follow: false, nocache: true } };

export default function Page() {
  return <AdminDashboard />;
}
