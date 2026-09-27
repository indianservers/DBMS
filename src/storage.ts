export function readStoredText(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStoredText(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function readStoredJson<T>(key: string, fallback: T): T {
  const text = readStoredText(key);
  if (text === null) return fallback;
  try {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    if (
      fallback !== null &&
      typeof fallback === "object" &&
      !Array.isArray(fallback) &&
      (parsed === null || typeof parsed !== "object" || Array.isArray(parsed))
    )
      return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}
