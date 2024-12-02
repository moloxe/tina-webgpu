import { setupWG } from "../../utils/webgpu";

export async function setupPlayer(
  canvas: HTMLCanvasElement,
  shaderCode: string
) {
  const draw = await setupWG(canvas, shaderCode);
  let beforeRender = () => {};
  let afterRender = () => {};

  let params = new Float32Array([]);
  function render() {
    beforeRender();
    draw(params);
    afterRender();

    requestAnimationFrame(render);
  }

  let animationFrame: number | null = null;

  return {
    play: () => {
      animationFrame = requestAnimationFrame(render);
    },
    stop: () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    },
    setParams(newValue: Float32Array) {
      params = newValue;
    },
    setBeforeRender(newValue: () => void) {
      beforeRender = newValue;
    },
    setAfterRender(newValue: () => void) {
      afterRender = newValue;
    },
  };
}
