---
slug: html-css
title: HTML5 & CSS3 — Semantic Markup to Responsive Layouts
track: frontend
order: 1
group: Web Basics
icon: H5
color: #e34f26
summary: Document structure, semantic HTML, forms and accessibility, the CSS cascade and specificity, the box model, Flexbox and Grid, responsive design with media and container queries, CSS variables, Bootstrap/Tailwind and the HTML/CSS interview questions.
---

# Overview

**HTML** (HyperText Markup Language) describes the **structure and meaning** of a page; **CSS** (Cascading Style Sheets) describes **how it looks**; JavaScript adds behaviour. Every frontend framework (Angular, React, Vue) still renders HTML and CSS, so these basics are asked in every frontend and full stack interview.

| Topic | What interviewers check |
|---|---|
| Semantic HTML | `header`, `nav`, `main`, `article`, `section`, `footer` instead of div soup |
| Forms | Labels, input types, validation attributes |
| Accessibility (a11y) | Alt text, labels, keyboard use, ARIA only when needed |
| Cascade & specificity | Why a style does or doesn't apply |
| Box model | `content-box` vs `border-box`, margin collapsing |
| Layout | Flexbox (1-D) vs Grid (2-D), positioning |
| Responsive design | Mobile-first media queries, fluid units, container queries |

# Versions

| Year | Milestone |
|---|---|
| 1991–1999 | HTML 1 → HTML 4.01; CSS1 (1996), CSS2 (1998) |
| 2000s | XHTML; table layouts give way to floats |
| 2011–2012 | CSS split into modules ("CSS3"): media queries, flexbox drafts, transitions |
| 2014 | HTML5 a W3C Recommendation; now the **HTML Living Standard** (WHATWG) |
| 2017 | CSS Grid ships in all major browsers; CSS custom properties widely supported |
| 2022–2023 | Container queries, `:has()`, cascade layers (`@layer`), native CSS nesting |
| 2024–2025 | Popover API, `<dialog>`, anchor positioning, view transitions, `@scope` reaching browsers |

Frameworks: Bootstrap 5 (2021, no jQuery), Tailwind CSS 4 (2025, CSS-first config).

# Lifecycle

**How the browser turns HTML + CSS into pixels (critical rendering path):**

1. Download HTML → parse into the **DOM** tree.
2. Download CSS → parse into the **CSSOM**.
3. Combine into the **render tree** (only visible nodes with computed styles).
4. **Layout** (reflow) — compute size and position of every box.
5. **Paint** — fill pixels (text, colours, borders, shadows).
6. **Composite** — layers combined on the GPU.

CSS is **render-blocking** and synchronous `<script>` is **parser-blocking** — so put CSS in `<head>`, use `defer`/`type="module"` for scripts, and animate `transform`/`opacity` (composite only) rather than `width`/`top` (layout every frame).

# Tools

- **Browser DevTools** — Elements (box model, computed styles, Flexbox/Grid overlays), Lighthouse (performance, accessibility, SEO), device toolbar for responsive testing.
- **Editors** — VS Code with Emmet, Prettier, stylelint.
- **CSS tooling** — Sass/SCSS, PostCSS + Autoprefixer, CSS Modules.
- **Frameworks** — Bootstrap, Tailwind CSS, Angular Material, MUI.
- **Accessibility** — axe DevTools, WAVE, screen readers (NVDA, VoiceOver).
- **Reference** — MDN Web Docs, caniuse.com.

# Module: HTML Foundations

## Lesson: [Basic|High] Document structure and semantic HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Orders — Divakar Shop</title>
  <link rel="stylesheet" href="styles.css">
  <script src="app.js" defer></script>
</head>
<body>
  <header><nav aria-label="Main"><a href="/">Home</a> <a href="/orders">Orders</a></nav></header>
  <main>
    <article>
      <h1>Order #1001</h1>
      <section><h2>Items</h2> …</section>
    </article>
    <aside>Related offers</aside>
  </main>
  <footer>© 2026</footer>
