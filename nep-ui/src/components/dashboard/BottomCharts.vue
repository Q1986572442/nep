<template>
  <div class="bc" ref="containerRef">
    <div class="bc-row">
      <div class="bc-card bc-card-ring">
        <div class="card-glow"></div>
        <div class="card-border"></div>
        <h5><i></i>污染热点分布 <span>// HOTSPOT DISTRIBUTION</span></h5>
        <div class="bc-pie-w">
          <ThreeRingChart 
            :value="completionRate" 
            :data="feedbackData" 
            :width="cardWidth" 
            :height="220" 
          />
        </div>
      </div>
      <div class="bc-card bc-card-bar">
        <div class="card-glow"></div>
        <div class="card-border"></div>
        <h5><i></i>城市AQI柱群 <span>// CITY AQI BARS</span></h5>
        <div class="bc-bar-w">
          <span class="bc-fv">{{ centerVal }}</span>
          <ThreeBarChart 
            :data="provinceData" 
            :width="cardWidth" 
            :height="220" 
          />
        </div>
      </div>
      <div class="bc-card bc-card-pie">
        <div class="card-glow"></div>
        <div class="card-border"></div>
        <h5><i></i>反馈状态分布 <span>// STATUS DISTRIBUTION</span></h5>
        <div class="bc-pie-w">
          <ThreePieChart 
            :data="feedbackData" 
            :width="cardWidth" 
            :height="220" 
            :center-value="centerVal" 
          />
        </div>
      </div>
    </div>

    <div class="bc-row">
      <div class="bc-card bc-card-bar bc-card-month">
        <div class="card-glow"></div>
        <div class="card-border"></div>
        <h5><i></i>月度反馈统计 <span>// MONTHLY TREND</span></h5>
        <ThreeBarChart 
          :data="monthlyData" 
          :width="cardWidth" 
          :height="220" 
        />
      </div>
      <div class="bc-card bc-card-bar bc-card-province">
        <div class="card-glow"></div>
        <div class="card-border"></div>
        <h5><i></i>各省份反馈统计 <span>// PROVINCE STATS</span></h5>
        <ThreeBarChart 
          :data="provinceData" 
          :width="cardWidth" 
          :height="220" 
        />
      </div>
      <div class="bc-card bc-card-bar bc-card-pollutant">
        <div class="card-glow"></div>
        <div class="card-border"></div>
        <h5><i></i>污染物超标累计 <span>// POLLUTANT EXCEEDANCE</span></h5>
        <ThreeStackedBarChart 
          :data="pollutantData" 
          :width="cardWidth" 
          :height="220" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { getFeedbackStatus, getProvinceFeedback, getMonthlyTrend, getProvincePollutantExceed } from '@/api/statistics'
import ThreeBarChart from './ThreeBarChart.vue'
import ThreeRingChart from './ThreeRingChart.vue'
import ThreePieChart from './ThreePieChart.vue'
import ThreeStackedBarChart from './ThreeStackedBarChart.vue'

const containerRef = ref(null)
const centerVal = ref('2307')
const cardWidth = ref(380)

const completionRate = ref(75)
const feedbackData = ref({})
const provinceData = ref([])
const monthlyData = ref([])
const pollutantData = ref([])

let resizeTimeout = null

const C = {
  cyan: '#00E5FF',
  blue: '#409EFF',
  green: '#10AC84',
  orange: '#F59E0B',
  red: '#FF3366',
  purple: '#9B59B6',
  text: '#8A9EBC',
  sub: '#546A85'
}

function updateCardWidth() {
  if (containerRef.value) {
    const containerWidth = containerRef.value.offsetWidth
    cardWidth.value = Math.floor((containerWidth - 40) / 3)
  }
}

function debounceResize() {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  resizeTimeout = setTimeout(updateCardWidth, 100)
}

async function fetchData() {
  try {
    const [fs, pf, mt, pe] = await Promise.all([
      getFeedbackStatus().catch(() => ({ data: null })),
      getProvinceFeedback().catch(() => ({ data: [] })),
      getMonthlyTrend().catch(() => ({ data: [] })),
      getProvincePollutantExceed().catch(() => ({ data: [] }))
    ])

    const fdata = fs && fs.data ? fs.data : { pending: 0, assigned: 0, completed: 0 }
    const total = fdata.pending + fdata.assigned + fdata.completed
    const rate = total > 0 ? Math.round(fdata.completed / total * 100) : 0
    const pdata = pf && pf.data ? pf.data : []
    const mdata = mt && mt.data ? mt.data : []
    const edata = pe && pe.data ? pe.data : []
    const cityTotal = pdata.reduce((s, d) => s + (d.count || 0), 0)

    completionRate.value = rate
    feedbackData.value = fdata
    provinceData.value = pdata
    monthlyData.value = mdata.map((d, i) => ({ name: d.month || `${i + 1}月`, value: d.count || 0 }))
    pollutantData.value = edata
    centerVal.value = cityTotal > 0 ? cityTotal.toString() : '2307'
  } catch (e) {
    console.error('图表数据加载失败:', e)
    completionRate.value = 75
    feedbackData.value = { pending: 30, assigned: 40, completed: 30 }
    provinceData.value = []
    monthlyData.value = []
    pollutantData.value = []
    centerVal.value = '2307'
  }
}

onMounted(() => {
  updateCardWidth()
  fetchData()
  window.addEventListener('resize', debounceResize)
})

