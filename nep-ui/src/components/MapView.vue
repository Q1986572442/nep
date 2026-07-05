<template>
  <div class="mv" ref="containerRef">
    <div class="mv-bar">
      <div class="mv-bar-l">
        <h3 class="mv-tt">全国污染热点概览</h3>
        <div class="mv-tt-line"></div>
      </div>
      <div class="mv-bar-m">
        <span class="mv-hint">
          <svg class="icon-hint" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          点击省份区域深度探测
        </span>
      </div>
      <div class="mv-bar-r">
        <div class="mv-sel-wrap">
          <el-select v-model="timeRange" size="small" class="mv-sel" @change="refreshMap" popper-class="mv-popper-light">
            <el-option label="今日" value="today" />
            <el-option label="近7天" value="week" />
            <el-option label="当月" value="month" />
          </el-select>
        </div>
        <div class="mv-sel-wrap">
          <el-select v-model="pollutant" size="small" class="mv-sel" @change="refreshMap" popper-class="mv-popper-light">
            <el-option label="综合AQI" value="aqi" />
            <el-option label="PM2.5" value="pm25" />
            <el-option label="PM10" value="pm10" />
            <el-option label="SO₂" value="so2" />
            <el-option label="CO" value="co" />
            <el-option label="O₃" value="o3" />
          </el-select>
        </div>
      </div>
    </div>

    <transition name="fade-slide">
      <div v-if="currentLevel === 'city'" class="mv-back">
        <button class="mv-back-btn" @click="backToChina">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          返回全国 · <span class="fw-500">{{ currentProvinceName }}</span>
        </button>
      </div>
    </transition>

    <div ref="chartRef" class="mv-chart"></div>

    <transition name="fade">
      <div v-if="mapLoading" class="mv-load">
        <div class="mv-load-ring"></div>
        <span>地图构建中...</span>
      </div>
    </transition>

    <transition name="slide-r">
      <div v-if="currentLevel === 'china' && topCities.length > 0" key="top5-panel" class="mv-top5">
        <div class="mv-top5-hd">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="#D17A7A" stroke-width="2" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <span>污染焦点城市</span>
        </div>
        <div
          v-for="(item, idx) in topCities"
          :key="idx"
          class="mv-top5-row"
          @click="focusCity(item)"
        >
          <span class="mv-top5-rk" :class="'rk-' + (idx + 1)">0{{ idx + 1 }}</span>
          <span class="mv-top5-nm">{{ item.cityName }}</span>
          <span class="mv-top5-val" :style="{ color: getAqiColor(item.avgAqi) }">{{ item.avgAqi }}</span>
        </div>
      </div>
    </transition>

    <div class="mv-leg">
      <span class="mv-leg-tt">AQI 质量指示</span>
      <div class="mv-leg-bar">
        <div
          class="mv-leg-grad"
          :style="{ background: 'linear-gradient(90deg, #73C088 0%, #E4C966 25%, #DE9E63 45%, #D17A7A 70%, #A3667B 85%, #7A5261 100%)' }"
        ></div>
      </div>
      <div class="mv-leg-lbls">
        <span v-for="l in aqiLevels" :key="l.label" class="mv-leg-lbl">
          <em :style="{ background: l.color }"></em>
          {{ l.label }}
        </span>
      </div>
    </div>

    <transition name="slide-l">
      <div v-if="currentLevel === 'city'" key="trend-panel" class="mv-trend">
        <div class="mv-trend-hd">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="#718096" stroke-width="2" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          {{ currentProvinceName }} 近7日趋势
        </div>
        <div ref="trendChartRef" class="mv-trend-ch"></div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, markRaw } from 'vue'
import * as echarts from 'echarts'
import { getMapAqi } from '@/api/statistics'

// ====== 瑞士水疗(Swiss Spa)柔和色系 AQI ======
const aqiLevels = [
  { min: 0, max: 50, color: '#73C088', label: '优', range: '0-50' },
  { min: 51, max: 100, color: '#E4C966', label: '良', range: '51-100' },
  { min: 101, max: 150, color: '#DE9E63', label: '轻度', range: '101-150' },
  { min: 151, max: 200, color: '#D17A7A', label: '中度', range: '151-200' },
  { min: 201, max: 300, color: '#A3667B', label: '重度', range: '201-300' },
  { min: 301, max: 9999, color: '#7A5261', label: '严重', range: '>300' }
]
const OFFLINE = '#E2E8F0'

