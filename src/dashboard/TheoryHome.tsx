import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Database,
  Layers3,
  Search,
  Sparkles,
  Workflow,
} from "lucide-react";
import { lessons } from "../learning/curriculum";
import { theoryCategories } from "../learning/navigation";
import type { TheoryCategory } from "../learning/navigation";
import "./theory-home.css";

const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
const featuredIds = ["fundamentals", "sql-basics", "transactions-acid"];
const icons = {
  systems: Database,
  foundations: Database,
  design: Workflow,
  sql: BookOpen,
  performance: Layers3,
  reliability: Sparkles,
  scale: Layers3,
};

function categoryLessons(category: TheoryCategory) {
  return category.subcategories.flatMap((sub) => sub.lessonIds);
}

export default function TheoryHome({
  openLesson,
  openCatalog,
}: {
  openLesson: (id: string) => void;
  openCatalog: () => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [expanded, setExpanded] = useState<string[]>(["foundations"]);
  const normalizedQuery = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      theoryCategories
        .filter(
          (category) => categoryId === "all" || category.id === categoryId,
        )
        .map((category) => {
          const categoryMatch =
            !normalizedQuery ||
            `${category.title} ${category.description}`
              .toLowerCase()
              .includes(normalizedQuery);
          const subcategories = category.subcategories
            .map((sub) => {
              const subMatch = sub.title
                .toLowerCase()
                .includes(normalizedQuery);
              const lessonIds = sub.lessonIds.filter((id) => {
                const lesson = lessonById.get(id);
                return (
                  categoryMatch ||
                  subMatch ||
                  `${lesson?.title ?? ""} ${lesson?.summary ?? ""}`
                    .toLowerCase()
                    .includes(normalizedQuery)
                );
              });
              return { ...sub, lessonIds };
            })
            .filter((sub) => sub.lessonIds.length > 0);
          return { ...category, subcategories };
        })
        .filter((category) => category.subcategories.length > 0),
    [categoryId, normalizedQuery],
  );

  function toggle(id: string) {
    setExpanded((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <section className="theory-home" aria-labelledby="theory-home-title">
      <div className="theory-home-heading">
        <div>
          <span className="theory-home-kicker">
            <BookOpen size={14} /> THE THEORY LIBRARY
          </span>
          <h2 id="theory-home-title">Learn DBMS, one idea at a time</h2>
          <p>
            Start with a concept, follow its visualization, then test it in the
            browser.
          </p>
        </div>
        <button className="theory-catalog-link" onClick={openCatalog}>
          Full learning center <ArrowRight size={16} />
        </button>
      </div>

      <div
        className="theory-featured-grid"
        aria-label="Suggested starting lessons"
      >
        {featuredIds.map((id, index) => {
          const lesson = lessonById.get(id);
          if (!lesson) return null;
          return (
            <button
              key={id}
              className={`theory-featured-card theory-featured-${index}`}
              onClick={() => openLesson(id)}
            >
              <span className="theory-featured-top">
                <span>START HERE · {String(index + 1).padStart(2, "0")}</span>
                <ArrowRight size={16} />
              </span>
              <strong>{lesson.title}</strong>
              <small>{lesson.summary}</small>
              <span className="theory-featured-foot">
                {lesson.level} · {lesson.minutes} min
              </span>
            </button>
          );
        })}
      </div>

      <div className="theory-browser-heading">
        <div>
          <h3>Explore by category</h3>
          <p>
            Seven learning paths, organized into subcategories and focused
            lessons.
          </p>
        </div>
        <label className="theory-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search theory lessons"
            aria-label="Search theory lessons"
          />
        </label>
      </div>
      <div
        className="theory-filters"
        role="group"
        aria-label="Filter theory categories"
      >
        <button
          className={categoryId === "all" ? "active" : ""}
          onClick={() => setCategoryId("all")}
        >
          All categories
        </button>
        {theoryCategories.map((category) => (
          <button
            key={category.id}
            className={categoryId === category.id ? "active" : ""}
            onClick={() => setCategoryId(category.id)}
          >
            {category.title}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="theory-no-results">
          No lessons match “{query}”. Try another topic or clear the category
          filter.
        </div>
      ) : (
        <div className="theory-category-grid">
          {visible.map((category) => {
            const Icon = icons[category.id as keyof typeof icons];
            const isExpanded =
              normalizedQuery.length > 0 || expanded.includes(category.id);
            const count = categoryLessons(category).length;
            return (
              <article
                key={category.id}
                className={`theory-category-card tone-${category.tone}`}
              >
                <div className="theory-category-top">
                  <span className="theory-category-icon">
                    <Icon size={21} />
                  </span>
                  <span className="theory-category-count">{count} lessons</span>
                </div>
                <h4>{category.title}</h4>
                <p>{category.description}</p>
                <div className="theory-subcategory-list">
                  {category.subcategories.map((sub) => (
                    <div className="theory-subcategory" key={sub.title}>
                      <div className="theory-subcategory-title">
                        <strong>{sub.title}</strong>
                        <span>{sub.lessonIds.length}</span>
                      </div>
                      {isExpanded && (
                        <div className="theory-lesson-list">
                          {sub.lessonIds.map((id) => {
                            const lesson = lessonById.get(id);
                            if (!lesson) return null;
                            return (
                              <button key={id} onClick={() => openLesson(id)}>
                                <span>{lesson.title}</span>
                                <ArrowRight size={14} />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {!normalizedQuery && (
                  <button
                    className="theory-category-toggle"
                    onClick={() => toggle(category.id)}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? "Show fewer lessons" : "Explore lessons"}
                    <ChevronDown size={15} />
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
