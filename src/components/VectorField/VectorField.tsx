import { useRef } from 'react'
import BasicFragment from '../../lib/components/BasicFragment/BasicFragment'

function VectorField() {
  const mouseX = useRef(0)
  return (
    <BasicFragment
      width={800}
      height={600}
      onMouseMove={({ clientX }) => (mouseX.current = clientX)}
      getUniforms={() => [
        3 + (3 * mouseX.current) / 800, // scale
      ]}
      fragment={
        /* wgsl */ `
        scale: f32,
        ---
        fn getTarget(origin: vec2f) -> vec2f {
          let x = origin.x;
          let y = origin.y;
          return vec2f(
            x*x - y*y - 4.,
            2. * x*y
          );
        }
        fn getAngularDist(angle1: f32, angle2: f32) -> f32 {
          let delta = angle2 - angle1;
          return abs(delta - floor(delta / TWO_PI) * TWO_PI);
        }
        fn hsv2rgb(h: f32, s: f32, v: f32) -> vec3f {
          let c = vec3f(h, s, v);
          let K = vec4f(1., 2. / 3., 1. / 3., 3.);
          let p = abs(fract(c.xxx + K.xyz) * 6. - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, vec3f(0.), vec3f(1.)), c.y);
        }
        ---
        let ori = (vec2f(uv.x, 1. - uv.y) * 2. - 1.) * uniforms.scale;
        var tar = getTarget(ori);

        let t = sin(uniforms.time + PI) * .5 + .5;
        tar = (1. - t) * ori + t * tar;

        let angleO = atan2(ori.y, ori.x);
        let angleT = atan2(tar.y, tar.x);

        let eDist = length(ori - tar);
        let aDist = getAngularDist(angleO, angleT);

        let color = hsv2rgb(aDist / TWO_PI, 1., log(1. + eDist));

        return vec4f(color, 1.);
      `
      }
    />
  )
}

export default VectorField
