import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as React from 'react'
import './index.css'
import App from './App'
import { StorefrontPage } from './components/storefront/StorefrontPage'
import { resolveTenant, type Tenant } from './services/tenantService'

// Decide entre a vitrine da loja (domínio próprio ou /loja/<slug>) e o painel da plataforma
function Root() {
  const [tenant, setTenant] = React.useState<Tenant | null>(null)

  React.useEffect(() => {
    resolveTenant().then(setTenant)
  }, [])

  if (!tenant) return null
  return tenant.kind === 'store' ? <StorefrontPage store={tenant.store} /> : <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
