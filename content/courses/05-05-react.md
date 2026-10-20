---
slug: react
title: React (with Hooks, React 19 & Next.js basics)
track: frontend
order: 5
icon: Re
color: #0ea5e9
summary: JSX, components and props, state, events, conditional rendering and lists, hooks in depth, effects and data fetching, forms, context, reducers, refs, performance (memo, useMemo, useCallback, React Compiler), routing, state libraries, React 19 actions and Server Components, testing and Next.js.
---

# Overview

**React** is a JavaScript library for building user interfaces from **components**, created at **Facebook (Meta)** by Jordan Walke and open-sourced in 2013. It is the most widely used frontend library.

Core ideas:

- **Declarative UI** — describe what the UI should look like for a given state; React updates the DOM.
- **Components** — functions returning **JSX**; compose them like building blocks.
- **One-way data flow** — data flows down via **props**; events flow up via callbacks.
- **State + re-render** — when state changes, React re-renders the component and **reconciles** the result against the previous render, updating only what changed in the DOM.
- **Hooks** (2019) — state and side effects in function components.
- **"Learn once, write anywhere"** — React DOM (web), React Native (mobile), React Server Components.

React is a *library*; for routing, data fetching, SSR and bundling you add tools or use a **framework** such as **Next.js** or **React Router (framework mode, formerly Remix)** — the React docs recommend starting new apps with a framework (or Vite for a pure client app). Create React App was **deprecated in February 2025**.

# Versions

| Version | Date | Highlights |
|---|---|---|
| 0.3 | May 2013 | Open-sourced at JSConf US |
| 0.14 | 2015 | `react` / `react-dom` split, stateless function components |
| 15 | Apr 2016 | Version jump from 0.14; `createElement` DOM rendering |
| **16** | Sep 2017 | **Fiber** reconciler, fragments, error boundaries, portals; 16.3 new Context API; **16.8 (Feb 2019) Hooks** |
| 17 | Oct 2020 | No new features — gradual upgrades, new JSX transform (no `import React` needed) |
| **18** | Mar 2022 | **Concurrent rendering**, `createRoot`, **automatic batching**, `useTransition`, `useDeferredValue`, `useId`, streaming SSR with Suspense |
| **19** | Dec 2024 | **Actions**, `useActionState`, `useOptimistic`, `use()`, form `action`, `ref` as a prop, Server Components & Server Actions stable, document metadata, resource preloading |
| 19.1 / 19.2 | 2025 | Owner stacks; 19.2 (Oct 2025): `<Activity>`, `useEffectEvent`, partial pre-rendering, `cacheSignal` |

Ecosystem milestones: **React Compiler 1.0** (Oct 2025 — automatic memoisation), React Native New Architecture default (0.76, 2024), React and React Native moved to the **React Foundation** under the Linux Foundation (announced Oct 2025). Next.js: 13 (App Router, 2022), 14, 15 (2024, React 19), 16 (2025, Turbopack default).

# Lifecycle

**Component lifecycle (function components):**

1. **Mount** — React calls the component function (render) → commits DOM → runs `useLayoutEffect` → browser paints → runs `useEffect` callbacks.
2. **Update** — triggered by a state change, new props from the parent re-rendering, or a context change → render again → React **diffs** the new element tree with the old one (reconciliation) → commits minimal DOM changes → runs effect **cleanups** for changed dependencies, then the new effects.
3. **Unmount** — effect cleanups run (unsubscribe, clear timers).

In development **Strict Mode** mounts components twice (mount → unmount → mount) to reveal missing cleanups.

**Class component lifecycle (legacy):** `constructor` → `render` → `componentDidMount` | updates: `shouldComponentUpdate` → `render` → `getSnapshotBeforeUpdate` → `componentDidUpdate` | `componentWillUnmount` | errors: `getDerivedStateFromError`, `componentDidCatch`.

| Class method | Hook equivalent |
|---|---|
| `componentDidMount` | `useEffect(() => {...}, [])` |
| `componentDidUpdate` | `useEffect(() => {...}, [deps])` |
| `componentWillUnmount` | cleanup returned from `useEffect` |
| `shouldComponentUpdate` | `React.memo` |
| `this.state` / `setState` | `useState` / `useReducer` |

**Render phases:** **render phase** (pure — call components, compute the tree; can be paused/interrupted in concurrent mode) → **commit phase** (apply DOM mutations, run layout effects, then passive effects).

