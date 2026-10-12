// ==============================================================================
// CLIENTE SUPABASE — FÁCIL CAR SHOP
// Conexão segura e tipada com Supabase (zzehxqgyberjewihsliu)
// ==============================================================================

import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://zzehxqgyberjewihsliu.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6ZWh4cWd5YmVyamV3aWhzbGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzAzODgsImV4cCI6MjA3NDg0NjM4OH0.tV9bokQgzq5jN806ui0vMEroiqECKO7CgOV0945724Y'

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  DEFAULT_SUPABASE_URL

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  DEFAULT_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
