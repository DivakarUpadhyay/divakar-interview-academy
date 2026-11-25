"""Mobile responsiveness check for every page in the sitemap.

For each URL and phone width it reports:
  - overflow: the page scrolls sideways (elements wider than the screen, outside scrollable boxes)
  - small text: visible text under 12px
  - small targets: links/buttons under 24x24 px (WCAG 2.2 minimum target size), inline links in text excluded
Runs in a visible Chrome window by default (pass --headless to hide it). The Cloudflare analytics beacon is blocked
so test visits never count as real users.

Usage: python scripts/mobile_check.py [--site URL] [--widths 320,390] [--limit N] [--only /path,...] [--headless]
Writes mobile-report.json next to this script's working directory.
"""
import argparse
import json
import re
import sys
import urllib.request

from playwright.sync_api import sync_playwright

CHECK_JS = r"""
() => {
  const vw = document.documentElement.clientWidth;
  const out = { scrollWidth: document.documentElement.scrollWidth, vw, overflow: [], smallText: 0, smallTextSample: [], smallTargets: [] };
  const scrollable = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (/(auto|scroll|hidden)/.test(s.overflowX) && p !== document.body && p !== document.documentElement) return true;
    }
    return false;
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none" || +s.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const label = (el) => (el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "")).slice(0, 80);
  for (const el of document.body.querySelectorAll("*")) {
    if (!visible(el)) continue;
    if (el.closest(".hp, [aria-hidden='true'], .sr-only")) continue;
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1) && !scrollable(el)) out.overflow.push({ el: label(el), left: Math.round(r.left), right: Math.round(r.right), text: (el.innerText || "").trim().slice(0, 40) });
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (hasText) {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 12) { out.smallText++; if (out.smallTextSample.length < 3) out.smallTextSample.push(label(el) + " " + fs + "px"); }
    }
    if (el.matches("a[href], button, input:not([type=hidden]), select, textarea, [role=button]")) {
      const inText = el.tagName === "A" && el.parentElement && /^(P|LI|TD|SPAN|EM|STRONG)$/.test(el.parentElement.tagName) && el.parentElement.innerText.trim().length > (el.innerText || "").trim().length + 5;
      if (!inText && (r.width < 24 || r.height < 24)) out.smallTargets.push(label(el) + " " + Math.round(r.width) + "x" + Math.round(r.height) + " '" + (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 20) + "'");
    }
  }
  // keep only the outermost overflowing elements
  out.overflow = out.overflow.slice(0, 6);
  return out;
}
"""


def urls_from_sitemap(site):
    # The sitemap lists production URLs; rewrite them so a preview deployment can be checked too.
    req = urllib.request.Request(f"{site}/sitemap.txt", headers={"user-agent": "devladder-mobile-check"})
    txt = urllib.request.urlopen(req, timeout=30).read().decode()
    return [re.sub(r"^https://[^/]+", site, u.strip()) for u in txt.splitlines() if u.strip().startswith("http")]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", default="https://devladder.pages.dev")
    ap.add_argument("--widths", default="320,390")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--only", default="")
    ap.add_argument("--headless", action="store_true")
    a = ap.parse_args()
    widths = [int(w) for w in a.widths.split(",")]
    urls = [a.site + p for p in a.only.split(",")] if a.only else urls_from_sitemap(a.site)
    if a.limit:
        urls = urls[: a.limit]
    report = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=a.headless, channel="chrome")
        for w in widths:
            ctx = browser.new_context(viewport={"width": w, "height": 800}, device_scale_factor=2, is_mobile=True, has_touch=True,
                                      user_agent="Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36 devladder-mobile-check")
            ctx.route(re.compile(r".*(cloudflareinsights\.com|beacon|googlesyndication|doubleclick|adservice).*"), lambda r: r.abort())
            page = ctx.new_page()
            for i, u in enumerate(urls, 1):
                try:
                    page.goto(u, wait_until="load", timeout=45000)
                    page.wait_for_timeout(150)
                    res = page.evaluate(CHECK_JS)
                except Exception as e:  # noqa: BLE001
                    res = {"error": str(e)[:200]}
                res.update(url=u, width=w)
                bad = res.get("error") or res.get("scrollWidth", 0) > res.get("vw", 0) + 1 or res.get("overflow") or res.get("smallText") or res.get("smallTargets")
                if bad:
                    report.append(res)
                if i % 100 == 0:
                    print(f"{w}px: {i}/{len(urls)} checked, {len(report)} with issues so far", flush=True)
            ctx.close()
        browser.close()
    json.dump(report, open("mobile-report.json", "w", encoding="utf-8"), indent=1)
    sideways = [r for r in report if r.get("scrollWidth", 0) > r.get("vw", 0) + 1 or r.get("overflow")]
    print(f"\nPages x widths checked: {len(urls) * len(widths)}")
    print(f"Sideways overflow: {len(sideways)}  Small text pages: {sum(1 for r in report if r.get('smallText'))}  "
          f"Small tap targets pages: {sum(1 for r in report if r.get('smallTargets'))}  Errors: {sum(1 for r in report if r.get('error'))}")
    sys.exit(1 if sideways else 0)


if __name__ == "__main__":
    main()
