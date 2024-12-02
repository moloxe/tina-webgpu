import { FC, HTMLProps, useEffect, useRef } from "react";
import { setupPlayer } from "../../stages/shader/main";
import { fragmentToShader } from "./fragmentTemplate";

type Props = {
  fragment: string;
  getUniforms?: () => number[];
} & HTMLProps<HTMLCanvasElement>;

// TODO: Add forwardRef

const BaseCanvas: FC<Props> = ({
  fragment,
  getUniforms = () => [],
  ...canvasProps
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    async function setup() {
      if (!canvas) return () => {};

      const player = await setupPlayer(canvas, fragmentToShader(fragment));

      player.setBeforeRender(() => {
        const extraUniforms = getUniforms();
        const time = performance.now() / 1000;
        player.setParams(
          new Float32Array([
            ...[canvas.width, canvas.height],
            time,
            ...extraUniforms,
          ])
        );
      });

      player.play();

      return () => {
        player.stop();
      };
    }

    const unsubscribePromise = setup();

    return () => {
      unsubscribePromise.then((unsubscribe) => unsubscribe());
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} {...canvasProps} />;
};

export default BaseCanvas;
