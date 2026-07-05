<template>
  <div ref="containerRef" class="three-stacked-bar-chart" :style="{ width: width + 'px', height: height + 'px' }">
    <canvas ref="canvasRef"></canvas>
    <div class="legend">
      <div v-for="(item, index) in legendItems" :key="index" class="legend-item">
        <span class="legend-dot" :style="{ backgroundColor: item.color, boxShadow: `0 0 15px ${item.color}` }"></span>
        <span class="legend-text">{{ item.name }}</span>
        <span class="legend-color-label">{{ item.label }}</span>
      </div>
    </div>
    <div v-if="displayData.length > 0" class="chart-labels">
      <div 
        v-for="(item, index) in displayData" 
        :key="index" 
        class="label-item"
        :style="{ left: getLabelX(index) + 'px' }"
      >
        <span class="label-value">{{ item.total }}</span>
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
  showAnimation: { type: Boolean, default: true }
})

const containerRef = ref(null)
const canvasRef = ref(null)

let scene, camera, renderer, bars = [], particles = []
let animationId = null

const legendItems = [
  { name: 'SO₂', color: '#F59E0B', label: '二氧化硫' },
  { name: 'CO', color: '#FF3366', label: '一氧化碳' },
  { name: 'PM2.5', color: '#9B59B6', label: '颗粒物' }
]

const displayData = computed(() => {
  if (props.data.filter(d => d.provinceName).length === 0) {
    return [
      { name: '北京', so2: 25, co: 18, pm25: 32 },
      { name: '天津', so2: 20, co: 15, pm25: 28 },
      { name: '河北', so2: 35, co: 25, pm25: 42 },
      { name: '山西', so2: 28, co: 20, pm25: 35 },
      { name: '内蒙古', so2: 15, co: 12, pm25: 20 },
      { name: '辽宁', so2: 22, co: 18, pm25: 30 },
      { name: '吉林', so2: 18, co: 14, pm25: 22 },
      { name: '黑龙江', so2: 16, co: 12, pm25: 20 }
    ].map(d => ({ ...d, total: d.so2 + d.co + d.pm25 }))
  }
  return props.data.filter(d => d.provinceName).slice(0, 8).map(d => ({
    name: d.provinceName,
    so2: Number(d.so2Exceed) || 0,
    co: Number(d.coExceed) || 0,
    pm25: Number(d.pm25Exceed) || 0
  })).map(d => ({ ...d, total: d.so2 + d.co + d.pm25 }))
})

const maxValue = computed(() => {
  const totals = displayData.value.map(d => d.total)
  return Math.max(...totals, 1)
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
  camera.position.set(0, 16, 35)
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
  createStackedBars()
  createParticles()
  
  animate()
}

function addLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5)
  directionalLight.position.set(20, 35, 30)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 100
  directionalLight.shadow.camera.left = -25
  directionalLight.shadow.camera.right = 25
  directionalLight.shadow.camera.top = 25
  directionalLight.shadow.camera.bottom = -25
  scene.add(directionalLight)
  
  const fillLight = new THREE.DirectionalLight(0x9B59B6, 1.0)
  fillLight.position.set(-18, 25, -25)
  scene.add(fillLight)
  
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.6)
  rimLight.position.set(0, 30, -30)
  scene.add(rimLight)
  
  const pointLight1 = new THREE.PointLight(0x9B59B6, 1.4, 60)
  pointLight1.position.set(-10, 15, 12)
  scene.add(pointLight1)
  
  const pointLight2 = new THREE.PointLight(0xFF3366, 1.1, 60)
  pointLight2.position.set(10, 12, -12)
  scene.add(pointLight2)
  
  const pointLight3 = new THREE.PointLight(0xF59E0B, 0.8, 50)
  pointLight3.position.set(0, 20, 10)
  scene.add(pointLight3)
  
  const pointLight4 = new THREE.PointLight(0x00E5FF, 0.6, 45)
  pointLight4.position.set(12, 8, 15)
  scene.add(pointLight4)
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
  
  const gridHelper = new THREE.GridHelper(50, 50, 0x9B59B6, 0x1a365d)
  gridHelper.position.y = 0.01
  gridHelper.material.opacity = 0.4
  gridHelper.material.transparent = true
  scene.add(gridHelper)
  
  const edgeGeometry = new THREE.BoxGeometry(50, 0.2, 35)
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x9B59B6,
    roughness: 0.05,
    metalness: 0.95,
    emissive: 0x9B59B6,
    emissiveIntensity: 0.5
  })
  const edge = new THREE.Mesh(edgeGeometry, edgeMaterial)
  edge.position.y = 0.1
  edge.castShadow = true
  scene.add(edge)
}

