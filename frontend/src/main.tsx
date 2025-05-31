import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// 🎯 Componente principal de la aplicación
import { App } from './App'
import { AuthProvider } from './components/auth/AuthProvider'

// 🚀 Renderizar la aplicación
const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