# Tools

| Tool | Use |
|---|---|
| **Vite** (`npm create vite@latest`) | Fast client-side React setup |
| **Next.js**, React Router (framework), Expo (React Native) | Frameworks |
| React Developer Tools (browser extension) | Component tree, props/state, profiler |
| TypeScript | Typed props/state |
| ESLint + `eslint-plugin-react-hooks` | Rules of Hooks, exhaustive deps |
| React Compiler (babel/SWC plugin) | Automatic memoisation |
| TanStack Query, SWR, RTK Query | Server-state fetching & caching |
| Redux Toolkit, Zustand, Jotai | Client state |
| React Hook Form + Zod | Forms and validation |
| Tailwind CSS, CSS Modules, shadcn/ui, MUI, Chakra | Styling and UI kits |
| Vitest/Jest + **React Testing Library**, Playwright | Testing |
| Storybook | Component development in isolation |

# Module: Fundamentals

## Lesson: [Basic|High] JSX, components and props

```jsx
// JSX compiles to function calls: <h1 className="t">Hi</h1>  →  jsx("h1", { className: "t", children: "Hi" })
function OrderCard({ order, onSelect }) {            // props are read-only
  const isBig = order.total > 10000;
  return (
    <div className={`card ${isBig ? "big" : ""}`} onClick={() => onSelect(order.id)}>
      <h3>#{order.id} — {order.customer}</h3>
      <p>{order.total.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</p>
    </div>
  );
}

function OrderList({ orders }) {
  return (
    <>                                               {/* Fragment: no extra DOM node */}
      {orders.map(o => (
        <OrderCard key={o.id} order={o} onSelect={id => console.log(id)} />
      ))}
    </>
  );
}
```

JSX rules: one root element (or fragment), `className` not `class`, `htmlFor`, camelCase attributes (`onClick`, `tabIndex`), `{}` for JavaScript expressions, self-close empty tags, `style={{ color: "red" }}`. JSX **escapes** values by default (XSS-safe); `dangerouslySetInnerHTML` bypasses that.

`children` prop for composition: `<Card><p>Body</p></Card>` → `function Card({ children }) { return <div className="card">{children}</div>; }`.

## Lesson: [Basic|High] State with useState and event handling

```jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  const [form, setForm] = useState({ name: "", email: "" });

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>Clicked {count} times</button>   {/* functional update */}
      <input
        value={form.name}
        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}    // immutable update
      />
    </>
  );
}
```

- State updates are **asynchronous and batched** — `count` doesn't change until the next render. Use the **functional form** (`c => c + 1`) when the new value depends on the old one.
- Never mutate state (`form.name = "x"`); create new objects/arrays (`[...items, newItem]`, `items.filter(...)`, `items.map(...)`).
- Lazy initial state for expensive computation: `useState(() => loadFromStorage())`.
- Events are React **synthetic events** wrapping native ones; `e.preventDefault()` for forms.

## Lesson: [Basic|High] Conditional rendering and lists with keys

```jsx
{isLoading ? <Spinner /> : <OrderTable orders={orders} />}
{error && <p className="error">{error.message}</p>}
{orders.length === 0 && <EmptyState />}            {/* careful: {0 && <X/>} renders "0" — use length > 0 */}

<ul>
  {todos.map(todo => <TodoItem key={todo.id} todo={todo} />)}
</ul>
```

**Keys** let React match list items between renders. Use a **stable, unique ID** from data. Using the array index as key breaks state and animations when items are inserted, removed or reordered (inputs keep the wrong value).

## Lesson: [Basic|High] Controlled vs uncontrolled forms

```jsx
// Controlled: React state is the source of truth
function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  function handleSubmit(e) {
    e.preventDefault();
    if (!email.includes("@")) return setError("Enter a valid email");
    onLogin(email);
  }
  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      {error && <span role="alert">{error}</span>}
      <button>Login</button>
    </form>
  );
}

// Uncontrolled: the DOM holds the value; read it with a ref or FormData
function SearchForm() {
  const inputRef = useRef(null);
  return <form onSubmit={e => { e.preventDefault(); search(inputRef.current.value); }}><input ref={inputRef} defaultValue="" /></form>;
}
```

For real forms, **React Hook Form** (uncontrolled, performant) + **Zod** schema validation is common; React 19 adds form **Actions** (below).