function createStackedBars() {
  disposeBars()
  
  const data = displayData.value
  const total = data.length
  const maxVal = maxValue.value
  const spacing = 3.0
  const startX = -(total - 1) * spacing / 2
  const barWidth = 2.8
  const barDepth = 2.8
  
  const colors = {
    so2: new THREE.Color('#F59E0B'),
    co: new THREE.Color('#FF3366'),
    pm25: new THREE.Color('#9B59B6')
  }
  
  data.forEach((item, index) => {
    let currentY = 0
    
    const stackItems = [
      { value: item.so2, color: colors.so2, name: 'so2' },
      { value: item.co, color: colors.co, name: 'co' },
      { value: item.pm25, color: colors.pm25, name: 'pm25' }
    ]
    
    stackItems.forEach((stackItem, stackIndex) => {
      const segmentHeight = Math.max((stackItem.value / maxVal) * 24, 2.2)
      
      if (segmentHeight > 0) {
        const geometry = new THREE.BoxGeometry(barWidth, segmentHeight, barDepth)
        
        const material = new THREE.MeshStandardMaterial({
          color: stackItem.color,
          roughness: 0.12,
          metalness: 0.95,
          emissive: stackItem.color,
          emissiveIntensity: 0.55
        })
        
        const segment = new THREE.Mesh(geometry, material)
        segment.position.set(
          startX + index * spacing,
          currentY + segmentHeight / 2,
          0
        )
        segment.castShadow = true
        segment.receiveShadow = true
        
        segment.userData = {
          targetHeight: segmentHeight,
          currentHeight: 0,
          color: stackItem.color,
          baseY: currentY,
          pulsePhase: index * 0.4 + stackIndex * 0.25
        }
        
        const topGeometry = new THREE.BoxGeometry(barWidth + 0.25, 0.3, barDepth + 0.25)
        const topMaterial = new THREE.MeshStandardMaterial({
          color: stackItem.color.clone().multiplyScalar(1.6),
          roughness: 0.01,
          metalness: 0.99,
          emissive: stackItem.color,
          emissiveIntensity: 1.0
        })
        const top = new THREE.Mesh(topGeometry, topMaterial)
        top.position.set(0, segmentHeight / 2 + 0.15, 0)
        top.castShadow = true
        segment.add(top)
        
        const glowGeometry = new THREE.BoxGeometry(barWidth + 0.6, segmentHeight + 0.5, barDepth + 0.6)
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: stackItem.color,
          transparent: true,
          opacity: 0.15,
          wireframe: false
        })
        const glow = new THREE.Mesh(glowGeometry, glowMaterial)
        glow.position.set(0, segmentHeight / 2, 0)
        segment.add(glow)
        
        const innerGlowGeometry = new THREE.BoxGeometry(barWidth + 0.4, segmentHeight + 0.35, barDepth + 0.4)
        const innerGlowMaterial = new THREE.MeshBasicMaterial({
          color: stackItem.color,
          transparent: true,
          opacity: 0.1,
          wireframe: false
        })
        const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial)
        innerGlow.position.set(0, segmentHeight / 2, 0)
        segment.add(innerGlow)
        
        const edgeGeometry = new THREE.BoxGeometry(barWidth + 0.15, segmentHeight + 0.25, barDepth + 0.15)
        const edgeMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.6,
          wireframe: true
        })
        const edge = new THREE.Mesh(edgeGeometry, edgeMaterial)
        edge.position.set(0, segmentHeight / 2, 0)
        segment.add(edge)
        
        const cornerGeometry = new THREE.BoxGeometry(0.25, segmentHeight, 0.25)
        const cornerMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.02,
          metalness: 0.98,
          emissive: 0xffffff,
          emissiveIntensity: 0.3
        })
        const corners = [
          { x: -barWidth/2 - 0.12, z: -barDepth/2 - 0.12 },
          { x: barWidth/2 + 0.12, z: -barDepth/2 - 0.12 },
          { x: -barWidth/2 - 0.12, z: barDepth/2 + 0.12 },
          { x: barWidth/2 + 0.12, z: barDepth/2 + 0.12 }
        ]
        corners.forEach(corner => {
          const cornerMesh = new THREE.Mesh(cornerGeometry, cornerMaterial)
          cornerMesh.position.set(corner.x, segmentHeight / 2, corner.z)
          segment.add(cornerMesh)
        })
        
        bars.push(segment)
        scene.add(segment)
        
        currentY += segmentHeight
        
        if (!props.showAnimation) {
          segment.userData.currentHeight = segmentHeight
        }
      }
    })
  })
}

