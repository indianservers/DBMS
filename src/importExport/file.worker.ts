import { parseDelimited, parseJsonDocuments } from "./formats";

self.onmessage = async (
  event: MessageEvent<{ file: File; extension: string }>,
) => {
  try {
    const { file, extension } = event.data;
    const text = await file.text();
    if (extension === "sql") {
      self.postMessage({ kind: "sql", text, preview: text.slice(0, 12000) });
      return;
    }
    const table =
      extension === "json" || extension === "jsonl" || extension === "ndjson"
        ? parseJsonDocuments(text)
        : parseDelimited(text, extension === "tsv" ? "\t" : ",");
    self.postMessage({ kind: "tabular", table, preview: text.slice(0, 12000) });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
