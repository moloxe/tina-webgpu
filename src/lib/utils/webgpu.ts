async function setupDevice() {
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) throw new Error('Adapter not available')
  const device = await adapter.requestDevice()
  return device
}

function setupShader(
  device: GPUDevice,
  context: GPUCanvasContext,
  code: string
) {
  const shaderModule = device.createShaderModule({ code })

  const pipeline = device.createRenderPipeline({
    vertex: {
      module: shaderModule,
      entryPoint: 'vs_main',
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs_main',
      targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
    },
    primitive: {
      topology: 'triangle-strip',
    },
    layout: 'auto',
  })

  const uniformBuffer = device.createBuffer({
    size: 128,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })

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
  ]

  function draw(params: Float32Array) {
    device.queue.writeBuffer(
      uniformBuffer,
      0,
      params.buffer,
      params.byteOffset,
      params.byteLength
    )

    const commandEncoder = device.createCommandEncoder()
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 }, // transparent bg
          loadOp: 'clear',
          storeOp: 'store',
          view: context.getCurrentTexture().createView(),
        },
      ],
    }

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
    passEncoder.setPipeline(pipeline)
    passEncoder.setBindGroup(0, pipelineBindGroup[0])
    passEncoder.draw(4, 1, 0, 0)
    passEncoder.end()
    device.queue.submit([commandEncoder.finish()])
  }

  return draw
}

export async function setupWG(canvas: HTMLCanvasElement, shaderCode: string) {
  const context = canvas.getContext('webgpu') as GPUCanvasContext
  const device = await setupDevice()

  if (!context) throw new Error('Context not available')

  context.configure({
    device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: 'premultiplied',
  })

  const draw = setupShader(device, context, shaderCode)

  return draw
}
