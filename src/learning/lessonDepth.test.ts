import { describe, expect, it } from "vitest";
import { lessons } from "./curriculum";
import { coreDepth, workedExamples } from "./lessonDepth";
import { coreVisuals } from "./coreVisuals";
import { lessonMastery } from "./lessonMastery";

describe("lesson depth", () => {
  it("gives every lesson multi-section theory and a worked example", () => {
    expect(lessons).toHaveLength(39);
    expect(Object.keys(coreDepth)).toHaveLength(24);
    expect(Object.keys(workedExamples)).toHaveLength(39);
    expect(Object.keys(lessonMastery)).toHaveLength(39);
    for (const lesson of lessons) {
      expect(lesson.deepDive?.sections.length).toBeGreaterThanOrEqual(3);
      expect(lesson.workedExample?.steps).toHaveLength(3);
      expect(lesson.workedExample?.takeaway).toBeTruthy();
      expect(lesson.mastery?.sections).toHaveLength(2);
      expect(lesson.mastery?.misconception.correction).toBeTruthy();
      expect(lesson.mastery?.challenge.answer).toBeTruthy();
    }
  });

  it("uses either a lesson-specific trace or an appropriate interactive lab", () => {
    for (const lesson of lessons) {
      if (lesson.deepDive?.lab) continue;
      if (["joins", "transactions-acid", "distributed"].includes(lesson.id))
        continue;
      expect(coreVisuals[lesson.id], lesson.id).toBeDefined();
    }
  });
});