</body>
</html>
```

**Why semantic tags matter:** screen readers use them as landmarks, search engines understand the content, and code is easier to read. `<div>` and `<span>` have no meaning — use them only for styling hooks.

| Element | Meaning |
|---|---|
| `header` / `footer` | Intro / closing content of a page or section |
| `nav` | Major navigation links |
| `main` | The unique main content (one per page) |
| `article` | Self-contained content (post, product card) |
| `section` | Thematic group with a heading |
| `aside` | Related but secondary content |
| `h1`–`h6` | Heading hierarchy — don't skip levels for styling |

**Block vs inline:** block elements (`div`, `p`, `h1`, `section`) start on a new line and take full width; inline elements (`span`, `a`, `strong`) flow within text and ignore width/height; `inline-block` flows inline but accepts width/height.

## Lesson: [Basic|High] Forms, input types and validation

```html
<form action="/api/register" method="post" novalidate>
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required autocomplete="email">

  <label for="age">Age</label>
  <input id="age" name="age" type="number" min="18" max="99">

  <label for="phone">Phone</label>
  <input id="phone" name="phone" type="tel" pattern="[0-9]{10}" placeholder="10 digits">

  <fieldset>
    <legend>Plan</legend>
    <label><input type="radio" name="plan" value="basic" checked> Basic</label>
    <label><input type="radio" name="plan" value="pro"> Pro</label>
  </fieldset>

  <select name="country"><option value="IN">India</option><option value="TW">Taiwan</option></select>
  <textarea name="notes" rows="3"></textarea>
  <button type="submit">Register</button>
</form>
```

- Every input needs a `<label>` (`for` = input `id`) — clicking the label focuses the input and screen readers announce it.
- HTML5 types (`email`, `number`, `date`, `tel`, `url`) give mobile keyboards and built-in validation.
- Constraint attributes: `required`, `min`, `max`, `minlength`, `maxlength`, `pattern`.
- `GET` puts data in the URL (search forms); `POST` sends it in the body (create/change data).
- **Client-side validation is for UX only — always validate again on the server.**

## Lesson: [Basic|High] Accessibility essentials

- Meaningful `alt` text on images (`alt=""` for decorative ones).
- Use real `<button>` for actions and `<a href>` for navigation — they work with the keyboard for free.
- Visible focus styles; logical tab order; never `outline: none` without a replacement.
- Colour contrast at least **4.5:1** for normal text (WCAG AA).
- Headings in order; `lang` on `<html>`; labels on all form fields.
- **ARIA** only when native HTML can't express it: `aria-label`, `aria-expanded`, `aria-live="polite"` for status messages, `role="dialog"`. "No ARIA is better than bad ARIA."

```html
<button aria-expanded="false" aria-controls="menu">Menu</button>
<ul id="menu" hidden>…</ul>
<div aria-live="polite" id="status"></div>   <!-- screen readers announce updates -->
```

# Module: CSS Fundamentals

## Lesson: [Basic|High] Selectors, the cascade and specificity

```css
p { }                 /* type */
.card { }             /* class */
#main { }             /* id */
a:hover { }           /* pseudo-class */
p::first-line { }     /* pseudo-element */
nav > a { }           /* direct child */
h2 + p { }            /* adjacent sibling */
input[type="email"] { }   /* attribute */
.card:has(img) { }    /* parent selector (modern) */
```

**Which rule wins?** The cascade, in order:

1. Origin and importance (`!important` beats normal; user-agent < author).
2. **Cascade layers** (`@layer`) order.
3. **Specificity** — (ids, classes/attributes/pseudo-classes, elements):

| Selector | Specificity |
|---|---|
| `p` | 0,0,1 |
| `.card p` | 0,1,1 |
| `#main .card p` | 1,1,1 |
| inline `style=""` | beats all selectors |

