"""Page-speed watcher: loads key DevLadder pages in Chrome like a mid-range phone on 4G and measures the Core Web
Vitals Google ranks on: LCP (main content shown), CLS (layout jumping) and TBT (main-thread blocking, the lab stand-in
for INP). Prints a report and exits 1 if any page is outside Google's "good" range, so it can fail a deploy or a
scheduled CI run.

Usage: python scripts/vitals_check.py [--site https://devladder.pages.dev] [--desktop]
Needs: pip install playwright && python -m playwright install chromium
"""
import argparse
import json
import sys

from playwright.sync_api import sync_playwright

PAGES = [
    "/",
    "/courses/csharp/lessons/what-csharp-and-dotnet-are",
    "/courses/sqlserver",
    "/interview-questions",
    "/courses/csharp/interview",
]
# Google's "good" thresholds. LCP and CLS fail the check; TBT is a lab-only proxy for INP (real-visitor INP is in
# Cloudflare Web Analytics) and the AdSense script alone adds ~300 ms of it on a throttled phone, so it only warns.
GOOD = {"lcp_ms": 2500, "cls": 0.1}
WARN = {"tbt_ms": 600}

OBSERVE = """
window.__v = { lcp: 0, cls: 0, tbt: 0 };
new PerformanceObserver(l => { for (const e of l.getEntries()) window.__v.lcp = e.startTime; })
  .observe({ type: 'largest-contentful-paint', buffered: true });
new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__v.cls += e.value; })
  .observe({ type: 'layout-shift', buffered: true });
new PerformanceObserver(l => { for (const e of l.getEntries()) window.__v.tbt += Math.max(0, e.duration - 50); })
  .observe({ type: 'longtask', buffered: true });
"""


def measure(browser, url, desktop):
    ctx = browser.new_context(
        viewport={"width": 1350, "height": 940} if desktop else {"width": 412, "height": 823},
        device_scale_factor=1 if desktop else 2.6, is_mobile=not desktop, has_touch=not desktop,
    )
    # Don't let these deliberately slowed test loads count as real visitors in Cloudflare Web Analytics.
    ctx.route("**/*cloudflareinsights.com/**", lambda r: r.abort())
    page = ctx.new_page()
    cdp = ctx.new_cdp_session(page)
    if not desktop:  # Lighthouse-like mobile: 4x slower CPU, ~1.6 Mbps / 150 ms network
        cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
        cdp.send("Network.enable")
        cdp.send("Network.emulateNetworkConditions",
                 {"offline": False, "latency": 150, "downloadThroughput": 1.6 * 1024 * 1024 / 8, "uploadThroughput": 750 * 1024 / 8})
    page.add_init_script(OBSERVE)
    # Warm the CDN edge first: right after a deploy the very first request is a cache miss that real visitors rarely see.
    page.request.get(url, timeout=90000)
    resp = page.goto(url, wait_until="load", timeout=90000)
    page.wait_for_timeout(4000)  # let late shifts (ads, fonts) happen
    v = page.evaluate("window.__v")
    size = page.evaluate("performance.getEntriesByType('navigation')[0]?.transferSize || 0")
    ctx.close()
    return {"url": url, "status": resp.status if resp else 0, "lcp_ms": round(v["lcp"]), "cls": round(v["cls"], 3),
            "tbt_ms": round(v["tbt"]), "html_kb": round(size / 1024)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", default="https://devladder.pages.dev")
    ap.add_argument("--desktop", action="store_true")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        results = [measure(browser, a.site.rstrip("/") + path, a.desktop) for path in PAGES]
        browser.close()
    bad = []
    for r in results:
        r["problems"] = [k for k, limit in GOOD.items() if r[k] > limit] + (["http"] if r["status"] != 200 else [])
        r["warnings"] = [k for k, limit in WARN.items() if r[k] > limit]
        if r["problems"]:
            bad.append(r)
    if a.json:
        print(json.dumps(results, indent=2))
    else:
        print(f"{'mobile' if not a.desktop else 'desktop'} | fail if LCP>{GOOD['lcp_ms']}ms or CLS>{GOOD['cls']}; warn if TBT>{WARN['tbt_ms']}ms")
        for r in results:
            flag = "FAIL" if r["problems"] else "WARN" if r["warnings"] else "OK  "
            print(f"{flag} LCP {r['lcp_ms']:>5}ms  CLS {r['cls']:<6} TBT {r['tbt_ms']:>4}ms  HTML {r['html_kb']:>4}KB  {r['url']}"
                  + (f"  <- {', '.join(r['problems'] + r['warnings'])}" if r["problems"] or r["warnings"] else ""))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
