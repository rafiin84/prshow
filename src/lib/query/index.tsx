"use client";
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "@/stores/toast";
import { useSession } from "@/stores/session";
import { ApiError } from "@/lib/api/client";
import { admin as adminApi } from "@/lib/api";
import { BASE_TIME } from "@/data/seeds/time";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false, staleTime: 0 } } }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** Query against the mock service. All keys share the `api` root so mutations can invalidate everything consistently. */
export function useApiQuery<T>(key: unknown[], fn: () => Promise<T>, enabled = true): UseQueryResult<T> {
  const userId = useSession((s) => s.userId);
  return useQuery({ queryKey: ["api", userId, ...key], queryFn: fn, enabled });
}

interface MutOpts<T, V> { success?: string | ((data: T, vars: V) => string | undefined); onSuccess?: (data: T, vars: V) => void; silentError?: boolean; onError?: (e: Error, vars: V) => void }
/** Mutation wrapper: toasts, invalidates the single source of truth so every list/badge/count refreshes. */
export function useApiMutation<T, V = void>(fn: (vars: V) => Promise<T>, opts: MutOpts<T, V> = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["api"] });
      const msg = typeof opts.success === "function" ? opts.success(data, vars) : opts.success;
      if (msg) toast.success(msg);
      opts.onSuccess?.(data, vars);
    },
    onError: (e, vars) => {
      if (!opts.silentError) toast.error(e instanceof ApiError ? e.message : "Something went wrong.");
      opts.onError?.(e as Error, vars);
    },
  });
}
export { useQueryClient };

/** Current demo-clock time (never the real clock). */
export function useDemoNow(): number {
  const q = useApiQuery(["clock"], () => adminApi.getClock());
  return q.data?.now ?? BASE_TIME;
}