function getAqiColor(v) {
  if (v == null || v < 0) return OFFLINE
  for (let i = 0; i < aqiLevels.length; i++) { if (v <= aqiLevels[i].max) return aqiLevels[i].color }
  return '#7A5261'
}
function getAqiLabel(v) {
  if (v == null || v < 0) return '无数据'
  for (let i = 0; i < aqiLevels.length; i++) { if (v <= aqiLevels[i].max) return aqiLevels[i].label }
  return '严重'
}

// ====== 状态 ======
const containerRef = ref(null)
const chartRef = ref(null), trendChartRef = ref(null)
let chart = null, trendChart = null
const mapLoading = ref(false)
const currentLevel = ref('china')
const currentProvinceName = ref(''), currentProvinceCode = ref('')
const timeRange = ref('week'), pollutant = ref('aqi')
const cityData = ref([]), provinceData = ref([])
const geoCache = {}; let resizeTimer = null

const topCities = computed(() => {
  return cityData.value.filter(c => c.avgAqi != null)
    .sort((a, b) => (b.avgAqi || 0) - (a.avgAqi || 0)).slice(0, 5)
})

const PROV_MAP = {
  '北京':110000,'北京市':110000,'天津':120000,'天津市':120000,
  '河北省':130000,'河北':130000,'山西省':140000,'山西':140000,
  '内蒙古自治区':150000,'内蒙古':150000,'辽宁省':210000,'辽宁':210000,
  '吉林省':220000,'吉林':220000,'黑龙江省':230000,'黑龙江':230000,
  '上海市':310000,'上海':310000,'江苏省':320000,'江苏':320000,
  '浙江省':330000,'浙江':330000,'安徽省':340000,'安徽':340000,
  '福建省':350000,'福建':350000,'江西省':360000,'江西':360000,
  '山东省':370000,'山东':370000,'河南省':410000,'河南':410000,
  '湖北省':420000,'湖北':420000,'湖南省':430000,'湖南':430000,
  '广东省':440000,'广东':440000,'广西壮族自治区':450000,'广西':450000,
  '海南省':460000,'海南':460000,'重庆市':500000,'重庆':500000,
  '四川省':510000,'四川':510000,'贵州省':520000,'贵州':520000,
  '云南省':530000,'云南':530000,'西藏自治区':540000,'西藏':540000,
  '陕西省':610000,'陕西':610000,'甘肃省':620000,'甘肃':620000,
  '青海省':630000,'青海':630000,'宁夏回族自治区':640000,'宁夏':640000,
  '新疆维吾尔自治区':650000,'新疆':650000,
  '台湾省':710000,'台湾':710000,'香港特别行政区':810000,'香港':810000,'澳门特别行政区':820000,'澳门':820000
}

function findAdcode(n) { return PROV_MAP[n] || null }
function matchProvName(n) {
  const s = n.replace(/省|市|自治区|维吾尔自治区|壮族自治区|回族自治区|特别行政区/g, '')
  return [n, s]
}

const CHINA_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json'

async function loadGeo(url) {
  if (geoCache[url]) return geoCache[url]
  const r = await fetch(url)
  if (!r.ok) throw new Error('GeoJSON load failed')
  const j = await r.json()
  geoCache[url] = j
  return j
}

async function fetchData() {
  try {
    const r = await getMapAqi()
    cityData.value = r.data.cities || []
    provinceData.value = r.data.provinces || []
  } catch(e) { cityData.value = []; provinceData.value = [] }
}

async function refreshMap() {
  if (currentLevel.value === 'china') await renderChina()
  else await drillDown(currentProvinceName.value, currentProvinceCode.value)
}

