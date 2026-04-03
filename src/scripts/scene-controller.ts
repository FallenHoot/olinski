/**
 * SceneController — Three.js cinematic image stage
 *
 * Renders hero images as textured planes in a 3D scene with:
 * - Film grain, vignette, and color grading via custom shaders
 * - Floating particles for atmospheric depth
 * - Subtle camera drift for parallax
 * - LoadingManager gate (scene ready only after all textures loaded)
 *
 * Follows the Montfort pattern: single fixed canvas, GSAP-scrubbed.
 */
import * as THREE from 'three';

// ── Vertex Shader ──────────────────────────────────────────────
const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ── Fragment Shader — cinematic image rendering ────────────────
const FRAG = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;
uniform float uOpacity;
uniform float uScale;
uniform float uTime;
uniform float uGrid;
uniform float uImageAspect;   // image width / height
uniform float uViewportAspect; // viewport width / height

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// CSS object-fit: cover equivalent
vec2 coverUV(vec2 uv) {
  vec2 s;
  if (uViewportAspect > uImageAspect) {
    s = vec2(1.0, uImageAspect / uViewportAspect);
  } else {
    s = vec2(uViewportAspect / uImageAspect, 1.0);
  }
  return (uv - 0.5) / s + 0.5;
}

void main() {
  // Zoom from center (driven by GSAP scale tween)
  vec2 uv = (vUv - 0.5) / uScale + 0.5;

  // Cover-fit mapping
  vec2 texUv = coverUV(uv);

  // Clamp to valid range — prevents edge pixel streaking
  texUv = clamp(texUv, 0.001, 0.999);

  vec4 tex = texture2D(uTexture, texUv);

  // ── Heavy vignette — cinematic letterbox feel ──
  vec2 center = vUv - 0.5;
  float vig = 1.0 - dot(center, center) * 2.4;
  vig = smoothstep(-0.1, 0.8, vig);

  // ── Subtle film grain ──
  float grain = hash(vUv * 1000.0 + fract(uTime * 0.1)) * 0.04 - 0.02;

  // ── Color grading: warm shadows, desaturate, darken ──
  float luma = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
  vec3 graded = mix(vec3(luma), tex.rgb, 0.72);
  graded *= vec3(1.06, 0.98, 0.90); // warm tint
  graded *= 0.50; // darken for text contrast

  // ── Procedural grid overlay (Oslo section) ──
  if (uGrid > 0.01) {
    vec2 gridUv = vUv * 40.0;
    float d = length(fract(gridUv) - 0.5);
    float dot = 1.0 - smoothstep(0.02, 0.06, d);
    graded += vec3(0.3, 0.64, 1.0) * dot * 0.16 * uGrid;
  }

  vec3 finalColor = graded * vig + grain;
  gl_FragColor = vec4(finalColor, uOpacity);
}
`;

// ── Particle shaders ───────────────────────────────────────────
const PARTICLE_VERT = /* glsl */ `
attribute float aSize;
uniform float uTime;
void main() {
  vec3 pos = position;
  pos.y += sin(uTime * 0.3 + position.x * 10.0) * 0.05;
  pos.x += cos(uTime * 0.2 + position.z * 8.0) * 0.03;
  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = aSize * (80.0 / -mvPos.z);
  gl_Position = projectionMatrix * mvPos;
}
`;

const PARTICLE_FRAG = /* glsl */ `
precision highp float;
uniform float uOpacity;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float alpha = smoothstep(0.5, 0.2, d) * uOpacity;
  gl_FragColor = vec4(0.82, 0.89, 1.0, alpha);
}
`;

// ── Types ──────────────────────────────────────────────────────
export interface ImageEntry {
  key: string;
  path: string;
}

// ── SceneController ────────────────────────────────────────────
export class SceneController {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private meshes = new Map<string, THREE.Mesh>();
  private mats = new Map<string, THREE.ShaderMaterial>();
  private particles!: THREE.Points;
  private particleMat!: THREE.ShaderMaterial;
  private clock = new THREE.Clock();
  private reducedMotion: boolean;

  private readonly CAM_Z = 5;

  constructor(canvas: HTMLCanvasElement) {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 1);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    this.camera.position.set(0, 0, this.CAM_Z);
    this.camera.lookAt(0, 0, 0);

    this.initParticles();
  }

  /** Load all textures via LoadingManager gate. Resolves when ready. */
  load(images: ImageEntry[]): Promise<void> {
    return new Promise((resolve) => {
      const manager = new THREE.LoadingManager(() => resolve());
      const loader = new THREE.TextureLoader(manager);

      images.forEach((img, i) => {
        loader.load(
          img.path,
          (texture) => {
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            this.addPlane(img.key, texture, i);
          },
          undefined,
          () => {
            // Fallback: 1×1 black texture
            const data = new Uint8Array([0, 0, 0, 255]);
            const fallback = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
            fallback.needsUpdate = true;
            this.addPlane(img.key, fallback, i);
          },
        );
      });
    });
  }

  /** Opacity uniform ref — for GSAP to tween */
  opacity(key: string): { value: number } {
    return this.mats.get(key)!.uniforms.uOpacity;
  }

  /** Scale uniform ref — for GSAP to tween */
  scale(key: string): { value: number } {
    return this.mats.get(key)!.uniforms.uScale;
  }

  /** Grid uniform ref — for GSAP to tween */
  grid(key: string): { value: number } {
    return this.mats.get(key)!.uniforms.uGrid;
  }

  /** Per-frame render. Called from gsap.ticker. */
  tick(): void {
    const t = this.clock.getElapsedTime();

    // Update shader time
    const timeVal = this.reducedMotion ? 0 : t;
    this.mats.forEach((mat) => {
      mat.uniforms.uTime.value = timeVal;
    });

    // Camera drift — subtle parallax against particles
    if (!this.reducedMotion) {
      this.camera.position.x = Math.sin(t * 0.13) * 0.04;
      this.camera.position.y = Math.cos(t * 0.11) * 0.03;
      this.camera.lookAt(0, 0, 0);
    }

    // Particle time
    this.particleMat.uniforms.uTime.value = timeVal;

    this.renderer.render(this.scene, this.camera);
  }

  /** Handle viewport resize */
  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);

    // Recalculate plane scale to fill viewport
    const [pw, ph] = this.planeCoverSize();
    this.meshes.forEach((mesh) => {
      mesh.scale.set(pw, ph, 1);
    });

    // Update viewport aspect for cover-fit shader math
    this.mats.forEach((mat) => {
      mat.uniforms.uViewportAspect.value = w / h;
    });
  }

  /** Full cleanup — textures, geometry, renderer */
  dispose(): void {
    this.meshes.forEach((mesh) => {
      mesh.geometry.dispose();
      const mat = mesh.material as THREE.ShaderMaterial;
      const tex = mat.uniforms.uTexture?.value as THREE.Texture;
      tex?.dispose();
      mat.dispose();
    });
    this.meshes.clear();
    this.mats.clear();

    if (this.particles) {
      this.particles.geometry.dispose();
      this.particleMat.dispose();
    }

    this.renderer.dispose();
  }

  // ── Private ──────────────────────────────────────────────────

  private addPlane(key: string, texture: THREE.Texture, index: number): void {
    const geo = new THREE.PlaneGeometry(1, 1);

    const imageAspect = texture.image
      ? (texture.image.width || 1) / (texture.image.height || 1)
      : 1;

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uOpacity: { value: key === 'farm' ? 1.0 : 0.0 },
        uScale: { value: 1.0 },
        uTime: { value: 0 },
        uGrid: { value: 0 },
        uImageAspect: { value: imageAspect },
        uViewportAspect: { value: window.innerWidth / window.innerHeight },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = index;
    mesh.position.z = -index * 0.01;

    // Scale to fill viewport
    const [w, h] = this.planeCoverSize();
    mesh.scale.set(w, h, 1);

    this.scene.add(mesh);
    this.meshes.set(key, mesh);
    this.mats.set(key, mat);
  }

  /** Calculate plane dimensions that cover the viewport with overshoot for camera drift */
  private planeCoverSize(): [number, number] {
    const vFov = this.camera.fov * (Math.PI / 180);
    const h = 2 * this.CAM_Z * Math.tan(vFov / 2);
    const w = h * this.camera.aspect;
    return [w * 1.05, h * 1.05];
  }

  private initParticles(): void {
    const count = 120;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = Math.random() * (this.CAM_Z - 0.5) + 0.2;
      sizes[i] = Math.random() * 1.2 + 0.3;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    this.particleMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0.08 },
      },
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.particles = new THREE.Points(geo, this.particleMat);
    this.scene.add(this.particles);
  }
}
