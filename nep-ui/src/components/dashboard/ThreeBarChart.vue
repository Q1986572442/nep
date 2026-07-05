<template>
  <div ref="containerRef" class="three-bar-chart" :style="{ width: width + 'px', height: height + 'px' }">
    <canvas ref="canvasRef"></canvas>
    <div v-if="data.length > 0" class="chart-labels">
      <div 
        v-for="(item, index) in displayData" 
        :key="index" 
        class="label-item"
        :style="{ left: getLabelX(index) + 'px' }"
      >
        <span class="label-value" :style="{ color: colorPalette[index % colorPalette.length] }">{{ item.value }}</span>
        <span class="label-name">{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  data: { type: Array, default: () => [] },
  width: { type: Number, default: 400 },
  height: { type: Number, default: 240 },
  color: { type: String, default: '#00E5FF' },
  backgroundColor: { type: String, default: 'transparent' },
  showAnimation: { type: Boolean, default: true }
})

const containerRef = ref(null)
const canvasRef = ref(null)

let scene, camera, renderer, bars = [], particles = [], glowLines = []
let animationId = null

const colorPalette = [
  '#00E5FF', '#409EFF', '#9B59B6', '#10AC84', '#F59E0B',
  '#FF3366', '#00E5FF', '#409EFF', '#9B59B6', '#10AC84'
]

const displayData = computed(() => {
  if (props.data.length === 0) {
    return [
      { name: '北京', value: 160 }, { name: '天津', value: 145 },
      { name: '河北', value: 130 }, { name: '山西', value: 120 },
      { name: '内蒙古', value: 115 }, { name: '辽宁', value: 110 },
      { name: '吉林', value: 105 }, { name: '黑龙江', value: 100 },
      { name: '上海', value: 95 }, { name: '江苏', value: 90 }
    ]
  }
  return props.data.slice(0, 10).map((d, i) => ({
    name: d.provinceName || d.name || `数据${i + 1}`,
    value: d.count || d.value || 0
  }))
})

const maxValue = computed(() => {
  const values = displayData.value.map(d => d.value)
  return Math.max(...values, 1)
})

function getLabelX(index) {
  const total = displayData.value.length
  const spacing = props.width / (total + 1)
  return spacing * (index + 1) - 40
}

function initScene() {
  if (!canvasRef.value) return
  
  scene = new THREE.Scene()
  
  const aspect = props.width / props.height
  camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 1000)
  camera.position.set(0, 18, 35)
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
  addFloor()
  createBars()
  createParticles()
  createGlowLines()
  
  animate()
}

function addLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0)
  directionalLight.position.set(18, 35, 25)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 80
  directionalLight.shadow.camera.left = -20
  directionalLight.shadow.camera.right = 20
  directionalLight.shadow.camera.top = 20
  directionalLight.shadow.camera.bottom = -20
  scene.add(directionalLight)
  
  const fillLight = new THREE.DirectionalLight(0x00E5FF, 0.8)
  fillLight.position.set(-15, 25, -20)
  scene.add(fillLight)
  
  const rimLight = new THREE.DirectionalLight(0x9B59B6, 0.5)
  rimLight.position.set(0, 30, -25)
  scene.add(rimLight)
  
  const pointLight1 = new THREE.PointLight(0x00E5FF, 1.2, 50)
  pointLight1.position.set(-8, 15, 10)
  scene.add(pointLight1)
  
  const pointLight2 = new THREE.PointLight(0x9B59B6, 1.0, 50)
  pointLight2.position.set(8, 12, -10)
  scene.add(pointLight2)
  
  const pointLight3 = new THREE.PointLight(0x409EFF, 0.6, 40)
  pointLight3.position.set(0, 22, 8)
  scene.add(pointLight3)
}

