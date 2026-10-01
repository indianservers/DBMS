import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Code2,
  Database,
  Filter,
  Flame,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Target,
  TerminalSquare,
  Trophy,
  Workflow,
} from "lucide-react";
import { allExercises, categories, lessons } from "./curriculum";
import type { Level, VisualKind } from "./curriculum";
import { databaseGuide } from "./seed";
import { evaluateSql, runSql } from "./sql";
import { writeStoredText } from "../storage";
import EngineeringLab from "./EngineeringLab";
import { coreVisuals } from "./coreVisuals";
import type { QueryResult } from "./sql";
import "./learning.css";

type Attempt = { wrong: number; lastAt: string };
type Progress = {
  solved: string[];
  completed: string[];
  bookmarks: string[];
  notes: Record<string, string>;
  attempts: Record<string, Attempt>;
  activity: { lessonId: string; at: string }[];
  lastLesson: string;
};
const progressKey = "dbms-studio-learning-v1";
const emptyProgress: Progress = {
  solved: [],
  completed: [],
  bookmarks: [],
  notes: {},
  attempts: {},
  activity: [],
  lastLesson: "fundamentals",
};
function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(progressKey);
    if (!raw) return emptyProgress;
    const p = JSON.parse(raw) as Partial<Progress>;
    return {
      ...emptyProgress,
      ...p,
      solved: Array.isArray(p.solved) ? p.solved : [],
      completed: Array.isArray(p.completed) ? p.completed : [],
      bookmarks: Array.isArray(p.bookmarks) ? p.bookmarks : [],
      notes: p.notes ?? {},
      attempts: p.attempts ?? {},
      activity: Array.isArray(p.activity) ? p.activity : [],
    };
  } catch {
    return emptyProgress;
  }
}
function today() {
  return new Date().toLocaleDateString("en-CA");
}
function streak(activity: Progress["activity"]) {
  const days = new Set(
    activity.map((a) => new Date(a.at).toLocaleDateString("en-CA")),
  );
  let count = 0;
  const date = new Date();
  if (!days.has(today())) date.setDate(date.getDate() - 1);
  while (days.has(date.toLocaleDateString("en-CA"))) {
    count++;
    date.setDate(date.getDate() - 1);
  }
  return count;
}
const levelOrder: Level[] = ["Beginner", "Intermediate", "Advanced"];

