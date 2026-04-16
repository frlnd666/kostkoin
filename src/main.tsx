import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './styles/theme.css'      // 1. Design tokens & fonts
import './styles/base.css'       // 2. Reset & global
import './styles/components.css' // 3. Komponen
import './index.css'             // 4. Tailwind (tetap di paling bawah)

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