# Module: Hooks in Depth

## Lesson: [Intermediate|High] useEffect: side effects, dependencies and cleanup

```jsx
function OrderDetails({ orderId }) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setOrder(null);
    fetch(`/api/orders/${orderId}`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setOrder)
      .catch(err => { if (err.name !== "AbortError") setError(err); });
    return () => controller.abort();          // cleanup: runs before the next effect and on unmount
  }, [orderId]);                               // re-run when orderId changes

  if (error) return <p>Failed: {error.message}</p>;
  return order ? <h2>{order.customer}</h2> : <Spinner />;
}
```

| Dependency array | Runs |
|---|---|
| none | After **every** render |
| `[]` | Once after mount (cleanup on unmount) |
| `[a, b]` | After mount and whenever `a` or `b` changes (`Object.is` comparison) |

Rules: include every reactive value used inside (the ESLint rule enforces it); don't use effects for things computable during render ("you might not need an effect"); avoid setting state that triggers the same effect in a loop; prefer a data library (TanStack Query) or framework loaders for data fetching (caching, dedupe, race conditions). `useLayoutEffect` runs synchronously after DOM mutations before paint — for measuring layout.

## Lesson: [Intermediate|High] useRef, useMemo, useCallback and React.memo

```jsx
const inputRef = useRef(null);            // DOM reference: inputRef.current.focus()
const renders = useRef(0);                 // mutable value that does NOT trigger re-render
renders.current++;

const filtered = useMemo(
  () => orders.filter(o => o.customer.includes(search)),       // cache an expensive calculation
  [orders, search]
);

const handleSelect = useCallback(id => setSelected(id), []);    // stable function identity

const OrderRow = memo(function OrderRow({ order, onSelect }) {  // skip re-render if props are shallow-equal
  return <tr onClick={() => onSelect(order.id)}><td>{order.customer}</td></tr>;
});
```

- `useMemo` caches a **value**; `useCallback` caches a **function** (`useCallback(fn, deps)` = `useMemo(() => fn, deps)`).
- `React.memo` caches a **component's render** for the same props — useful only if props are stable (hence `useCallback`/`useMemo` for objects and functions passed down).
- Don't memoise everything — it has its own cost. The **React Compiler** (1.0, Oct 2025) adds memoisation automatically at build time, making most manual `useMemo`/`useCallback`/`memo` unnecessary in new code.
- `forwardRef` is no longer needed in React 19 — `ref` is a regular prop for function components.

## Lesson: [Intermediate|High] useContext and useReducer

```jsx
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const value = useMemo(() => ({ user, login: setUser, logout: () => setUser(null) }), [user]);
  return <AuthContext value={value}>{children}</AuthContext>;      // React 19: <Context> as provider (older: <AuthContext.Provider>)
}
const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

// useReducer: complex state transitions in one place
function cartReducer(state, action) {
  switch (action.type) {
    case "add": return { ...state, items: [...state.items, action.item] };
    case "remove": return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case "clear": return { ...state, items: [] };
    default: throw new Error(`Unknown action ${action.type}`);
  }
}
const [cart, dispatch] = useReducer(cartReducer, { items: [] });
dispatch({ type: "add", item: { id: 7, name: "Mouse", price: 900 } });
```

Context avoids **prop drilling** for app-wide values (theme, auth, locale). Every consumer re-renders when the context value changes — split contexts, memoise the value, or use a state library for frequently changing global state.

## Lesson: [Intermediate|High] Custom hooks and the Rules of Hooks

```jsx
function useFetch(url) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  useEffect(() => {
    const c = new AbortController();
    setState(s => ({ ...s, loading: true }));
    fetch(url, { signal: c.signal })
      .then(r => r.json())
      .then(data => setState({ data, error: null, loading: false }))
      .catch(error => { if (error.name !== "AbortError") setState({ data: null, error, loading: false }); });
    return () => c.abort();
  }, [url]);
  return state;
}

function useDebounce(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return debounced;
}
```

**Rules of Hooks:** 1) call hooks only at the **top level** of a component or custom hook (not in loops, conditions, nested functions or after early returns) — React relies on call order; 2) call them only from React function components or custom hooks. Custom hook names start with `use`. Exception: the new `use()` API can be called conditionally.

# Module: React 19 and Server Components