function getCenter(adcode) {
  const m = { 110000:[116.4,39.9],120000:[117.2,39.1],130000:[114.5,38.0],140000:[112.5,37.9],150000:[111.7,40.8],210000:[123.4,41.8],220000:[125.3,43.9],230000:[126.6,45.8],310000:[121.5,31.2],320000:[118.8,32.0],330000:[120.2,30.3],340000:[117.3,31.9],350000:[119.3,26.1],360000:[115.9,28.7],370000:[117.0,36.7],410000:[113.7,34.8],420000:[114.3,30.6],430000:[113.0,28.2],440000:[113.3,23.1],450000:[108.3,22.8],460000:[110.3,20.0],500000:[106.5,29.5],510000:[104.1,30.7],520000:[106.7,26.6],530000:[102.7,25.0],540000:[91.1,29.7],610000:[108.9,34.3],620000:[103.8,36.1],630000:[101.8,36.6],640000:[106.3,38.5],650000:[87.6,43.8] }
  return m[adcode] || [null, null]
}

function focusCity(item) {
  if (!chart) return
  chart.dispatchAction({ type: 'highlight', name: item.cityName })
  setTimeout(() => { chart.dispatchAction({ type: 'downplay', name: item.cityName }) }, 2000)
}

// ====== 渲染中国地图 (完美视觉居中) ======
async function renderChina() {
  if (!chart) return
  mapLoading.value = true
  try {
    const geo = await loadGeo(CHINA_URL)
    echarts.registerMap('china', geo)

    const pm = {}
    provinceData.value.forEach(p => {
      if (p.provinceName) {
        const ns = matchProvName(p.provinceName)
        ns.forEach(n => { pm[n] = { aqi: p.avgAqi, count: p.totalDetections || 0, maxAqi: p.maxAqi } })
      }
    })

    const offline = []
    geo.features.forEach(f => {
      const n = f.properties.name
      if (!pm[n]) {
        let found = false
        Object.keys(pm).forEach(k => { if (k.includes(n) || n.includes(k)) found = true })
        if (!found) offline.push(n)
      }
    })

    const hotspotData = provinceData.value.filter(p => p.avgAqi > 80).slice(0, 8).map(p => {
      const c = getCenter(findAdcode(p.provinceName))
      return { name: p.provinceName, value: [c[0], c[1], p.maxAqi], avgAqi: p.avgAqi }
    }).filter(s => s.value[0] != null)

    chart.setOption(buildChinaOption(pm, offline, hotspotData), true)

    chart.off('click')
    chart.on('click', async params => {
      if (params.componentType === 'series' && currentLevel.value === 'china') {
        const code = findAdcode(params.name)
        if (code) await drillDown(params.name, code)
      }
    })

    currentLevel.value = 'china'
    currentProvinceName.value = ''
  } catch(e) { console.error('渲染失败:', e) }
  finally { mapLoading.value = false }
}

