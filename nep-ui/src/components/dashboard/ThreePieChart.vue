<template>
  <div ref="containerRef" class="three-pie-chart" :style="{ width: width + 'px', height: height + 'px' }">
    <canvas ref="canvasRef"></canvas>
    <div class="center-value">
      <span class="value-num">{{ centerValue }}</span>
      <span class="value-label">总数</span>
    </div>
    <div class="legend">
      <div v-for="(item, index) in legendData" :key="index" class="legend-item">
        <span class="legend-dot" :style="{ backgroundColor: item.color }"></span>
        <span class="legend-text">{{ item.name }}</span>
        <span class="legend-value">{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as THREE from 'three'

const props = defineProps({
  data: { type: Object, default: () => ({}) },
  width: { type: Number, default: 300 },
  height: { type: Number, default: 240 },
  centerValue: { type: String, default: '2307' }
})

const containerRef = ref(null)
const canvasRef = ref(null)

let scene, camera, renderer, pieSlices = [], particles = []
let animationId = null
let raycaster, mouse

const legendData = computed(() => {
  const data = props.data
  const total = (data.pending || 0) + (data.assigned || 0) + (data.completed || 0) || 100
  return [
    { name: '待处理', value: data.pending || 30, color: '#F59E0B' },
    { name: '处理中', value: data.assigned || 40, color: '#00E5FF' },
    { name: '已完成', value: data.completed || 30, color: '#10AC84' }
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
  renderer.shadowMap.type = THREE.PCFShadowMap
  
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()
  
  addLights()
  createPie()
  createParticles()
  
  animate()
  
  canvasRef.value.addEventListener('mousemove', onMouseMove)
  canvasRef.value.addEventListener('click', onMouseClick)
}

function addLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55)
  scene.add(ambientLight)
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0)
  directionalLight.position.set(10, 10, 15)
  directionalLight.castShadow = true
  scene.add(directionalLight)
  
  const fillLight = new THREE.DirectionalLight(0x409EFF, 0.8)
  fillLight.position.set(-8, 8, -10)
  scene.add(fillLight)
  
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.5)
  rimLight.position.set(0, 15, -10)
  scene.add(rimLight)
  
  const pointLight1 = new THREE.PointLight(0x00E5FF, 1.2, 50)
  pointLight1.position.set(5, 7, 8)
  scene.add(pointLight1)
  
  const pointLight2 = new THREE.PointLight(0x10AC84, 0.9, 50)
  pointLight2.position.set(-5, 6, -8)
  scene.add(pointLight2)
  
  const pointLight3 = new THREE.PointLight(0x9B59B6, 0.7, 40)
  pointLight3.position.set(0, 10, 6)
  scene.add(pointLight3)
  
  const pointLight4 = new THREE.PointLight(0xF59E0B, 0.5, 35)
  pointLight4.position.set(6, 4, -6)
  scene.add(pointLight4)
}

