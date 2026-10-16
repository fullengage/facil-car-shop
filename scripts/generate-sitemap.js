#!/usr/bin/env node
/**
 * Gerador de Sitemap Dinâmico para Fácil Car Shop
 * Executa em build-time + pode ser chamado via API em runtime
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const SITE_URL = 'https://facilcarshop.com.br'
const changefreq = {
  static: 'yearly',
  category: 'weekly',
  vehicle: 'weekly',
  store: 'monthly',
}

async function getVehicles() {
  // Em desenvolvimento: tenta Supabase, fallback para mock data
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️  Supabase não configurado, usando mock data')
      return generateMockVehicles()
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data, error } = await supabase
      .from('fcs_vehicles')
      .select('id, brand, model, model_year, slug, updated_at, dealer:fcs_dealers(slug)')
      .eq('status', 'published')
      .limit(50000)

    if (error) {
      console.warn('⚠️  Erro ao buscar veículos do Supabase:', error.message)
      return generateMockVehicles()
    }

    return data || []
  } catch (err) {
    console.warn('⚠️  Erro na conexão Supabase:', err.message)
    return generateMockVehicles()
  }
}

function generateMockVehicles() {
  // Mock data para desenvolvimento
  return [
    {
      id: 'demo-veh-001',
      brand: 'Toyota',
      model: 'Corolla Altis',
      model_year: 2023,
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-veh-002',
      brand: 'Jeep',
      model: 'Compass Longitude',
      model_year: 2024,
      updated_at: new Date().toISOString(),
    },
  ]
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\./g, '-')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function generateVehicleSlug(vehicle) {
  const parts = []
  if (vehicle.brand) parts.push(vehicle.brand)
  if (vehicle.model) parts.push(vehicle.model)
  if (vehicle.model_year) parts.push(String(vehicle.model_year))
  if (vehicle.id) parts.push(vehicle.id)
  return slugify(parts.join(' '))
}

async function generateSitemap() {
  const urls = []

  // 1. Páginas estáticas (prioridade alta)
  const staticPages = [
    { loc: '/', changefreq: 'daily', priority: 1.0 },
    { loc: '/carros', changefreq: 'daily', priority: 0.9 },
    { loc: '/lojas', changefreq: 'weekly', priority: 0.8 },
  ]

  urls.push(...staticPages)

  // 2. Veículos (dinâmicos)
  try {
    const vehicles = await getVehicles()
    console.log(`📍 Gerando URLs para ${vehicles.length} veículos...`)

    vehicles.forEach((vehicle) => {
      const slug = generateVehicleSlug(vehicle)
      const lastmod = new Date(vehicle.updated_at).toISOString().split('T')[0]

      urls.push({
        loc: `/carros/${slug}`,
        lastmod,
        changefreq: 'weekly',
        priority: 0.8,
      })
    })
  } catch (err) {
    console.error('❌ Erro ao processar veículos:', err.message)
  }

  // 3. Gerar XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'

  urls.forEach(({ loc, lastmod, changefreq: cf, priority: p }) => {
    xml += '  <url>\n'
    xml += `    <loc>${SITE_URL}${loc}</loc>\n`
    if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`
    xml += `    <changefreq>${cf}</changefreq>\n`
    xml += `    <priority>${p}</priority>\n`
    xml += '  </url>\n'
  })

  xml += '</urlset>'

  // 4. Salvar arquivo
  const outputPath = path.join(ROOT, 'public', 'sitemap.xml')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, xml, 'utf-8')

  console.log(`✅ Sitemap gerado: ${outputPath} (${urls.length} URLs)`)
  return outputPath
}

// Executar
generateSitemap().catch(err => {
  console.error('❌ Erro fatal:', err.message)
  process.exit(1)
})
