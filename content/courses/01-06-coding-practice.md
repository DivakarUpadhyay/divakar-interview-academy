---
slug: coding-practice
title: Coding Round Practice (DSA in C#)
track: foundations
order: 6
icon: {}
color: #e8590c
summary: Big-O, arrays, strings, hashing, two pointers, sliding window, stacks, linked lists, trees, sorting, searching, recursion and the most-asked C# coding programs with solutions.
---

# Overview

Most .NET interviews include a **coding round**: 1–3 problems in 30–60 minutes, on a shared editor (CoderPad, HackerRank, Codility), on a whiteboard, or in Visual Studio over a screen share. Service companies ask classic programs (reverse a string, palindrome, Fibonacci, duplicates). Product companies ask LeetCode-style easy/medium problems (two sum, sliding window, trees).

What interviewers score:

1. **Clarifying** the problem and edge cases before coding.
2. A working **brute-force** idea, then an **optimised** one.
3. Clean, compiling code with good names.
4. **Testing** with examples and edge cases out loud.
5. Stating **time and space complexity**.

# Versions

Algorithms don't have versions, but the C# features you can use in a coding round do:

| Feature | Since | Useful for |
|---|---|---|
| Generic collections `List<T>`, `Dictionary<K,V>` | C# 2.0 | Everything |
| LINQ | C# 3.0 | Quick grouping/sorting |
| `HashSet<T>` | .NET 3.5 | Uniqueness / O(1) lookup |
| Tuples + swap `(a, b) = (b, a)` | C# 7 | Two pointers |
| Ranges/indices `s[^1]`, `s[1..3]` | C# 8 | Slicing |
| `PriorityQueue<TElement,TPriority>` | .NET 6 | Top-K, Dijkstra |
| Collection expressions `[1, 2, 3]` | C# 12 | Test data |
| `CountBy`, `AggregateBy`, `Index()` LINQ | .NET 9 | Frequency counting |

# Lifecycle

**How to solve a problem in an interview (UMPIRE):**

1. **Understand** — restate the problem; ask about input size, nulls, duplicates, negative numbers, sorted or not.
2. **Match** — which pattern? (hash map, two pointers, sliding window, stack, BFS/DFS, binary search, DP)
3. **Plan** — say the brute force and its complexity, then the better approach.
4. **Implement** — write clean code; talk while typing.
5. **Review** — dry-run with a small example; check edge cases (empty, one element, all same).
6. **Evaluate** — state time/space complexity and possible improvements.

# Tools

- **Visual Studio / VS Code / Rider** with `dotnet new console` for practice.
- **LINQPad**, **dotnetfiddle.net**, **SharpLab** — quick online/offline runners.
- **LeetCode, HackerRank, Codility, CodeSignal, GeeksforGeeks** — practice platforms (HackerRank/Codility are often used by Indian service companies for online tests).
- **NeetCode 150 / Blind 75** — curated problem lists by pattern.
- **BenchmarkDotNet** — compare approaches.
- **xUnit** — write tests for your own solutions.

# Module: Foundations

## Lesson: [Basic|High] Big-O notation

Big-O describes how time or memory grows as input size *n* grows (worst case, ignoring constants).

| Big-O | Name | Example |
|---|---|---|
| O(1) | Constant | Array index, dictionary lookup (average) |
| O(log n) | Logarithmic | Binary search, balanced BST |
| O(n) | Linear | Single loop, linear search |
| O(n log n) | Linearithmic | Merge sort, `Array.Sort` (introsort) |
| O(n²) | Quadratic | Nested loops, bubble sort |
| O(2ⁿ) | Exponential | Naive recursive Fibonacci, all subsets |
| O(n!) | Factorial | All permutations |

C# collection costs: `List<T>.Add` amortised O(1), `Insert(0)` O(n), `Contains` O(n); `Dictionary`/`HashSet` add/lookup O(1) average; `SortedDictionary` O(log n); `Array.Sort`/`List.Sort` O(n log n).

> **Interview tip:** always state both time and **space** complexity, e.g. "O(n) time, O(n) extra space for the dictionary."

## Lesson: [Basic|High] String programs

```csharp
// 1. Reverse a string (without Array.Reverse)
static string Reverse(string s)
{
    var chars = s.ToCharArray();
    for (int i = 0, j = chars.Length - 1; i < j; i++, j--)
        (chars[i], chars[j]) = (chars[j], chars[i]);
    return new string(chars);
}

// 2. Palindrome (ignore case and non-alphanumerics) — two pointers, O(n) time, O(1) space
static bool IsPalindrome(string s)
{
    int i = 0, j = s.Length - 1;
    while (i < j)
    {
        if (!char.IsLetterOrDigit(s[i])) { i++; continue; }
        if (!char.IsLetterOrDigit(s[j])) { j--; continue; }
        if (char.ToLowerInvariant(s[i]) != char.ToLowerInvariant(s[j])) return false;
        i++; j--;
    }
    return true;
}

// 3. Count each character
static Dictionary<char, int> CharCount(string s)
{
    var counts = new Dictionary<char, int>();
    foreach (var c in s) counts[c] = counts.GetValueOrDefault(c) + 1;
    return counts;
}

// 4. First non-repeating character
static char? FirstUnique(string s)
{
    var counts = CharCount(s);
    foreach (var c in s) if (counts[c] == 1) return c;
    return null;
}

// 5. Anagram check — O(n) with a count array for lowercase letters
static bool IsAnagram(string a, string b)
{
    if (a.Length != b.Length) return false;
    var count = new int[26];
    for (int i = 0; i < a.Length; i++) { count[a[i] - 'a']++; count[b[i] - 'a']--; }
    return count.All(c => c == 0);
}

// 6. Reverse words in a sentence
static string ReverseWords(string s) =>
    string.Join(' ', s.Split(' ', StringSplitOptions.RemoveEmptyEntries).Reverse());

// 7. Count vowels
static int Vowels(string s) => s.Count(c => "aeiouAEIOU".Contains(c));
```

## Lesson: [Basic|High] Number programs

```csharp
// Fibonacci — iterative O(n) time, O(1) space
static long Fib(int n)
{
    if (n < 2) return n;
    long a = 0, b = 1;
    for (int i = 2; i <= n; i++) (a, b) = (b, a + b);
    return b;
}

// Prime check — O(√n)
static bool IsPrime(int n)
{
    if (n < 2) return false;
    if (n % 2 == 0) return n == 2;
    for (int i = 3; i * i <= n; i += 2) if (n % i == 0) return false;
    return true;
}

// Factorial — recursive and iterative
static long Fact(int n) => n <= 1 ? 1 : n * Fact(n - 1);

// Swap without temp
int x = 5, y = 9;
(x, y) = (y, x);           // tuple swap (or x ^= y; y ^= x; x ^= y;)

// Armstrong number (153 = 1³ + 5³ + 3³)
static bool IsArmstrong(int n)
{
    var digits = n.ToString();
    return digits.Sum(d => (int)Math.Pow(d - '0', digits.Length)) == n;
}

// FizzBuzz
for (int i = 1; i <= 15; i++)
    Console.WriteLine(i % 15 == 0 ? "FizzBuzz" : i % 3 == 0 ? "Fizz" : i % 5 == 0 ? "Buzz" : i.ToString());

// GCD (Euclid) and LCM
static int Gcd(int a, int b) => b == 0 ? a : Gcd(b, a % b);
static int Lcm(int a, int b) => a / Gcd(a, b) * b;
```

# Module: Arrays and Hashing

## Lesson: [Basic|High] Array programs

```csharp
// Second largest (distinct) — single pass O(n)
static int? SecondLargest(int[] a)
{
    int? first = null, second = null;
    foreach (var n in a)
    {
        if (first is null || n > first) { second = first; first = n; }
        else if (n != first && (second is null || n > second)) second = n;
    }
    return second;
}

// Find duplicates — HashSet O(n)
static List<int> Duplicates(int[] a)
{
    var seen = new HashSet<int>(); var dups = new HashSet<int>();
    foreach (var n in a) if (!seen.Add(n)) dups.Add(n);
    return dups.ToList();
}

// Missing number in 1..n — sum formula O(n), O(1) space
static int Missing(int[] a, int n) => n * (n + 1) / 2 - a.Sum();

// Move zeros to the end keeping order — O(n), in place
static void MoveZeros(int[] a)
{
    int write = 0;
    foreach (var n in a) if (n != 0) a[write++] = n;
    while (write < a.Length) a[write++] = 0;
}

// Rotate array right by k — reverse trick O(n), O(1)
static void Rotate(int[] a, int k)
{
    k %= a.Length;
    Array.Reverse(a); Array.Reverse(a, 0, k); Array.Reverse(a, k, a.Length - k);
}

// Merge two sorted arrays — O(n + m)
static int[] Merge(int[] x, int[] y)
{
    var r = new int[x.Length + y.Length]; int i = 0, j = 0, k = 0;
    while (i < x.Length && j < y.Length) r[k++] = x[i] <= y[j] ? x[i++] : y[j++];
    while (i < x.Length) r[k++] = x[i++];
    while (j < y.Length) r[k++] = y[j++];
    return r;
}
```

## Lesson: [Intermediate|High] Hash map pattern — Two Sum, frequency, grouping

```csharp
// Two Sum — O(n) time, O(n) space
static (int, int)? TwoSum(int[] nums, int target)
{
    var index = new Dictionary<int, int>();          // value -> index
    for (int i = 0; i < nums.Length; i++)
    {
        if (index.TryGetValue(target - nums[i], out var j)) return (j, i);
        index[nums[i]] = i;
    }
    return null;
}

// Group anagrams
static IEnumerable<List<string>> GroupAnagrams(string[] words) =>
    words.GroupBy(w => new string(w.OrderBy(c => c).ToArray())).Select(g => g.ToList());

// Top K frequent elements — PriorityQueue (.NET 6+)
static int[] TopK(int[] nums, int k)
{
    var freq = nums.CountBy(n => n);                 // .NET 9; or GroupBy
    var pq = new PriorityQueue<int, int>();          // min-heap by frequency
    foreach (var (num, count) in freq)
    {
        pq.Enqueue(num, count);
        if (pq.Count > k) pq.Dequeue();
    }
    var result = new int[pq.Count];
    for (int i = result.Length - 1; i >= 0; i--) result[i] = pq.Dequeue();
    return result;
}
```

## Lesson: [Intermediate|High] Two pointers and sliding window

```csharp
// Pair with sum in a SORTED array — two pointers O(n)
static bool HasPair(int[] sorted, int target)
{
    int l = 0, r = sorted.Length - 1;
    while (l < r)
    {
        int sum = sorted[l] + sorted[r];
        if (sum == target) return true;
        if (sum < target) l++; else r--;
    }
    return false;
}

// Longest substring without repeating characters — sliding window O(n)
static int LongestUnique(string s)
{
    var last = new Dictionary<char, int>();
    int best = 0, start = 0;
    for (int i = 0; i < s.Length; i++)
    {
        if (last.TryGetValue(s[i], out var prev) && prev >= start) start = prev + 1;
        last[s[i]] = i;
        best = Math.Max(best, i - start + 1);
    }
    return best;
}

// Maximum subarray sum — Kadane's algorithm O(n)
static int MaxSubArray(int[] a)
{
    int best = a[0], current = a[0];
    for (int i = 1; i < a.Length; i++)
    {
        current = Math.Max(a[i], current + a[i]);
        best = Math.Max(best, current);
    }
    return best;
}

// Max sum of any window of size k — fixed sliding window
static int MaxWindow(int[] a, int k)
{
    int sum = a.Take(k).Sum(), best = sum;
    for (int i = k; i < a.Length; i++) { sum += a[i] - a[i - k]; best = Math.Max(best, sum); }
    return best;
}
```

# Module: Stacks, Queues and Linked Lists

## Lesson: [Intermediate|High] Stack problems

```csharp
// Valid parentheses — O(n)
static bool IsValid(string s)
{
    var stack = new Stack<char>();
    var pairs = new Dictionary<char, char> { [')'] = '(', [']'] = '[', ['}'] = '{' };
    foreach (var c in s)
    {
        if (pairs.ContainsValue(c)) stack.Push(c);
        else if (pairs.TryGetValue(c, out var open))
        {
            if (stack.Count == 0 || stack.Pop() != open) return false;
        }
    }
    return stack.Count == 0;
}

// Next greater element — monotonic stack O(n)
static int[] NextGreater(int[] a)
{
    var result = Enumerable.Repeat(-1, a.Length).ToArray();
    var stack = new Stack<int>();                    // indexes waiting for a greater value
    for (int i = 0; i < a.Length; i++)
    {
        while (stack.Count > 0 && a[stack.Peek()] < a[i]) result[stack.Pop()] = a[i];
        stack.Push(i);
    }
    return result;
}
```

## Lesson: [Intermediate|High] Linked list problems

```csharp
public class Node(int value) { public int Value = value; public Node? Next; }

// Reverse a linked list — iterative O(n), O(1)
static Node? Reverse(Node? head)
{
    Node? prev = null;
    while (head is not null)
    {
        var next = head.Next;
        head.Next = prev;
        prev = head;
        head = next;
    }
    return prev;
}

// Detect a cycle — Floyd's slow/fast pointers
static bool HasCycle(Node? head)
{
    Node? slow = head, fast = head;
    while (fast?.Next is not null)
    {
        slow = slow!.Next; fast = fast.Next.Next;
        if (slow == fast) return true;
    }
    return false;
}

// Middle node — slow moves 1, fast moves 2
static Node? Middle(Node? head)
{
    Node? slow = head, fast = head;
    while (fast?.Next is not null) { slow = slow!.Next; fast = fast.Next.Next; }
    return slow;
}
```

## Lesson: [Advanced|Medium] LRU cache (design + code)

Least Recently Used cache with O(1) `Get` and `Put`: a **Dictionary** for lookup + a **doubly linked list** for recency order.

```csharp
public class LruCache<TKey, TValue>(int capacity) where TKey : notnull
{
    private readonly Dictionary<TKey, LinkedListNode<(TKey Key, TValue Value)>> _map = new();
    private readonly LinkedList<(TKey Key, TValue Value)> _list = new();   // front = most recent

    public bool TryGet(TKey key, out TValue value)
    {
        if (_map.TryGetValue(key, out var node))
        {
            _list.Remove(node); _list.AddFirst(node);
            value = node.Value.Value; return true;
        }
        value = default!; return false;
    }

    public void Put(TKey key, TValue value)
    {
        if (_map.TryGetValue(key, out var existing)) _list.Remove(existing);
        else if (_map.Count == capacity) { _map.Remove(_list.Last!.Value.Key); _list.RemoveLast(); }
        _map[key] = _list.AddFirst((key, value));
    }
}
```

# Module: Sorting, Searching and Recursion

## Lesson: [Basic|High] Binary search

```csharp
// O(log n) on a sorted array
static int BinarySearch(int[] a, int target)
{
    int lo = 0, hi = a.Length - 1;
    while (lo <= hi)
    {
        int mid = lo + (hi - lo) / 2;      // avoids int overflow of (lo + hi)
        if (a[mid] == target) return mid;
        if (a[mid] < target) lo = mid + 1; else hi = mid - 1;
    }
    return -1;
}
// Built-in: Array.BinarySearch(a, target), List<T>.BinarySearch
```

## Lesson: [Intermediate|High] Sorting algorithms

| Algorithm | Best | Average | Worst | Space | Stable |
|---|---|---|---|---|---|
| Bubble | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Selection | O(n²) | O(n²) | O(n²) | O(1) | No |
| Insertion | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Merge | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick | O(n log n) | O(n log n) | O(n²) | O(log n) | No |
| Heap | O(n log n) | O(n log n) | O(n log n) | O(1) | No |

.NET's `Array.Sort`/`List.Sort` use **introsort** (quicksort + heapsort + insertion sort) — O(n log n) worst case, **not stable**. LINQ `OrderBy` **is stable**.

```csharp
// Bubble sort with early exit
static void BubbleSort(int[] a)
{
    for (int i = 0; i < a.Length - 1; i++)
    {
        bool swapped = false;
        for (int j = 0; j < a.Length - 1 - i; j++)
            if (a[j] > a[j + 1]) { (a[j], a[j + 1]) = (a[j + 1], a[j]); swapped = true; }
        if (!swapped) break;
    }
}

// Quick sort (Lomuto partition)
static void QuickSort(int[] a, int lo, int hi)
{
    if (lo >= hi) return;
    int pivot = a[hi], i = lo;
    for (int j = lo; j < hi; j++) if (a[j] < pivot) { (a[i], a[j]) = (a[j], a[i]); i++; }
    (a[i], a[hi]) = (a[hi], a[i]);
    QuickSort(a, lo, i - 1); QuickSort(a, i + 1, hi);
}

// Merge sort
static int[] MergeSort(int[] a)
{
    if (a.Length <= 1) return a;
    int mid = a.Length / 2;
    return Merge(MergeSort(a[..mid]), MergeSort(a[mid..]));   // Merge from the arrays lesson
}
```

## Lesson: [Intermediate|Medium] Recursion, memoisation and dynamic programming

```csharp
// Naive Fibonacci is O(2^n); memoised is O(n)
static long FibMemo(int n, Dictionary<int, long>? memo = null)
{
    memo ??= new();
    if (n < 2) return n;
    if (memo.TryGetValue(n, out var v)) return v;
    return memo[n] = FibMemo(n - 1, memo) + FibMemo(n - 2, memo);
}

// Climbing stairs (1 or 2 steps) — bottom-up DP, same recurrence as Fibonacci
static int Climb(int n) { int a = 1, b = 1; for (int i = 2; i <= n; i++) (a, b) = (b, a + b); return b; }

// Permutations of a string — backtracking
static void Permute(string prefix, string rest, List<string> output)
{
    if (rest.Length == 0) { output.Add(prefix); return; }
    for (int i = 0; i < rest.Length; i++)
        Permute(prefix + rest[i], rest[..i] + rest[(i + 1)..], output);
}
```

Recursion needs a **base case**; deep recursion can cause `StackOverflowException`, which **cannot be caught** in .NET — convert to iteration for large inputs.

# Module: Trees and Graphs

## Lesson: [Intermediate|High] Binary trees and BST

```csharp
public class TreeNode(int val) { public int Val = val; public TreeNode? Left, Right; }

// Depth-first traversals
static void InOrder(TreeNode? n, List<int> o) { if (n is null) return; InOrder(n.Left, o); o.Add(n.Val); InOrder(n.Right, o); }  // BST → sorted
static void PreOrder(TreeNode? n, List<int> o) { if (n is null) return; o.Add(n.Val); PreOrder(n.Left, o); PreOrder(n.Right, o); }

// Height / max depth
static int Height(TreeNode? n) => n is null ? 0 : 1 + Math.Max(Height(n.Left), Height(n.Right));

// Level-order (BFS) with a queue
static List<List<int>> Levels(TreeNode? root)
{
    var result = new List<List<int>>();
    if (root is null) return result;
    var q = new Queue<TreeNode>(); q.Enqueue(root);
    while (q.Count > 0)
    {
        var level = new List<int>();
        for (int size = q.Count; size > 0; size--)
        {
            var n = q.Dequeue(); level.Add(n.Val);
            if (n.Left is not null) q.Enqueue(n.Left);
            if (n.Right is not null) q.Enqueue(n.Right);
        }
        result.Add(level);
    }
    return result;
}

// Validate BST using bounds
static bool IsBst(TreeNode? n, long min = long.MinValue, long max = long.MaxValue) =>
    n is null || (n.Val > min && n.Val < max && IsBst(n.Left, min, n.Val) && IsBst(n.Right, n.Val, max));
```

## Lesson: [Advanced|Medium] Graph BFS and DFS

```csharp
// Number of islands in a grid — DFS flood fill O(rows*cols)
static int Islands(char[][] g)
{
    int count = 0;
    void Sink(int r, int c)
    {
        if (r < 0 || c < 0 || r >= g.Length || c >= g[0].Length || g[r][c] != '1') return;
        g[r][c] = '0';
        Sink(r + 1, c); Sink(r - 1, c); Sink(r, c + 1); Sink(r, c - 1);
    }
    for (int r = 0; r < g.Length; r++)
        for (int c = 0; c < g[0].Length; c++)
            if (g[r][c] == '1') { count++; Sink(r, c); }
    return count;
}

// Shortest path in an unweighted graph — BFS
static int ShortestPath(Dictionary<int, List<int>> graph, int from, int to)
{
    var dist = new Dictionary<int, int> { [from] = 0 };
    var q = new Queue<int>([from]);
    while (q.Count > 0)
    {
        var node = q.Dequeue();
        if (node == to) return dist[node];
        foreach (var next in graph.GetValueOrDefault(node, []))
            if (dist.TryAdd(next, dist[node] + 1)) q.Enqueue(next);
    }
    return -1;
}
```

# Interview

## [Beginner|High] Reverse a string without using built-in Reverse.

Convert to a `char[]`, swap from both ends towards the middle with two pointers, then build a new string. O(n) time, O(n) space for the array (strings are immutable, so you can't do it in place).

```csharp
static string Reverse(string s)
{
    var c = s.ToCharArray();
    for (int i = 0, j = c.Length - 1; i < j; i++, j--) (c[i], c[j]) = (c[j], c[i]);
    return new string(c);
}
```

Mention: for user-visible text with emoji or combining characters, use `StringInfo` text elements.

## [Beginner|High] Check whether a string is a palindrome.

Two pointers from both ends, skip non-alphanumerics, compare case-insensitively. O(n) time, O(1) space. Simple version: `s == new string(s.Reverse().ToArray())`, which is O(n) extra space.

```csharp
static bool IsPal(string s)
{
    for (int i = 0, j = s.Length - 1; i < j; i++, j--)
        if (char.ToLower(s[i]) != char.ToLower(s[j])) return false;
    return true;
}
```

## [Beginner|High] Print the Fibonacci series up to n terms.

```csharp
long a = 0, b = 1;
for (int i = 0; i < n; i++) { Console.Write($"{a} "); (a, b) = (b, a + b); }
```

Iterative is O(n) time and O(1) space. Naive recursion `F(n-1)+F(n-2)` is O(2ⁿ) — mention memoisation if asked for recursion.

## [Beginner|High] Find duplicate elements in an array.

Use a `HashSet<int>`: `Add` returns false when the item already exists. O(n) time, O(n) space. LINQ alternative: `arr.GroupBy(x => x).Where(g => g.Count() > 1).Select(g => g.Key)`. If O(1) space is required and the array can be modified: sort first (O(n log n)) and compare neighbours.

```csharp
var seen = new HashSet<int>();
var dups = arr.Where(x => !seen.Add(x)).Distinct().ToList();
```

## [Beginner|High] Count the occurrences of each character in a string.

```csharp
var counts = new Dictionary<char, int>();
foreach (var c in s) counts[c] = counts.GetValueOrDefault(c) + 1;
// LINQ: s.GroupBy(c => c).ToDictionary(g => g.Key, g => g.Count());
// .NET 9: s.CountBy(c => c)
```

O(n) time, O(k) space where k = distinct characters.

## [Beginner|High] Find the second largest number in an array.

Single pass tracking `first` and `second` (skip values equal to `first` if distinct values are needed). O(n), O(1). Sorting is simpler but O(n log n): `arr.Distinct().OrderByDescending(x => x).Skip(1).First()`. Clarify: what if all elements are the same or there's only one?

## [Beginner|Medium] Check whether two strings are anagrams.

Same length + same character counts. Use an `int[26]` count array (lowercase a–z) incrementing for one string and decrementing for the other — O(n) time, O(1) space. Or sort both and compare — O(n log n). For Unicode use a `Dictionary<char,int>`.

## [Beginner|Medium] Swap two numbers without a third variable.

`(a, b) = (b, a);` in modern C#. Classic answers: arithmetic `a = a + b; b = a - b; a = a - b;` (can overflow) or XOR `a ^= b; b ^= a; a ^= b;` (integers only).

## [Intermediate|High] Two Sum: return indexes of two numbers that add up to a target.

Brute force: two loops, O(n²). Optimal: one pass with a `Dictionary<value, index>`. For each number, check whether `target - number` was seen. O(n) time, O(n) space. If the array is sorted, use two pointers in O(1) space.

```csharp
var seen = new Dictionary<int, int>();
for (int i = 0; i < nums.Length; i++)
{
    if (seen.TryGetValue(target - nums[i], out var j)) return [j, i];
    seen[nums[i]] = i;
}
```

## [Intermediate|High] Find the length of the longest substring without repeating characters.

Sliding window: keep the last index of each character. When a repeat appears inside the window, move `start` past its previous position, and track the max window length. O(n) time, O(k) space. Example: "abcabcbb" → 3 ("abc").

## [Intermediate|High] Find the maximum subarray sum (Kadane's algorithm).

At each element, either extend the current subarray or start fresh: `cur = max(a[i], cur + a[i])`, and `best = max(best, cur)`. O(n) time, O(1) space. Works with all-negative arrays if you initialise with `a[0]`. Example: [-2,1,-3,4,-1,2,1,-5,4] → 6 ([4,-1,2,1]).

## [Intermediate|High] Check for balanced parentheses.

Push opening brackets on a `Stack<char>`. For each closing bracket, the stack must be non-empty and the top must match. At the end the stack must be empty. O(n) time and space.

## [Intermediate|High] Reverse a linked list.

Iterate with three pointers: `prev`, `current`, `next`. Save `next`, point `current.Next` to `prev`, advance both. Return `prev`. O(n) time, O(1) space. Recursive version: O(n) stack space.

## [Intermediate|High] Detect a loop in a linked list.

Floyd's cycle detection: slow pointer moves one step, fast moves two. If they meet, there is a cycle; if fast reaches null, there isn't. O(n) time, O(1) space. To find the cycle start, reset one pointer to head and move both one step at a time until they meet. Alternative: a `HashSet` of visited nodes (O(n) space).

## [Intermediate|High] Implement binary search. What is its complexity?

On a **sorted** array, compare with the middle element and discard half each time: O(log n) time, O(1) space iteratively. Compute `mid = lo + (hi - lo) / 2` to avoid overflow. Variants: first/last occurrence, search in a rotated array, lower bound.

## [Intermediate|Medium] What sorting algorithm does .NET use? Is it stable?

`Array.Sort` and `List<T>.Sort` use **introspective sort** (quicksort, switching to heapsort when recursion is too deep, and insertion sort for small partitions). It's O(n log n) worst case and **not stable**. `Enumerable.OrderBy` (LINQ) is a **stable** sort. Use LINQ when equal elements must keep their original order.

## [Intermediate|Medium] Find the height of a binary tree and print it level by level.

Height: recursive `1 + max(height(left), height(right))`, with null = 0. Level-order: BFS with a `Queue`, processing `queue.Count` nodes per level. Both are O(n). Space is O(h) for recursion and O(w) for the queue (h = height, w = max width).

## [Advanced|High] Design and implement an LRU cache with O(1) get and put.

Combine a `Dictionary<key, LinkedListNode>` for O(1) lookup with a doubly `LinkedList` ordered by recency. On get: move the node to the front. On put: update and move to the front, or insert at the front. If over capacity, remove the **last** node and its dictionary entry. Thread safety: wrap in a lock or use per-key strategies. In production use `MemoryCache` with a size limit.

## [Advanced|Medium] Find the top K frequent elements.

Count with a dictionary, O(n). Then either sort by count, O(n log n), or use a **min-heap of size k** (`PriorityQueue<int,int>`), O(n log k). Bucket sort by frequency gives O(n). Discuss the trade-offs.

## [Advanced|Medium] Count the number of islands in a 2D grid.

Scan the grid. When you find unvisited land (`'1'`), increment the count and flood-fill (DFS or BFS) to mark the whole island visited. O(rows × cols) time; recursion depth can reach rows × cols, so use an explicit stack or queue for big grids. Union-Find is an alternative.

## [Scenario|High] You are given 10 million log lines and must find the top 10 most frequent IP addresses with limited memory. How?

If the distinct IPs fit in memory: stream the file line by line (`File.ReadLines`), count in a `Dictionary<string,int>`, then keep a min-heap of size 10, O(n log 10). If not: **partition** by hash of the IP into N temp files so each file's distinct IPs fit in memory, count each file, and merge the per-file top-10s. For a stream with bounded error, use a Count-Min Sketch or the Space-Saving algorithm. In practice you'd load the data into SQL/Kusto and `GROUP BY ... ORDER BY COUNT(*) DESC`.

## [Scenario|High] The interviewer says your O(n²) solution works — "can you do better?" What's your approach?

Find the repeated work in the inner loop. Usual upgrades: (1) a **hash map/set** to replace an inner search, O(n²) → O(n); (2) **sort + two pointers**, O(n log n); (3) a **sliding window** for contiguous subarray/substring problems; (4) **prefix sums** for range sums; (5) a **heap** for top-K; (6) **binary search** on a sorted structure or on the answer; (7) **memoisation/DP** for overlapping subproblems. Say the trade-off (more memory for less time).

## [Scenario|Medium] You get stuck halfway through a coding problem in an interview. What do you do?

Keep talking. Restate what works so far, try a smaller example by hand to spot the pattern, consider brute force if the optimal approach is stuck, and ask a clarifying question or for a hint. A working brute-force solution with a clear explanation scores better than a half-written optimal one. Test what you have and state its complexity.

# Cheatsheet

## Pattern → when to use

| Clue in the problem | Pattern |
|---|---|
| "pair/complement", "seen before", duplicates | Hash map / HashSet |
| Sorted array, pair sum, palindrome | Two pointers |
| Contiguous subarray/substring, "longest/shortest window" | Sliding window |
| Brackets, "next greater", undo | Stack (monotonic stack) |
| Shortest path unweighted, level order | BFS (Queue) |
| All paths, islands, tree recursion | DFS |
| Sorted + search, "minimum feasible value" | Binary search |
| Top K, k-th largest, merge k lists | Heap (`PriorityQueue`) |
| Overlapping subproblems, "number of ways" | DP / memoisation |
| All combinations/permutations | Backtracking |
| Linked list cycle/middle | Fast & slow pointers |

## Complexity of C# collections

| Operation | List | Dictionary/HashSet | SortedDictionary | LinkedList |
|---|---|---|---|---|
| Add | O(1)* | O(1)* | O(log n) | O(1) |
| Search | O(n) | O(1) | O(log n) | O(n) |
| Remove | O(n) | O(1) | O(log n) | O(1) with node |
| Index | O(1) | — | — | O(n) |

*amortised/average

## Must-know programs (practise until automatic)

Reverse string · palindrome · anagram · char count · first unique char · reverse words · Fibonacci · prime · factorial · Armstrong · FizzBuzz · swap · second largest · duplicates · missing number · move zeros · rotate array · merge sorted arrays · two sum · Kadane · valid parentheses · reverse linked list · cycle detection · binary search · bubble/quick/merge sort · tree height/BFS · LRU cache.

## Useful C# snippets

```csharp
counts[c] = counts.GetValueOrDefault(c) + 1;
(a, b) = (b, a);
var pq = new PriorityQueue<string, int>();   // min-heap
var maxPq = new PriorityQueue<int, int>(Comparer<int>.Create((x, y) => y.CompareTo(x)));
int mid = lo + (hi - lo) / 2;
s[^1]; s[1..^1]; arr[..k];
Array.Sort(arr); Array.Reverse(arr, i, len);
string.Join(",", list);
```

## Answer checklist

Clarify → examples → brute force + Big-O → optimise → code → dry-run → edge cases (empty, one, duplicates, negatives, overflow) → final Big-O.
