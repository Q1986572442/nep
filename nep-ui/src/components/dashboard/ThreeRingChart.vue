<template>
  <div ref="containerRef" class="three-ring-chart" :style="{ width: width + 'px', height: height + 'px' }">
    <canvas ref="canvasRef"></canvas>
    <div class="center-value">
      <span class="value-num">{{ displayValue }}</span>
      <span class="value-unit">%</span>
      <span class="value-label">完成率</span>
    </div>
    <div class="legend">
      <div v-for="(item, index) in legendData" :key="index" class="legend-item">
        <span class="legend-dot" :style="{ backgroundColor: item.color, boxShadow: `0 0 15px ${item.color}` }"></span>
        <span class="legend-text">{{ item.name }}</span>
        <span class="legend-value">{{ item.value }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  value: { type: Number, default: 75 },
  width: { type: Number, default: 300 },
  height: { type: Number, default: 240 },
  data: { type: Object, default: () => ({}) }
})

const containerRef = ref(null)
const canvasRef = ref(null)

let scene, camera, renderer, rings = [], particles = []
let animationId = null

const displayValue = computed(() => {
  return props.value.toString()
})

const legendData = computed(() => {
  const data = props.data
  const total = (data.pending || 0) + (data.assigned || 0) + (data.completed || 0) || 100
  return [
    { name: '待处理', value: Math.round(((data.pending || 30) / total) * 100), color: '#F59E0B' },
    { name: '处理中', value: Math.round(((data.assigned || 40) / total) * 100), color: '#00E5FF' },
    { name: '已完成', value: Math.round(((data.completed || 30) / total) * 100), color: '#10AC84' }
  ]
})

function initScene() {
  if (!canvasRef.value) return
  
  scene = new THREE.Scene()
  
  const aspect = props.width / props.height
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
  camera.position.set(0, 0, 11)
  camera.lookAt(0, 0, 0)
  
  renderer = new THREE.WebGLRenderer({ 
    canvas: canvasRef.value, 
    antialias: true, 
    alpha: true 
  })
  renderer.setSize(props.width, props.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  
  addLights()
  createRings()
  createParticles()
  
  animate()
}

function addLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5)
  directionalLight.position.set(12, 12, 18)
  directionalLight.castShadow = true
  scene.add(directionalLight)
  
  const pointLight1 = new THREE.PointLight(0x00E5FF, 1.5, 60)
  pointLight1.position.set(0, 10, 12)
  scene.add(pointLight1)
  
  const pointLight2 = new THREE.PointLight(0x9B59B6, 1.2, 60)
  pointLight2.position.set(-10, -6, -12)
  scene.add(pointLight2)
  
  const fillLight = new THREE.DirectionalLight(0x409EFF, 0.8)
  fillLight.position.set(-10, 10, -12)
  scene.add(fillLight)
  
  const rimLight = new THREE.PointLight(0xffffff, 0.6, 50)
  rimLight.position.set(0, -8, 15)
  scene.add(rimLight)
  
  const pointLight3 = new THREE.PointLight(0x10AC84, 0.7, 45)
  pointLight3.position.set(8, 6, -8)
  scene.add(pointLight3)
  
  const pointLight4 = new THREE.PointLight(0xFF3366, 0.5, 40)
  pointLight4.position.set(-6, 8, 8)
  scene.add(pointLight4)
}

