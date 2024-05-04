"use client";

import styles from "./page.module.css";
import { useRef, useMemo, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";

const imageUrls = ["/img-0.jpg", "/img-1.jpg", "/img-2.jpg", "/img-3.jpg"];

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.canvasContainer}>
        <Canvas>
          <Plane imageUrl={imageUrls[0]} />
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

  useEffect(() => {
    if ($textureMesh.current.material) {
      $textureMesh.current.material.uniforms.uZoomScale.value.x =
        viewport.width / width;
      $textureMesh.current.material.uniforms.uZoomScale.value.y =
        viewport.height / height;
      $textureMesh.current.material.uniforms.uRes.value = {
        x: width,
        y: height,
      };
    }
  }, []);

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

          gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
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

  return (
    <group>
      <mesh ref={$textureMesh} {...settings}>
        <planeGeometry args={[width, height, 30, 30]} />
        <shaderMaterial args={[textureShaderArgs]} />
      </mesh>
      <mesh ref={$waveMesh} {...settings}>
        <planeGeometry args={[width, height, 30, 30]} />
        <shaderMaterial transparent opacity={0.5} args={[waveShaderArgs]} />
      </mesh>
    </group>
  );
}
