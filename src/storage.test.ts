import { afterEach, describe, expect, it, vi } from "vitest";
import { readStoredJson, readStoredText, writeStoredText } from "./storage";

afterEach(() => vi.unstubAllGlobals());

describe("browser preference storage", () => {
  it("falls back when storage is blocked or full", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("Blocked");
      },
      setItem: () => {
        throw new Error("Quota exceeded");
      },
    });
    expect(readStoredText("draft")).toBeNull();
    expect(readStoredJson("draft", [1])).toEqual([1]);
    expect(writeStoredText("draft", "hello")).toBe(false);
  });

  it("reads valid JSON and ignores damaged values", () => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) =>
        key === "valid" ? '{"value":2}' : key === "wrong" ? "null" : "{",
    });
    expect(readStoredJson("valid", {})).toEqual({ value: 2 });
    expect(readStoredJson("damaged", { value: 0 })).toEqual({ value: 0 });
    expect(readStoredJson("wrong", { value: 0 })).toEqual({ value: 0 });
  });
});
