import { describe, expect, it } from "vitest";
import { lessons } from "./curriculum";
import { theoryCategories } from "./navigation";

describe("home theory navigation", () => {
  it("places every lesson in exactly one category and subcategory", () => {
    expect(theoryCategories).toHaveLength(7);
    const ids = theoryCategories.flatMap((category) =>
      category.subcategories.flatMap((subcategory) => subcategory.lessonIds),
    );
    expect(ids).toHaveLength(lessons.length);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(lessons.map((lesson) => lesson.id)));
  });

  it("gives every category visible subcategories", () => {
    for (const category of theoryCategories) {
      expect(category.title).toBeTruthy();
      expect(category.subcategories.length).toBeGreaterThan(0);
      for (const subcategory of category.subcategories)
        expect(subcategory.lessonIds.length).toBeGreaterThan(0);
    }
  });
});
