import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import initSqlJs from "sql.js";
import { allExercises, lessons } from "./curriculum";
import { seedSql } from "./seed";
import { sameResult } from "./sql";

const require = createRequire(import.meta.url);

describe("learning curriculum", () => {
  it("contains unique, complete lessons and at least 40 exercises", () => {
    expect(lessons.length).toBeGreaterThanOrEqual(23);
    expect(allExercises.length).toBeGreaterThanOrEqual(40);
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(
      lessons.length,
    );
    expect(new Set(allExercises.map((exercise) => exercise.id)).size).toBe(
      allExercises.length,
    );
    for (const lesson of lessons) {
      expect(lesson.objectives).toHaveLength(2);
      expect(lesson.explanation.length).toBeGreaterThan(80);
      expect(lesson.exercises).toHaveLength(2);
      for (const exercise of lesson.exercises)
        if (exercise.kind === "choice") {
          expect(exercise.options).toHaveLength(4);
          expect(exercise.correct).toBeGreaterThanOrEqual(0);
          expect(exercise.correct).toBeLessThan(4);
        }
    }
  });

  it("executes every SQL reference answer on the browser practice dataset", async () => {
    const SQL = await initSqlJs({
      locateFile: () => require.resolve("sql.js/dist/sql-wasm.wasm"),
    });
    const db = new SQL.Database();
    db.run(seedSql);
    db.run("PRAGMA query_only = ON;");
    for (const exercise of allExercises) {
      if (exercise.kind !== "sql") continue;
      expect(() => db.exec(exercise.reference), exercise.id).not.toThrow();
      expect(
        db.exec(exercise.reference)[0]?.columns.length,
        exercise.id,
      ).toBeGreaterThan(0);
    }
    db.close();
  });

  it("compares SQL results by values and row order when requested", () => {
    const expected = { columns: ["name"], rows: [["Notebook"], ["Desk Lamp"]] };
    const reversed = {
      columns: ["product"],
      rows: [["Desk Lamp"], ["Notebook"]],
    };
    expect(sameResult(reversed, expected)).toBe(true);
    expect(sameResult(reversed, expected, true)).toBe(false);
    expect(
      sameResult({ columns: ["name"], rows: [["Notebook"]] }, expected),
    ).toBe(false);
  });
});
