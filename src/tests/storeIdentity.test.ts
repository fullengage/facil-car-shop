import { describe, expect, it } from 'vitest'
import { normalizeDomain, slugify } from '@/utils/storeIdentity'

describe('slugify', () => {
  it('remove acentos e troca espaços por hífen', () => {
    expect(slugify('Auto Fácil Premium')).toBe('auto-facil-premium')
  })

  it('não deixa hífen nas pontas', () => {
    expect(slugify('  --Loja & Cia.--  ')).toBe('loja-cia')
  })
})

describe('normalizeDomain', () => {
  it('aceita URL completa e devolve só o host em minúsculas', () => {
    expect(normalizeDomain('https://WWW.Minha-Loja.com.br/estoque')).toBe('www.minha-loja.com.br')
  })

  it('rejeita textos que não são domínio', () => {
    expect(normalizeDomain('minha loja')).toBeNull()
    expect(normalizeDomain('localhost')).toBeNull()
  })
})
