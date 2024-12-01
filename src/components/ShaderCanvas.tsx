import { useEffect, useRef } from "react"
import { playShader } from "../lib/main"

function ShaderCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fpsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const fps = fpsRef.current
    if (!canvas || !fps) return
    const unsubscribePromise = playShader(canvas, fps)
    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe())
    }
  }, [])
  return (
    <>
      <div ref={fpsRef} />
      <canvas ref={canvasRef} width={800} height={600} />
    </>
  )
}

export default ShaderCanvas
