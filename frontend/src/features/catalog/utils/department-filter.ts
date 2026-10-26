import type { Course } from "@/lib/mock-data";
import type { DepartmentFilterMode } from "../components/DepartmentFilter";

export function matchesDepartment(
  course: Course | undefined,
  mode: DepartmentFilterMode,
  department?: string,
): boolean {
  if (!course || mode === "all") return true;
  const departments = course.departments ?? [];
  if (departments.length === 0) return true;
  return Boolean(department && departments.includes(department));
}

export function matchesLevel(course: Course | undefined, studentLevel?: string) {
  return !course || !studentLevel || course.level === "all" || course.level === studentLevel;
}
