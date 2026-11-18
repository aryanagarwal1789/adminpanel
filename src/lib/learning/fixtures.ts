import type { Learning, LearningCourse, LearningLesson, LearningModule } from "./types";

export const lesson = (id: string, over: Partial<LearningLesson> = {}): LearningLesson => ({
  id,
  title: `Lesson ${id}`,
  description: "",
  duration: "1:00",
  videoUrl: `https://v/${id}`,
  thumbnail: "",
  order: 0,
  ...over,
});
export const mod = (
  moduleId: string,
  lessons: LearningLesson[],
  over: Partial<LearningModule> = {},
): LearningModule => ({
  moduleId,
  title: `Module ${moduleId}`,
  lessons,
  ...over,
});
export const course = (
  courseId: string,
  modules: LearningModule[],
  over: Partial<LearningCourse> = {},
): LearningCourse => ({
  courseId,
  eyebrow: "AI Native",
  title: `Course ${courseId}`,
  description: "",
  category: "sales",
  accent: "",
  icon: "",
  image: "",
  order: 0,
  enabled: true,
  modules,
  ...over,
});
export const learning = (courses: LearningCourse[]): Learning => ({
  heading: "H",
  subheading: "S",
  revision: 3,
  courses,
});
