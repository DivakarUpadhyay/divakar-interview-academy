// Every way DevLadder earns money besides AdSense, in one place. Choices follow official program terms and research:
// - Coursera's affiliate program (Impact network) pays up to 45% on eligible purchases (coursera.org/about/affiliates);
//   Udemy's also runs on Impact. Join both on impact.com, then paste the tracking links below with affiliate: true.
// - Free-to-paid conversion is typically 2-5% (Kannan et al., AMA; Lambrecht & Misra 2016; ITC-ILO 2023 found ~2%),
//   so free lessons feed a low-priced Prep Pack and paid mock interviews.
// - EthicalAds needs 50k page views/month and must be the only ad on a page; consider it instead of AdSense later. Fill in a URL once the matching account exists
// (booking calendar, Gumroad product, affiliate links); until then buttons fall back to the contact email.
import { CONTACT_EMAIL } from "@/lib/site";

const mail = (subject: string) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;

/** Paid 1:1 sessions. Prices are starting points; change them here. */
export const SESSIONS = [
  { name: "Mock .NET interview", minutes: 60, price: "US$35",
    detail: "A realistic technical round on C#, ASP.NET Core, SQL Server and system design, followed by honest feedback and a written list of what to improve." },
  { name: "CV and LinkedIn review", minutes: 45, price: "US$25",
    detail: "We go through your CV and LinkedIn profile line by line and rewrite the parts that recruiters skip, so your experience is clear in ten seconds." },
  { name: "Career and salary call", minutes: 30, price: "US$15",
    detail: "Talk through a job offer, a career gap, a move abroad or what to learn next, with advice from nine years of working as a .NET developer." },
];
/** Calendly / Topmate / Cal.com booking page. Empty = booking by email. */
export const BOOKING_URL = "";
export const bookingHref = (session: string) => BOOKING_URL || mail(`Booking: ${session}`);

/** The downloadable interview pack (Gumroad / Lemon Squeezy product page). Empty = "notify me" by email. */
export const PREP_PACK = { url: "", price: "US$9" };
export const prepPackHref = () => PREP_PACK.url || mail("Interview Prep Pack: please notify me when it is ready");

export const HIRE_HREF = mail("Project or job enquiry from DevLadder");
export const SPONSOR_HREF = mail("Sponsoring DevLadder");

export type Resource = { title: string; url: string; note: string; affiliate?: boolean };

/**
 * "Recommended resources" shown on lessons by learning track and on the tools pages. Mark `affiliate: true` once a
 * link carries your affiliate ID; those links get rel="sponsored" and a small "affiliate" label, as the disclosure page says.
 */
export const RESOURCES: Record<string, Resource[]> = {
  dotnet: [
    { title: "Microsoft Learn: C# and .NET", url: "https://learn.microsoft.com/dotnet/csharp/", note: "Free official docs and learning paths" },
    { title: ".NET courses on Udemy", url: "https://www.udemy.com/topic/c-sharp/", note: "Video courses, often on sale" },
    { title: "Software development on Coursera", url: "https://www.coursera.org/browse/computer-science/software-development", note: "University and Microsoft certificates" },
    { title: ".NET courses on Pluralsight", url: "https://www.pluralsight.com/browse/software-development/c-sharp", note: "Structured paths with skill tests" },
  ],
  data: [
    { title: "Microsoft Learn: SQL Server", url: "https://learn.microsoft.com/sql/sql-server/", note: "Free official docs" },
    { title: "SQL Server courses on Udemy", url: "https://www.udemy.com/topic/sql-server/", note: "T-SQL, performance and DBA courses" },
    { title: "Data courses on Coursera", url: "https://www.coursera.org/browse/data-science", note: "SQL and data engineering certificates" },
  ],
  "devops-cloud": [
    { title: "Microsoft Learn: Azure", url: "https://learn.microsoft.com/training/azure/", note: "Free training for Azure certifications" },
    { title: "DigitalOcean", url: "https://www.digitalocean.com/", note: "Simple cloud servers to practise Docker and Linux" },
    { title: "Docker and Kubernetes on Udemy", url: "https://www.udemy.com/topic/docker/", note: "Hands-on container courses" },
    { title: "Cloud certificates on Coursera", url: "https://www.coursera.org/browse/information-technology/cloud-computing", note: "Azure, AWS and Google Cloud programs" },
  ],
  frontend: [
    { title: "MDN Web Docs", url: "https://developer.mozilla.org/", note: "Free, the best reference for HTML, CSS and JavaScript" },
    { title: "Frontend courses on Udemy", url: "https://www.udemy.com/topic/react/", note: "React, Angular and Vue courses" },
  ],
  foundations: [
    { title: "LeetCode", url: "https://leetcode.com/", note: "Practise coding-round problems" },
    { title: "Algorithms on Coursera", url: "https://www.coursera.org/search?query=algorithms", note: "University courses, free to audit" },
  ],
  interview: [
    { title: "Interview Prep Pack", url: "/interview-prep-pack", note: "Top questions, answers and a 30-day plan in one PDF" },
    { title: "Book a mock interview", url: "/mentoring", note: "Practise with a .NET developer and get feedback" },
  ],
  default: [
    { title: "Book a mock interview", url: "/mentoring", note: "Practise with a .NET developer and get feedback" },
  ],
};
