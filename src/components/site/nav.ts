import { useCallback } from "react";
import { useLocation, useNavigate, useSearchParams as useRouterSearchParams } from "react-router-dom";

/** Caminho atual (equivalente a usePathname do Next). */
export function usePathname(): string {
  return useLocation().pathname;
}

/** Navegação programática (equivalente a useRouter().push do Next). */
export function useRouter() {
  const navigate = useNavigate();
  const push = useCallback(
    (url: string, _opts?: { scroll?: boolean }) => navigate(url),
    [navigate],
  );
  return { push };
}

/** Query string atual como URLSearchParams (equivalente a useSearchParams do Next). */
export function useSearchParams(): URLSearchParams {
  const [params] = useRouterSearchParams();
  return params;
}
