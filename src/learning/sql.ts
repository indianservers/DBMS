import type { SqlExercise } from "./curriculum";

export type QueryResult = {
  columns: string[];
  rows: (string | number | null)[][];
  error?: string;
};
type WorkerResponse = QueryResult & { id: number };

export function runSql(sql: string): Promise<QueryResult> {
  return new Promise((resolve) => {
    if (!sql.trim()) {
      resolve({ columns: [], rows: [], error: "Enter a SQL query first." });
      return;
    }
    const worker = new Worker(new URL("./sql.worker.ts", import.meta.url), {
      type: "module",
    });
    const timer = window.setTimeout(() => {
      worker.terminate();
      resolve({
        columns: [],
        rows: [],
        error: "Query timed out after 5 seconds. Try a smaller query.",
      });
    }, 5000);
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      window.clearTimeout(timer);
      worker.terminate();
      resolve({
        columns: event.data.columns,
        rows: event.data.rows,
        error: event.data.error,
      });
    };
    worker.onerror = () => {
      window.clearTimeout(timer);
      worker.terminate();
      resolve({
        columns: [],
        rows: [],
        error: "The browser SQL engine could not start.",
      });
    };
    worker.postMessage({ id: 1, sql });
  });
}

function normalized(value: string | number | null): string {
  if (value === null) return "null";
  if (typeof value === "number") return Number(value.toFixed(8)).toString();
  return String(value);
}

export function sameResult(
  actual: QueryResult,
  expected: QueryResult,
  ordered = false,
): boolean {
  if (
    actual.error ||
    expected.error ||
    actual.columns.length !== expected.columns.length ||
    actual.rows.length !== expected.rows.length
  )
    return false;
  const rows = (result: QueryResult) =>
    result.rows.map((row) => JSON.stringify(row.map(normalized)));
  const a = rows(actual),
    b = rows(expected);
  if (!ordered) {
    a.sort();
    b.sort();
  }
  return a.every((row, i) => row === b[i]);
}

export async function evaluateSql(
  exercise: SqlExercise,
  answer: string,
): Promise<{ correct: boolean; result: QueryResult; message: string }> {
  const result = await runSql(answer);
  if (result.error) return { correct: false, result, message: result.error };
  const expected = await runSql(exercise.reference);
  if (expected.error)
    return {
      correct: false,
      result,
      message:
        "The exercise reference could not be checked. Please report this lesson.",
    };
  const correct = sameResult(result, expected, exercise.ordered);
  return {
    correct,
    result,
    message: correct
      ? "Correct result. Your query returns the expected data."
      : `Not quite. Your result has ${result.rows.length} row${result.rows.length === 1 ? "" : "s"} and ${result.columns.length} column${result.columns.length === 1 ? "" : "s"}; compare it with the goal and try again.`,
  };
}