function buildChinaOption(provMap, offline, hotspotData) {
  const dataPoints = Object.keys(provMap).map(name => {
    const info = provMap[name]
    return { name, value: info.aqi != null ? info.aqi : -1, count: info.count, maxAqi: info.maxAqi, hasData: info.aqi != null }
  })
  offline.forEach(name => {
    if (!dataPoints.find(d => d.name === name)) {
      dataPoints.push({ name, value: -1, count: 0, maxAqi: 0, hasData: false })
    }
  })

  return {
    backgroundColor: 'transparent',
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'transparent', borderWidth: 0, padding: 0,
      formatter: params => {
        const d = params.data
        if (!d || !d.hasData || d.value < 0) {
          return `<div class="mv-tip-light"><strong>${params.name}</strong><span class="mv-tip-off">暂无设备或离线</span></div>`
        }
        const c = getAqiColor(d.value)
        return `<div class="mv-tip-light">
                  <strong>${params.name}</strong>
                  <b style="color:${c}">${Math.round(d.value)}</b>
                  <span class="tag" style="background:${c}15;color:${c}">${getAqiLabel(d.value)}</span>
                  <span class="mv-tip-sub">监测频次: ${d.count || 0}</span>
                </div>`
      }
    },
    visualMap: { show: false, type: 'piecewise', pieces: aqiLevels, outOfRange: { color: OFFLINE } },
    geo: [{
      map: 'china', roam: true, 
      // 【关键修复：视觉居中补偿】
      // 将原 50% 往左移至 43% 补偿右侧卡片；往下移至 55% 补偿顶部标题和南海诸岛包围盒
      layoutCenter: ['43%', '55%'], layoutSize: '105%', scaleLimit: { min: 1, max: 6 },
      label: { show: false },
      itemStyle: { 
        areaColor: '#FFFFFF', 
        borderColor: '#DCDFE6', 
        borderWidth: 1.2,
        shadowColor: 'rgba(143, 155, 179, 0.15)',
        shadowBlur: 16,
        shadowOffsetY: 8
      },
      emphasis: { disabled: true },
      zlevel: 0
    }],
    series: [{
      name: 'AQI', type: 'map', map: 'china', geoIndex: 0,
      roam: true, 
      label: { show: false },
      itemStyle: { borderColor: '#E0E5EC', borderWidth: 1 },
      emphasis: {
        label: { show: true, fontSize: 13, color: '#4A5568', fontWeight: 500 },
        itemStyle: { areaColor: '#F0F4F8', borderColor: '#A0AABC', borderWidth: 1.5, shadowColor: 'rgba(0,0,0,0.08)', shadowBlur: 10 }
      },
      data: dataPoints
    }, {
      name: '城市散点', type: 'scatter', coordinateSystem: 'geo', geoIndex: 0,
      data: provinceData.value.filter(p => p.avgAqi != null && p.avgAqi >= 0).slice(0, 30).map(p => {
        const c = getCenter(findAdcode(p.provinceName))
        return { name: p.provinceName, value: [c[0], c[1], p.avgAqi], avgAqi: p.avgAqi }
      }).filter(d => d.value[0] != null),
      symbolSize: v => Math.max(6, Math.min((v[2] || 50) / 5, 14)),
      itemStyle: { color: p => getAqiColor(p.data.avgAqi), opacity: 0.9, borderColor: '#fff', borderWidth: 1.5 },
      zlevel: 2
    }, {
      name: '高污染热点', type: 'effectScatter', coordinateSystem: 'geo', geoIndex: 0,
      data: hotspotData,
      symbolSize: v => Math.min((v[2] || 50) / 2.5, 24),
      showEffectOn: 'render', rippleEffect: { brushType: 'stroke', scale: 2.5, period: 4 },
      itemStyle: { color: p => getAqiColor(p.data.avgAqi), opacity: 0.8 },
      label: { show: true, formatter: '{b}', position: 'top', color: '#4A5568', fontSize: 12, fontWeight: 600, textBorderColor: '#fff', textBorderWidth: 2 },
      zlevel: 3
    }]
  }
}

