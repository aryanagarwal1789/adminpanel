import { createFileRoute, Outlet } from "@tanstack/react-router";
import { LearningProvider } from "@/lib/learning/LearningProvider";

// One draft store shared by the list and the course page.
export const Route = createFileRoute("/admin/courses")({
  component: () => (
    <LearningProvider>
      <Outlet />
    </LearningProvider>
  ),
});
