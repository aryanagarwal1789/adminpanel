import { createFileRoute } from "@tanstack/react-router";
import { PageBuilder } from "@/components/builder/PageBuilder";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PageBuilder — Visual Website Editor" },
      { name: "description", content: "Build beautiful websites visually with a drag-and-drop page builder." },
    ],
  }),
  component: Index,
});

function Index() {
  return <PageBuilder />;
}