function createPie() {
  disposePie()
  
  const data = legendData.value
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  let startAngle = 0
  const radius = 3.3
  const thickness = 1.3
  
  data.forEach((item, index) => {
    const sliceAngle = (item.value / total) * Math.PI * 2
    const endAngle = startAngle + sliceAngle
    
    const geometry = createPieSliceGeometry(radius, thickness, startAngle, endAngle)
    
    const baseColor = new THREE.Color(item.color)
    const highlightColor = baseColor.clone().multiplyScalar(1.3)
    
    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.15,
      metalness: 0.85,
      emissive: baseColor,
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide
    })
    
    const slice = new THREE.Mesh(geometry, material)
    slice.position.y = thickness / 2
    
    const midAngle = startAngle + sliceAngle / 2
    const extrudeDistance = 0.5
    slice.position.x = Math.cos(midAngle) * extrudeDistance
    slice.position.z = Math.sin(midAngle) * extrudeDistance
    
    slice.castShadow = true
    slice.receiveShadow = true
    
    slice.userData = {
      index,
      item,
      baseColor,
      highlightColor,
      originalPosition: { x: slice.position.x, y: slice.position.y, z: slice.position.z },
      hoverPosition: { x: slice.position.x + Math.cos(midAngle) * 0.4, y: slice.position.y + 0.4, z: slice.position.z + Math.sin(midAngle) * 0.4 },
      isHovered: false,
      pulsePhase: index * 0.6
    }
    
    const edgeGeometry = new THREE.TorusGeometry(radius * 0.95, 0.06, 4, Math.floor((sliceAngle / (Math.PI * 2)) * 120))
    const edgeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4
    })
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial)
    edge.rotation.x = -Math.PI / 2
    edge.position.y = thickness / 2 + 0.03
    edge.rotation.z = midAngle - sliceAngle / 2
    slice.add(edge)
    
    const innerEdgeGeometry = new THREE.TorusGeometry(radius * 0.3, 0.04, 4, Math.floor((sliceAngle / (Math.PI * 2)) * 60))
    const innerEdgeMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.6
    })
    const innerEdge = new THREE.Mesh(innerEdgeGeometry, innerEdgeMaterial)
    innerEdge.rotation.x = -Math.PI / 2
    innerEdge.position.y = thickness / 2 + 0.02
    innerEdge.rotation.z = midAngle - sliceAngle / 2
    slice.add(innerEdge)
    
    pieSlices.push(slice)
    scene.add(slice)
    
    startAngle = endAngle
  })
  
  const innerGeometry = new THREE.CylinderGeometry(radius - 1.3, radius - 1.3, thickness + 0.25, 96)
  const innerMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a1931,
    roughness: 0.2,
    metalness: 0.9,
    transparent: true,
    opacity: 0.98
  })
  const inner = new THREE.Mesh(innerGeometry, innerMaterial)
  inner.position.y = thickness / 2
  inner.castShadow = true
  pieSlices.push(inner)
  scene.add(inner)
  
  const innerTopGeometry = new THREE.CylinderGeometry(radius - 1.0, radius - 1.5, 0.2, 96)
  const innerTopMaterial = new THREE.MeshStandardMaterial({
    color: 0x00E5FF,
    roughness: 0.05,
    metalness: 0.95,
    emissive: 0x00E5FF,
    emissiveIntensity: 0.6
  })
  const innerTop = new THREE.Mesh(innerTopGeometry, innerTopMaterial)
  innerTop.position.y = thickness / 2 + 0.2
  innerTop.castShadow = true
  pieSlices.push(innerTop)
  scene.add(innerTop)
  
  const centerGlowGeometry = new THREE.SphereGeometry(radius - 1.6, 64, 64)
  const centerGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0x00E5FF,
    transparent: true,
    opacity: 0.06
  })
  const centerGlow = new THREE.Mesh(centerGlowGeometry, centerGlowMaterial)
  centerGlow.position.y = thickness / 2
  pieSlices.push(centerGlow)
  scene.add(centerGlow)
}

function createPieSliceGeometry(radius, thickness, startAngle, endAngle) {
  const shape = new THREE.Shape()
  
  shape.moveTo(0, 0)
  shape.arc(0, 0, radius, startAngle, endAngle)
  shape.lineTo(0, 0)
  
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelSegments: 4
  })
  
  return geometry
}

