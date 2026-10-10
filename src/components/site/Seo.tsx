import { useEffect } from "react";
import { SITE_NAME } from "@/lib/site/seo";

interface SeoProps {
  title?: string;
  description?: string;
  canonical?: string;
  jsonLd?: object[];
}

/**
 * Metadados por rota num app SPA: título, descrição, canonical e JSON-LD no <head>.
 * Substitui o generateMetadata do Next (que gerava HTML pronto para o crawler).
 */
export function Seo({ title, description, canonical, jsonLd = [] }: SeoProps) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    if (description) setMeta("description", description);
    if (canonical) setCanonical(`${window.location.origin}${canonical}`);
    const scripts = jsonLd.map((data, i) => {
      const el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = `jsonld-${i}`;
      el.textContent = JSON.stringify(data);
      document.head.appendChild(el);
      return el;
    });
    return () => scripts.forEach((el) => el.remove());
  }, [title, description, canonical, jsonLd]);
  return null;
}

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}
