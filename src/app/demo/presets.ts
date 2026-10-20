// Ready-made snippets for the demo kit. Kept small so they can be explained in a minute or two.

export const JS_PRESETS: { title: string; code: string }[] = [
  {
    title: "Event loop order (sync → microtasks → macrotasks)",
    code: `console.log("1 sync");
setTimeout(() => console.log("5 macrotask: setTimeout"), 0);
Promise.resolve().then(() => console.log("3 microtask: promise"));
queueMicrotask(() => console.log("4 microtask: queueMicrotask"));
console.log("2 sync");
// Output order: 1, 2, 3, 4, 5 — the call stack empties, then ALL microtasks run, then one macrotask.`,
  },
  {
    title: "Closures — private counter",
    code: `function makeCounter() {
  let count = 0;                 // captured by the inner functions
  return { inc: () => ++count, get: () => count };
}
const c = makeCounter();
c.inc(); c.inc();
console.log(c.get());            // 2
console.log(c.count);            // undefined — not reachable from outside`,
  },
  {
    title: "var vs let in loops",
    code: `for (var i = 0; i < 3; i++) setTimeout(() => console.log("var", i));   // 3 3 3 (one shared binding)
for (let j = 0; j < 3; j++) setTimeout(() => console.log("let", j));   // 0 1 2 (new binding per iteration)`,
  },
  {
    title: "this binding — regular vs arrow functions",
    code: `const user = {
  name: "Divakar",
  regular() { return this.name; },
  arrow: () => typeof this,          // arrow takes 'this' from the enclosing scope, not from 'user'
  later() { setTimeout(() => console.log("arrow inside method:", this.name)); }
};
console.log(user.regular());          // Divakar
console.log(user.arrow());
const detached = user.regular;
console.log(detached.call({ name: "call() sets this" }));
user.later();`,
  },
  {
    title: "Debounce (search box) and throttle",
    code: `function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
function throttle(fn, ms) {
  let last = 0;
  return (...args) => { const now = Date.now(); if (now - last >= ms) { last = now; fn(...args); } };
}
const search = debounce((q) => console.log("search for", q), 200);
["d", "di", "div", "diva"].forEach((q, i) => setTimeout(() => search(q), i * 50));
// only "diva" is searched, 200 ms after the last keystroke`,
  },
  {
    title: "Promise.all vs allSettled vs race vs any",
    code: `const ok = (v, ms) => new Promise(r => setTimeout(() => r(v), ms));
const fail = (e, ms) => new Promise((_, r) => setTimeout(() => r(new Error(e)), ms));
(async () => {
  console.log("all:", await Promise.all([ok("a", 30), ok("b", 10)]));
  try { await Promise.all([ok("a", 30), fail("boom", 10)]); } catch (e) { console.log("all rejects fast:", e.message); }
  console.log("allSettled:", (await Promise.allSettled([ok("a", 10), fail("x", 5)])).map(r => r.status));
  console.log("race:", await Promise.race([ok("slow", 50), ok("fast", 5)]));
  console.log("any:", await Promise.any([fail("x", 5), ok("first ok", 20)]));
})();`,
  },
  {
    title: "Array methods — map / filter / reduce / groupBy",
    code: `const orders = [
  { id: 1, customer: "Asha", total: 1200 },
  { id: 2, customer: "Ravi", total: 300 },
  { id: 3, customer: "Asha", total: 450 },
];
console.log(orders.filter(o => o.total > 400).map(o => o.id));            // [1, 3]
console.log(orders.reduce((sum, o) => sum + o.total, 0));                 // 1950
const byCustomer = orders.reduce((acc, o) => ((acc[o.customer] ??= 0), (acc[o.customer] += o.total), acc), {});
console.log(byCustomer);                                                   // { Asha: 1650, Ravi: 300 }
console.log(Object.groupBy ? Object.groupBy(orders, o => o.customer) : "Object.groupBy needs a 2024+ browser");`,
  },
  {
    title: "Shallow vs deep copy",
    code: `const a = { name: "x", tags: ["one"] };
const shallow = { ...a };
const deep = structuredClone(a);
a.tags.push("two");
console.log(shallow.tags);  // ["one","two"] — nested array is shared
console.log(deep.tags);     // ["one"]`,
  },
  {
    title: "Coding round: reverse words, palindrome, anagram, first non-repeating char",
    code: `const reverseWords = s => s.trim().split(/\\s+/).reverse().join(" ");
const isPalindrome = s => { const t = s.toLowerCase().replace(/[^a-z0-9]/g, ""); return t === [...t].reverse().join(""); };
const isAnagram = (a, b) => [...a.toLowerCase()].sort().join("") === [...b.toLowerCase()].sort().join("");
const firstUnique = s => { const m = new Map(); for (const ch of s) m.set(ch, (m.get(ch) ?? 0) + 1); for (const [ch, n] of m) if (n === 1) return ch; return null; };
console.log(reverseWords("  hello   interview world "));
console.log(isPalindrome("A man, a plan, a canal: Panama"));
console.log(isAnagram("Listen", "Silent"));
console.log(firstUnique("swiss"));`,
  },
  {
    title: "Two Sum (hash map, O(n))",
    code: `function twoSum(nums, target) {
  const seen = new Map();                 // value -> index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return null;
}
console.log(twoSum([2, 7, 11, 15], 9));   // [0, 1]`,
  },
];

