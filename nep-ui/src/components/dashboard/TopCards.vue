<template>
  <div class="top-cards-container">
    <div class="container-bg"></div>
    <div class="container-border"></div>
    <div class="cards-wrapper">
      <div v-for="(card, i) in cards" :key="i" class="stat-card" :class="{ 'main-card': i === 3 }" :style="{ '--card-color': card.color }">
        <div class="card-glow"></div>
        <div class="card-inner">
          <div class="card-icon">
            <div class="icon-inner">
              <span class="icon-emoji">{{ card.icon }}</span>
            </div>
            <div class="icon-ring"></div>
          </div>
          <div class="card-number">
            <span class="number-value">{{ card.value }}</span>
          </div>
          <div class="card-label">{{ card.label }}</div>
        </div>
        <div class="card-edge"></div>
        <div class="card-shine"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOverview } from '@/api/statistics'

const cards = ref([
  { value:0, label:'注册监督员', icon:'👤', color:'#00E5FF', glow:'cyan' },
  { value:0, label:'反馈总数', icon:'📊', color:'#409EFF', glow:'blue' },
  { value:0, label:'AQI检测数', icon:'⚡', color:'#F59E0B', glow:'orange' },
  { value:0, label:'覆盖城市', icon:'🌍', color:'#9B59B6', glow:'purple' },
  { value:0, label:'已完成', icon:'✅', color:'#10AC84', glow:'green' },
  { value:0, label:'待处理', icon:'🔔', color:'#FF3366', glow:'red' }
])

onMounted(async function() {
  try {
    var res = await getOverview()
    var d = (res && res.data) ? res.data : {}
    cards.value[0].value = d.totalUsers || 0
    cards.value[1].value = d.totalFeedbacks || 0
    cards.value[2].value = d.totalDetections || 0
    cards.value[3].value = d.totalCities || 0
    cards.value[4].value = d.completedFeedbacks || 0
    cards.value[5].value = d.pendingFeedbacks || 0
  } catch(e) { console.error('TopCards加载失败:', e) }
})
</script>

<style scoped>
.top-cards-container {
  position:relative; 
  padding:20px 24px;
  background:linear-gradient(180deg, rgba(10, 25, 49, 0.95) 0%, rgba(5, 12, 22, 0.9) 100%);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  overflow:hidden;
}

.container-bg {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse at 20% 50%, rgba(0, 229, 255, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 50%, rgba(155, 89, 182, 0.06) 0%, transparent 50%);
}

.container-border {
  position: absolute;
  inset: 1px;
  border: 1px solid transparent;
  background: linear-gradient(135deg, rgba(0, 229, 255, 0.12) 0%, rgba(155, 89, 182, 0.08) 100%) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

.cards-wrapper { 
  display:flex; 
  justify-content:space-between; 
  gap:16px; 
  position:relative; 
  z-index:2; 
}

.stat-card {
  position:relative; 
  flex:1; 
  min-width:115px; 
  height:96px; 
  border-radius:14px;
  background:linear-gradient(135deg, rgba(15,30,54,0.85) 0%, rgba(8,18,35,0.95) 100%);
  border:1px solid rgba(64,158,255,0.15); 
  overflow:hidden; 
  transition:all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stat-card:hover { 
  transform:translateY(-5px) scale(1.02); 
  border-color:rgba(0, 229, 255, 0.4); 
  box-shadow:
    0 0 40px var(--card-color, rgba(0, 229, 255, 0.15)),
    0 15px 35px rgba(0,0,0,0.4);
}

.stat-card.main-card { 
  border:1px solid rgba(155,89,182,0.35); 
  box-shadow:
    0 0 40px rgba(155,89,182,0.2),
    0 10px 25px rgba(0,0,0,0.3);
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 30%, var(--card-color, rgba(0, 229, 255, 0.1)) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
}

.stat-card:hover .card-glow {
  opacity: 1;
}

.card-inner { 
  position:relative; 
  height:100%; 
  display:flex; 
  flex-direction:column; 
  align-items:center; 
  justify-content:center; 
  padding:10px; 
}

.card-icon { 
  position: relative;
  width: 36px; 
  height: 36px; 
  margin-bottom:8px;
}

.icon-inner {
  position: absolute;
  inset: 0;
  border-radius: 50%; 
  background: rgba(255,255,255,0.05); 
  border:1px solid rgba(255,255,255,0.15); 
  display:flex; 
  align-items:center; 
  justify-content:center;
  z-index: 2;
}

.icon-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid transparent;
  background: conic-gradient(from 0deg, var(--card-color, #00E5FF), transparent 30%) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: ringRotate 10s linear infinite;
  opacity: 0.6;
}

@keyframes ringRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.icon-emoji { 
  font-size:16px; 
}

.card-number { 
  position:relative; 
  margin-bottom:4px; 
}

.number-value { 
  font-size:26px; 
  font-weight:700; 
  color:#fff; 
  font-family:'DIN Alternate','SF Mono',monospace;
  text-shadow: 0 0 20px var(--card-color, rgba(0, 229, 255, 0.4));
}

.stat-card.main-card .number-value { 
  font-size:36px; 
}

.card-label { 
  font-size:11px; 
  color:rgba(138, 158, 188, 0.8); 
  text-align:center; 
  letter-spacing:0.3px;
}

.card-edge { 
  position:absolute; 
  top:0; 
  left:0; 
  right:0; 
  height:2px; 
  background:linear-gradient(90deg, transparent, var(--card-color, rgba(0, 229, 255, 0.4)), transparent); 
}

.stat-card.main-card .card-edge { 
  height:3px; 
  background:linear-gradient(90deg, transparent, rgba(155,89,182,0.6), rgba(0,229,255,0.4), transparent); 
}

.card-shine { 
  position:absolute; 
  top:0; 
  left:-100%; 
  width:50%; 
  height:100%; 
  background:linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent); 
  transform:skewX(-20deg); 
  animation:shine 5s infinite; 
}

@keyframes shine { 
  0%{left:-100%} 
  100%{left:200%} 
}

@media(max-width: 1024px) {
  .cards-wrapper {
    flex-wrap: wrap;
  }
  .stat-card {
    min-width: 130px;
  }
}

@media(max-width: 768px) {
  .stat-card {
    min-width: 100px;
    height: 85px;
  }
  .number-value {
    font-size: 20px;
  }
  .stat-card.main-card .number-value {
    font-size: 26px;
  }
}
</style>