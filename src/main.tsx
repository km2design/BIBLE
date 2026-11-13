import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/noto-serif-tc/chinese-traditional-400.css'
import '@fontsource/noto-serif-tc/chinese-traditional-700.css'
import '@fontsource/noto-serif-tc/latin-400.css'
import '@fontsource/noto-serif-tc/latin-700.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
