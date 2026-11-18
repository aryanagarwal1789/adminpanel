import type { Learning, LearningCourse, LearningLesson, LearningModule } from "./types";

export type Draft = Learning;

const renumberLessons = (lessons: LearningLesson[]): LearningLesson[] =>
  lessons.map((l, i) => (l.order === i ? l : { ...l, order: i }));

// Array.prototype.sort is stable, so equal orders keep their stored sequence.
const sortByOrder = (lessons: LearningLesson[]): LearningLesson[] =>
  lessons.slice().sort((a, b) => a.order - b.order);

const renumberCourses = (courses: LearningCourse[]): LearningCourse[] =>
  courses.map((c, i) => (c.order === i ? c : { ...c, order: i }));

function move<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= list.length || to < 0 || to >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const mapCourse = (
  d: Draft,
  courseId: string,
  fn: (c: LearningCourse) => LearningCourse,
): Draft => ({
  ...d,
  courses: d.courses.map((c) => (c.courseId === courseId ? fn(c) : c)),
});

const mapModule = (
  d: Draft,
  courseId: string,
  moduleId: string,
  fn: (m: LearningModule) => LearningModule,
): Draft =>
  mapCourse(d, courseId, (c) => ({
    ...c,
    modules: c.modules.map((m) => (m.moduleId === moduleId ? fn(m) : m)),
  }));

export function fromServer(learning: Learning): Draft {
  const clone = JSON.parse(JSON.stringify(learning)) as Learning;
  return {
    ...clone,
    courses: renumberCourses(
      (clone.courses ?? []).map((c) => ({
        ...c,
        modules: (c.modules ?? []).map((m) => ({
          ...m,
          lessons: renumberLessons(sortByOrder(m.lessons ?? [])),
        })),
      })),
    ),
  };
}

// courses
export const addCourse = (d: Draft, course: LearningCourse): Draft => ({
  ...d,
  courses: renumberCourses([...d.courses, course]),
});
export const updateCourse = (d: Draft, courseId: string, patch: Partial<LearningCourse>): Draft =>
  mapCourse(d, courseId, (c) => ({ ...c, ...patch }));
export const removeCourse = (d: Draft, courseId: string): Draft => ({
  ...d,
  courses: renumberCourses(d.courses.filter((c) => c.courseId !== courseId)),
});
export const reorderCourses = (d: Draft, from: number, to: number): Draft => ({
  ...d,
  courses: renumberCourses(move(d.courses, from, to)),
});

// modules
export const addModule = (d: Draft, courseId: string, module: LearningModule): Draft =>
  mapCourse(d, courseId, (c) => ({
    ...c,
    modules: [...c.modules, { ...module, lessons: renumberLessons(module.lessons) }],
  }));
export const updateModule = (
  d: Draft,
  courseId: string,
  moduleId: string,
  patch: Partial<Omit<LearningModule, "lessons">>,
): Draft => mapModule(d, courseId, moduleId, (m) => ({ ...m, ...patch }));
export const removeModule = (d: Draft, courseId: string, moduleId: string): Draft =>
  mapCourse(d, courseId, (c) => ({
    ...c,
    modules: c.modules.filter((m) => m.moduleId !== moduleId),
  }));
export const reorderModules = (d: Draft, courseId: string, from: number, to: number): Draft =>
  mapCourse(d, courseId, (c) => ({ ...c, modules: move(c.modules, from, to) }));

// lessons
export const addLesson = (
  d: Draft,
  courseId: string,
  moduleId: string,
  lesson: LearningLesson,
): Draft =>
  mapModule(d, courseId, moduleId, (m) => ({
    ...m,
    lessons: renumberLessons([...m.lessons, lesson]),
  }));
export const updateLesson = (
  d: Draft,
  courseId: string,
  moduleId: string,
  lessonId: string,
  patch: Partial<LearningLesson>,
): Draft =>
  mapModule(d, courseId, moduleId, (m) => ({
    ...m,
    lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, ...patch } : l)),
  }));
export const removeLesson = (
  d: Draft,
  courseId: string,
  moduleId: string,
  lessonId: string,
): Draft =>
  mapModule(d, courseId, moduleId, (m) => ({
    ...m,
    lessons: renumberLessons(m.lessons.filter((l) => l.id !== lessonId)),
  }));
export const reorderLessons = (
  d: Draft,
  courseId: string,
  moduleId: string,
  from: number,
  to: number,
): Draft =>
  mapModule(d, courseId, moduleId, (m) => ({
    ...m,
    lessons: renumberLessons(move(m.lessons, from, to)),
  }));
