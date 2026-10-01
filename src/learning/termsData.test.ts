import { describe, expect, it } from "vitest";
import { lessons } from "./curriculum";
import { glossaryCategories, glossaryTerms } from "./termsData";
import { systemsLessons } from "./systemsCurriculum";

describe("DBMS dictionary and systems theory", () => {
  it("provides 200 unique, defined terms across ten topics", () => {
    expect(glossaryTerms).toHaveLength(200);
    expect(glossaryCategories).toHaveLength(10);
    expect(
      new Set(glossaryTerms.map((item) => item.term.toLowerCase())).size,
    ).toBe(200);
    expect(new Set(glossaryTerms.map((item) => item.category))).toEqual(
      new Set(glossaryCategories),
    );
    const ids = new Set(lessons.map((lesson) => lesson.id));
    for (const item of glossaryTerms) {
      expect(item.term.length).toBeGreaterThan(1);
      expect(item.definition.length).toBeGreaterThan(25);
      expect(ids.has(item.lessonId), item.term).toBe(true);
    }
  });

  it("teaches relational, SQL, NoSQL, and realtime systems in depth", () => {
    expect(systemsLessons.map((lesson) => lesson.id)).toEqual([
      "rdbms-systems",
      "sql-language-systems",
      "nosql-families",
      "realtime-databases",
    ]);
    for (const lesson of systemsLessons) {
      expect(lesson.deepDive?.sections.length).toBeGreaterThanOrEqual(3);
      expect(lesson.mastery?.sections.length).toBe(2);
      expect(lesson.workedExample?.steps.length).toBe(3);
      expect(lesson.exercises).toHaveLength(2);
    }
  });
});
