import { Outlet, createFileRoute } from "@tanstack/react-router";

/** Provides a route outlet so the competition catalogue and arena are separate pages. */
export const Route = createFileRoute("/competitions")({
  component: Outlet,
});