function createParticles() {
  disposeParticles()
  
  const particleCount = 200
  const geometry = new THREE.BufferGeometry()
  const positions = []
  const colors = []
  const sizes = []
  
  const particleColors = ['#F59E0B', '#FF3366', '#9B59B6', '#00E5FF', '#409EFF']
  
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 3 + Math.random() * 10
    const height = Math.random() * 22
    positions.push(Math.cos(angle) * radius, height, Math.sin(angle) * radius)
    
    const color = new THREE.Color(particleColors[i % particleColors.length])
    colors.push(color.r, color.g, color.b)
    sizes.push(0.12 + Math.random() * 0.18)
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))
  
  const material = new THREE.PointsMaterial({
    size: 0.18,
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
  
  const particleSystem2 = new THREE.Points(geometry.clone(), material.clone())
  particleSystem2.userData = {
    basePositions: positions.slice().map((p, i) => p + (Math.random() - 0.5) * 2)
  }
  particles.push(particleSystem2)
  scene.add(particleSystem2)
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

function animate() {
  animationId = requestAnimationFrame(animate)
  
  const time = Date.now() * 0.001
  
  bars.forEach((bar, index) => {
    if (props.showAnimation && bar.userData.currentHeight < bar.userData.targetHeight) {
      bar.userData.currentHeight += (bar.userData.targetHeight - bar.userData.currentHeight) * 0.06
      
      const scaleY = bar.userData.currentHeight / bar.userData.targetHeight
      bar.scale.y = scaleY
      bar.position.y = bar.userData.baseY + bar.userData.currentHeight / 2
      
      if (bar.children[0]) {
        bar.children[0].position.y = bar.userData.currentHeight / 2 + 0.12
      }
      if (bar.children[1]) {
        bar.children[1].position.y = bar.userData.currentHeight / 2
      }
      if (bar.children[2]) {
        bar.children[2].position.y = bar.userData.currentHeight / 2
      }
      if (bar.children[3]) {
        bar.children[3].position.y = bar.userData.currentHeight / 2
      }
    }
    
    bar.rotation.y = Math.sin(time + bar.userData.pulsePhase) * 0.012
    
    const pulseIntensity = 0.45 + Math.sin(time * 2.5 + bar.userData.pulsePhase) * 0.22
    bar.material.emissiveIntensity = pulseIntensity
    if (bar.children[0]) {
      bar.children[0].material.emissiveIntensity = 0.8 + Math.sin(time * 2.5 + bar.userData.pulsePhase) * 0.3
    }
    if (bar.children[1]) {
      bar.children[1].material.opacity = 0.1 + Math.sin(time * 1.5 + bar.userData.pulsePhase) * 0.06
    }
    if (bar.children[2]) {
      bar.children[2].material.opacity = 0.06 + Math.sin(time * 1.2 + bar.userData.pulsePhase) * 0.04
    }
    if (bar.children[3]) {
      bar.children[3].material.opacity = 0.5 + Math.sin(time * 2 + bar.userData.pulsePhase) * 0.15
    }
  })
  
  particles.forEach(particle => {
    const positions = particle.geometry.attributes.position.array
    const basePositions = particle.userData.basePositions
    
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = basePositions[i] + Math.sin(time + i * 0.01) * 0.45
      positions[i + 1] = basePositions[i + 1] + Math.sin(time * 0.6 + i * 0.01) * 0.35
      positions[i + 2] = basePositions[i + 2] + Math.cos(time * 0.4 + i * 0.01) * 0.45
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
  createStackedBars()
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
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<style scoped>
.three-stacked-bar-chart {
  position: relative;
  width: 100%;
  height: 100%;
}

.three-stacked-bar-chart canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.legend {
  position: absolute;
  top: 12px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 10;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: rgba(10, 25, 49, 0.85);
  border-radius: 8px;
  border: 1px solid rgba(155, 89, 182, 0.25);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.legend-item:hover {
  background: rgba(155, 89, 182, 0.2);
  border-color: rgba(155, 89, 182, 0.5);
  transform: translateX(-3px);
}

.legend-dot {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  transition: transform 0.3s ease;
}

.legend-item:hover .legend-dot {
  transform: scale(1.3);
}

.legend-text {
  font-size: 13px;
  font-weight: 700;
  color: #FFFFFF;
  font-family: 'DIN Alternate', 'SF Mono', monospace;
  white-space: nowrap;
  letter-spacing: 1px;
}

.legend-color-label {
  font-size: 11px;
  color: rgba(138, 158, 188, 0.85);
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.chart-labels {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  pointer-events: none;
}

.label-item {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.label-value {
  font-size: 32px;
  font-weight: 800;
  color: #FFFFFF;
  font-family: 'DIN Alternate', 'SF Mono', monospace;
  text-shadow: 
    0 0 25px rgba(155, 89, 182, 0.9), 
    0 0 50px rgba(155, 89, 182, 0.5),
    0 0 80px rgba(0,0,0,0.6);
  letter-spacing: 2px;
  line-height: 1.1;
  background: linear-gradient(180deg, #FFFFFF 0%, rgba(138, 158, 188, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.label-name {
  font-size: 13px;
  color: rgba(138, 158, 188, 0.95);
  white-space: nowrap;
  letter-spacing: 1px;
  text-shadow: 
    0 0 10px rgba(0, 229, 255, 0.3),
    0 2px 4px rgba(0,0,0,0.6);
  font-weight: 600;
}
</style>