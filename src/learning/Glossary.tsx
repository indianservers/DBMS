import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, BookText, Search, X } from "lucide-react";
import { lessons } from "./curriculum";
import { glossaryCategories, glossaryTerms } from "./termsData";
import "./glossary.css";

const lessonNames = new Map(lessons.map((lesson) => [lesson.id, lesson.title]));
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Glossary({
  openLesson,
}: {
  openLesson: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All topics");
  const [letter, setLetter] = useState("All");
  const normalized = query.trim().toLocaleLowerCase();
  const visible = useMemo(
    () =>
      glossaryTerms.filter(
        (item) =>
          (category === "All topics" || item.category === category) &&
          (letter === "All" || item.term.toUpperCase().startsWith(letter)) &&
          (!normalized ||
            `${item.term} ${item.definition} ${item.category}`
              .toLocaleLowerCase()
              .includes(normalized)),
      ),
    [category, letter, normalized],
  );
  const grouped = useMemo(() => {
    const map = new Map<string, typeof glossaryTerms>();
    for (const item of [...visible].sort((a, b) =>
      a.term.localeCompare(b.term),
    )) {
      const key = item.term[0].toUpperCase();
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return [...map.entries()];
  }, [visible]);

  return (
    <div className="glossary-page content-scroll">
      <header className="glossary-hero">
        <span className="glossary-eyebrow">
          <BookText size={15} /> DBMS DICTIONARY
        </span>
        <h1>Find the meaning. Follow the idea.</h1>
        <p>
          200 concise terms across relational databases, SQL, NoSQL, realtime
          systems, and operations. Each term connects to a lesson for deeper
          exploration.
        </p>
        <div className="glossary-hero-stats">
          <strong>200</strong> terms <span />{" "}
          <strong>{glossaryCategories.length}</strong> topics <span />{" "}
          Browser-only reference
        </div>
      </header>
      <div className="glossary-toolbar">
        <label className="glossary-search">
          <Search size={18} />
          <input
            aria-label="Search DBMS terms"
            placeholder="Search a term, definition, or topic…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button aria-label="Clear search" onClick={() => setQuery("")}>
              <X size={16} />
            </button>
          )}
        </label>
        <select
          aria-label="Filter dictionary topic"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option>All topics</option>
          {glossaryCategories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div
        className="glossary-alphabet"
        role="group"
        aria-label="Filter by first letter"
      >
        <button
          className={letter === "All" ? "active" : ""}
          onClick={() => setLetter("All")}
        >
          All
        </button>
        {letters.map((item) => (
          <button
            key={item}
            className={letter === item ? "active" : ""}
            onClick={() => setLetter(item)}
            disabled={
              !glossaryTerms.some((term) =>
                term.term.toUpperCase().startsWith(item),
              )
            }
          >
            {item}
          </button>
        ))}
      </div>
      <div className="glossary-results-heading">
        <h2>
          {visible.length} {visible.length === 1 ? "term" : "terms"}
        </h2>
        <span>
          {category === "All topics" ? "All topics" : category}
          {letter !== "All" ? ` · ${letter}` : ""}
        </span>
      </div>
      {grouped.length ? (
        grouped.map(([initial, items]) => (
          <section
            className="glossary-letter-section"
            key={initial}
            aria-label={`Terms beginning with ${initial}`}
          >
            <h3>{initial}</h3>
            <div className="glossary-grid">
              {items.map((item) => (
                <article className="glossary-card" key={item.term}>
                  <span className="glossary-topic">{item.category}</span>
                  <h4>{item.term}</h4>
                  <p>{item.definition}</p>
                  <button
                    onClick={() => openLesson(item.lessonId)}
                    aria-label={`Read ${lessonNames.get(item.lessonId)} lesson for ${item.term}`}
                  >
                    <BookOpen size={14} /> Explore in{" "}
                    {lessonNames.get(item.lessonId)} <ArrowRight size={14} />
                  </button>
                </article>
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="glossary-empty">
          No terms match your filters. Try another word, topic, or letter.{" "}
          <button
            onClick={() => {
              setQuery("");
              setCategory("All topics");
              setLetter("All");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