// ====== 下钻到省 ======
async function drillDown(name, code) {
  if (!chart) return
  mapLoading.value = true
  currentProvinceName.value = name; currentProvinceCode.value = code
  try {
    const url = `https://geo.datav.aliyun.com/areas_v3/bound/${code}_full.json`
    const geo = await loadGeo(url)
    const mapName = 'prov_' + code
    echarts.registerMap(mapName, geo)

    const cm = {}
    cityData.value.forEach(c => {
      if (c.provinceName && matchProvName(c.provinceName).some(n => n === name || name.includes(n) || n.includes(name))) {
        const sn = c.cityName.replace(/市|州|地区|盟|自治州/g, '')
        cm[sn] = { aqi: c.avgAqi, count: c.detectionCount, maxAqi: c.maxAqi }
        cm[c.cityName] = { aqi: c.avgAqi, count: c.detectionCount, maxAqi: c.maxAqi }
      }
    })

    const dp = []
    geo.features.forEach(f => {
      const gn = f.properties.name
      const info = cm[gn] || cm[gn.replace(/市|州|地区|盟|自治州/g, '')]
      dp.push({ name: gn, value: info ? info.aqi : -1, count: info ? info.count : 0, maxAqi: info ? info.maxAqi : 0, hasData: info != null })
    })

    chart.setOption({
      backgroundColor: 'transparent',
      animationDuration: 800, animationEasing: 'cubicOut',
      tooltip: {
        trigger: 'item', backgroundColor: 'transparent', borderWidth: 0, padding: 0,
        formatter: params => {
          const d = params.data
          if (!d || !d.hasData) return `<div class="mv-tip-light"><strong>${params.name}</strong><span class="mv-tip-off">暂无数据</span></div>`
          const c = getAqiColor(d.value)
          return `<div class="mv-tip-light"><strong>${params.name}</strong><b style="color:${c}">${Math.round(d.value)}</b><span>检测: ${d.count||0}次</span></div>`
        }
      },
      visualMap: { show: false, type: 'piecewise', pieces: aqiLevels, outOfRange: { color: OFFLINE } },
      geo: [{
        map: mapName, roam: true, scaleLimit: { min: 1, max: 6 },
        // 【关键修复：下钻地图视觉居中补偿】
        // 省份下钻时，右侧卡片消失，但左侧出现趋势面板，故将其往右侧微调补偿至 55%
        layoutCenter: ['55%', '54%'], layoutSize: '95%',
        label: { show: false },
        itemStyle: { 
          areaColor: '#FFFFFF', borderColor: '#DCDFE6', borderWidth: 1,
          shadowColor: 'rgba(143, 155, 179, 0.12)', shadowBlur: 14, shadowOffsetY: 6
        },
        emphasis: { disabled: true }, zlevel: 0
      }],
      series: [{ 
        type: 'map', map: mapName, geoIndex: 0, 
        label: { show: true, fontSize: 11, color: '#909399' },
        itemStyle: { borderColor: '#E0E5EC', borderWidth: 1, areaColor: 'transparent' },
        emphasis: { label: { show: true, fontSize: 12, color: '#303133', fontWeight: 600 }, itemStyle: { areaColor: '#F0F4F8', borderColor: '#A0AABC' } },
        data: dp
      }, { 
        type: 'scatter', coordinateSystem: 'geo', geoIndex: 0,
        data: dp.filter(d => d.hasData).map(d => {
          const feature = geo.features.find(f => f.properties.name === d.name || f.properties.name.replace(/市|州|地区|盟|自治州/g,'') === d.name)
          const coords = feature?.properties?.center || feature?.properties?.cp || [105, 35]
          return { name: d.name, value: [coords[0], coords[1], d.value], aqi: d.value }
        }),
        symbolSize: v => Math.max(8, Math.min((v[2]||50)/4, 16)),
        label: { show: true, formatter: p => Math.round(p.data.aqi), position: 'inside', color: '#fff', fontSize: 9 },
        itemStyle: { color: p => getAqiColor(p.data.aqi), opacity: 0.95, borderColor: '#fff', borderWidth: 1.5 }, symbol: 'circle', zlevel: 5
      }]
    }, true)

    currentLevel.value = 'city'
    
    for (let attempt = 0; attempt < 8; attempt++) {
      if (trendChartRef.value?.parentNode) break
      await nextTick()
      await new Promise(r => requestAnimationFrame(r))
    }
    setTimeout(() => { if (trendChartRef.value?.parentNode) renderTrend() }, 150)

  } catch(e) { console.error('下钻失败:', e) }
  finally { mapLoading.value = false }
}

async function renderTrend() {
  if (!trendChartRef.value) return
  if (trendChart) { try { trendChart.dispose() } catch(e) {} trendChart = null }
  
  try {
    trendChart = markRaw(echarts.init(trendChartRef.value))
    const days = [], vals = []
    for (let i = 6; i >= 0; i--) { 
      const d = new Date(); d.setDate(d.getDate() - i); 
      days.push(`${d.getMonth()+1}/${d.getDate()}`); 
      vals.push(Math.floor(Math.random()*80+30)) 
    }
    trendChart.setOption({
      backgroundColor: 'transparent', animationDuration: 800,
      grid: { top: 15, right: 10, bottom: 25, left: 30 },
      xAxis: { type:'category', data:days, axisTick:{show:false}, axisLine:{lineStyle:{color:'#E4E7ED'}}, axisLabel:{color:'#909399',fontSize:10} },
      yAxis: { type:'value', splitLine:{lineStyle:{color:'#F2F6FC',type:'dashed'}}, axisLabel:{color:'#909399',fontSize:10} },
      series: [{ 
        type:'line', data:vals, smooth:true, symbol:'circle', symbolSize:6,
        lineStyle:{ width:3, color:'#73C088' },
        areaStyle:{ color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(115,192,136,0.2)'},{offset:1,color:'rgba(115,192,136,0)'}]) },
        itemStyle:{ color:'#73C088', borderColor:'#fff', borderWidth:2 }
      }]
    })
  } catch(e) { console.error('renderTrend failed:', e) }
}

async function backToChina() {
  if (trendChart) { try { trendChart.dispose() } catch(e) {} trendChart = null }
  await renderChina()
}

onMounted(async () => {
  await fetchData()
  if (chartRef.value) {
    chart = markRaw(echarts.init(chartRef.value))
    await renderChina()
    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => { chart?.resize(); trendChart?.resize() }, 150)
    })
  }
})

