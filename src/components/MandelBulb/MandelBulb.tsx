import { useEffect, useRef } from "react"
import { setupPlayer } from "../../lib/stages/shader/main";
import { mat4 } from "../../external/glMatrix";
import { shaderCode } from "./shader";

function addCanvasDraggListener(
  canvas: HTMLCanvasElement,
  handleMouseMove: (dx: number, dy: number) => void
) {
  let isDragging = false;
  let prevMousePosition = { x: 0, y: 0 };

  function onMouseDown(e: MouseEvent) {
    isDragging = true;
    prevMousePosition = { x: e.clientX, y: e.clientY };
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    const dx = e.clientX - prevMousePosition.x;
    const dy = e.clientY - prevMousePosition.y;
    handleMouseMove(dx, dy);
    prevMousePosition = { x: e.clientX, y: e.clientY };
  }

  function onMouseUp() {
    isDragging = false;
  }

  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseup", onMouseUp);

  return () => {
    canvas.removeEventListener("mousedown", onMouseDown);
    canvas.removeEventListener("mousemove", onMouseMove);
    canvas.removeEventListener("mouseup", onMouseUp);
  };
}

function ShaderCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fpsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const fps = fpsRef.current

    async function setup() {
      if (!canvas || !fps) return () => { }

      const cameraPosition = [0, 0, 0];
      const cameraRotation = { x: 0, y: 0 };

      const sceneViewMatrix = mat4.create();
      function handleDrag(sceneCenter: number[]) {
        const sceneCenterInverse = sceneCenter.map((x) => -x);
        mat4.lookAt(sceneViewMatrix, cameraPosition, sceneCenter, [0, 1, 0]);
        mat4.translate(sceneViewMatrix, sceneViewMatrix, sceneCenter);
        mat4.rotateX(sceneViewMatrix, sceneViewMatrix, cameraRotation.x);
        mat4.rotateY(sceneViewMatrix, sceneViewMatrix, cameraRotation.y);
        mat4.translate(sceneViewMatrix, sceneViewMatrix, sceneCenterInverse);
        mat4.invert(sceneViewMatrix, sceneViewMatrix);
      }

      const removeDraggCanvasListeners = addCanvasDraggListener(
        canvas,
        (dx, dy) => {
          cameraRotation.y += dx * 0.003;
          cameraRotation.x -= dy * 0.003;
        }
      );

      const player = await setupPlayer(canvas, shaderCode)

      player.setBeforeRender(() => {
        const imageWidth = canvas.width;
        const imageHeight = canvas.height;
        const fov = 62;
        const sceneCenter = [-1.5, 0.4, 2.0];
        handleDrag(sceneCenter);
        player.setParams(new Float32Array([
          ...sceneViewMatrix,
          // ---
          imageWidth,
          imageHeight,
          fov,
          frame,
          // ---
          ...sceneCenter,
          0, // blob
          // ---
          0, // spike
          0.003, // detalle
          0, // temp1,
          0, // temp2,
          // ---
          ...[0.2, 0.5, 0.1],
        ]))
      })

      let frame = 0;
      player.setAfterRender(() => {
        frame += 1;
      })

      let previousFpsFrame = 0;
      const fpsInterval = setInterval(() => {
        fps.textContent = frame - previousFpsFrame + " FPS.";
        previousFpsFrame = frame;
      }, 1000);


      player.play()

      return () => {
        removeDraggCanvasListeners()
        player.stop()
        clearInterval(fpsInterval)
      }
    }

    const unsubscribePromise = setup()

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