## Lesson: [Advanced|Medium] Actions, useActionState, useOptimistic and use()

```jsx
// Form Actions (React 19): pass a function to <form action>
function AddTodo({ addTodo }) {
  const [error, submitAction, isPending] = useActionState(async (prevState, formData) => {
    const title = formData.get("title");
    if (!title) return "Title is required";
    await addTodo(title);                        // async transition: isPending is true meanwhile
    return null;
  }, null);

  return (
    <form action={submitAction}>
      <input name="title" />
      <button disabled={isPending}>{isPending ? "Saving…" : "Add"}</button>
      {error && <p>{error}</p>}
    </form>
  );
}

// Optimistic UI
const [optimisticLikes, addOptimisticLike] = useOptimistic(likes, (current, delta) => current + delta);

// use(): read a promise (with Suspense) or context, can be conditional
function Comments({ commentsPromise }) {
  const comments = use(commentsPromise);
  return comments.map(c => <p key={c.id}>{c.text}</p>);
}
```

Also: `useFormStatus` (pending state for a submit button inside a form), `useTransition` (mark non-urgent updates), `useDeferredValue`, document metadata (`<title>`, `<meta>` rendered anywhere), `<Activity mode="hidden">` (19.2) to keep hidden UI state.

## Lesson: [Advanced|High] Server Components, SSR and Next.js basics

- **CSR** (client-side rendering): browser downloads JS and renders — slower first paint, weak SEO.
- **SSR** (server-side rendering): server renders HTML per request, client **hydrates** to make it interactive.
- **SSG** (static generation): HTML at build time; **ISR** regenerates periodically.
- **React Server Components (RSC)**: components that run **only on the server** (can read databases/files directly, ship zero JS); **Client Components** (`"use client"`) handle state and events. **Server Actions/Functions** (`"use server"`) are server functions callable from forms/client code.

```tsx
// Next.js App Router — app/orders/page.tsx (Server Component by default)
export default async function OrdersPage() {
  const orders = await db.order.findMany({ orderBy: { createdAt: "desc" }, take: 20 });   // runs on the server
  return <OrderTable orders={orders} />;
}

// app/orders/new/actions.ts
"use server";
export async function createOrder(formData: FormData) {
  await db.order.create({ data: { customer: String(formData.get("customer")) } });
  revalidatePath("/orders");
}
```

Next.js features: file-based routing (`app/` directory, layouts, loading/error files), Server Components by default, streaming with Suspense, Route Handlers (API), middleware/proxy, image/font optimisation, caching. Deployed commonly on **Vercel**.

# Module: Building Real Apps

## Lesson: [Intermediate|High] Routing with React Router

```jsx
import { createBrowserRouter, RouterProvider, Link, NavLink, Outlet, useParams, useNavigate } from "react-router";

const router = createBrowserRouter([
  {
    path: "/", element: <Layout />, errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: "orders", element: <Orders /> },
      { path: "orders/:id", element: <OrderDetails />, loader: ({ params }) => fetchOrder(params.id) },
      { path: "admin", element: <RequireAuth><Admin /></RequireAuth> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function Layout() { return <><nav><NavLink to="/orders">Orders</NavLink></nav><Outlet /></>; }
function OrderDetails() { const { id } = useParams(); const navigate = useNavigate(); /* ... */ }

createRoot(document.getElementById("root")).render(<RouterProvider router={router} />);
```

React Router v7 (2024) merged with **Remix** and has library mode and framework mode. Alternative: TanStack Router (type-safe).

## Lesson: [Intermediate|High] State management: local, server and global state

| Kind | Tool |
|---|---|
| Local UI state | `useState`, `useReducer` |
| Shared across a subtree | Lift state up, Context |
| **Server state** (API data, caching, refetching) | **TanStack Query**, SWR, RTK Query, framework loaders |
| Global client state | **Redux Toolkit**, **Zustand**, Jotai, Context + reducer |
| URL state | Search params (`useSearchParams`) |
| Form state | React Hook Form |

```jsx
// TanStack Query
const { data: orders, isPending, error } = useQuery({ queryKey: ["orders", page], queryFn: () => api.orders(page) });
const mutation = useMutation({ mutationFn: api.createOrder, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }) });

// Redux Toolkit slice
const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] },
  reducers: {
    added(state, action) { state.items.push(action.payload); },   // Immer allows "mutating" syntax safely
    removed(state, action) { state.items = state.items.filter(i => i.id !== action.payload); },
  },
});

// Zustand
const useCart = create(set => ({ items: [], add: item => set(s => ({ items: [...s.items, item] })) }));
```

