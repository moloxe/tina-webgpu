import { mat4 } from "../external/glMatrix";
import { shaderCode } from "./shaders";

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

export async function playShader(
  canvas: HTMLCanvasElement,
  fps: HTMLDivElement
) {
  const code = shaderCode;

  const adapter = await navigator.gpu.requestAdapter();

  if (!adapter) throw new Error("Adapter not available");

  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu") as GPUCanvasContext;

  if (!context) throw new Error("Context not available");

  context.configure({
    device: device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: "premultiplied",
  });

  const shaderModule = device.createShaderModule({ code });

  const pipeline = device.createRenderPipeline({
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
    },
    primitive: {
      topology: "triangle-strip",
    },
    layout: "auto",
  });

  const uniformBuffer = device.createBuffer({
    size: 128,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const pipelineBindGroup = [
    device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: uniformBuffer },
        },
      ],
    }),
  ];

  const cameraPosition = [0, 0, 0];
  const cameraRotation = { x: 0, y: 0 };
  const removeDraggCanvasListeners = addCanvasDraggListener(
    canvas,
    (dx, dy) => {
      cameraRotation.y += dx * 0.003;
      cameraRotation.x -= dy * 0.003;
    }
  );
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

  let frame = 0;
  function render() {
    // params
    const imageWidth = canvas.width;
    const imageHeight = canvas.height;
    const fov = 62;
    const sceneCenter = [-1.5, 0.4, 2.0]; // XY is rotation, Z is zoom
    // camera position/rotation
    handleDrag(sceneCenter);
    // put custom params into uniform buffer, aligned to 16 bytes
    const params = new Float32Array([
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
    ]);
    device.queue.writeBuffer(
      uniformBuffer,
      0,
      params.buffer,
      params.byteOffset,
      params.byteLength
    );

    const commandEncoder = device.createCommandEncoder();
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 }, // transparent bg
          loadOp: "clear",
          storeOp: "store",
          view: context.getCurrentTexture().createView(),
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, pipelineBindGroup[0]);
    passEncoder.draw(4, 1, 0, 0);
    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(render);
    frame += 1;
  }

  let previousFpsFrame = 0;
  const fpsInterval = setInterval(() => {
    fps.textContent = frame - previousFpsFrame + " FPS.";
    previousFpsFrame = frame;
  }, 1000);

  const animationFrame = requestAnimationFrame(render);

  return () => {
    clearInterval(fpsInterval);
    cancelAnimationFrame(animationFrame);
    removeDraggCanvasListeners();
  };
}
