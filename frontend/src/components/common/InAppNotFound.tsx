import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { NotFoundIllustration } from "./NotFoundIllustration";

interface InAppNotFoundProps {
  title?: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
}

export function InAppNotFound({
  title = "Item not found",
  description = "The item you're looking for doesn't exist or may have been removed.",
  backTo = "/solidworks",
  backLabel = "Go back",
}: InAppNotFoundProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-10 text-center">
      <NotFoundIllustration className="mb-6 h-auto w-48 max-w-full sm:w-56" />
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      <div className="mt-6">
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
        >
          <ArrowLeft className="size-4" />
          <span>{backLabel}</span>
        </Link>
      </div>
    </div>
  );
}