4. **Source order** — later wins when specificity is equal.

**Inheritance:** text properties (`color`, `font-*`, `line-height`) inherit; box properties (`margin`, `border`, `width`) don't.

> **Interview tip:** Avoid `!important` and id selectors for styling — keep specificity low and flat (classes), so styles are easy to override.

## Lesson: [Basic|High] The box model, units and positioning

Every element is a box: **content → padding → border → margin**.

```css
*, *::before, *::after { box-sizing: border-box; }   /* width includes padding + border — the modern default */
.card { width: 300px; padding: 16px; border: 1px solid #ddd; margin: 12px; }
/* content-box: rendered width = 300 + 32 + 2 = 334px;  border-box: rendered width = 300px */
```

**Margin collapsing:** vertical margins of adjacent blocks combine into the larger one (not in flex/grid containers).

| Unit | Relative to | Use |
|---|---|---|
| `px` | Fixed | Borders, small details |
| `rem` | Root font size | Font sizes, spacing (respects user zoom settings) |
| `em` | Parent/element font size | Padding that scales with its text |
| `%` | Parent | Fluid widths |
| `vw` / `vh` / `dvh` | Viewport (dynamic viewport for mobile bars) | Full-screen sections |
| `fr` | Free space in Grid | Grid columns |
| `ch` | Width of "0" | Readable line length (`max-width: 70ch`) |

**Position:**

| Value | Behaviour |
|---|---|
| `static` | Normal flow (default) |
| `relative` | Offset from its normal place; becomes containing block for absolute children |
| `absolute` | Removed from flow; positioned to nearest positioned ancestor |
| `fixed` | Relative to the viewport (stays when scrolling) |
| `sticky` | Normal until a scroll threshold, then sticks (`top: 0`) |

`z-index` works only on positioned (or flex/grid) elements and within its **stacking context**.

# Module: Layout and Responsive Design

## Lesson: [Intermediate|High] Flexbox — one-dimensional layout

```css
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.toolbar .search { flex: 1; min-width: 200px; }   /* grow to fill free space */
```

| Property (container) | Does |
|---|---|
| `flex-direction` | `row` / `column` — sets the **main axis** |
| `justify-content` | Align on the main axis (`flex-start`, `center`, `space-between`) |
| `align-items` | Align on the cross axis (`stretch`, `center`) |
| `flex-wrap` | Allow items onto new lines |
| `gap` | Space between items |

| Property (item) | Does |
|---|---|
| `flex: 1` | Shorthand for grow 1, shrink 1, basis 0 — share space equally |
| `flex: 0 0 200px` | Fixed 200px, no grow/shrink |
| `align-self` / `order` | Override alignment / visual order |

Classic: perfectly centre anything — `display:flex; justify-content:center; align-items:center;` (or Grid `place-items:center`).

## Lesson: [Intermediate|High] CSS Grid — two-dimensional layout

```css
.page {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  min-height: 100dvh;
}
header { grid-area: header; }  aside { grid-area: sidebar; }  main { grid-area: main; }  footer { grid-area: footer; }

/* Responsive card grid with no media queries */
.cards { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
```

**Flexbox vs Grid:** Flexbox lays out along **one** axis and sizes from the content (toolbars, nav bars, button groups). Grid controls **rows and columns together** from the container (page layouts, card grids, forms). They combine well: Grid for the page, Flexbox inside components.

## Lesson: [Intermediate|High] Responsive design — mobile first, media and container queries

1. `<meta name="viewport" content="width=device-width, initial-scale=1">` — without it phones render a zoomed-out desktop page.
2. **Mobile first:** base styles for small screens, then `min-width` media queries add layout for larger ones.
3. Fluid layouts: `%`, `fr`, `minmax()`, `clamp()`, `max-width` instead of fixed widths.
4. Responsive images: `max-width: 100%; height: auto;`, `srcset`/`sizes`, `<picture>`, `loading="lazy"`.

