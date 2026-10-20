"use client";
// Per-browser learning progress (completed lessons, bookmarked questions, practice history) in localStorage.
import { useEffect, useState } from "react";

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("academy-storage"));
  } catch {}
};

export function useStored<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    const load = () => setValue(read(key, fallback));
    load();
    window.addEventListener("academy-storage", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("academy-storage", load);
      window.removeEventListener("storage", load);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [value, (v: T) => { setValue(v); write(key, v); }];
}

export const useDoneLessons = () => useStored<string[]>("done-lessons", []);
export const useBookmarks = () => useStored<number[]>("bookmarks", []);