function createRings() {
  disposeRings()
  
  const baseRadius = 3.5
  const ringThickness = 0.9
  const segments = 200
  
  const gradientColors = [
    new THREE.Color('#00E5FF'),
    new THREE.Color('#409EFF'),
    new THREE.Color('#9B59B6'),
    new THREE.Color('#FF3366'),
    new THREE.Color('#00E5FF')
  ]
  
  for (let i = 0; i < 4; i++) {
    const radius = baseRadius + i * 0.9
    const height = 0.4 + i * 0.07
    const geometry = new THREE.TorusGeometry(radius, ringThickness, 20, segments)
    
    const materials = []
    for (let j = 0; j < segments; j++) {
      const colorIndex = Math.floor((j / segments) * gradientColors.length)
      const nextColorIndex = (colorIndex + 1) % gradientColors.length
      const t = (j / segments) * gradientColors.length - colorIndex
      const color = new THREE.Color().lerpColors(
        gradientColors[colorIndex],
        gradientColors[nextColorIndex],
        t
      )
      materials.push(new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.08,
        metalness: 0.98,
        emissive: color,
        emissiveIntensity: 0.5
      }))
    }
    
    const ring = new THREE.Mesh(geometry, materials)
    ring.rotation.x = Math.PI / 2
    ring.rotation.y = Math.PI / 6
    
    ring.userData = { 
      rotationSpeed: (0.0035 + i * 0.0015) * (i % 2 === 0 ? 1 : -1),
      phase: i * 0.4,
      pulseIntensity: 0.5
    }
    
    ring.castShadow = true
    ring.receiveShadow = true
    
    rings.push(ring)
    scene.add(ring)
  }
  
  const innerGeometry = new THREE.CylinderGeometry(baseRadius - 1.4, baseRadius - 1.4, 0.7, 96)
  const innerMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a1931,
    roughness: 0.15,
    metalness: 0.9,
    transparent: true,
    opacity: 0.98
  })
  const inner = new THREE.Mesh(innerGeometry, innerMaterial)
  inner.position.y = 0.35
  inner.castShadow = true
  rings.push(inner)
  scene.add(inner)
  
  const innerTopGeometry = new THREE.CylinderGeometry(baseRadius - 1.0, baseRadius - 1.5, 0.3, 96)
  const innerTopMaterial = new THREE.MeshStandardMaterial({
    color: 0x00E5FF,
    roughness: 0.03,
    metalness: 0.98,
    emissive: 0x00E5FF,
    emissiveIntensity: 0.7
  })
  const innerTop = new THREE.Mesh(innerTopGeometry, innerTopMaterial)
  innerTop.position.y = 0.75
  innerTop.castShadow = true
  rings.push(innerTop)
  scene.add(innerTop)
  
  const centerGlowGeometry = new THREE.SphereGeometry(baseRadius - 1.6, 64, 64)
  const centerGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0x00E5FF,
    transparent: true,
    opacity: 0.1
  })
  const centerGlow = new THREE.Mesh(centerGlowGeometry, centerGlowMaterial)
  centerGlow.position.y = 0.35
  rings.push(centerGlow)
  scene.add(centerGlow)
  
  const progressGeometry = createProgressRing(baseRadius - 1.4, ringThickness * 0.85, props.value)
  const progressMaterial = new THREE.MeshStandardMaterial({
    color: 0x00E5FF,
    roughness: 0.02,
    metalness: 0.99,
    emissive: 0x00E5FF,
    emissiveIntensity: 0.9,
    side: THREE.DoubleSide
  })
  const progress = new THREE.Mesh(progressGeometry, progressMaterial)
  progress.rotation.x = -Math.PI / 2
  progress.position.y = 0.45
  progress.castShadow = true
  rings.push(progress)
  scene.add(progress)
}

function createProgressRing(radius, thickness, percentage) {
  const segments = 150
  const startAngle = 0
  const endAngle = (percentage / 100) * Math.PI * 2
  
  const shape = new THREE.Shape()
  shape.moveTo(radius + thickness, 0)
  shape.arc(radius + thickness, 0, thickness, startAngle, endAngle)
  shape.arc(radius, 0, thickness, endAngle, startAngle, true)
  
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.25,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05
  })
  
  return geometry
}

function createParticles() {
  disposeParticles()
  
  const particleCount = 180
  const geometry = new THREE.BufferGeometry()
  const positions = []
  const colors = []
  
  const particleColors = [0x00E5FF, 0x409EFF, 0x9B59B6, 0xFF3366, 0xF59E0B]
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2
    const radius = 3.2 + Math.random() * 5
    const height = Math.random() * 6
    positions.push(Math.cos(angle) * radius, height, Math.sin(angle) * radius)
    
    const color = new THREE.Color(particleColors[i % particleColors.length])
    colors.push(color.r, color.g, color.b)
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  
  const material = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  })
  
  const particleSystem = new THREE.Points(geometry, material)
  particleSystem.userData = {
    basePositions: positions.slice()
  }
  
  particles.push(particleSystem)
  scene.add(particleSystem)
}

function disposeRings() {
  rings.forEach(ring => {
    if (Array.isArray(ring.material)) {
      ring.material.forEach(m => m.dispose())
    } else {
      ring.material.dispose()
    }
    ring.geometry.dispose()
    scene.remove(ring)
  })
  rings = []
}

