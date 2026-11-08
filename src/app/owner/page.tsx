import type { Metadata } from "next";
import AdminDashboard from "./AdminDashboard";

// Owner dashboard: not linked anywhere, not in the sitemap or IndexNow, and marked noindex. The page itself is public,
// but its numbers only load with the private key in the link (/owner#k=…), checked by functions/owner/data.js.
export const metadata: Metadata = { title: "Owner dashboard", robots: { index: false, follow: false, nocache: true } };

export default function Page() {
  return <AdminDashboard />;
}
