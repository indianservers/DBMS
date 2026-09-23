import type { ParsedTable } from "./formats";

export type ParsedFile =
  | { kind: "sql"; text: string; preview: string }
  | { kind: "tabular"; table: ParsedTable; preview: string };

export function parseLocalFile(
  file: File,
  extension: string,
): Promise<ParsedFile> {
  const worker = new Worker(new URL("./file.worker.ts", import.meta.url), {
    type: "module",
  });
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      worker.terminate();
      reject(new Error("File parsing timed out."));
    }, 30_000);
    worker.onmessage = (
      event: MessageEvent<ParsedFile & { error?: string }>,
    ) => {
      window.clearTimeout(timer);
      worker.terminate();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data);
    };
    worker.onerror = (event) => {
      window.clearTimeout(timer);
      worker.terminate();
      reject(new Error(event.message));
    };
    worker.postMessage({ file, extension });
  });
}
