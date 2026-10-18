import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { SavePass } from 'three/addons/postprocessing/SavePass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

/** 保留模型原始透明度，只在明亮轮廓附近叠加短距离泛光。 */
export function createLogoBloom(renderer, scene, camera) {
  const composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  const original = new SavePass()
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.72, 0.28, 0.9)
  // 限制大尺度模糊的权重，避免星心四周出现整片白雾。
  bloom.compositeMaterial.uniforms.bloomFactors.value = [1, 0.42, 0.08, 0, 0]

  const output = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      tOriginal: { value: original.renderTarget.texture }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform sampler2D tOriginal;
      varying vec2 vUv;

      void main() {
        vec4 original = texture2D(tOriginal, vUv);
        vec3 combined = texture2D(tDiffuse, vUv).rgb;
        vec3 glow = max(combined - original.rgb, vec3(0.0));
        float energy = max(glow.r, max(glow.g, glow.b));
        float glowAlpha = 1.0 - exp(-energy * 1.8);
        float alpha = max(original.a, glowAlpha);
        gl_FragColor = vec4(combined / max(alpha, 0.0001), alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        // WebGL 画布使用预乘透明度，必须在显示空间中执行预乘。
        gl_FragColor.rgb *= alpha;
      }
    `
  })
  output.material.depthTest = false
  output.material.depthWrite = false
  composer.addPass(renderPass)
  composer.addPass(original)
  composer.addPass(bloom)
  composer.addPass(output)

  return {
    render() {
      composer.render()
    },
    resize(width, height) {
      composer.setSize(width, height)
    },
    dispose() {
      original.dispose()
      bloom.dispose()
      output.dispose()
      composer.dispose()
    }
  }
}