```css
.layout { display: grid; gap: 16px; }                        /* phone: one column */
@media (min-width: 768px)  { .layout { grid-template-columns: 1fr 1fr; } }      /* tablet */
@media (min-width: 1200px) { .layout { grid-template-columns: 250px 1fr 300px; } } /* desktop */

h1 { font-size: clamp(1.5rem, 1rem + 2vw, 2.5rem); }        /* fluid type, no breakpoints */

/* Container query: a card adapts to the space it is placed in, not the viewport */
.card-wrap { container-type: inline-size; }
@container (min-width: 400px) { .card { display: flex; gap: 12px; } }

@media (prefers-color-scheme: dark) { :root { --bg: #111; --text: #eee; } }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
```

Common breakpoints (Bootstrap 5): 576, 768, 992, 1200, 1400 px — but choose breakpoints where **your content** breaks.

# Module: Modern CSS and Frameworks

## Lesson: [Intermediate|Medium] Variables, transitions, animations and modern selectors

```css
:root { --brand: #3b5bdb; --radius: 12px; --space: 16px; }
.btn { background: var(--brand); border-radius: var(--radius); padding: calc(var(--space) / 2) var(--space);
       transition: transform .15s ease, box-shadow .15s ease; }
.btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgb(0 0 0 / 15%); }

@keyframes spin { to { transform: rotate(360deg); } }
.loader { animation: spin 1s linear infinite; }

/* Native nesting and :has() */
.card {
  padding: var(--space);
  & h3 { margin: 0; }
  &:has(img) { padding-top: 0; }
}
```

**Custom properties vs Sass variables:** CSS variables are live at runtime (change them with JS or media queries, they inherit and cascade — ideal for theming/dark mode); Sass variables are replaced at compile time.

**Hiding things:** `display: none` (removed from layout and accessibility tree), `visibility: hidden` (keeps space), `opacity: 0` (keeps space, still clickable), visually-hidden class (hidden visually, still read by screen readers).

## Lesson: [Intermediate|Medium] Bootstrap, Tailwind and CSS architecture

| Approach | Example | Pros | Cons |
|---|---|---|---|
| Component framework | Bootstrap 5 | Fast, consistent grid and components | Sites look alike, heavier CSS |
| Utility-first | Tailwind CSS | No naming, small production CSS, design tokens | Long class lists in markup |
| Methodology | BEM (`.card__title--active`) | Predictable, low specificity | Verbose names |
| Scoped CSS | CSS Modules, Angular view encapsulation, Vue `scoped` | No global leaks | Tooling-specific |

```html
<!-- Bootstrap grid -->
<div class="container"><div class="row"><div class="col-12 col-md-6 col-lg-4">Card</div></div></div>
<!-- Tailwind -->
<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div class="rounded-xl p-4 shadow">Card</div></div>
```

## Lesson: [Advanced|Medium] Performance and SEO for HTML/CSS

- Critical CSS inline / small CSS bundles; remove unused CSS (Tailwind does this automatically).
- `<script defer>` or `type="module"`; avoid render-blocking third-party scripts.
- Images: modern formats (WebP/AVIF), correct sizes, `width`/`height` attributes to prevent layout shift, `loading="lazy"` below the fold.
- Fonts: `font-display: swap`, preload the main font, limit weights.
- Core Web Vitals: **LCP** (largest content paint ≤ 2.5 s), **INP** (interaction to next paint ≤ 200 ms), **CLS** (layout shift ≤ 0.1).
- SEO basics: unique `<title>` and meta description, one `h1`, semantic structure, descriptive link text, `alt` text, canonical URLs, Open Graph tags for sharing.

# Interview

## [Beginner|High] What is semantic HTML and why is it important?

