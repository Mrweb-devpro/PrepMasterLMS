import { createFileRoute } from "@tanstack/react-router";
import { CppBookPage } from "@/features/cpp-book/pages/CppBookPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/books/cpp")({
  head: () => pageHead("C++ Programming for Engineers", "Interactive C++ course textbook and reference manual."),
  component: CppBookRoute,
});

function CppBookRoute() {
  return <CppBookPage />;
}