function addFloor() {
  const floorGeometry = new THREE.PlaneGeometry(50, 35)
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a1931,
    roughness: 0.5,
    metalness: 0.4,
    transparent: true,
    opacity: 0.7
  })
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.01
  floor.receiveShadow = true
  scene.add(floor)
  
  const gridHelper = new THREE.GridHelper(50, 50, 0x00E5FF, 0x1a365d)
  gridHelper.position.y = 0.01
  gridHelper.material.opacity = 0.4
  gridHelper.material.transparent = true
  scene.add(gridHelper)
  
  const edgeGeometry = new THREE.BoxGeometry(50, 0.2, 35)
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x00E5FF,
    roughness: 0.05,
    metalness: 0.95,
    emissive: 0x00E5FF,
    emissiveIntensity: 0.5
  })
  const edge = new THREE.Mesh(edgeGeometry, edgeMaterial)
  edge.position.y = 0.1
  edge.castShadow = true
  scene.add(edge)
}

function createBars() {
  disposeBars()
  
  const data = displayData.value
  const total = data.length
  const maxVal = maxValue.value
  const spacing = 3.2
  const startX = -(total - 1) * spacing / 2
  
  data.forEach((item, index) => {
    const barHeight = Math.max((item.value / maxVal) * 22, 3.5)
    const barWidth = 3.0
    const barDepth = 3.0
    
    const geometry = new THREE.BoxGeometry(barWidth, barHeight, barDepth)
    
    const baseColor = new THREE.Color(colorPalette[index % colorPalette.length])
    const topColor = baseColor.clone().multiplyScalar(1.6).add(new THREE.Color(0x222222))
    const bottomColor = baseColor.clone().multiplyScalar(0.35)
    
    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.15,
      metalness: 0.9,
      emissive: baseColor,
      emissiveIntensity: 0.5
    })
    
    const bar = new THREE.Mesh(geometry, material)
    bar.position.set(
      startX + index * spacing,
      barHeight / 2,
      0
    )
    bar.castShadow = true
    bar.receiveShadow = true
    bar.userData = { 
      targetHeight: barHeight, 
      currentHeight: 0,
      color: baseColor,
      topColor,
      bottomColor,
      value: item.value,
      pulsePhase: index * 0.4
    }
    
    const topGeometry = new THREE.BoxGeometry(barWidth + 0.25, 0.3, barDepth + 0.25)
    const topMaterial = new THREE.MeshStandardMaterial({
      color: topColor,
      roughness: 0.02,
      metalness: 0.98,
      emissive: topColor,
      emissiveIntensity: 0.85
    })
    const top = new THREE.Mesh(topGeometry, topMaterial)
    top.position.set(0, barHeight / 2 + 0.15, 0)
    top.castShadow = true
    bar.add(top)
    
    const glowGeometry = new THREE.BoxGeometry(barWidth + 0.6, barHeight + 0.5, barDepth + 0.6)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.15,
      wireframe: false
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.position.set(0, barHeight / 2, 0)
    bar.add(glow)
    
    const innerGlowGeometry = new THREE.BoxGeometry(barWidth + 0.35, barHeight + 0.3, barDepth + 0.35)
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.1,
      wireframe: false
    })
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial)
    innerGlow.position.set(0, barHeight / 2, 0)
    bar.add(innerGlow)
    
    const edgeGeometry = new THREE.BoxGeometry(barWidth + 0.15, barHeight + 0.25, barDepth + 0.15)
    const edgeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.55,
      wireframe: true
    })
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial)
    edge.position.set(0, barHeight / 2, 0)
    bar.add(edge)
    
    bars.push(bar)
    scene.add(bar)
    
    if (!props.showAnimation) {
      bar.userData.currentHeight = barHeight
    }
  })
}

function createParticles() {
  disposeParticles()
  
  const particleCount = 150
  const geometry = new THREE.BufferGeometry()
  const positions = []
  const colors = []
  const sizes = []
  
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2
    const radius = 4 + Math.random() * 10
    const height = Math.random() * 20
    positions.push(Math.cos(angle) * radius, height, Math.sin(angle) * radius)
    
    const colorIndex = Math.floor(Math.random() * colorPalette.length)
    const color = new THREE.Color(colorPalette[colorIndex])
    colors.push(color.r, color.g, color.b)
    sizes.push(0.08 + Math.random() * 0.1)
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))
  
  const material = new THREE.PointsMaterial({
    size: 0.2,
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

function createGlowLines() {
  disposeGlowLines()
  
  const lineCount = 10
  for (let i = 0; i < lineCount; i++) {
    const points = []
    points.push(new THREE.Vector3(-15 + i * 3.5, 0, -12))
    points.push(new THREE.Vector3(-15 + i * 3.5, 25, -12))
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: 0x00E5FF,
      transparent: true,
      opacity: 0.1,
      linewidth: 1
    })
    
    const line = new THREE.Line(geometry, material)
    line.userData = { offset: i * 0.4 }
    glowLines.push(line)
    scene.add(line)
  }
}