Using elements that describe meaning — `header`, `nav`, `main`, `article`, `section`, `aside`, `footer`, `button`, headings — instead of generic `div`/`span`. Benefits: accessibility (screen readers use landmarks and roles), SEO (search engines understand structure), built-in behaviour (buttons are focusable and keyboard-operable), and readable code.

## [Beginner|High] Explain the CSS box model. What does box-sizing: border-box do?

Each element is content + padding + border + margin. With the default `content-box`, `width` sets only the content, so padding and border are added on top. With `border-box`, `width` includes content, padding and border, which makes sizing predictable — most projects set it globally.

## [Beginner|High] What is CSS specificity? Which rule wins?

Specificity scores selectors as (ids, classes/attributes/pseudo-classes, elements); higher wins, inline styles beat selectors, `!important` beats normal declarations, and with equal specificity the later rule wins. Example: `#nav a` (1,0,1) beats `.menu a.active` (0,2,1). Keep specificity low with classes to avoid override wars.

## [Beginner|High] Flexbox vs Grid — when do you use each?

Flexbox is one-dimensional (a row or a column), content-driven — nav bars, toolbars, centring, distributing items. Grid is two-dimensional (rows and columns together), container-driven — page layouts, card galleries, forms. Often Grid for the overall layout and Flexbox inside components.

## [Beginner|High] How do you centre a div horizontally and vertically?

Flexbox: parent `display:flex; justify-content:center; align-items:center;`. Grid: parent `display:grid; place-items:center;`. Horizontal only for a block with a width: `margin: 0 auto`. Absolute: `position:absolute; inset:0; margin:auto;` with a set size, or `top:50%; left:50%; transform:translate(-50%,-50%)`.

## [Beginner|Medium] Difference between display: none, visibility: hidden and opacity: 0?

`display:none` removes the element from layout and the accessibility tree. `visibility:hidden` hides it but keeps its space and it can't be clicked. `opacity:0` makes it transparent but it keeps its space and still receives clicks and focus.

## [Beginner|Medium] What are the different position values?

`static` (default flow), `relative` (offset from its normal place, anchor for absolute children), `absolute` (out of flow, relative to nearest positioned ancestor), `fixed` (relative to the viewport), `sticky` (behaves relative until a scroll offset, then fixed within its container).

## [Intermediate|High] How do you make a website responsive?

Viewport meta tag, mobile-first CSS with `min-width` media queries, fluid layouts (Flexbox/Grid, `%`, `fr`, `minmax`, `clamp`), responsive images (`max-width:100%`, `srcset`, `<picture>`), relative units (`rem`), container queries for reusable components, testing on real devices and DevTools device mode, and avoiding fixed widths and horizontal scroll.

## [Intermediate|High] What are media queries and container queries?

Media queries apply styles based on the viewport/device (`@media (min-width: 768px)`, `prefers-color-scheme`, `prefers-reduced-motion`, print). Container queries apply styles based on the size of a parent container (`container-type: inline-size; @container (min-width: 400px)`), so a component adapts wherever it is placed — e.g. a card in a narrow sidebar vs a wide main area.

## [Intermediate|High] How do you make a web page accessible?

Semantic HTML, labels for inputs, `alt` text, real buttons/links, keyboard navigation with visible focus, colour contrast ≥ 4.5:1, logical heading order, `lang` attribute, ARIA only where native HTML can't (live regions, expanded states), respect reduced motion, and test with Lighthouse/axe and a screen reader. Target WCAG 2.1/2.2 AA.

## [Intermediate|Medium] What is the difference between em, rem, %, vw and px?

`px` is fixed; `em` is relative to the element's/parent's font size (compounds when nested); `rem` is relative to the root font size (predictable, respects user font settings); `%` is relative to the parent dimension; `vw`/`vh` are 1% of the viewport width/height (`dvh` accounts for mobile browser bars).

## [Intermediate|Medium] CSS variables vs Sass variables?