onUnmounted(() => {
  if (resizeTimer) clearTimeout(resizeTimer)
  if (chart) { chart.dispose(); chart = null }
  if (trendChart) { trendChart.dispose(); trendChart = null }
})
</script>

<style scoped>
/* ====== 容器基础 (瑞士质感浅色基底) ====== */
.mv { 
  position: relative; width: 100%; height: 100%; 
  border-radius: 16px; overflow: hidden; 
  background: #F7F9FC; 
  box-shadow: inset 0 0 40px rgba(0,0,0,0.015);
}

/* ====== 板块1: 顶栏 ====== */
.mv-bar {
  position: absolute; top: 0; left: 0; right: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 28px;
  background: linear-gradient(180deg, rgba(247,249,252,0.95) 30%, rgba(247,249,252,0) 100%);
  pointer-events: none;
}
.mv-bar-l, .mv-bar-m, .mv-bar-r { pointer-events: auto; }
.mv-bar-l { display: flex; align-items: center; gap: 14px; }
.mv-tt { font-size: 18px; font-weight: 600; color: #2C3E50; margin: 0; letter-spacing: 0.5px; }
.mv-tt-line { width: 20px; height: 4px; background: #73C088; border-radius: 2px; }

.mv-bar-m { flex: 1; text-align: center; }
.mv-hint { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #718096; font-weight: 500; background: rgba(255,255,255,0.6); padding: 6px 14px; border-radius: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.icon-hint { color: #A0AABC; }

.mv-bar-r { display: flex; align-items: center; gap: 12px; }
.mv-sel { width: 110px; }
.mv-sel :deep(.el-input__wrapper) {
  background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; 
  box-shadow: 0 2px 6px rgba(0,0,0,0.02); padding: 4px 12px; transition: all 0.25s;
}
.mv-sel :deep(.el-input__wrapper:hover) { border-color: #CBD5E1; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
.mv-sel :deep(.el-input__inner) { color: #4A5568; font-size: 13px; font-weight: 500; }

/* ====== 返回按钮 ====== */
.mv-back { position: absolute; top: 76px; left: 28px; z-index: 20; }
.mv-back-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 22px;
  background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 24px;
  color: #4A5568; font-size: 13px; font-weight: 400; cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.fw-500 { font-weight: 600; color: #2C3E50; }
.mv-back-btn:hover { color: #2C3E50; border-color: #CBD5E1; box-shadow: 0 6px 16px rgba(0,0,0,0.08); transform: translateY(-1px); }

/* ====== 板块2: 地图 ====== */
.mv-chart { width: 100%; height: 100%; position: relative; }
.mv-load {
  position: absolute; inset: 0; z-index: 30; display: flex; flex-direction: column;
  align-items: center; justify-content: center; background: rgba(247,249,252,0.7); backdrop-filter: blur(4px);
}
.mv-load-ring {
  width: 36px; height: 36px; margin-bottom: 16px;
  border: 3px solid #E2E8F0; border-top-color: #73C088; border-radius: 50%;
  animation: mv-spin 0.8s ease-in-out infinite;
}
@keyframes mv-spin { to { transform: rotate(360deg) } }
.mv-load span { color: #718096; font-size: 13px; font-weight: 500; letter-spacing: 1px; }

/* ====== 板块3: 极简卡片组件 ====== */
.mv-top5 {
  position: absolute; top: 76px; right: 28px; z-index: 10;
  padding: 20px; width: 240px;
  background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px);
  border: 1px solid #FFFFFF; border-radius: 16px;
  box-shadow: 0 8px 32px rgba(143, 155, 179, 0.1);
}
.mv-top5-hd { font-size: 14px; font-weight: 600; color: #2C3E50; margin-bottom: 18px; display: flex; align-items: center; gap: 8px; }

.mv-top5-row {
  display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px;
  cursor: default; transition: background 0.3s; margin-bottom: 4px;
}
.mv-top5-row:hover { background: #F7F9FC; }
.mv-top5-rk { font-family: 'SF Mono', monospace; font-weight: 700; font-size: 13px; color: #A0AABC; }
.mv-top5-rk.rk-1 { color: #D17A7A; }
.mv-top5-rk.rk-2 { color: #DE9E63; }
.mv-top5-rk.rk-3 { color: #E4C966; }
.mv-top5-nm { flex: 1; font-size: 14px; color: #4A5568; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mv-top5-val { font-size: 16px; font-weight: 700; font-family: 'SF Mono', monospace; }

/* ====== 板块4: 底部图例 ====== */
.mv-leg {
  position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%); z-index: 10;
  background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(16px);
  border: 1px solid #FFFFFF; border-radius: 20px;
  padding: 14px 28px; display: flex; align-items: center; gap: 24px;
  box-shadow: 0 8px 24px rgba(143, 155, 179, 0.12);
}
.mv-leg-tt { font-size: 13px; font-weight: 600; color: #4A5568; white-space: nowrap; }
.mv-leg-bar { width: 200px; height: 6px; border-radius: 3px; overflow: hidden; }
.mv-leg-grad { width: 100%; height: 100%; }
.mv-leg-lbls { display: flex; gap: 16px; align-items: center; }
.mv-leg-lbl { font-size: 12px; color: #718096; display: flex; align-items: center; gap: 6px; white-space: nowrap; font-weight: 500;}
.mv-leg-lbl em { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }

/* ====== 趋势面板 ====== */
.mv-trend {
  position: absolute; top: 136px; left: 28px; z-index: 10;
  padding: 20px; width: 260px;
  background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px);
  border: 1px solid #FFFFFF; border-radius: 16px;
  box-shadow: 0 8px 32px rgba(143, 155, 179, 0.1);
}
.mv-trend-hd { font-size: 14px; font-weight: 600; color: #2C3E50; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.mv-trend-ch { width: 100%; height: 160px; }

/* 优雅的进出动效 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }
.slide-r-enter-active, .slide-r-leave-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-r-enter-from, .slide-r-leave-to { opacity: 0; transform: translateX(20px); }
.slide-l-enter-active, .slide-l-leave-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-l-enter-from, .slide-l-leave-to { opacity: 0; transform: translateX(-20px); }
</style>

<style>
/* ====== 全局: 纯净浅色 Tooltip ====== */
.mv-tip-light {
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px);
  border: 1px solid #E2E8F0; border-radius: 12px;
  padding: 16px 20px; text-align: center; color: #2C3E50;
  box-shadow: 0 12px 32px rgba(143, 155, 179, 0.15);
}
.mv-tip-light strong { display: block; font-size: 15px; font-weight: 600; margin-bottom: 10px; }
.mv-tip-light b { display: block; font-size: 36px; font-weight: 700; font-family: 'SF Mono', monospace; margin-bottom: 10px; line-height: 1; }
.mv-tip-light .tag { display: inline-block; font-size: 12px; padding: 4px 10px; border-radius: 12px; font-weight: 600; }
.mv-tip-light .mv-tip-off { color: #A0AABC; font-size: 13px; font-style: normal; }
.mv-tip-light .mv-tip-sub { display: block; font-size: 12px; color: #718096; margin-top: 12px; padding-top: 10px; border-top: 1px solid #F1F5F9; }

/* ====== 全局: Element Plus 极简下拉 ====== */
.mv-popper-light { 
  background: #FFFFFF !important; border: 1px solid #E2E8F0 !important; 
  border-radius: 12px !important; box-shadow: 0 12px 32px rgba(143, 155, 179, 0.1) !important; padding: 6px !important; 
}
.mv-popper-light .el-select-dropdown__item { 
  color: #4A5568 !important; font-size: 13px; font-weight: 500; border-radius: 8px; margin: 2px 4px; padding: 8px 16px; transition: all 0.2s; 
}
.mv-popper-light .el-select-dropdown__item.hover,
.mv-popper-light .el-select-dropdown__item:hover { color: #2C3E50 !important; background: #F7F9FC !important; }
.mv-popper-light .el-select-dropdown__item.selected { color: #73C088 !important; background: #F0F9F4 !important; font-weight: 600; }
</style>