## Lesson: [Intermediate|Medium] Error boundaries, portals, Suspense and lazy loading

```jsx
// Error boundary (still a class component, or use the react-error-boundary package)
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { logToServer(error, info.componentStack); }
  render() { return this.state.hasError ? <p>Something went wrong.</p> : this.props.children; }
}

// Code splitting
const Reports = lazy(() => import("./Reports"));
<Suspense fallback={<Spinner />}><Reports /></Suspense>

// Portal: render outside the parent DOM (modals, tooltips)
createPortal(<Modal />, document.getElementById("modal-root"));
```

Error boundaries catch errors during rendering, lifecycle and constructors of children — **not** in event handlers, async code or the boundary itself.

## Lesson: [Advanced|High] Performance optimisation

1. Measure first: React DevTools **Profiler**, why-did-you-render, Lighthouse/Core Web Vitals.
2. Avoid unnecessary re-renders: keep state as local as possible, split components, `memo` + stable props (or React Compiler), split contexts.
3. Correct **keys** for lists; **virtualise** long lists (TanStack Virtual, react-window).
4. **Code splitting** with `lazy`/dynamic import and route-based splitting.
5. `useTransition`/`useDeferredValue` to keep typing responsive during heavy updates.
6. Debounce expensive inputs; avoid creating objects/functions inline for memoised children (or use the compiler).
7. Server Components/SSR to ship less JS; image optimisation; caching server data (TanStack Query).
8. Production build (`vite build`) — dev mode is much slower.

## Lesson: [Intermediate|Medium] Testing React components

```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("shows an error for an invalid email", async () => {
  render(<LoginForm onLogin={vi.fn()} />);
  await userEvent.type(screen.getByRole("textbox"), "not-an-email");
  await userEvent.click(screen.getByRole("button", { name: /login/i }));
  expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email");
});
```

React Testing Library philosophy: test **behaviour as a user sees it** (roles, labels, text), not implementation details (state, internal methods). Mock network calls with **MSW** (Mock Service Worker). E2E with Playwright.

# Interview

## [Beginner|High] What is React and what are its main features?

React is a JavaScript library (by Meta, 2013) for building user interfaces with reusable components. Features: declarative UI, component-based architecture, JSX, one-way data flow via props, state with hooks, efficient updates via reconciliation (virtual DOM diffing), a huge ecosystem, and React Native for mobile. It focuses on the view layer; routing, data fetching and SSR come from libraries or frameworks like Next.js.

## [Beginner|High] What is JSX?

JSX is a syntax extension that looks like HTML inside JavaScript. A compiler (Babel, SWC, esbuild) turns it into function calls (`jsx("div", props)` / `React.createElement`) that create React elements. It supports embedding expressions in `{}`, uses `className`/camelCase attributes, and escapes values by default to prevent XSS. It's optional but universal.

## [Beginner|High] What is the virtual DOM and reconciliation?

The virtual DOM is a lightweight in-memory tree of React elements describing the UI. On each render React creates a new tree, **diffs** it against the previous one (reconciliation) using heuristics — elements of a different type are replaced, same-type elements are updated, keys identify list items — and applies only the minimal changes to the real DOM in the commit phase. Fiber (React 16+) made this work interruptible and prioritised.

## [Beginner|High] What is the difference between props and state?

Props are inputs passed from parent to child; they're read-only for the child. State is data owned and managed by a component (`useState`/`useReducer`) that changes over time and triggers re-renders when updated. A parent's state often becomes a child's props. Data flows down via props; children request changes via callback props.

## [Beginner|High] Why are keys important in lists?

Keys give each list item a stable identity so React can match elements between renders and update, move or remove the right DOM nodes and preserve component state. Without good keys (or with array indexes when the list changes order), React may reuse the wrong component instance, causing bugs like inputs showing the wrong values and unnecessary re-renders. Use unique IDs from data; keys need to be unique only among siblings.

## [Beginner|Medium] Controlled vs uncontrolled components?

