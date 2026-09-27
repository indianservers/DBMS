import { quoteId } from "../workspace/database";

export function rowCountQueries(names: string[]): string[] {
  const queries: string[] = [];
  for (let start = 0; start < names.length; start += 200) {
    queries.push(
      names
        .slice(start, start + 200)
        .map(
          (name, index) =>
            `SELECT ${start + index} AS table_index, COUNT(*) AS row_count FROM ${quoteId(name)}`,
        )
        .join(" UNION ALL "),
    );
  }
  return queries;
}
