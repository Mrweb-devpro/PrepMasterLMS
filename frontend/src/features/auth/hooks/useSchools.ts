import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchWorldSchools } from "../services/schools.service";

export const schoolsQuery = queryOptions({
  queryKey: ["schools", "world"],
  queryFn: fetchWorldSchools,
  staleTime: Infinity,
  gcTime: Infinity,
  retry: 1,
});

/** Loaded lazily when the school picker opens — the picker shows its own loading row. */
export const useSchools = (enabled: boolean) => useQuery({ ...schoolsQuery, enabled });
