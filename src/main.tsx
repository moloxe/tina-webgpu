import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import VectorField from './components/VectorField/VectorField.tsx'
import MandelBulb from './components/MandelBulb/MandelBulb'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div>
      <h1>Mandelbulb</h1>
      <p>from <a href="https://github.com/zordone/fractal-webgpu" target='_blank'>https://github.com/zordone/fractal-webgpu</a></p>
      <MandelBulb />
      <h1>VectorField</h1>
      <VectorField />
    </div>
  </StrictMode>
)
