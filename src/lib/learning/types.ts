export interface LearningLesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  thumbnail: string;
  order: number;
  screenshots?: string[];
  workflow?: { role: string; text: string }[];
  builtForCoke?: boolean;
}

export interface LearningModule {
  moduleId: string;
  title: string;
  description?: string;
  lessons: LearningLesson[];
}

export interface LearningCourse {
  courseId: string;
  eyebrow: string;
  title: string;
  description: string;
  category: string;
  accent: string;
  icon: string;
  image: string;
  order: number;
  enabled: boolean;
  productId?: string;
  modules: LearningModule[];
  lastUpdatedBy?: string | null;
  lastUpdatedAt?: string | null;
}

export interface Learning {
  heading: string;
  subheading: string;
  revision: number;
  courses: LearningCourse[];
}

export interface Locator {
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  field?: string;
}