function disposeParticles() {
  particles.forEach(particle => {
    particle.material.dispose()
    particle.geometry.dispose()
    scene.remove(particle)
  })
  particles = []
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  const time = Date.now() * 0.001
  
  rings.forEach((ring, index) => {
    if (index < 4) {
      ring.rotation.y += ring.userData.rotationSpeed
      ring.rotation.z = Math.sin(time + ring.userData.phase) * 0.1
      
      const scale = 1 + Math.sin(time * 1.8 + ring.userData.phase) * 0.05
      ring.scale.set(scale, scale, scale)
      
      if (Array.isArray(ring.material)) {
        const pulseIntensity = 0.5 + Math.sin(time * 2.5 + ring.userData.phase) * 0.25
        ring.material.forEach(m => {
          m.emissiveIntensity = pulseIntensity
        })
      }
    }
    if (index === rings.length - 4) {
      const scale = 1 + Math.sin(time * 2) * 0.02
      ring.scale.set(scale, scale, scale)
    }
    if (index === rings.length - 3) {
      const glowScale = 1 + Math.sin(time * 1.5) * 0.18
      ring.scale.set(glowScale, glowScale, glowScale)
      ring.material.opacity = 0.06 + Math.sin(time * 1.5) * 0.04
    }
    if (index === rings.length - 1) {
      const pulseIntensity = 0.9 + Math.sin(time * 3) * 0.35
      ring.material.emissiveIntensity = pulseIntensity
    }
  })
  
  particles.forEach(particle => {
    const positions = particle.geometry.attributes.position.array
    const basePositions = particle.userData.basePositions
    
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = basePositions[i] + Math.sin(time + i * 0.01) * 0.5
      positions[i + 1] = basePositions[i + 1] + Math.sin(time * 0.6 + i * 0.01) * 0.4
      positions[i + 2] = basePositions[i + 2] + Math.cos(time * 0.4 + i * 0.01) * 0.5
    }
    
    particle.geometry.attributes.position.needsUpdate = true
    particle.rotation.y += 0.0025
  })
  
  renderer.render(scene, camera)
}

function handleResize() {
  if (!camera || !renderer) return
  const aspect = props.width / props.height
  camera.aspect = aspect
  camera.updateProjectionMatrix()
  renderer.setSize(props.width, props.height)
}

watch(() => props.value, () => {
  createRings()
})

watch(() => props.data, () => {
  createRings()
}, { deep: true })

watch(() => [props.width, props.height], () => {
  handleResize()
})

onMounted(() => {
  initScene()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', handleResize)
  disposeRings()
  disposeParticles()
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<style scoped>
.three-ring-chart {
  position: relative;
  width: 100%;
  height: 100%;
}

.three-ring-chart canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.center-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  pointer-events: none;
}

.value-num {
  font-size: 58px;
  font-weight: 800;
  color: #FFFFFF;
  font-family: 'DIN Alternate', 'SF Mono', monospace;
  text-shadow: 
    0 0 35px rgba(0, 229, 255, 1), 
    0 0 70px rgba(0, 229, 255, 0.6),
    0 0 100px rgba(0, 229, 255, 0.4);
  letter-spacing: 8px;
  line-height: 1.1;
  background: linear-gradient(180deg, #FFFFFF 0%, rgba(0, 229, 255, 0.8) 50%, rgba(138, 158, 188, 0.6) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.value-unit {
  font-size: 22px;
  font-weight: 700;
  color: rgba(0, 229, 255, 0.95);
  font-family: 'DIN Alternate', 'SF Mono', monospace;
  letter-spacing: 4px;
  text-shadow: 
    0 0 20px rgba(0, 229, 255, 0.8),
    0 0 40px rgba(0, 229, 255, 0.4);
}

.value-label {
  font-size: 14px;
  color: rgba(138, 158, 188, 0.85);
  letter-spacing: 3px;
  margin-top: 6px;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.2);
}

.legend {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 24px;
  z-index: 10;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  background: rgba(10, 25, 49, 0.9);
  border-radius: 10px;
  border: 1px solid rgba(0, 229, 255, 0.2);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.legend-item:hover {
  background: rgba(0, 229, 255, 0.15);
  border-color: rgba(0, 229, 255, 0.5);
  transform: translateY(-2px);
}

.legend-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.legend-item:hover .legend-dot {
  transform: scale(1.4);
}

.legend-text {
  font-size: 13px;
  color: rgba(138, 158, 188, 0.95);
  white-space: nowrap;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.legend-value {
  font-size: 14px;
  color: #FFFFFF;
  font-weight: 800;
  font-family: 'DIN Alternate', 'SF Mono', monospace;
  letter-spacing: 2px;
  text-shadow: 0 0 15px rgba(0, 229, 255, 0.5);
}
</style>