function createParticles() {
  disposeParticles()
  
  const particleCount = 120
  const geometry = new THREE.BufferGeometry()
  const positions = []
  const colors = []
  
  const data = legendData.value
  
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 2.2 + Math.random() * 4
    const height = Math.random() * 4
    positions.push(Math.cos(angle) * radius, height, Math.sin(angle) * radius)
    
    const color = new THREE.Color(data[i % data.length].color)
    colors.push(color.r, color.g, color.b)
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  
  const material = new THREE.PointsMaterial({
    size: 0.1,
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

function disposePie() {
  pieSlices.forEach(slice => {
    slice.children.forEach(child => {
      child.geometry.dispose()
      child.material.dispose()
    })
    slice.material.dispose()
    slice.geometry.dispose()
    scene.remove(slice)
  })
  pieSlices = []
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
  
  pieSlices.forEach((slice, index) => {
    if (index < pieSlices.length - 3) {
      if (slice.userData.isHovered) {
        slice.position.x += (slice.userData.hoverPosition.x - slice.position.x) * 0.15
        slice.position.y += (slice.userData.hoverPosition.y - slice.position.y) * 0.15
        slice.position.z += (slice.userData.hoverPosition.z - slice.position.z) * 0.15
        slice.material.emissiveIntensity = Math.min(slice.material.emissiveIntensity + 0.03, 0.7)
      } else {
        slice.position.x += (slice.userData.originalPosition.x - slice.position.x) * 0.15
        slice.position.y += (slice.userData.originalPosition.y - slice.position.y) * 0.15
        slice.position.z += (slice.userData.originalPosition.z - slice.position.z) * 0.15
        slice.material.emissiveIntensity = Math.max(slice.material.emissiveIntensity - 0.03, 0.35)
      }
      
      slice.rotation.y += 0.004
      
      if (!slice.userData.isHovered) {
        const pulseScale = 1 + Math.sin(time * 2.5 + slice.userData.pulsePhase) * 0.03
        slice.scale.set(pulseScale, pulseScale, pulseScale)
      }
    }
    if (index === pieSlices.length - 1) {
      const glowScale = 1 + Math.sin(time * 1.8) * 0.12
      slice.scale.set(glowScale, glowScale, glowScale)
      slice.material.opacity = 0.04 + Math.sin(time * 1.8) * 0.02
    }
  })
  
  particles.forEach(particle => {
    const positions = particle.geometry.attributes.position.array
    const basePositions = particle.userData.basePositions
    
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = basePositions[i] + Math.sin(time + i * 0.01) * 0.35
      positions[i + 1] = basePositions[i + 1] + Math.sin(time * 0.6 + i * 0.01) * 0.25
      positions[i + 2] = basePositions[i + 2] + Math.cos(time * 0.4 + i * 0.01) * 0.35
    }
    
    particle.geometry.attributes.position.needsUpdate = true
    particle.rotation.y += 0.002
  })
  
  renderer.render(scene, camera)
}

function onMouseMove(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  
  raycaster.setFromCamera(mouse, camera)
  
  pieSlices.forEach((slice, index) => {
    if (index < pieSlices.length - 3) {
      const intersects = raycaster.intersectObject(slice)
      slice.userData.isHovered = intersects.length > 0
    }
  })
}

function onMouseClick(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  
  raycaster.setFromCamera(mouse, camera)
  
  pieSlices.forEach((slice, index) => {
    if (index < pieSlices.length - 3) {
      const intersects = raycaster.intersectObject(slice)
      if (intersects.length > 0) {
        console.log('Clicked:', slice.userData.item.name)
      }
    }
  })
}

function handleResize() {
  if (!camera || !renderer) return
  const aspect = props.width / props.height
  camera.aspect = aspect
  camera.updateProjectionMatrix()
  renderer.setSize(props.width, props.height)
}

watch(() => props.data, () => {
  createPie()
  createParticles()
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
  if (canvasRef.value) {
    canvasRef.value.removeEventListener('mousemove', onMouseMove)
    canvasRef.value.removeEventListener('click', onMouseClick)
  }
  disposePie()
  disposeParticles()
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<style scoped>
.three-pie-chart {
  position: relative;
  width: 100%;
  height: 100%;
}

.three-pie-chart canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.center-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  pointer-events: none;
}

.value-num {
  font-size: 48px;
  font-weight: 800;
  color: #FFFFFF;
  font-family: 'DIN Alternate', 'SF Mono', monospace;
  text-shadow: 
    0 0 35px rgba(0, 229, 255, 1), 
    0 0 70px rgba(0, 229, 255, 0.6),
    0 0 100px rgba(0, 229, 255, 0.4);
  letter-spacing: 5px;
  line-height: 1.1;
  background: linear-gradient(180deg, #FFFFFF 0%, rgba(0, 229, 255, 0.8) 50%, rgba(138, 158, 188, 0.6) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.value-label {
  font-size: 15px;
  font-weight: 700;
  color: rgba(0, 229, 255, 0.85);
  font-family: 'DIN Alternate', 'SF Mono', monospace;
  letter-spacing: 3px;
  text-shadow: 0 0 15px rgba(0, 229, 255, 0.4);
}

.legend {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 22px;
  z-index: 10;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: rgba(10, 25, 49, 0.9);
  border-radius: 8px;
  border: 1px solid rgba(16, 172, 132, 0.2);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.legend-item:hover {
  background: rgba(16, 172, 132, 0.15);
  border-color: rgba(16, 172, 132, 0.5);
  transform: translateY(-2px);
}

.legend-dot {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  box-shadow: 0 0 18px currentColor;
  transition: transform 0.3s ease;
}

.legend-item:hover .legend-dot {
  transform: scale(1.35);
}

.legend-text {
  font-size: 12px;
  color: rgba(138, 158, 188, 0.95);
  white-space: nowrap;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.legend-value {
  font-size: 13px;
  color: #FFFFFF;
  font-weight: 700;
  font-family: 'DIN Alternate', 'SF Mono', monospace;
  letter-spacing: 1px;
  text-shadow: 0 0 12px rgba(16, 172, 132, 0.5);
}
</style>