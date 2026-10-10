import { useSearchParams } from "@/components/site/nav";

/** Query string como objeto simples (formato esperado pelas listagens do portal). */
export function useSearchParamsObject(): Record<string, string> {
  const sp = useSearchParams();
  const obj: Record<string, string> = {};
  sp.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}
