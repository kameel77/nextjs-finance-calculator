"use client";

import { useQuery } from "@tanstack/react-query";

import { catalogQueryKey, fetchCatalog } from "./catalog";

export function useCatalog() {
  return useQuery({
    queryKey: catalogQueryKey,
    queryFn: ({ signal }) => fetchCatalog({ signal }),
    staleTime: 5 * 60 * 1000
  });
}
