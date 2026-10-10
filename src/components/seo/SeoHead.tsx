// ==============================================================================
// COMPONENTE SEO HEAD — GERENCIADOR DINÂMICO DE METATAGS E SCHEMA.ORG
// Atualiza title, meta tags, OpenGraph, Twitter Cards e JSON-LD no DOM
// ==============================================================================

import * as React from 'react'

export interface SeoHeadProps {
  title: string
  description: string
  canonicalUrl?: string
  ogImage?: string
  ogType?: 'website' | 'article' | 'product'
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>
  keywords?: string[]
}

function updateOrCreateMeta(attribute: 'name' | 'property', attrValue: string, content: string) {
  let element = document.querySelector(`meta[${attribute}="${attrValue}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, attrValue)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function updateOrCreateCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

function injectJsonLd(data: unknown, scriptId = 'fcs-schema-jsonld') {
  let script = document.getElementById(scriptId) as HTMLScriptElement | null
  if (!script) {
    script = document.createElement('script')
    script.id = scriptId
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(data, null, 2)
}

export function SeoHead({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  jsonLd,
  keywords,
}: SeoHeadProps) {
  React.useEffect(() => {
    // 1. Title da aba
    document.title = title

    // 2. Meta description
    updateOrCreateMeta('name', 'description', description)

    // 3. Keywords
    if (keywords && keywords.length > 0) {
      updateOrCreateMeta('name', 'keywords', keywords.join(', '))
    }

    // 4. Canonical URL
    if (canonicalUrl) {
      updateOrCreateCanonical(canonicalUrl)
      updateOrCreateMeta('property', 'og:url', canonicalUrl)
    }

    // 5. OpenGraph (Facebook, WhatsApp, LinkedIn)
    updateOrCreateMeta('property', 'og:title', title)
    updateOrCreateMeta('property', 'og:description', description)
    updateOrCreateMeta('property', 'og:type', ogType)
    if (ogImage) {
      updateOrCreateMeta('property', 'og:image', ogImage)
      updateOrCreateMeta('property', 'og:image:alt', title)
    }

    // 6. Twitter Card
    updateOrCreateMeta('name', 'twitter:card', 'summary_large_image')
    updateOrCreateMeta('name', 'twitter:title', title)
    updateOrCreateMeta('name', 'twitter:description', description)
    if (ogImage) {
      updateOrCreateMeta('name', 'twitter:image', ogImage)
    }

    // 7. Schema.org JSON-LD para Google
    if (jsonLd) {
      injectJsonLd(jsonLd)
    }

    return () => {
      // Limpeza opcional se desmontar
      const script = document.getElementById('fcs-schema-jsonld')
      if (script) script.remove()
    }
  }, [title, description, canonicalUrl, ogImage, ogType, jsonLd, keywords])

  return null
}
