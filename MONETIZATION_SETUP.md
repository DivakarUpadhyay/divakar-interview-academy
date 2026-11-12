# Monetization setup

DevLadder's live .NET Interview Prep Pack checkout was checked on 12 November 2026. The product page is public, shows the $9 price, and describes a downloadable 74-page PDF with 237 questions, six cheat sheets and a 30-day plan. Do not click Pay while testing; that would start a real purchase.

## Turn mentoring into paid checkout

The mentoring page shows a request form until a hosted checkout URL is configured. Create the services in a payment provider account you already own and verify its payout details first. Use hosted payment links so card data never passes through DevLadder. Add these public URLs to the Cloudflare Pages project environment and rebuild:

- `NEXT_PUBLIC_CHECKOUT_INTERVIEW_EXPRESS`: 24-hour interview prep (US$49)
- `NEXT_PUBLIC_CHECKOUT_CV_REVIEW`: CV review (US$25)
- `NEXT_PUBLIC_CHECKOUT_ANSWER_REVIEW`: review of up to five answers (US$15)

These prices are initial offers; set the same prices on the provider checkout pages. Verify deliverables and turnaround times before making the links public. If a link is missing, the site continues to show the request form.

## Affiliate links

Only set these after an affiliate program accepts the account and issues an actual tracking URL. The site automatically marks configured URLs as affiliate links and adds `rel="sponsored"`:

- `NEXT_PUBLIC_AFFILIATE_UDEMY_DOTNET_URL`
- `NEXT_PUBLIC_AFFILIATE_UDEMY_SQL_URL`
- `NEXT_PUBLIC_AFFILIATE_UDEMY_DOCKER_URL`
- `NEXT_PUBLIC_AFFILIATE_UDEMY_FRONTEND_URL`
- `NEXT_PUBLIC_AFFILIATE_COURSERA_URL`
- `NEXT_PUBLIC_AFFILIATE_DIGITALOCEAN_URL`

The current public non-tracked links remain in use until real tracking URLs are configured. Keep the existing disclosure page accurate and place disclosures near affiliate links as required by each program.

## Ads and sponsors

AdSense integration is already gated by `NEXT_PUBLIC_ADSENSE_CLIENT` and the slot IDs in `src/lib/ads.ts`. Only populate them after Google approves the site and supplies the account/client and unit IDs. Ad revenue is not a 1–2 day payout path. The existing `/advertise` page accepts direct sponsorship enquiries; share it with relevant developer tools, training platforms and recruiters instead of promising unverified traffic numbers.