export const SQL_SCHEMA = `
CREATE TABLE Departments (DeptId INTEGER PRIMARY KEY, DeptName TEXT NOT NULL, Location TEXT);
CREATE TABLE Employees (
  EmpId INTEGER PRIMARY KEY, Name TEXT NOT NULL, DeptId INTEGER REFERENCES Departments(DeptId),
  ManagerId INTEGER REFERENCES Employees(EmpId), Salary INTEGER NOT NULL, HireDate TEXT NOT NULL, Email TEXT);
CREATE TABLE Customers (CustomerId INTEGER PRIMARY KEY, Name TEXT NOT NULL, City TEXT);
CREATE TABLE Products (ProductId INTEGER PRIMARY KEY, Name TEXT NOT NULL, Category TEXT, Price REAL NOT NULL);
CREATE TABLE Orders (OrderId INTEGER PRIMARY KEY, CustomerId INTEGER REFERENCES Customers(CustomerId), OrderDate TEXT NOT NULL);
CREATE TABLE OrderItems (OrderId INTEGER REFERENCES Orders(OrderId), ProductId INTEGER REFERENCES Products(ProductId), Qty INTEGER NOT NULL);

INSERT INTO Departments VALUES (1,'Engineering','Pune'),(2,'Data','Mumbai'),(3,'HR','Pune'),(4,'Sales','Delhi'),(5,'Legal',NULL);
INSERT INTO Employees VALUES
 (1,'Anita Rao',1,NULL,250000,'2015-04-01','anita@corp.test'),
 (2,'Vikram Shah',1,1,180000,'2017-06-15','vikram@corp.test'),
 (3,'Meera Iyer',1,2,120000,'2020-01-10','meera@corp.test'),
 (4,'Rahul Verma',1,2,120000,'2021-03-22','rahul@corp.test'),
 (5,'Sneha Patil',2,1,160000,'2018-09-01','sneha@corp.test'),
 (6,'Arjun Nair',2,5,95000,'2022-07-11','arjun@corp.test'),
 (7,'Kavya Menon',3,1,90000,'2019-11-05','kavya@corp.test'),
 (8,'Rohan Das',4,1,110000,'2016-02-29','rohan@corp.test'),
 (9,'Priya Singh',4,8,70000,'2023-05-02','priya@corp.test'),
 (10,'Imran Khan',4,8,70000,'2023-08-19','priya@corp.test'),
 (11,'Neha Joshi',NULL,NULL,65000,'2024-01-15',NULL);
INSERT INTO Customers VALUES (1,'Acme Ltd','Mumbai'),(2,'Zen Retail','Pune'),(3,'Blue Ocean','Delhi'),(4,'Nova Labs','Taipei');
INSERT INTO Products VALUES (1,'Laptop','Electronics',65000),(2,'Monitor','Electronics',14000),(3,'Desk','Furniture',9000),(4,'Chair','Furniture',6500),(5,'Mouse','Electronics',900);
INSERT INTO Orders VALUES (101,1,'2026-01-05'),(102,1,'2026-02-11'),(103,2,'2026-02-20'),(104,3,'2026-03-01'),(105,1,'2026-03-15');
INSERT INTO OrderItems VALUES (101,1,2),(101,5,2),(102,2,3),(103,3,1),(103,4,4),(104,1,1),(104,2,1),(105,5,10);
`;