In a controlled component, form input values are driven by React state (`value` + `onChange`), giving React full control — instant validation, conditional disabling, formatting. In an uncontrolled component, the DOM keeps the value and you read it when needed via refs or `FormData` (`defaultValue`), which means less code and fewer re-renders (React Hook Form uses this approach). File inputs are always uncontrolled.

## [Intermediate|High] Explain useEffect and its dependency array. How do you clean up?

`useEffect(fn, deps)` runs side effects (data fetching, subscriptions, timers, DOM APIs) after the component commits. With no deps it runs after every render; with `[]` once after mount; with `[a, b]` when those values change. Return a cleanup function from the effect to unsubscribe, clear timers or abort fetches — React runs it before re-running the effect and on unmount. Missing dependencies cause stale values; the ESLint hooks rule helps.

## [Intermediate|High] What are the Rules of Hooks and why do they exist?

Only call hooks at the top level of React function components or custom hooks — never inside loops, conditions, nested functions or after early returns — and only from React functions. React stores hook state in an ordered list per component and relies on the call order being identical on every render to match each `useState`/`useEffect` with its stored data.

## [Intermediate|High] useMemo vs useCallback vs React.memo?

`useMemo(() => compute(a, b), [a, b])` caches the result of an expensive calculation. `useCallback(fn, deps)` caches a function's identity so it doesn't change every render. `React.memo(Component)` skips re-rendering a component when its props are shallowly equal. They work together: memoised child + stable callback/object props. Use them where profiling shows a benefit; the React Compiler now automates most of this.

## [Intermediate|High] What is the Context API? When would you not use it?

Context passes data through the component tree without prop drilling: `createContext`, a provider with a value, and `useContext` in consumers. It suits low-frequency global values (theme, auth user, locale, feature flags). Avoid it for frequently changing, large global state, because every consumer re-renders on any change of the value — use a state library (Zustand, Redux Toolkit) or split contexts and memoise values. It's not a replacement for server-state caching.

## [Intermediate|High] useState vs useReducer?

`useState` is ideal for simple, independent values. `useReducer` centralises complex state logic where the next state depends on the previous one and on multiple action types (forms with many fields, carts, wizards). Its reducer is pure and easily testable, and `dispatch` is stable, which helps memoisation. It often pairs with Context for small app-wide stores.

## [Intermediate|High] What is lifting state up?

When two components need the same changing data, move the state to their closest common parent and pass it down as props, with callbacks for updates. This keeps a single source of truth. If many layers are involved, consider composition (passing components as children), Context, or a store.

## [Intermediate|Medium] What are custom hooks? Give an example.

Functions starting with `use` that call other hooks to encapsulate reusable stateful logic — `useFetch(url)`, `useDebounce(value)`, `useLocalStorage(key)`, `useOnlineStatus()`. Each component that calls a custom hook gets its own independent state. They replace older patterns like HOCs and render props for logic reuse.

## [Intermediate|Medium] What are error boundaries?

Components (currently class components implementing `getDerivedStateFromError`/`componentDidCatch`, or the `react-error-boundary` package) that catch JavaScript errors in their child component tree during rendering, lifecycle methods and constructors, show a fallback UI and log the error, instead of unmounting the whole app. They don't catch errors in event handlers, async code (setTimeout, promises outside rendering), SSR or themselves.

## [Advanced|High] How do you optimise the performance of a React application?

Profile with React DevTools; avoid unnecessary re-renders (state colocation, splitting components, `memo` with stable props or the React Compiler, splitting contexts); virtualise long lists; correct keys; code-split routes and heavy components with `lazy`/Suspense; `useTransition`/`useDeferredValue` for heavy updates during typing; cache server data with TanStack Query; debounce inputs; use SSR/Server Components to reduce client JS; optimise images; always ship production builds.

## [Advanced|High] What are React Server Components and how do they differ from SSR?

SSR renders the whole component tree to HTML on the server per request, then ships all the component JS to hydrate it in the browser. Server Components are components that run only on the server (or at build time): they can access databases and secrets directly, and their code is never sent to the browser — only their rendered output (RSC payload). Client Components (`"use client"`) are still hydrated for interactivity. RSC and SSR are complementary — frameworks like Next.js use both.

## [Advanced|Medium] What's new in React 18 and 19?

