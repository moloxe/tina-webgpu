import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import VectorField from './components/VectorField/VectorField.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <VectorField />
  </StrictMode>,
)
