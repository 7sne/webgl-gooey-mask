"use client";

import styles from "./page.module.css";
import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useControls } from "leva";

const imageUrls = ["/img-0.jpg", "/img-1.jpg", "/img-2.jpg", "/img-3.jpg"];

export default function Home() {
  const $renderer = useRef();

  return (
    <main className={styles.main}>
      <div className={styles.canvasContainer}>
        <Canvas ref={$renderer}>
          <DisolvePlane imageUrl={imageUrls[0]} />
        </Canvas>
      </div>
    </main>
  );
}

const planeSettings = {
  width: 3,
  height: 4.5,
  gap: 0.1,
};

function Plane({ imageUrl, settings = planeSettings }) {
  const { width, height } = settings;
  const { viewport } = useThree();
  const tex = useTexture(imageUrl);

  const $waveMesh = useRef();
  const $textureMesh = useRef();

  // useEffect(() => {
  //   if ($textureMesh.current.material) {
  //     $textureMesh.current.material.uniforms.uZoomScale.value.x =
  //       viewport.width / width;
  //     $textureMesh.current.material.uniforms.uZoomScale.value.y =
  //       viewport.height / height;
  //     $textureMesh.current.material.uniforms.uRes.value = {
  //       x: width,
  //       y: height,
  //     };
  //   }
  // }, []);

  const textureShaderArgs = useMemo(() => {
    return {
      uniforms: {
        uProgress: { value: 0 },
        uZoomScale: { value: { x: 1, y: 1 } },
        uTex: { value: tex },
        uRes: { value: { x: 1, y: 1 } },
        uImageRes: {
          value: { x: tex.source.data.width, y: tex.source.data.height },
        },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        uniform float uProgress;
        uniform vec2 uZoomScale;

        void main() {
          vUv = uv;
          vec3 pos = position;
          float angle = uProgress * 3.14159265 / 2.;
          float wave = cos(angle);
          float c = sin(length(uv - .5) * 15. + uProgress * 12.) * .5 + .5;
          pos.x *= mix(1., uZoomScale.x + wave * c, uProgress);
          pos.y *= mix(1., uZoomScale.y + wave * c, uProgress);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTex;
        uniform vec2 uRes;
        uniform vec2 uZoomScale;
        uniform vec2 uImageRes;

        /*------------------------------
        Background Cover UV
        --------------------------------
        u = basic UV
        s = screensize
        i = image size
        ------------------------------*/
        vec2 CoverUV(vec2 u, vec2 s, vec2 i) {
          float rs = s.x / s.y; // Aspect screen size
          float ri = i.x / i.y; // Aspect image size
          vec2 st = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x); // New st
          vec2 o = (rs < ri ? vec2((st.x - s.x) / 2.0, 0.0) : vec2(0.0, (st.y - s.y) / 2.0)) / st; // Offset
          return u * s / st + o;
        }

        varying vec2 vUv;

        void main() {
          vec2 uv = CoverUV(vUv, uRes, uImageRes);
          vec3 tex = texture2D(uTex, uv).rgb;
          gl_FragColor = vec4( tex, 1.0 );
        }
      `,
    };
  }, []);

  const waveShaderArgs = useMemo(() => {
    return {
      uniforms: {},
      vertexShader: /* glsl */ `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        // uniform vec2 uRes;

        // float circle(in vec2 _st, in float _radius, in float blurriness){
        //   vec2 dist = _st;
        //   return 1.-smoothstep(_radius-(_radius*blurriness), _radius+(_radius*blurriness), dot(dist,dist)*4.0);
        // }

        void main() {
          gl_FragColor = vec4(1., 0., 0., .5);
        }
      `,
    };
  }, []);

  const gooeyShaderArgs = useMemo(() => {
    return {
      uniforms: {
        uRes: { value: [width, height] }, // Pass mesh dimensions
        uImageRes: { value: [tex.image.width, tex.image.height] }, // Pass texture dimensions
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
      
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
      fragmentShader: /* glsl */ `
        uniform vec2 uRes;
        uniform vec2 uImageRes;
        varying vec2 vUv;

        void main() {
          // Calculate UV coordinates scaled to cover the mesh
          // vec2 uv = vUv * (uRes / uImageRes);
          vec2 uv = vUv;
          // Calculate distance from the center
          vec2 center = vec2(0.5);
          float distance = distance(uv, center);
          vec3 backgroundColor = vec3(0.0);
          // Set circle radius (half the minimum dimension)
          float radius = min(uRes.x, uRes.y) / 2.0;
          // Interpolate between circle and background color
          float smoothStep = smoothstep(radius - 0.01, radius, distance);
          // Set fragment color
          vec3 finalColor = mix(backgroundColor, vec3(1.0), smoothStep);
          gl_FragColor = vec4(finalColor, 1.0);
        }
    `,
    };
  }, [height, width, tex.image.width, tex.image.height]);

  console.log(height, width, tex.image.width, tex.image.height);

  return (
    <group>
      {/* <mesh ref={$textureMesh} {...settings}>
        <planeGeometry args={[width, height, 30, 30]} />
        <shaderMaterial transparent opacity={0} args={[textureShaderArgs]} />
      </mesh> */}
      <mesh ref={$waveMesh} {...settings}>
        <planeGeometry args={[width, height, 30, 30]} />
        <shaderMaterial args={[gooeyShaderArgs]} />
      </mesh>
      {/* <mesh ref={$waveMesh} {...settings}>
        <planeGeometry args={[width, height, 30, 30]} />
        <shaderMaterial transparent opacity={0.5} args={[waveShaderArgs]} />
      </mesh> */}
    </group>
  );
}

function CircleOnPlane({ imageUrl, settings = planeSettings }) {
  const { width, height } = settings;

  const $mesh = useRef();

  useFrame(({ clock }) => {
    // Update uTime uniform on every frame
    if ($mesh.current) {
      $mesh.current.material.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  const { gl } = useThree();

  useEffect(() => {
    gl.setClearColor(0x000000, 1.0);
  }, []);

  const shaderArgs = useMemo(() => {
    return {
      defines: {
        PR: window.devicePixelRatio.toFixed(1),
      },
      uniforms: {
        uRes: { value: [width, height] },
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vPos;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vPos;
        varying vec2 vUv;

        uniform vec2 uRes;
        uniform float uTime;

        // Simplex 2D noise
        //
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

        float snoise(vec2 v){
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                  -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod(i, 289.0);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
          + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
            dot(x12.zw,x12.zw)), 0.0);
          m = m*m ;
          m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        float circle(in vec2 _st, in float _radius, in float blurriness){
          vec2 dist = _st;
          return 1. - smoothstep(_radius - (_radius * blurriness), _radius + (_radius * blurriness), dot(dist, dist) * 4.0);
        }

        void main() {
          vec2 res = uRes * PR;
          vec2 st = vPos.xy / res.xy;
          st.y *= uRes.y / uRes.x;

          vec2 circlePos = st;
          float c = circle(circlePos, .03, 2.);
          
          gl_FragColor = vec4(vec3(c), 1.);

          float offX = vUv.x + sin(vUv.y + uTime * .1);
          float offY = vUv.y - uTime * 0.1 - cos(uTime * .001) * .01;
          
          float n = snoise(vec2(offX * uTime * .005, offY * uTime * .005) * .5) * 1.;
          gl_FragColor = vec4(vec3(n), 1.);
          

          // vec2 normalizedPos = vPos.xy / uRes;
          // vec2 center = vec2(0);
          // float distanceToCenter = distance(normalizedPos, center);
          // float pct = smoothstep(0.4, 0.5, distanceToCenter);
          // vec3 color = vec3(pct);
          // gl_FragColor = vec4(color, 1.0);
        }
      `,
    };
  }, []);

  return (
    <mesh ref={$mesh} {...settings}>
      <planeGeometry args={[width, height, 30, 30]} />
      <shaderMaterial args={[shaderArgs]} />
    </mesh>
  );
}

function DisolvePlane({ imageUrl, settings = planeSettings }) {
  const { dissolveValue } = useControls("Dissolve", {
    dissolveValue: { value: 0.5, min: 0, max: 1 },
  });

  const { width, height } = settings;

  const $mesh = useRef();

  const dissolveTexture = useTexture("/text-1.jpeg");
  const imgTexture = useTexture("/img-0.jpg");

  useFrame(({ clock }) => {
    // Update uTime uniform on every frame
    if ($mesh.current) {
      $mesh.current.material.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  useEffect(() => {
    $mesh.current.material.uniforms.uDissolveValue.value = dissolveValue;
  }, [dissolveValue]);

  const { gl } = useThree();

  useEffect(() => {
    gl.setClearColor(0x000000, 1.0);
  }, []);

  const shaderArgs = useMemo(() => {
    return {
      defines: {
        PR: window.devicePixelRatio.toFixed(1),
      },
      uniforms: {
        uRes: { value: [width, height] },
        uTime: { value: 0 },
        uTex: { value: imgTexture },
        uDissolveTex: { value: dissolveTexture },
        uDissolveValue: { value: dissolveValue },
        uBurnSize: { value: 0.04 },
        uBurnColor: { value: [1, 0, 0] },
      },
      vertexShader: /* glsl */ `
        varying vec3 vPos;
        varying vec2 vUv;

        void main() {
          vPos = position;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv;

        uniform sampler2D uTex;
        uniform sampler2D uDissolveTex;
        uniform float uDissolveValue;
        uniform float uBurnSize;
        uniform vec3 uBurnColor;
        
        void main() {
          vec4 main_texture = texture2D(uTex, vUv);
          vec4 noise_texture = texture2D(uDissolveTex, vUv);
          
          main_texture.a *= floor(uDissolveValue + min(1., noise_texture.x));
          gl_FragColor = main_texture;

          // vec3 tex = texture2D(uTex, vUv).rgb;
          // float dissolveTex = texture2D(uDissolveTex, vUv).x;
          
          // float burn_size_step = uBurnSize * step(0.001, uDissolveValue) * step(uDissolveValue, 0.999);
          // float threshold = smoothstep(dissolveTex - burn_size_step, dissolveTex, uDissolveValue);
          // float border = smoothstep(dissolveTex, dissolveTex + burn_size_step, uDissolveValue);
          
          // gl_FragColor.a *= threshold;
          // gl_FragColor.rgb = mix(uBurnColor, tex, border);
        }
      `,
    };
  }, []);

  return (
    <mesh ref={$mesh} {...settings}>
      <planeGeometry args={[width, height, 30, 30]} />
      <shaderMaterial args={[shaderArgs]} />
    </mesh>
  );
}
