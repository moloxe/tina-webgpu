const crossShader = (extraUniforms: string, functions: string) => /* wgsl */ `
const PI = 3.1415926535897932384626433832795;
const TWO_PI = PI * 2;

// incoming parameters, aligned to 16 bytes
struct Uniforms {
  resolution: vec2f,
  time: f32,
  ${extraUniforms}
};

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

${functions}

struct Interpolators {
  @builtin(position) pRaster: vec4<f32>,
  @location(0) uv: vec2f,
};
`;

const vertexShader = /* wgsl */ `
@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> Interpolators {
  // triangle strip, forming a quad, covering the whole view
  let vertices = array<vec2<f32>, 4>(
    vec2<f32>(-1, -1),
    vec2<f32>(-1,  1),
    vec2<f32>( 1, -1),
    vec2<f32>( 1,  1)
  );
  let vertex = vertices[vertexIndex];
  var output: Interpolators;
  output.pRaster = vec4<f32>(vertex, 0, 1); // will be converted to raster space automatically
  return output;
}
`;

export function fragmentToShader(inputFragment: string) {
  let finalFragment = inputFragment;
  let extraUniforms = "";
  let functions = "";

  if (finalFragment.includes("---")) {
    const blocks = finalFragment.split("---");
    if (blocks.length === 2) {
      [extraUniforms, finalFragment] = blocks;
    } else if (blocks.length === 3) {
      [extraUniforms, functions, finalFragment] = blocks;
    } else {
      throw new Error("Fragment error: Too many blocks.");
    }
  }

  const parsedShader = /* wgsl */ `
    ${crossShader(extraUniforms, functions)}
    ${vertexShader}
    @fragment
    fn fs_main(input: Interpolators) -> @location(0) vec4<f32> {
      let uv = input.pRaster.xy / uniforms.resolution;
      ${finalFragment}
    }
  `;

  return parsedShader;
}