export const SQL_PRESETS: { title: string; sql: string }[] = [
  { title: "INNER vs LEFT JOIN (employees without a department)", sql: `SELECT e.Name, d.DeptName
FROM Employees e
LEFT JOIN Departments d ON d.DeptId = e.DeptId
ORDER BY d.DeptName;   -- Neha has NULL DeptName; INNER JOIN would drop her` },
  { title: "Second highest salary (3 ways)", sql: `-- 1) subquery
SELECT MAX(Salary) AS SecondHighest FROM Employees WHERE Salary < (SELECT MAX(Salary) FROM Employees);
-- 2) DENSE_RANK handles ties: change 2 to N for the Nth highest
SELECT DISTINCT Salary FROM (SELECT Salary, DENSE_RANK() OVER (ORDER BY Salary DESC) AS rnk FROM Employees) t WHERE rnk = 2;
-- 3) T-SQL: SELECT DISTINCT Salary ... ORDER BY Salary DESC OFFSET 1 ROWS FETCH NEXT 1 ROWS ONLY;  (SQLite: LIMIT 1 OFFSET 1)` },
  { title: "Highest paid employee per department", sql: `WITH ranked AS (
  SELECT e.*, ROW_NUMBER() OVER (PARTITION BY DeptId ORDER BY Salary DESC) AS rn
  FROM Employees e WHERE DeptId IS NOT NULL
)
SELECT d.DeptName, r.Name, r.Salary
FROM ranked r JOIN Departments d ON d.DeptId = r.DeptId
WHERE rn = 1;` },
  { title: "ROW_NUMBER vs RANK vs DENSE_RANK", sql: `SELECT Name, Salary,
  ROW_NUMBER() OVER (ORDER BY Salary DESC) AS row_num,
  RANK()       OVER (ORDER BY Salary DESC) AS rnk,
  DENSE_RANK() OVER (ORDER BY Salary DESC) AS dense_rnk
FROM Employees;` },
  { title: "Employee and manager (self join)", sql: `SELECT e.Name AS Employee, m.Name AS Manager
FROM Employees e
LEFT JOIN Employees m ON m.EmpId = e.ManagerId;` },
  { title: "Org chart with a recursive CTE", sql: `WITH RECURSIVE org AS (           -- T-SQL: WITH org AS (...) — no RECURSIVE keyword
  SELECT EmpId, Name, ManagerId, 0 AS Level, Name AS Path FROM Employees WHERE ManagerId IS NULL AND DeptId IS NOT NULL
  UNION ALL
  SELECT e.EmpId, e.Name, e.ManagerId, o.Level + 1, o.Path || ' > ' || e.Name
  FROM Employees e JOIN org o ON e.ManagerId = o.EmpId
)
SELECT Level, Path FROM org ORDER BY Path;` },
  { title: "Find and delete duplicates (keep one)", sql: `-- find: same email used by more than one employee
SELECT Email, COUNT(*) AS Cnt FROM Employees WHERE Email IS NOT NULL GROUP BY Email HAVING COUNT(*) > 1;
-- delete all but the lowest EmpId (T-SQL often uses a CTE with ROW_NUMBER() and DELETE FROM cte WHERE rn > 1)
-- DELETE FROM Employees WHERE EmpId NOT IN (SELECT MIN(EmpId) FROM Employees GROUP BY Email);` },
  { title: "Running total and month-over-month", sql: `WITH sales AS (
  SELECT strftime('%Y-%m', o.OrderDate) AS Month, SUM(oi.Qty * p.Price) AS Revenue
  FROM Orders o JOIN OrderItems oi ON oi.OrderId = o.OrderId JOIN Products p ON p.ProductId = oi.ProductId
  GROUP BY Month
)
SELECT Month, Revenue,
  SUM(Revenue) OVER (ORDER BY Month ROWS UNBOUNDED PRECEDING) AS RunningTotal,
  Revenue - LAG(Revenue) OVER (ORDER BY Month) AS ChangeFromPrevMonth
FROM sales;   -- T-SQL: FORMAT(OrderDate,'yyyy-MM') instead of strftime` },
  { title: "Customers who never ordered (NOT EXISTS)", sql: `SELECT c.Name FROM Customers c
WHERE NOT EXISTS (SELECT 1 FROM Orders o WHERE o.CustomerId = c.CustomerId);` },
  { title: "Pivot with conditional aggregation", sql: `SELECT c.Name,
  SUM(CASE WHEN p.Category = 'Electronics' THEN oi.Qty * p.Price ELSE 0 END) AS Electronics,
  SUM(CASE WHEN p.Category = 'Furniture'   THEN oi.Qty * p.Price ELSE 0 END) AS Furniture
FROM Customers c
JOIN Orders o ON o.CustomerId = c.CustomerId
JOIN OrderItems oi ON oi.OrderId = o.OrderId
JOIN Products p ON p.ProductId = oi.ProductId
GROUP BY c.Name;   -- T-SQL also has the PIVOT operator` },
  { title: "Departments with average salary above company average", sql: `SELECT d.DeptName, AVG(e.Salary) AS AvgSalary
FROM Employees e JOIN Departments d ON d.DeptId = e.DeptId
GROUP BY d.DeptName
HAVING AVG(e.Salary) > (SELECT AVG(Salary) FROM Employees);` },
];

export const PITCH_TEMPLATES = {
  intro: `Hi, I'm <name>. I'm a <role> with <N> years of experience building <kind of systems> using C#/.NET, SQL Server and <frontend/cloud>.
Most recently at <company> I <one result with a number, e.g. "cut report run time from 40 to 6 minutes by rewriting SSIS loads as set-based T-SQL">.
Before that I <second highlight>.
I'm looking for <what you want next>, and this role fits because <one specific thing about this company/role>.`,
  project: `Project: <name> — <one-line purpose, users, scale>
Stack: <ASP.NET Core / EF Core / SQL Server / Azure / React …>
My role: <what YOU owned>
Architecture: <client → API → services → DB; queues; caching; CI/CD>
Hard problem: <the toughest issue> → <how you diagnosed it> → <fix>
Result: <metric: latency, cost, defects, time saved>
What I'd do differently: <honest improvement>`,
  star: `Situation: <context in 1–2 sentences>
Task: <what you were responsible for>
Action: <what YOU did — 3 concrete steps, "I" not "we">
Result: <measurable outcome + what you learned>`,
  questions: `- What does success look like in the first 90 days for this role?
- What are the biggest technical challenges the team is facing right now?
- How does the team handle code reviews, testing and releases?
- How is on-call / production support organised?
- What are the next steps in the process?`,
};
