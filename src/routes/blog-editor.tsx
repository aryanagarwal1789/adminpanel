import { createFileRoute } from "@tanstack/react-router";
import { BlogEditorPage } from "@/components/builder/BlogEditorPage";

export const Route = createFileRoute("/blog-editor")({
  head: () => ({
    meta: [{ title: "Blog CMS — SalesCode" }],
  }),
  component: BlogEditorPage,
});
