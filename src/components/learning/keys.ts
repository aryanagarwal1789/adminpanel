export const moduleKey = (moduleId: string) => `m:${moduleId}`;
export const lessonKey = (moduleId: string, lessonId: string) => `l:${moduleId}:${lessonId}`;
export const moduleDomId = (moduleId: string) => `lp-m-${moduleId}`;
export const lessonDomId = (moduleId: string, lessonId: string) => `lp-l-${moduleId}-${lessonId}`;
