// ==============================================================================
// FÁCIL CAR SHOP — APLICAÇÃO (portal público + painel de gestão)
// Roteamento: portal (home, listagens, veículos, lojas) e painel (/painel).
// ==============================================================================

import { useEffect, lazy, Suspense } from 'react'
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
import LoginPage from '@/pages/LoginPage'
import { AuthProvider } from '@/contexts/AuthContext'

// Lazy load de páginas pesadas
const PainelPage = lazy(() => import('@/pages/PainelPage'))
const TiagoDemoPage = lazy(() => import('@/pages/site/TiagoDemoPage'))

// Loading fallback minimalista
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin">⏳</div>
    </div>
  )
}

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
    <AuthProvider>
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/painel" element={<Suspense fallback={<PageLoader />}><PainelPage /></Suspense>} />
            <Route path="/previews/classificados-de-tiago" element={<Suspense fallback={<PageLoader />}><TiagoDemoPage /></Suspense>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
        <ScrollToHash />
        <Reveal />
      </div>
    </AuthProvider>
  )
}

export default App
