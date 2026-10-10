// ==============================================================================
// GERENCIADOR DE FOTOGRAFIAS DO VEÍCULO
// ==============================================================================

import * as React from 'react'
import { ImagePlus, Trash2, Star, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface VehiclePhotoUploaderProps {
  photos: string[]
  onChange: (photos: string[]) => void
}

const SAMPLE_PHOTO_PRESETS = [
  {
    name: 'Sedan Prata',
    url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'SUV Cinza',
    url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Hatch Preto',
    url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Interior Premium',
    url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
  },
]

export function VehiclePhotoUploader({
  photos,
  onChange,
}: VehiclePhotoUploaderProps) {
  const [photoInputUrl, setPhotoInputUrl] = React.useState('')

  function handleAddUrl() {
    if (!photoInputUrl.trim()) return
    onChange([...photos, photoInputUrl.trim()])
    setPhotoInputUrl('')
  }

  function handleRemove(index: number) {
    const updated = photos.filter((_, i) => i !== index)
    onChange(updated)
  }

  function handleSetCover(index: number) {
    if (index === 0) return
    const selected = photos[index]
    const rest = photos.filter((_, i) => i !== index)
    onChange([selected, ...rest])
  }

  function handleAddPreset(url: string) {
    if (!photos.includes(url)) {
      onChange([...photos, url])
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white">Fotografias do Anúncio</h4>
          <p className="text-xs text-slate-400">
            Adicione pelo menos 1 foto para aumentar o engajamento do comprador.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
        </span>
      </div>

      {/* Formulário de Adicionar URL */}
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="Cole o link da foto (URL pública)..."
          value={photoInputUrl}
          onChange={(e) => setPhotoInputUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddUrl()
            }
          }}
          className="text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleAddUrl}
          disabled={!photoInputUrl.trim()}
          className="shrink-0"
        >
          <ImagePlus className="w-4 h-4 mr-1.5" />
          Adicionar
        </Button>
      </div>

      {/* Fotos de Exemplo Rápidas */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-[11px]">Adicionar foto demonstrativa:</span>
        {SAMPLE_PHOTO_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => handleAddPreset(preset.url)}
            className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition-colors"
          >
            + {preset.name}
          </button>
        ))}
      </div>

      {/* Grid de Fotos Carregadas */}
      {photos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center bg-slate-900/30">
          <ImagePlus className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-medium">Nenhuma foto adicionada ainda.</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Clique em uma das fotos demonstrativas acima ou cole um link de imagem.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {photos.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="group relative aspect-video rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950"
            >
              <img
                src={url}
                alt={`Foto ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Fallback se a imagem falhar
                  ;(e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=60'
                }}
              />

              {/* Badge de Capa */}
              {idx === 0 && (
                <div className="absolute top-1.5 left-1.5 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  Capa
                </div>
              )}

              {/* Controles no Hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetCover(idx)}
                    title="Definir como foto de capa"
                    className="p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  title="Remover foto"
                  className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-500 transition-colors shadow"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
