import { describe, expect, it } from "vitest";
import { engineeringLessons } from "./engineeringCurriculum";
import {
  attributeClosure,
  precedenceEdges,
  supportedEngineeringLabs,
} from "./EngineeringLab";

describe("engineering curriculum", () => {
  it("provides theory, labs, and exercises for every new chapter", () => {
    expect(engineeringLessons).toHaveLength(15);
    expect(new Set(engineeringLessons.map((lesson) => lesson.id)).size).toBe(
      15,
    );
    for (const lesson of engineeringLessons) {
      expect(lesson.deepDive?.sections).toHaveLength(3);
      expect(lesson.deepDive?.lab).toBeTruthy();
      expect(supportedEngineeringLabs.has(lesson.deepDive?.lab ?? "")).toBe(
        true,
      );
      expect(lesson.exercises).toHaveLength(2);
    }
  });

  it("computes transitive attribute closure", () => {
    expect(attributeClosure("A")).toBe("ABC");
    expect(attributeClosure("AD")).toBe("ABCDE");
    expect(attributeClosure("D")).toBe("D");
  });

  it("adds precedence edges only for conflicting operations", () => {
    expect(
      precedenceEdges([
        { tx: "T1", mode: "R", item: "A" },
        { tx: "T2", mode: "R", item: "A" },
      ]),
    ).toEqual([]);
    expect(
      precedenceEdges([
        { tx: "T1", mode: "W", item: "A" },
        { tx: "T2", mode: "R", item: "A" },
        { tx: "T2", mode: "W", item: "B" },
        { tx: "T1", mode: "R", item: "B" },
      ]),
    ).toEqual(["T1→T2", "T2→T1"]);
  });
});