onUnmounted(() => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  window.removeEventListener('resize', debounceResize)
})
</script>

<style scoped>
.bc {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  min-height: 520px;
  background: radial-gradient(ellipse at top, rgba(0, 229, 255, 0.03) 0%, transparent 50%),
              radial-gradient(ellipse at bottom, rgba(155, 89, 182, 0.03) 0%, transparent 50%);
}

.bc-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.bc-card {
  position: relative;
  background: linear-gradient(135deg, rgba(10, 25, 49, 0.9) 0%, rgba(26, 45, 75, 0.75) 50%, rgba(10, 25, 49, 0.85) 100%);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border-radius: 18px;
  padding: 24px 26px;
  overflow: hidden;
  min-height: 300px;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 30%, rgba(0, 229, 255, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(155, 89, 182, 0.1) 0%, transparent 50%);
  pointer-events: none;
  transition: opacity 0.4s;
}

.card-border {
  position: absolute;
  inset: 1px;
  border-radius: 15px;
  border: 1px solid transparent;
  background: linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(155, 89, 182, 0.1) 100%) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  transition: opacity 0.4s;
}

.bc-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(0, 229, 255, 0.6) 20%, 
    rgba(155, 89, 182, 0.6) 50%, 
    rgba(0, 229, 255, 0.6) 80%, 
    transparent 100%);
}

.bc-card::after {
  content: '';
  position: absolute;
  top: 12px;
  left: 12px;
  width: 14px;
  height: 14px;
  border-top: 2px solid rgba(0, 229, 255, 0.6);
  border-left: 2px solid rgba(0, 229, 255, 0.6);
  border-radius: 3px 0 0 0;
}

.bc-card:hover {
  transform: translateY(-8px) scale(1.015);
  box-shadow:
    0 0 80px rgba(0, 229, 255, 0.2),
    0 0 120px rgba(155, 89, 182, 0.1),
    0 25px 50px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.bc-card:hover .card-glow {
  opacity: 1;
}

.bc-card-ring {
  border: 1px solid rgba(0, 229, 255, 0.15);
}

.bc-card-ring .card-glow {
  background: radial-gradient(circle at 30% 30%, rgba(0, 229, 255, 0.2) 0%, transparent 50%);
}

.bc-card-bar {
  border: 1px solid rgba(64, 158, 255, 0.15);
}

.bc-card-bar .card-glow {
  background: radial-gradient(circle at 30% 30%, rgba(64, 158, 255, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(0, 229, 255, 0.1) 0%, transparent 50%);
}

.bc-card-pie {
  border: 1px solid rgba(16, 172, 132, 0.15);
}

.bc-card-pie .card-glow {
  background: radial-gradient(circle at 30% 30%, rgba(16, 172, 132, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(0, 229, 255, 0.1) 0%, transparent 50%);
}

.bc-card-month {
  border-color: rgba(64, 158, 255, 0.2);
}

.bc-card-province {
  border-color: rgba(0, 229, 255, 0.2);
}

.bc-card-pollutant {
  border-color: rgba(155, 89, 182, 0.2);
}

.bc-card-pollutant .card-glow {
  background: radial-gradient(circle at 30% 30%, rgba(155, 89, 182, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(245, 158, 11, 0.1) 0%, transparent 50%);
}

.bc-card h5 {
  font-size: 15px;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0 0 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
  z-index: 2;
  letter-spacing: 1px;
}

.bc-card h5 i {
  display: inline-block;
  width: 4px;
  height: 20px;
  background: linear-gradient(180deg, #00E5FF 0%, #9B59B6 100%);
  border-radius: 2px;
  box-shadow: 
    0 0 15px rgba(0, 229, 255, 0.8),
    0 0 30px rgba(0, 229, 255, 0.4),
    inset 0 0 8px rgba(255, 255, 255, 0.3);
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { 
    box-shadow: 
      0 0 15px rgba(0, 229, 255, 0.8),
      0 0 30px rgba(0, 229, 255, 0.4),
      inset 0 0 8px rgba(255, 255, 255, 0.3);
  }
  50% { 
    box-shadow: 
      0 0 25px rgba(0, 229, 255, 1), 
      0 0 45px rgba(155, 89, 182, 0.6),
      inset 0 0 12px rgba(255, 255, 255, 0.5);
  }
}

.bc-card h5 span {
  font-size: 11px;
  font-weight: 500;
  color: rgba(138, 158, 188, 0.6);
  letter-spacing: 3px;
  margin-left: 6px;
  text-transform: uppercase;
  font-family: 'DIN Alternate', 'SF Mono', monospace;
}

.bc-pie-w {
  position: relative;
  height: 220px;
  width: 100%;
}

.bc-bar-w {
  position: relative;
  height: 220px;
  width: 100%;
}

.bc-fv {
  position: absolute;
  top: 8px;
  left: 16px;
  font-size: 22px;
  font-weight: 700;
  color: #F59E0B;
  font-family: 'DIN Alternate', 'SF Mono', monospace;
  text-shadow: 0 0 15px rgba(245, 158, 11, 0.7), 0 0 30px rgba(245, 158, 11, 0.3);
  z-index: 5;
  letter-spacing: 1px;
}

@media(max-width: 1400px) {
  .bc-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media(max-width: 900px) {
  .bc-row {
    grid-template-columns: 1fr;
  }
  
  .bc-card {
    min-height: 280px;
  }
}
</style>