CSS custom properties exist at runtime: they cascade and inherit, can be changed by media queries, classes or JavaScript — perfect for themes and dark mode. Sass variables are compile-time constants, replaced in the output CSS; useful for build-time logic (loops, mixins), but cannot change in the browser.

## [Intermediate|Medium] What is the critical rendering path and how do you optimise it?

HTML → DOM, CSS → CSSOM, combined into the render tree → layout → paint → composite. CSS blocks rendering and sync scripts block parsing. Optimise: small/critical CSS first, `defer` scripts, preload key fonts/images, compress and size images, avoid layout shifts by setting dimensions, animate `transform`/`opacity`.

## [Advanced|Medium] What is a stacking context and why does z-index sometimes not work?

A stacking context is an isolated layering group; `z-index` only compares elements within the same context. New contexts are created by positioned elements with `z-index`, `opacity < 1`, `transform`, `filter`, `isolation: isolate` and others. A child with `z-index: 9999` can't escape a parent context that is below another element — fix the parent's stacking, not the child's number.

## [Advanced|Medium] What are Core Web Vitals?

Google's user-experience metrics: LCP (Largest Contentful Paint — loading, good ≤ 2.5 s), INP (Interaction to Next Paint — responsiveness, good ≤ 200 ms; replaced FID in 2024) and CLS (Cumulative Layout Shift — visual stability, good ≤ 0.1). Improve with optimised images and fonts, less JavaScript, and fixed dimensions for media and ads.

## [Scenario|High] The layout looks fine on desktop but has a horizontal scrollbar on mobile. How do you find and fix it?

Use DevTools device mode and find the element wider than the viewport (temporarily `* { outline: 1px solid red }`, or check elements whose right edge exceeds the width). Usual causes: fixed widths (`width: 500px`), long unbroken text/URLs (`overflow-wrap: anywhere`), images without `max-width:100%`, `100vw` with a scrollbar, negative margins, tables and code blocks (wrap them in an `overflow-x:auto` container), and grid/flex children that can't shrink (`min-width: 0` on grid/flex items, `minmax(0, 1fr)`).

## [Scenario|Medium] A designer wants a card grid that shows 1 column on phones, 2 on tablets and 4 on desktop. Write the CSS.

```css
.cards { display: grid; gap: 16px; grid-template-columns: 1fr; }
@media (min-width: 640px)  { .cards { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1100px) { .cards { grid-template-columns: repeat(4, 1fr); } }
```

Or without breakpoints: `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));` — columns appear as space allows.

## [Scenario|Medium] Your page jumps around while loading (high CLS). What do you fix?

Set `width`/`height` (or `aspect-ratio`) on images, videos and iframes; reserve space for ads, banners and late-loading components (skeletons); use `font-display: swap` with similar fallback fonts or `size-adjust`; don't insert content above existing content after load; animate with `transform` instead of changing layout properties.

# Cheatsheet

## Semantic skeleton

`header > nav` · `main > article > section` · `aside` · `footer` · one `h1`, headings in order · `button` for actions, `a` for navigation · labels for every input.

## Specificity

inline > id (1,0,0) > class/attr/pseudo-class (0,1,0) > element (0,0,1); equal → last wins; `!important` overrides; `@layer` order before specificity.

## Layout picks

| Need | Use |
|---|---|
| Row of items, centring | Flexbox |
| Page layout, card grid | Grid |
| Auto-responsive grid | `repeat(auto-fill, minmax(220px, 1fr))` |
| Sticky header | `position: sticky; top: 0` |
| Fluid font | `clamp(min, preferred, max)` |

## Responsive checklist

Viewport meta · mobile-first `min-width` queries · no fixed widths · `max-width:100%` images · `min-width:0` on grid/flex children · overflow wrappers for tables/code · container queries for components · test 320 → 1920 px.

## Accessibility checklist

Alt text · labels · keyboard + visible focus · contrast 4.5:1 · `lang` · landmarks · ARIA only when needed · `prefers-reduced-motion`.