React 18: concurrent rendering (interruptible rendering), `createRoot`, automatic batching of all state updates, transitions (`useTransition`, `startTransition`), `useDeferredValue`, `useId`, streaming SSR with Suspense. React 19: Actions (async functions in transitions and `<form action>`), `useActionState`, `useFormStatus`, `useOptimistic`, the `use()` API, `ref` as a prop (no `forwardRef`), `<Context>` as provider, document metadata tags, stable Server Components and Server Actions, and better hydration error messages. 19.2 added `<Activity>` and `useEffectEvent`.

## [Advanced|Medium] What causes infinite re-render loops and how do you fix them?

Setting state during render unconditionally (`setCount(count + 1)` in the body), calling a handler instead of passing it (`onClick={handle()}`), or an effect that sets state which changes its own dependencies (objects/arrays/functions recreated each render in the dependency array). Fix by moving updates into event handlers, passing function references, computing derived values during render instead of in effects, memoising dependency objects or depending on primitive fields, and guarding effect updates with conditions.

## [Scenario|High] A dashboard with many widgets re-renders entirely when the user types in a search box. How do you fix it?

Find what re-renders with the Profiler. Usually the search state lives too high (in the page) so every widget re-renders. Move the search state down into the search component or the part that uses it; wrap expensive widgets in `memo` and pass stable props (or enable the React Compiler); use `useDeferredValue` for the filtered results so typing stays responsive; debounce the search before triggering data fetching; split a big context into smaller ones.

## [Scenario|High] Fetching data in useEffect sometimes shows results for the previous user ID after switching quickly. Why and how to fix?

Race condition: an older request resolves after a newer one and overwrites state. Fix by aborting the previous request in the effect cleanup (`AbortController`), or ignoring stale responses with a flag (`let ignore = false; return () => { ignore = true }`). Better: use TanStack Query/SWR or framework loaders, which key requests by parameters and handle caching, deduplication and races automatically.

## [Scenario|Medium] How would you structure a large React application?

Feature-based folders (`features/orders/{components,hooks,api,types}`) plus shared `components/ui`, `lib`, `hooks`; a framework (Next.js) or Vite + React Router; TypeScript everywhere; server state in TanStack Query (or framework loaders), minimal global client state in Zustand/Redux Toolkit; a design system (Tailwind/shadcn or MUI); forms with React Hook Form + Zod; route-based code splitting; testing with Vitest + RTL + MSW and Playwright; ESLint (hooks rules) and Prettier; Storybook for shared components; CI with type checks, tests and bundle-size budgets.

## [Scenario|Medium] A modal rendered inside a card is cut off by `overflow: hidden` on the card. How do you fix it in React?

Render the modal with a **portal** (`createPortal(<Modal />, document.body)` or a dedicated `#modal-root`) so it's attached outside the card's DOM hierarchy while still part of the React tree (events and context still work). Manage focus trapping, Escape to close and `aria-modal` for accessibility — or use the native `<dialog>` element or an accessible library (Radix UI).

# Cheatsheet

## Core

Components = functions returning JSX · props down, callbacks up · state triggers re-render · keys for lists · immutable updates · fragments `<>...</>`.

## Hooks

`useState` · `useEffect` (deps, cleanup) · `useLayoutEffect` · `useRef` · `useMemo` · `useCallback` · `useContext` · `useReducer` · `useId` · `useTransition` · `useDeferredValue` · `useSyncExternalStore` · React 19: `use` · `useActionState` · `useFormStatus` · `useOptimistic` · 19.2: `useEffectEvent`.

## Effect dependency rules

none = every render · `[]` = mount/unmount · `[x]` = when x changes · cleanup before re-run and on unmount · abort fetches.

## Rules of Hooks

Top level only · React functions only · names start with `use`.

## Performance

Profile → colocate state → `memo` + stable props (or React Compiler) → virtualise lists → `lazy` + Suspense → transitions → TanStack Query caching → SSR/RSC.

## State choices

Local `useState` · complex `useReducer` · subtree Context · server data TanStack Query · global Zustand/Redux Toolkit · URL params · forms React Hook Form.

## Rendering models

CSR · SSR + hydration · SSG/ISR · Server Components (`"use server"` actions, `"use client"` components) · Next.js App Router.

## Versions

16.8 Hooks (2019) · 18 concurrent + batching (2022) · 19 Actions + RSC stable (Dec 2024) · 19.2 Activity (Oct 2025) · React Compiler 1.0 · CRA deprecated (2025).
