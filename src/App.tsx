// ==============================================================================
// FÁCIL CAR SHOP — APLICAÇÃO (portal público + painel de gestão)
// Roteamento: portal (home, listagens, veículos, lojas) e painel (/painel).
// ==============================================================================

import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { Header } from '@/components/site/layout/Header'
import { Footer } from '@/components/site/layout/Footer'
import { TopBar } from '@/components/site/layout/TopBar'
import { Reveal } from '@/components/site/ui/Reveal'
import HomePage from '@/pages/site/HomePage'
import LiveCarrosPage from '@/pages/site/LiveCarrosPage'
import LiveLojasPage from '@/pages/site/LiveLojasPage'
import NotFoundPage from '@/pages/site/NotFoundPage'
import { CidadePage, LojaPage, MarcaPage, ModeloPage, VeiculoPage } from '@/pages/site/SitePages'
import PainelPage from '@/pages/PainelPage'
import TiagoDemoPage from '@/pages/site/TiagoDemoPage'

/** Rola até a âncora (#marcas, #anuncie...) ao trocar de rota ou de hash. */
function ScrollToHash() {
  const { hash, pathname } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [hash, pathname])
  return null
}

/** Link antigo /loja/<slug> leva para a página da loja no portal. */
function LojaRedirect() {
  const { slug = '' } = useParams()
  return <Navigate to={`/lojas/${slug}`} replace />
}

export function App() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-text">
      <TopBar />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/carros" element={<LiveCarrosPage />} />
          <Route path="/carros/:marca" element={<MarcaPage />} />
          <Route path="/carros/:marca/:modelo" element={<ModeloPage />} />
          <Route path="/carros-em/:cidade" element={<CidadePage />} />
          <Route path="/veiculo/:slug" element={<VeiculoPage />} />
          <Route path="/lojas" element={<LiveLojasPage />} />
          <Route path="/lojas/:slug" element={<LojaPage />} />
          <Route path="/loja/:slug" element={<LojaRedirect />} />
          <Route path="/painel" element={<PainelPage />} />
          <Route path="/previews/classificados-de-tiago" element={<TiagoDemoPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <ScrollToHash />
      <Reveal />
    </div>
  )
}

export default App
