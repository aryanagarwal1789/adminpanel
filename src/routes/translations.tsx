import { createFileRoute } from "@tanstack/react-router";
import { TranslationsPage } from "@/components/builder/TranslationsPage";

export const Route = createFileRoute("/translations")({
  head: () => ({
    meta: [{ title: "Translations — SalesCode" }],
  }),
  component: TranslationsPage,
});