function disposeBars() {
  bars.forEach(bar => {
    bar.children.forEach(child => {
      child.geometry.dispose()
      child.material.dispose()
    })
    bar.geometry.dispose()
    bar.material.dispose()
    scene.remove(bar)
  })
  bars = []
}

function disposeParticles() {
  particles.forEach(particle => {
    particle.material.dispose()
    particle.geometry.dispose()
    scene.remove(particle)
  })
  particles = []
}

function disposeGlowLines() {
  glowLines.forEach(line => {
    line.geometry.dispose()
    line.material.dispose()
    scene.remove(line)
  })
  glowLines = []
}

function animate() {
  animationId = requestAnimationFrame(animate)
  
  const time = Date.now() * 0.001
  
  bars.forEach((bar, index) => {
    if (props.showAnimation && bar.userData.currentHeight < bar.userData.targetHeight) {
      bar.userData.currentHeight += (bar.userData.targetHeight - bar.userData.currentHeight) * 0.07
      
      const scaleY = bar.userData.currentHeight / bar.userData.targetHeight
      bar.scale.y = scaleY
      bar.position.y = bar.userData.currentHeight / 2
      
      bar.children[0].position.y = bar.userData.currentHeight / 2 + 0.15
      bar.children[1].position.y = bar.userData.currentHeight / 2
      bar.children[2].position.y = bar.userData.currentHeight / 2
      bar.children[3].position.y = bar.userData.currentHeight / 2
      
      const progress = bar.userData.currentHeight / bar.userData.targetHeight
      const currentColor = new THREE.Color().lerpColors(
        bar.userData.bottomColor,
        bar.userData.topColor,
        progress
      )
      bar.material.color.copy(currentColor)
      bar.material.emissive.copy(currentColor)
    }
    
    bar.rotation.y = Math.sin(time + bar.userData.pulsePhase) * 0.012
    
    const pulseIntensity = 0.5 + Math.sin(time * 2.5 + bar.userData.pulsePhase) * 0.25
    bar.material.emissiveIntensity = pulseIntensity
    bar.children[0].material.emissiveIntensity = 0.85 + Math.sin(time * 2.5 + bar.userData.pulsePhase) * 0.35
    
    if (bar.children[1]) {
      bar.children[1].material.opacity = 0.12 + Math.sin(time * 1.5 + bar.userData.pulsePhase) * 0.08
    }
    if (bar.children[2]) {
      bar.children[2].material.opacity = 0.08 + Math.sin(time * 1.2 + bar.userData.pulsePhase) * 0.05
    }
    if (bar.children[3]) {
      bar.children[3].material.opacity = 0.5 + Math.sin(time * 2 + bar.userData.pulsePhase) * 0.18
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
    particle.rotation.y += 0.002
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

watch(() => props.data, () => {
  createBars()
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
  disposeBars()
  disposeParticles()
  disposeGlowLines()
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<style scoped>
.three-bar-chart {
  position: relative;
  width: 100%;
  height: 100%;
}

.three-bar-chart canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.chart-labels {
  position: absolute;
  bottom: 2px;
  left: 0;
  right: 0;
  height: 60px;
  pointer-events: none;
}

.label-item {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.label-value {
  font-size: 28px;
  font-weight: 700;
  color: #FFFFFF;
  font-family: 'DIN Alternate', 'SF Mono', monospace;
  text-shadow: 
    0 0 20px currentColor, 
    0 0 40px currentColor,
    0 0 60px rgba(0,0,0,0.5);
  letter-spacing: 1px;
  line-height: 1.2;
}

.label-name {
  font-size: 12px;
  color: rgba(138, 158, 188, 0.9);
  white-space: nowrap;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}
</style>