export default function LearningCenter({
  initialLessonId,
  openTerms,
}: {
  initialLessonId?: string;
  openTerms: () => void;
}) {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [screen, setScreen] = useState<"dashboard" | "catalog" | "lesson">(
    initialLessonId && lessons.some((lesson) => lesson.id === initialLessonId)
      ? "lesson"
      : "dashboard",
  );
  const [lessonId, setLessonId] = useState(
    initialLessonId && lessons.some((lesson) => lesson.id === initialLessonId)
      ? initialLessonId
      : progress.lastLesson,
  );
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All topics");
  const [level, setLevel] = useState("All levels");
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    message: string;
    explanation?: string;
  } | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [sqlAnswer, setSqlAnswer] = useState("");
  const [exampleSql, setExampleSql] = useState("");
  const [exampleResult, setExampleResult] = useState<QueryResult | null>(null);
  const [answerResult, setAnswerResult] = useState<QueryResult | null>(null);
  const [savedOnly, setSavedOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  useEffect(() => {
    if (
      initialLessonId &&
      lessons.some((item) => item.id === initialLessonId)
    ) {
      setProgress((current) =>
        current.lastLesson === initialLessonId
          ? current
          : { ...current, lastLesson: initialLessonId },
      );
    }
  }, [initialLessonId]);
  const lesson = lessons.find((l) => l.id === lessonId) ?? lessons[0];
  const exercise = lesson.exercises[exerciseIndex];
  const completion = Math.round(
    (progress.completed.length / lessons.length) * 100,
  );
  const totalMinutes = lessons
    .filter((l) => progress.completed.includes(l.id))
    .reduce((n, l) => n + l.minutes, 0);
  const recommended =
    lessons.find((l) => !progress.completed.includes(l.id)) ?? lessons[0];
  const filtered = useMemo(
    () =>
      lessons.filter(
        (l) =>
          (category === "All topics" || l.category === category) &&
          (level === "All levels" || l.level === level) &&
          (!savedOnly || progress.bookmarks.includes(l.id)) &&
          `${l.title} ${l.summary} ${l.category}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [category, level, search, savedOnly, progress.bookmarks],
  );
  const weak = lessons
    .map((l) => ({
      lesson: l,
      wrong: l.exercises.reduce(
        (n, e) => n + (progress.attempts[e.id]?.wrong ?? 0),
        0,
      ),
    }))
    .filter((x) => x.wrong > 0 && !progress.completed.includes(x.lesson.id))
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 3);
  useEffect(() => {
    writeStoredText(progressKey, JSON.stringify(progress));
  }, [progress]);
  useEffect(() => {
    setExampleSql(lesson.exampleSql);
    setSqlAnswer("");
    setExampleResult(null);
    setAnswerResult(null);
    setFeedback(null);
    setSelectedOption(null);
    setHintOpen(false);
    setSolutionOpen(false);
  }, [lessonId, exerciseIndex]);
  function openLesson(id: string) {
    setLessonId(id);
    setExerciseIndex(0);
    setProgress((p) => ({ ...p, lastLesson: id }));
    setScreen("lesson");
  }
  function toggleBookmark(id: string) {
    setProgress((p) => ({
      ...p,
      bookmarks: p.bookmarks.includes(id)
        ? p.bookmarks.filter((x) => x !== id)
        : [...p.bookmarks, id],
    }));
  }
  function saveNote(value: string) {
    setProgress((p) => ({ ...p, notes: { ...p.notes, [lesson.id]: value } }));
  }
  function record(correct: boolean, message: string, explanation?: string) {
    setFeedback({ correct, message, explanation });
    if (correct) {
      setProgress((p) => {
        if (p.solved.includes(exercise.id)) return p;
        const solved = [...p.solved, exercise.id];
        const complete = lesson.exercises.every((e) => solved.includes(e.id));
        return {
          ...p,
          solved,
          completed:
            complete && !p.completed.includes(lesson.id)
              ? [...p.completed, lesson.id]
              : p.completed,
          activity: [
            { lessonId: lesson.id, at: new Date().toISOString() },
            ...p.activity,
          ].slice(0, 60),
        };
      });
    } else
      setProgress((p) => ({
        ...p,
        attempts: {
          ...p.attempts,
          [exercise.id]: {
            wrong: (p.attempts[exercise.id]?.wrong ?? 0) + 1,
            lastAt: new Date().toISOString(),
          },
        },
      }));
  }
  async function checkAnswer() {
    if (busy) return;
    if (exercise.kind === "choice") {
      if (selectedOption === null) {
        setFeedback({
          correct: false,
          message: "Choose an answer before checking.",
        });
        return;
      }
      const correct = selectedOption === exercise.correct;
      record(
        correct,
        correct
          ? "That’s right."
          : "Try again. Read the explanation and use the hint if needed.",
        correct ? exercise.explanation : undefined,
      );
      return;
    }
    if (!sqlAnswer.trim()) {
      setFeedback({
        correct: false,
        message: "Write a SQL query before checking.",
      });
      return;
    }
    setBusy(true);
    const evaluation = await evaluateSql(exercise, sqlAnswer);
    record(
      evaluation.correct,
      evaluation.message,
      evaluation.correct ? exercise.explanation : undefined,
    );
    setAnswerResult(evaluation.result);
    setBusy(false);
  }
  async function runExample() {
    setBusy(true);
    const result = await runSql(exampleSql);
    setExampleResult(result);
    setBusy(false);
  }
  const runnable =
    !/\b(CREATE|UPDATE|INSERT|DELETE|DROP|BEGIN|COMMIT|ALTER)\b/i.test(
      exampleSql.replace(/^--.*$/gm, ""),
    );
  return (
    <div className="learning-root">
      <div className="learning-topline">
        <div>
          <GraduationCap size={18} />
          <strong>Learning Center</strong>
          <span>Learn · Practice · Understand</span>
        </div>
        <div>
          <span className="learning-browser">
            <span /> Progress saved in this browser
          </span>
          <button
            onClick={() => setScreen("dashboard")}
            className={screen === "dashboard" ? "selected" : ""}
          >
            Dashboard
          </button>
          <button
            onClick={() => setScreen("catalog")}
            className={screen === "catalog" ? "selected" : ""}
          >
            All lessons
          </button>
          <button onClick={openTerms}>Dictionary · 200 terms</button>
        </div>
      </div>
      {screen === "dashboard" && (
        <div className="learning-scroll dashboard-screen">
          <div className="learning-hero">
            <div className="learning-eyebrow">
              <Sparkles size={14} /> YOUR LEARNING SPACE
            </div>
            <h1>
              Build database intuition
              <br />
              <span>one idea at a time.</span>
            </h1>
            <p>
              Explore concepts, test queries against a local practice database,
              and track what you master.
            </p>
            <div className="learning-hero-actions">
              <button
                className="learning-primary"
                onClick={() => openLesson(recommended.id)}
              >
                <Play size={16} />{" "}
                {progress.completed.length
                  ? "Continue learning"
                  : "Start learning"}
              </button>
              <button
                className="learning-secondary"
                onClick={() => setScreen("catalog")}
              >
                <BookOpen size={16} /> Browse lessons
              </button>
            </div>
          </div>
          <div className="learning-metrics">
            <Metric
              icon={Target}
              value={`${completion}%`}
              label="Course complete"
              color="blue"
            />
            <Metric
              icon={CheckCircle2}
              value={`${progress.solved.length}/${allExercises.length}`}
              label="Exercises solved"
              color="green"
            />
            <Metric
              icon={Flame}
              value={`${streak(progress.activity)} ${streak(progress.activity) === 1 ? "day" : "days"}`}
              label="Current streak"
              color="orange"
            />
            <Metric
              icon={Clock3}
              value={`${totalMinutes} min`}
              label="Learned so far"
              color="violet"
            />
          </div>
          <div className="learning-section-title">
            <div>
              <h2>Your next step</h2>
              <p>Pick up where your learning path continues.</p>
            </div>
            <button onClick={() => setScreen("catalog")}>
              View all <ArrowRight size={15} />
            </button>
          </div>
          <button
            className="next-lesson-card"
            onClick={() => openLesson(recommended.id)}
          >
            <div>
              <span className="lesson-number">
                {String(lessons.indexOf(recommended) + 1).padStart(2, "0")}
              </span>
              <div>
                <span className="lesson-kicker">
                  {recommended.category} · {recommended.level} ·{" "}
                  {recommended.minutes} min
                </span>
                <strong>{recommended.title}</strong>
                <p>{recommended.summary}</p>
              </div>
            </div>
            <span className="next-arrow">
              <ArrowRight size={20} />
            </span>
          </button>
          <div className="learning-dashboard-grid">
            <section className="learning-panel">
              <div className="learning-section-title">
                <div>
                  <h2>Skills by topic</h2>
                  <p>Progress across your learning tracks.</p>
                </div>
              </div>
              <div className="skill-bars">
                {categories.map((cat) => {
                  const items = lessons.filter((l) => l.category === cat);
                  const count = items.filter((l) =>
                    progress.completed.includes(l.id),
                  ).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategory(cat);
                        setScreen("catalog");
                      }}
                    >
                      <span>
                        <strong>{cat}</strong>
                        <small>
                          {count}/{items.length} lessons
                        </small>
                      </span>
                      <span className="skill-track">
                        <span
                          style={{ width: `${(count / items.length) * 100}%` }}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
            <section className="learning-panel">
              <div className="learning-section-title">
                <div>
                  <h2>
                    {weak.length ? "Worth another look" : "Recent activity"}
                  </h2>
                  <p>
                    {weak.length
                      ? "Questions you can strengthen next."
                      : "Your learning trail starts here."}
                  </p>
                </div>
              </div>
              {weak.length ? (
                <div className="activity-list">
                  {weak.map((x) => (
                    <button
                      key={x.lesson.id}
                      onClick={() => openLesson(x.lesson.id)}
                    >
                      <span className="activity-icon">
                        <RotateCcw size={16} />
                      </span>
                      <span>
                        <strong>{x.lesson.title}</strong>
                        <small>
                          {x.wrong} attempt{x.wrong === 1 ? "" : "s"} to revisit
                        </small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  ))}
                </div>
              ) : progress.activity.length ? (
                <div className="activity-list">
                  {progress.activity.slice(0, 4).map((a, i) => {
                    const l = lessons.find((x) => x.id === a.lessonId);
                    return (
                      <button
                        key={`${a.at}-${i}`}
                        onClick={() => openLesson(a.lessonId)}
                      >
                        <span className="activity-icon">
                          <Check size={16} />
                        </span>
                        <span>
                          <strong>{l?.title}</strong>
                          <small>{new Date(a.at).toLocaleDateString()}</small>
                        </span>
                        <ChevronRight size={15} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="learning-empty">
                  <BookOpen size={25} />
                  <strong>Ready when you are</strong>
                  <p>Complete an exercise to start your learning history.</p>
                </div>
              )}
              <div className="badge-row">
                <span>
                  <Trophy size={16} /> First steps{" "}
                  {progress.solved.length > 0 ? "✓" : ""}
                </span>
                <span>
                  <Star size={16} /> 10 solved{" "}
                  {progress.solved.length >= 10 ? "✓" : ""}
                </span>
                <span>
                  <Flame size={16} /> 3-day streak{" "}
                  {streak(progress.activity) >= 3 ? "✓" : ""}
                </span>
              </div>
            </section>
          </div>
        </div>
      )}
      {screen === "catalog" && (
        <div className="learning-scroll catalog-screen">
          <div className="catalog-heading">
            <div>
              <span className="learning-eyebrow">
                <BookOpen size={14} /> COURSE LIBRARY
              </span>
              <h1>Explore every concept.</h1>
              <p>
                {lessons.length} focused lessons · {allExercises.length}{" "}
                exercises · one connected path from first principles to advanced
                design.
              </p>
            </div>
            <div className="catalog-progress">
              <strong>{completion}%</strong>
              <span>complete</span>
              <div className="skill-track">
                <span style={{ width: `${completion}%` }} />
              </div>
            </div>
          </div>
          <div className="catalog-filters">
            <label>
              <Search size={17} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search lessons or topics..."
              />
            </label>
            <div>
              <Filter size={15} />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>All topics</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
            <div>
              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option>All levels</option>
                {levelOrder.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
            <button
              className="bookmark-filter"
              onClick={() => setSavedOnly(!savedOnly)}
              title={savedOnly ? "Show all lessons" : "Show bookmarked lessons"}
              aria-pressed={savedOnly}
            >
              <Bookmark size={16} fill={savedOnly ? "currentColor" : "none"} />
            </button>
            <button
              className="bookmark-filter"
              onClick={() => {
                setCategory("All topics");
                setLevel("All levels");
                setSearch("");
                setSavedOnly(false);
              }}
              title="Clear filters"
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="catalog-count">Showing {filtered.length} lessons</div>
          <div className="catalog-grid">
            {filtered.map((l) => {
              const done = progress.completed.includes(l.id),
                saved = progress.bookmarks.includes(l.id);
              return (
                <button
                  key={l.id}
                  className={`catalog-card ${done ? "completed" : ""}`}
                  onClick={() => openLesson(l.id)}
                >
                  <div className="catalog-card-top">
                    <span className="lesson-number">
                      {String(lessons.indexOf(l) + 1).padStart(2, "0")}
                    </span>
                    <span className={`level-pill ${l.level.toLowerCase()}`}>
                      {l.level}
                    </span>
                  </div>
                  <strong>{l.title}</strong>
                  <p>{l.summary}</p>
                  <div className="catalog-card-bottom">
                    <span>
                      <Clock3 size={13} />
                      {l.minutes} min
                    </span>
                    <span>
                      <ListChecks size={13} />2 exercises
                    </span>
                    {done ? (
                      <span className="done-label">
                        <CheckCircle2 size={14} />
                        Done
                      </span>
                    ) : saved ? (
                      <span className="saved-label">
                        <Bookmark size={13} />
                        Saved
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
          {!filtered.length && (
            <div className="learning-empty">
              <Search size={26} />
              <strong>No lessons found</strong>
              <p>Try another search or clear the filters.</p>
            </div>
          )}
        </div>
      )}
      {screen === "lesson" && (
        <div className="learning-scroll lesson-screen">
          <div className="lesson-breadcrumb">
            <button onClick={() => setScreen("catalog")}>
              <ArrowLeft size={15} /> All lessons
            </button>
            <span>/</span>
            <span>{lesson.category}</span>
            <span>/</span>
            <strong>{lesson.title}</strong>
          </div>
          <div className="lesson-layout">
            <div className="lesson-main">
              <div className="lesson-heading">
                <div className="learning-eyebrow">
                  LESSON {String(lessons.indexOf(lesson) + 1).padStart(2, "0")}{" "}
                  OF {lessons.length} · {lesson.category.toUpperCase()}
                </div>
                <h1>{lesson.title}</h1>
                <p>{lesson.summary}</p>
                <div className="lesson-meta">
                  <span className={`level-pill ${lesson.level.toLowerCase()}`}>
                    {lesson.level}
                  </span>
                  <span>
                    <Clock3 size={14} />
                    {lesson.minutes} min
                  </span>
                  <span>
                    <ListChecks size={14} />2 exercises
                  </span>
                  {progress.completed.includes(lesson.id) && (
                    <span className="done-label">
                      <CheckCircle2 size={14} />
                      Completed
                    </span>
                  )}
                </div>
              </div>
              <section className="lesson-card">
                <div className="lesson-card-heading">
                  <span className="section-icon blue">
                    <Target size={18} />
                  </span>
                  <div>
                    <small>01 / LEARNING OBJECTIVES</small>
                    <h2>What you’ll learn</h2>
                  </div>
                </div>
                <ul className="objective-list">
                  {lesson.objectives.map((x) => (
                    <li key={x}>
                      <Check size={15} />
                      {x}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="lesson-card">
                <div className="lesson-card-heading">
                  <span className="section-icon violet">
                    <BookOpen size={18} />
                  </span>
                  <div>
                    <small>02 / THE CONCEPT</small>
                    <h2>Understand the idea</h2>
                  </div>
                </div>
                {lesson.deepDive ? (
                  <div className="engineering-theory">
                    {lesson.deepDive.sections.map((section, index) => (
                      <div
                        className="engineering-theory-section"
                        key={section.title}
                      >
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <div>
                          <h3>{section.title}</h3>
                          <p>{section.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="lesson-explanation">{lesson.explanation}</p>
                )}
                <div className="key-idea">
                  <Lightbulb size={18} />
                  <div>
                    <strong>Keep this in mind</strong>
                    <span>{lesson.keyIdea}</span>
                  </div>
                </div>
                {lesson.workedExample && (
                  <div className="worked-example">
                    <span className="worked-example-label">
                      WORKED REASONING
                    </span>
                    <h3>{lesson.workedExample.question}</h3>
                    <ol>
                      {lesson.workedExample.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <p>{lesson.workedExample.takeaway}</p>
                  </div>
                )}
              </section>
              {lesson.mastery && (
                <section className="lesson-card mastery-card">
                  <div className="lesson-card-heading">
                    <span className="section-icon orange">
                      <GraduationCap size={18} />
                    </span>
                    <div>
                      <small>03 / GO DEEPER</small>
                      <h2>Reason beyond the basics</h2>
                    </div>
                  </div>
                  <div className="engineering-theory">
                    {lesson.mastery.sections.map((section, index) => (
                      <div
                        className="engineering-theory-section"
                        key={section.title}
                      >
                        <span>{String(index + 4).padStart(2, "0")}</span>
                        <div>
                          <h3>{section.title}</h3>
                          <p>{section.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mastery-misconception">
                    <strong>Common misconception</strong>
                    <p>“{lesson.mastery.misconception.claim}”</p>
                    <span>{lesson.mastery.misconception.correction}</span>
                  </div>
                  <div className="mastery-challenge">
                    <strong>Exam-style self-check</strong>
                    <p>{lesson.mastery.challenge.question}</p>
                    <details key={lesson.id}>
                      <summary>Reveal reasoned answer</summary>
                      <p>{lesson.mastery.challenge.answer}</p>
                    </details>
                  </div>
                </section>
              )}
              {lesson.deepDive?.lab ? (
                <EngineeringLab key={lesson.id} lab={lesson.deepDive.lab} />
              ) : (
                <ConceptLab
                  key={lesson.id}
                  kind={lesson.visual}
                  lessonId={lesson.id}
                />
              )}
              <section className="lesson-card">
                <div className="lesson-card-heading">
                  <span className="section-icon green">
                    <TerminalSquare size={18} />
                  </span>
                  <div>
                    <small>05 / TRY IT LIVE</small>
                    <h2>Explore a working example</h2>
                  </div>
                </div>
                <p className="lab-caption">
                  A small RetailDB practice database runs entirely in your
                  browser. Edit the example and inspect the result.
                </p>
                <div className="learning-editor">
                  <div className="learning-editor-head">
                    <span>
                      <Code2 size={15} /> SQL example
                    </span>
                    <span>
                      {runnable
                        ? "READ-ONLY PRACTICE DATA"
                        : "CONCEPT ILLUSTRATION"}
                    </span>
                  </div>
                  <textarea
                    spellCheck={false}
                    value={exampleSql}
                    onChange={(e) => setExampleSql(e.target.value)}
                    aria-label="Lesson SQL example"
                  />
                  <div className="learning-editor-actions">
                    <button onClick={() => setExampleSql(lesson.exampleSql)}>
                      <RotateCcw size={14} /> Reset
                    </button>
                    <button
                      className="learning-primary"
                      onClick={runExample}
                      disabled={busy || !runnable}
                    >
                      <Play size={14} /> {busy ? "Running..." : "Run example"}
                    </button>
                  </div>
                </div>
                {exampleResult && <ResultTable result={exampleResult} />}
              </section>
              <section className="lesson-card exercise-card">
                <div className="lesson-card-heading">
                  <span className="section-icon orange">
                    <ListChecks size={18} />
                  </span>
                  <div>
                    <small>06 / CHECK YOUR UNDERSTANDING</small>
                    <h2>Practice exercise {exerciseIndex + 1} of 2</h2>
                  </div>
                </div>
                <div className="exercise-progress">
                  <span
                    className={
                      progress.solved.includes(lesson.exercises[0].id)
                        ? "done"
                        : ""
                    }
                  />
                  <span
                    className={
                      progress.solved.includes(lesson.exercises[1].id)
                        ? "done"
                        : ""
                    }
                  />
                </div>
                <div className="exercise-label">
                  {exercise.kind === "sql"
                    ? "WRITE A QUERY"
                    : "CHOOSE THE BEST ANSWER"}
                </div>
                <h3 className="exercise-prompt">{exercise.prompt}</h3>
                {exercise.kind === "choice" ? (
                  <div className="choice-list">
                    {exercise.options.map((option, i) => (
                      <button
                        key={option}
                        className={`${selectedOption === i ? "selected" : ""} ${feedback?.correct && i === exercise.correct ? "correct" : ""}`}
                        onClick={() => {
                          setSelectedOption(i);
                          setFeedback(null);
                        }}
                      >
                        <span>{String.fromCharCode(65 + i)}</span>
                        {option}
                        {feedback?.correct && i === exercise.correct && (
                          <CheckCircle2 size={17} />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="learning-editor answer-editor">
                      <div className="learning-editor-head">
                        <span>
                          <Code2 size={15} /> Your SQL
                        </span>
                        <span>Results are compared, not query text</span>
                      </div>
                      <textarea
                        spellCheck={false}
                        aria-label="SQL exercise answer"
                        placeholder="Write your query here..."
                        value={sqlAnswer}
                        onChange={(e) => {
                          setSqlAnswer(e.target.value);
                          setFeedback(null);
                        }}
                      />
                    </div>
                    <details className="schema-reference">
                      <summary>
                        <Database size={14} /> Practice tables{" "}
                        <ChevronDown size={14} />
                      </summary>
                      <div>
                        {databaseGuide.map((t) => (
                          <div key={t.table}>
                            <strong>{t.table}</strong>
                            <span>{t.columns}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </>
                )}
                <div className="exercise-actions">
                  <button
                    className="learning-secondary"
                    onClick={() => setHintOpen(!hintOpen)}
                  >
                    <Lightbulb size={15} />
                    {hintOpen ? "Hide hint" : "Show hint"}
                  </button>
                  <button
                    className="learning-primary"
                    onClick={checkAnswer}
                    disabled={busy || progress.solved.includes(exercise.id)}
                  >
                    <Check size={15} />
                    {progress.solved.includes(exercise.id)
                      ? "Solved"
                      : busy
                        ? "Checking..."
                        : "Check answer"}
                  </button>
                </div>
                {hintOpen && (
                  <div className="hint-box">
                    <Lightbulb size={16} />
                    <span>{exercise.hint}</span>
                  </div>
                )}
                {feedback && (
                  <div
                    className={`answer-feedback ${feedback.correct ? "correct" : "incorrect"}`}
                    role="status"
                  >
                    <span>
                      {feedback.correct ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <CircleHelp size={18} />
                      )}
                    </span>
                    <div>
                      <strong>{feedback.message}</strong>
                      {feedback.explanation && <p>{feedback.explanation}</p>}
                    </div>
                  </div>
                )}
                {exercise.kind === "sql" && answerResult && (
                  <ResultTable result={answerResult} />
                )}
                <button
                  className="solution-toggle"
                  onClick={() => setSolutionOpen(!solutionOpen)}
                >
                  {solutionOpen ? "Hide" : "Show"} solution walkthrough{" "}
                  <ChevronDown size={14} />
                </button>
                {solutionOpen && (
                  <div className="solution-box">
                    <p>{exercise.explanation}</p>
                    {exercise.kind === "sql" && <pre>{exercise.reference}</pre>}
                    {exercise.kind === "choice" && (
                      <strong>
                        Answer: {exercise.options[exercise.correct]}
                      </strong>
                    )}
                  </div>
                )}
              </section>
              <div className="lesson-nav">
                <button
                  onClick={() => {
                    const i = lessons.findIndex((l) => l.id === lesson.id);
                    if (i > 0) openLesson(lessons[i - 1].id);
                  }}
                  disabled={lessons[0].id === lesson.id}
                >
                  <ChevronLeft size={16} /> Previous lesson
                </button>
                {exerciseIndex === 0 ? (
                  <button
                    className="learning-primary"
                    onClick={() => setExerciseIndex(1)}
                  >
                    Exercise 2 <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    className="learning-primary"
                    onClick={() => {
                      const i = lessons.findIndex((l) => l.id === lesson.id);
                      if (i < lessons.length - 1) openLesson(lessons[i + 1].id);
                      else setScreen("dashboard");
                    }}
                  >
                    {lessons.at(-1)?.id === lesson.id
                      ? "Back to dashboard"
                      : "Next lesson"}{" "}
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
            <aside className="lesson-sidebar">
              <div className="lesson-side-card">
                <div className="side-card-title">
                  <span>
                    <Bookmark size={16} /> Your workspace
                  </span>
                  <button
                    onClick={() => toggleBookmark(lesson.id)}
                    title={
                      progress.bookmarks.includes(lesson.id)
                        ? "Remove bookmark"
                        : "Bookmark lesson"
                    }
                    className={
                      progress.bookmarks.includes(lesson.id) ? "bookmarked" : ""
                    }
                  >
                    <Bookmark
                      size={17}
                      fill={
                        progress.bookmarks.includes(lesson.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                </div>
                <label>
                  Personal notes
                  <textarea
                    value={progress.notes[lesson.id] ?? ""}
                    onChange={(e) => saveNote(e.target.value)}
                    placeholder="Write a reminder in your own words..."
                  />
                </label>
                <small>Saved automatically in this browser</small>
              </div>
              <div className="lesson-side-card">
                <div className="side-card-title">
                  <span>
                    <Workflow size={16} /> Lesson path
                  </span>
                </div>
                <div className="path-list">
                  {lessons.map((l, i) => (
                    <button
                      key={l.id}
                      className={l.id === lesson.id ? "active" : ""}
                      onClick={() => openLesson(l.id)}
                    >
                      <span
                        className={
                          progress.completed.includes(l.id) ? "path-done" : ""
                        }
                      >
                        {progress.completed.includes(l.id) ? (
                          <Check size={12} />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <strong>{l.title}</strong>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof Target;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="learning-metric">
      <span className={`metric-icon ${color}`}>
        <Icon size={19} />
      </span>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}
function ResultTable({ result }: { result: QueryResult }) {
  if (result.error)
    return (
      <div className="result-error" role="alert">
        {result.error}
      </div>
    );
  return (
    <div className="practice-result">
      <div>
        <strong>Query result</strong>
        <span>
          {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
        </span>
      </div>
      {result.columns.length ? (
        <div className="practice-table-scroll">
          <table>
            <thead>
              <tr>
                {result.columns.map((col, i) => (
                  <th key={`${col}-${i}`}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.slice(0, 20).map((row, i) => (
                <tr key={i}>
                  {row.map((value, j) => (
                    <td key={j}>
                      {value === null ? <em>NULL</em> : String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No result columns. Try a SELECT query.</p>
      )}
      {result.rows.length > 20 && <small>Showing the first 20 rows</small>}
    </div>
  );
}

const visualText: Record<
  VisualKind,
  {
    title: string;
    subtitle: string;
    steps: [string, string, string];
    nodes: [string, string, string];
  }
> = {
  relational: {
    title: "Follow a relationship",
    subtitle: "How one key connects two tables",
    steps: [
      "A customer row has a unique customer_id.",
      "An order stores that value as a foreign key.",
      "Matching values connect each order to its customer.",
    ],
    nodes: ["customers", "customer_id", "orders"],
  },
  query: {
    title: "Trace a query",
    subtitle: "A SELECT moves through a logical sequence",
    steps: [
      "FROM identifies the source rows.",
      "WHERE filters rows that do not qualify.",
      "SELECT shapes the output; ORDER BY arranges it.",
    ],
    nodes: ["FROM", "WHERE", "SELECT"],
  },
  join: {
    title: "See a join happen",
    subtitle: "Match rows by the key they share",
    steps: [
      "Start with customers and orders.",
      "Match orders.customer_id to customers.customer_id.",
      "An inner join keeps matches; a left join also keeps unmatched customers.",
    ],
    nodes: ["customers", "ON customer_id", "orders"],
  },
  index: {
    title: "Trace an index lookup",
    subtitle: "An ordered search narrows the candidates",
    steps: [
      "Start at the root of the B-tree.",
      "Follow the key range to the relevant leaf.",
      "Read matching row references from the leaf.",
    ],
    nodes: ["root: 50", "branch: 25–49", "leaf: 31"],
  },
  transaction: {
    title: "Watch an atomic transfer",
    subtitle: "Two updates should commit together",
    steps: [
      "Account A begins with 500; account B with 200.",
      "Debit 100 from A and credit 100 to B inside one transaction.",
      "Commit both changes; if either fails, roll both back.",
    ],
    nodes: ["A: 500", "transfer 100", "B: 200"],
  },
  normalization: {
    title: "Split repeated facts",
    subtitle: "Move each fact to its correct key",
    steps: [
      "One wide row repeats customer and product details.",
      "Separate customers and products into their own tables.",
      "Order items retain only keys and transaction-specific facts.",
    ],
    nodes: ["wide order row", "customers + products", "order_items"],
  },
  security: {
    title: "Separate code from values",
    subtitle: "Parameter binding protects query structure",
    steps: [
      "The SQL statement defines the operation.",
      "A user value is bound as data, not inserted into SQL syntax.",
      "The database compares the value without executing it as code.",
    ],
    nodes: ["SQL template", "bound value", "safe comparison"],
  },
  distributed: {
    title: "Compare scale strategies",
    subtitle: "Copies and partitions solve different problems",
    steps: [
      "One database holds every customer.",
      "Replicas copy the same data to other nodes.",
      "Shards divide customers across nodes by a key.",
    ],
    nodes: ["primary", "replica", "shard"],
  },
  document: {
    title: "Explore a document",
    subtitle: "Related fields can live together",
    steps: [
      "A collection contains individual documents.",
      "Each document has an _id and named fields.",
      "Nested objects and arrays hold related details.",
    ],
    nodes: ["collection", "document", "nested fields"],
  },
  pipeline: {
    title: "Move through stages",
    subtitle: "Each stage transforms a stream",
    steps: [
      "Filter the input to the needed records.",
      "Group related records and calculate summaries.",
      "Sort the final result for display.",
    ],
    nodes: ["filter", "group", "sort"],
  },
};
function ConceptLab({
  kind,
  lessonId,
}: {
  kind: VisualKind;
  lessonId: string;
}) {
  const [step, setStep] = useState(0);
  const [alternate, setAlternate] = useState(false);
  const v = coreVisuals[lessonId] ?? visualText[kind];
  const nodes =
    lessonId === "joins"
      ? alternate
        ? (["6 customers", "LEFT JOIN", "5 orders + 1 NULL"] as const)
        : (["6 customers", "INNER JOIN", "5 matched orders"] as const)
      : lessonId === "distributed"
        ? alternate
          ? (["shard A: IDs 1–3", "partition key", "shard B: IDs 4–6"] as const)
          : (["primary: IDs 1–6", "copy changes", "replica: IDs 1–6"] as const)
        : v.nodes;
  const caption =
    lessonId === "joins" && alternate
      ? "A left join also returns customers who have no order; their order fields are NULL."
      : lessonId === "distributed" && alternate
        ? "Each shard stores a different range of customer IDs."
        : v.steps[step];
  useEffect(() => {
    setStep(0);
    setAlternate(false);
  }, [kind, lessonId]);
  return (
    <section className="lesson-card concept-lab">
      <div className="lesson-card-heading">
        <span className="section-icon blue">
          <Sparkles size={18} />
        </span>
        <div>
          <small>04 / VISUAL EXPLORER</small>
          <h2>{v.title}</h2>
        </div>
      </div>
      <p className="lab-caption">{v.subtitle}</p>
      <div className={`concept-stage concept-${kind}`}>
        <div className="concept-nodes">
          {nodes.map((node, i) => (
            <div key={node} className={step >= i ? "lit" : ""}>
              <span>
                {lessonId === "transactions-acid" && alternate && i === 0
                  ? "A: 400"
                  : lessonId === "transactions-acid" && alternate && i === 2
                    ? "B: 300"
                    : node}
              </span>
              {i < 2 && <ArrowRight size={18} />}
            </div>
          ))}
        </div>
        <div className="concept-caption">
          <span>STEP {step + 1} / 3</span>
          <strong>{caption}</strong>
        </div>
      </div>
      <div className="concept-controls">
        <div>
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            aria-label="Previous visual step"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            onClick={() => setStep(Math.min(2, step + 1))}
            disabled={step === 2}
            aria-label="Next visual step"
          >
            <ChevronRight size={17} />
          </button>
          <button
            onClick={() => {
              setStep(0);
              setAlternate(false);
            }}
            aria-label="Reset visual"
          >
            <RotateCcw size={15} />
          </button>
        </div>
        {lessonId === "transactions-acid" && (
          <button
            className="scenario-toggle"
            onClick={() => setAlternate(!alternate)}
          >
            {alternate ? "Show initial balances" : "Commit transfer"}
          </button>
        )}
        {lessonId === "joins" && (
          <button
            className="scenario-toggle"
            onClick={() => setAlternate(!alternate)}
          >
            {alternate ? "Show inner join" : "Show left join"}
          </button>
        )}
        {lessonId === "distributed" && (
          <button
            className="scenario-toggle"
            onClick={() => setAlternate(!alternate)}
          >
            {alternate ? "Show replication" : "Show sharding"}
          </button>
        )}
        <div className="step-dots">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={step === i ? "active" : ""}
              aria-label={`Visual step ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
