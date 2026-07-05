<template>
  <div class="dash">
    <div class="grid">
      <div class="card hero">
        <div class="hl">
          <h2 class="h2">{{ greetingText }}</h2>
          <p class="hp">{{ dynamicContent.heroSubtitle }}</p>
          <div class="hbtns">
            <button class="hb primary" @click="router.push(dynamicContent.routeTasks)">
              <svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              {{ dynamicContent.btnInspectText }}
            </button>
            <button class="hb outline" @click="router.push(dynamicContent.routeRecords)">
              <svg class="sys-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              {{ dynamicContent.btnRecordText }}
            </button>
          </div>
        </div>
        <div class="hr">
          <div class="orb">
            <div class="orb-ring r1"></div>
            <div class="orb-ring r2"></div>
            <div class="orb-ring r3"></div>
            <div class="orb-inner">
              <span class="orb-v">{{ aqiData.value }}</span>
              <span class="orb-l">{{ aqiLabelText }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mcol">
        <div class="mcard urgent">
          <div class="urgent-shimmer"></div>
          <div class="urgent-scan"></div>
          <div class="urgent-ring"></div>
          <div class="mhead">
            <span class="micon urg">
              <svg class="icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </span>
            <button class="mbtn" @click="router.push(dynamicContent.routeTasks)">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </button>
          </div>
          <div class="mbody">
            <span class="mval">{{ anim.pending }}</span>
            <span class="mtit">{{ dynamicContent.metric1Title }}</span>
          </div>
        </div>

        <div class="mcard done">
          <div class="done-sparkles">
            <span class="ds s1">✦</span>
            <span class="ds s2">✦</span>
            <span class="ds s3">✦</span>
          </div>
          <div class="mhead">
            <span class="micon don">
              <svg class="icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
          </div>
          <div class="mbody">
            <span class="mval grn">{{ anim.completed }}</span>
            <span class="mtit">{{ dynamicContent.metric2Title }}</span>
          </div>
          <svg class="done-ring" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(16,185,129,0.1)" stroke-width="3" />
            <circle cx="30" cy="30" r="26" fill="none" stroke="#10B981" stroke-width="3" stroke-dasharray="163"
              :stroke-dashoffset="163 - (163 * Math.min(metricsData.completed / Math.max(metricsData.pending + metricsData.completed, 1), 1))"
              stroke-linecap="round" transform="rotate(-90 30 30)" class="done-ring-fill" />
          </svg>
        </div>
      </div>

      <div class="card focus">
        <div class="ch">
          <h3>{{ dynamicContent.focusListTitle }}</h3>
          <button class="tbtn" @click="router.push(dynamicContent.routeTasks)">
            {{ dynamicContent.focusListBtnText }}
            <svg class="icon-sm" style="margin-left:4px" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
        <div class="cb" v-if="displayTasks.length === dynamicContent.zeroCount">
          <div class="empty">
            <svg class="empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
            <br />{{ dynamicContent.emptyTaskText }}
          </div>
        </div>
        <div class="cb flist" v-else>
          <div v-for="task in displayTasks" :key="task.id" class="fitem" @click="goToTaskDetail(task)">
            <div class="fi-left" :class="task.levelCode">
              <svg v-if="task.statusCode === 'active'" class="icon-md progress-ring" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(245,158,11,0.15)" stroke-width="2" />
                <circle cx="12" cy="12" r="10" fill="none" stroke="#F59E0B" stroke-width="2" stroke-dasharray="62.8"
                  stroke-dashoffset="31.4" stroke-linecap="round" transform="rotate(-90 12 12)" />
                <text x="12" y="16" text-anchor="middle" fill="#F59E0B" font-size="8" font-weight="700">50%</text>
              </svg>
              <svg v-else class="icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line v-if="['danger', 'warning'].includes(task.levelCode)" x1="12" y1="8" x2="12" y2="12"></line>
                <line v-if="['danger', 'warning'].includes(task.levelCode)" x1="12" y1="16" x2="12.01" y2="16"></line>
                <polyline v-if="task.levelCode === 'info'" points="12 16 12 12 10 12"></polyline>
                <circle v-if="task.levelCode === 'info'" cx="12" cy="8" r="1"></circle>
              </svg>
            </div>
            <div class="finfo">
              <div class="finfo-row primary-text">
                <span class="ft-no">{{ task.taskNo }}</span>
                <span class="ft">{{ task.title }}</span>
              </div>
              <div v-if="task.statusCode === 'active'" class="fprogress-bar-wrap">
                <div class="fprogress-track">
                  <div class="fprogress-fill" style="width:50%"></div>
                </div>
                <span class="fprogress-label">未完成</span>
              </div>
              <div class="finfo-row secondary-text">
                <span class="fd loc">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {{ task.address }}
                </span>
                <span class="fd time">
                  <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {{ task.deadline }}
                </span>
              </div>
            </div>
            <div class="ftag-group">
              <span class="ftag" :class="task.levelCode">{{ task.levelText }}</span>
              <span v-if="task.statusCode === 'active'" class="ftag ftag-unfinished">未完成</span>
              <span v-else-if="task.statusCode === 'pending'" class="ftag ftag-pending">待接受</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card guidelines">
        <div class="ch">
          <h3>{{ dynamicContent.guidelineTitle }}</h3>
        </div>
        <div class="cb glist">

          <div class="gitem">
            <div class="gicon-wrap g-blue">
              <svg class="gicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
            <div class="gtext">
              <span class="gt-title">敏捷响应</span>
              <span class="gt-desc">快速接单，高效触达现场作业</span>
            </div>
          </div>

          <div class="gitem">
            <div class="gicon-wrap g-emerald">
              <svg class="gicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div class="gtext">
              <span class="gt-title">客观严谨</span>
              <span class="gt-desc">如实采集数据，杜绝主观偏差</span>
            </div>
          </div>

          <div class="gitem">
            <div class="gicon-wrap g-indigo">
              <svg class="gicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div class="gtext">
              <span class="gt-title">合规守正</span>
              <span class="gt-desc">严格遵守保密规范与监管协议</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getAssignedToMe, getAssignedStats } from '@/api/feedback'
import { getMyAqiRecords } from '@/api/aqi'

const router = useRouter()
const userStore = useUserStore()

const dynamicContent = ref({
  greetingPrefix: '早安', defaultUserName: '专员', punctuationComma: '，',
  heroSubtitle: '今日各项指标平稳，请继续保持。您可以直接开始巡查，或查阅数据简报。',
  btnInspectText: '开始巡查', btnRecordText: '巡查记录',
  aqiLabelPrefix: 'AQI', metric1Title: '待办任务', metric2Title: '本周已完成',
  focusListTitle: '焦点任务', focusListBtnText: '查看全部',
  guidelineTitle: '网格员工作准则', emptyTaskText: '当前无未完成任务',
  routeTasks: '/nepg/tasks', routeRecords: '/nepg/records',
  zeroCount: 0, sliceLimit: 3
})

const userName = computed(function () { return userStore.user?.realName || dynamicContent.value.defaultUserName })
const greetingText = computed(function () { return dynamicContent.value.greetingPrefix + dynamicContent.value.punctuationComma + userName.value })
const aqiLabelText = computed(function () { return dynamicContent.value.aqiLabelPrefix + ' ' + aqiData.value.status })

const aqiData = ref({ value: 0, status: '--' })
const metricsData = ref({ pending: 0, completed: 0 })
const anim = ref({ pending: 0, completed: 0 })

function aqiStatus(val) {
  if (!val && val !== 0) return '--'
  if (val <= 50) return '优'
  if (val <= 100) return '良'
  if (val <= 150) return '轻度污染'
  if (val <= 200) return '中度污染'
  if (val <= 300) return '重度污染'
  return '严重污染'
}

const rawTasks = ref([])

// 焦点任务过滤优化
const displayTasks = computed(function () {
  let pending = rawTasks.value.filter(t => t.status !== '已完成' && t.status !== '已关闭')
  pending.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return new Date(b.deadline || 0).getTime() - new Date(a.deadline || 0).getTime()
  })
  return pending.slice(0, dynamicContent.value.sliceLimit)
})

// 核心修改点：新增跳转到任务详情的方法，附带 taskId
function goToTaskDetail(task) {
  if (!task || !task.id) return;
  router.push({
    path: dynamicContent.value.routeTasks,
    query: { taskId: task.id } // 携带任务 ID
  })
}

function updateGreeting() {
  var h = new Date().getHours()
  if (h < 12) dynamicContent.value.greetingPrefix = '早安'
  else if (h < 18) dynamicContent.value.greetingPrefix = '下午好'
  else dynamicContent.value.greetingPrefix = '晚上好'
}

function animateCount(targets) {
  var duration = 1200, startTime = Date.now()
  function step() {
    var elapsed = Date.now() - startTime
    var progress = Math.min(elapsed / duration, 1)
    var ep = 1 - Math.pow(1 - progress, 3)
    anim.value.pending = Math.round(targets.pending * ep)
    anim.value.completed = Math.round(targets.completed * ep)
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

onMounted(async function () {
  if (!userStore.user) userStore.fetchUser()
  updateGreeting()

  try {
    var aqiRes = await getMyAqiRecords()
    var aqiList = (aqiRes && aqiRes.data) ? aqiRes.data : []
    if (aqiList.length > 0) {
      var sumAqi = aqiList.reduce(function (s, r) { return s + (parseInt(r.finalAqi) || 0) }, 0)
      var avgVal = Math.round(sumAqi / aqiList.length)
      aqiData.value = { value: avgVal, status: aqiStatus(avgVal) }
    }
  } catch (e) { console.error('AQI加载失败:', e) }

  var targets = { pending: 0, completed: 0 }

  try {
    var [assignedRes, processingRes] = await Promise.all([
      getAssignedToMe('ASSIGNED'),
      getAssignedToMe('PROCESSING')
    ])
    var assignedList = (assignedRes && assignedRes.data) ? assignedRes.data : []
    var processingList = (processingRes && processingRes.data) ? processingRes.data : []
    var list = [...assignedList, ...processingList]
    var lm = { 1: { code: 'info', text: '常规' }, 2: { code: 'info', text: '常规' }, 3: { code: 'warning', text: '中优' }, 4: { code: 'warning', text: '中优' }, 5: { code: 'danger', text: '高优' }, 6: { code: 'danger', text: '高优' } }
    var statusMap = { 'ASSIGNED': 'pending', 'PROCESSING': 'active' }

    rawTasks.value = list.map(function (t) {
      return {
        id: t.id,
        taskNo: t.taskNo || `TSK-` + String(t.id).padStart(4, '0'),
        title: t.description || t.title || '环境常规巡查与隐患复核',
        address: t.specificAddress || t.address || '未指定巡查位置',
        deadline: t.deadline || '2026-07-04 18:00',
        status: t.status || '待处理',
        statusCode: statusMap[t.status] || 'pending',
        priority: t.priority || t.estimatedAqiLevel || 1,
        levelCode: lm[t.estimatedAqiLevel]?.code || 'info',
        levelText: lm[t.estimatedAqiLevel]?.text || '常规'
      }
    })

    targets.pending = rawTasks.value.length;

  } catch (e) { }

  try {
    var sr = await getAssignedStats()
    var d = sr.data || {}
    targets.completed = d.completed || 0
  } catch (e) { }

  metricsData.value = { pending: targets.pending, completed: targets.completed }
  animateCount(targets)
})
</script>

<style scoped>
/* 此处保留所有原有的样式代码不变，CSS 无需进行任何修改 */
.dash {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  height: 100%;
  gap: 24px;
}

.card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 4px 10px -4px rgba(0, 0, 0, 0.02);
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.06);
  z-index: 5;
}

.ch {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.ch h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0;
  letter-spacing: 0.2px;
}

.tbtn {
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 500;
  color: #86868B;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.tbtn:hover {
  color: #1D1D1F;
}

.cb {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.sys-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
}

.icon-xs {
  width: 12px;
  height: 12px;
  margin-right: 4px;
  vertical-align: -2px;
}

.icon-sm {
  width: 16px;
  height: 16px;
  display: block;
}

.icon-md {
  width: 20px;
  height: 20px;
  display: block;
}

.hero {
  grid-column: span 2;
  background: linear-gradient(135deg, #F8FAFC, #F1F5F9);
  border: 1px solid rgba(15, 23, 42, 0.03);
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 32px 40px;
}

.hero:hover {
  transform: translateY(-4px);
}

.hl {
  flex: 1;
  max-width: 65%;
}

.h2 {
  font-size: 34px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 12px;
  letter-spacing: 0.5px;
}

.hp {
  font-size: 15px;
  color: #475569;
  margin: 0 0 28px;
  line-height: 1.6;
}

.hbtns {
  display: flex;
  gap: 16px;
}

.hb {
  padding: 12px 28px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.hb.primary {
  background: #0F172A;
  color: #fff;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.15);
}

.hb.primary:hover {
  background: #1E293B;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.2);
}

.hb.outline {
  background: #fff;
  color: #0F172A;
  border: 1px solid rgba(15, 23, 42, 0.1);
}

.hb.outline:hover {
  background: #F8FAFC;
}

.hr {
  flex-shrink: 0;
}

.orb {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 2px solid rgba(2, 132, 199, 0.25);
  animation: orb-pulse 3s infinite;
}

.r1 {
  width: 130px;
  height: 130px;
  animation-delay: 0s;
}

.r2 {
  width: 150px;
  height: 150px;
  animation-delay: 1s;
}

.r3 {
  width: 170px;
  height: 170px;
  animation-delay: 2s;
}

@keyframes orb-pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.85);
    opacity: 0.6;
  }

  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 0.2;
  }

  100% {
    transform: translate(-50%, -50%) scale(0.85);
    opacity: 0.6;
  }
}

.orb-inner {
  position: relative;
  z-index: 1;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 30px rgba(2, 132, 199, 0.15), 0 12px 32px rgba(14, 165, 233, 0.1);
  animation: orb-glow 2s infinite alternate;
}

@keyframes orb-glow {
  0% {
    box-shadow: 0 0 20px rgba(2, 132, 199, 0.1), 0 8px 24px rgba(14, 165, 233, 0.05);
  }

  100% {
    box-shadow: 0 0 40px rgba(2, 132, 199, 0.25), 0 16px 40px rgba(14, 165, 233, 0.15);
  }
}

.orb-v {
  font-size: 48px;
  font-weight: 800;
  color: #0284C7;
  line-height: 1;
  animation: val-pop 0.5s ease-out;
}

@keyframes val-pop {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }

  70% {
    transform: scale(1.15);
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.orb-l {
  font-size: 13px;
  font-weight: 600;
  color: #10B981;
  margin-top: 2px;
}

.mcol {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
}

.mcard {
  flex: 1;
  background: #fff;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
  cursor: pointer;
}

.mcard:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.08);
  z-index: 5;
}

.mcard.urgent {
  border-left: 4px solid #EF4444;
  background: linear-gradient(135deg, #FFF5F5, #FFF);
}

.urgent-shimmer {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.5) 45%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0.5) 55%, transparent 60%);
  animation: urg-shimmer 3s infinite;
  z-index: 1;
}

@keyframes urg-shimmer {
  0% {
    transform: translateX(-100%) rotate(25deg);
  }

  100% {
    transform: translateX(100%) rotate(25deg);
  }
}

.urgent-scan {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background: rgba(239, 68, 68, 0.4);
  z-index: 1;
  animation: urg-scan 2s infinite;
}

@keyframes urg-scan {
  0% {
    top: -2px;
    opacity: 0;
  }

  30% {
    opacity: 1;
  }

  100% {
    top: 100%;
    opacity: 0;
  }
}

.urgent-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
  border-radius: 50%;
  border: 2px solid rgba(239, 68, 68, 0.3);
  animation: urg-ring 2s infinite;
  z-index: 1;
}

@keyframes urg-ring {
  0% {
    width: 30px;
    height: 30px;
    opacity: 0.5;
  }

  100% {
    width: 180px;
    height: 180px;
    opacity: 0;
  }
}

.mcard.done {
  border-left: 4px solid #10B981;
  background: linear-gradient(135deg, #F0FDF4, #FFF);
}

.done-sparkles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
}

.ds {
  position: absolute;
  font-size: 14px;
  color: #10B981;
  animation: dsp 2s infinite;
  opacity: 0;
}

.s1 {
  top: 12px;
  right: 24px;
  animation-delay: 0s;
}

.s2 {
  top: 24px;
  right: 10px;
  animation-delay: 0.7s;
  font-size: 10px;
}

.s3 {
  bottom: 12px;
  right: 30px;
  animation-delay: 1.4s;
  font-size: 11px;
}

@keyframes dsp {

  0%,
  100% {
    opacity: 0;
    transform: translateY(0) scale(0.5);
  }

  50% {
    opacity: 0.8;
    transform: translateY(-6px) scale(1.2);
  }
}

.done-ring {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
}

.done-ring-fill {
  transition: stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.mhead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: auto;
  position: relative;
  z-index: 2;
}

.micon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.micon.urg {
  background: #FEF2F2;
  color: #EF4444;
  animation: ib 0.6s ease-out;
}

.micon.don {
  background: #ECFDF5;
  color: #10B981;
  animation: ib 0.5s ease-out;
}

@keyframes ib {
  0% {
    transform: scale(0) rotate(-10deg);
  }

  60% {
    transform: scale(1.2) rotate(5deg);
  }

  100% {
    transform: scale(1) rotate(0);
  }
}

.mbtn {
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  padding: 4px;
  position: relative;
  z-index: 2;
  transition: color 0.2s;
}

.mbtn:hover {
  color: #0F172A;
}

.mbody {
  position: relative;
  z-index: 2;
  margin-top: auto;
}

.mval {
  font-family: "SF Pro Display", -apple-system, sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: #0F172A;
  display: block;
  letter-spacing: -0.5px;
}

.mval.grn {
  color: #10B981;
}

.mtit {
  font-size: 13px;
  color: #64748B;
  font-weight: 500;
  margin-top: 4px;
  display: block;
}

.focus {
  grid-column: span 2;
}

.flist {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: flex-start;
  overflow-y: auto;
}

.fitem {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 16px;
  background: #FDFDFD;
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.fitem:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.05);
  background: #F8FAFC;
}

.fi-left {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F1F5F9;
  color: #64748B;
  animation: fi-in 0.4s ease-out;
}

.fi-left.danger {
  background: #FEF2F2;
  color: #EF4444;
}

.fi-left.warning {
  background: #FFFBEB;
  color: #F59E0B;
}

.fi-left.info {
  background: #F8FAFC;
  color: #64748B;
}

@keyframes fi-in {
  0% {
    transform: scale(0);
  }

  60% {
    transform: scale(1.1);
  }

  100% {
    transform: scale(1);
  }
}

.finfo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.finfo-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.primary-text {
  align-items: baseline;
}

.ft-no {
  font-family: monospace;
  font-size: 12px;
  font-weight: 600;
  color: #64748B;
  background: #F1F5F9;
  padding: 2px 6px;
  border-radius: 4px;
}

.ft {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.secondary-text {
  gap: 16px;
}

.fd {
  font-size: 12px;
  color: #64748B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
}

.ftag {
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}

.ftag.danger {
  background: #FEF2F2;
  color: #EF4444;
  animation: tag-pulse 2s infinite;
}

.ftag.warning {
  background: #FFFBEB;
  color: #F59E0B;
}

.ftag.info {
  background: #F1F5F9;
  color: #64748B;
}

.ftag-group {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  align-items: center;
}

.ftag-unfinished {
  background: #FFF7ED;
  color: #EA580C;
  border: 1px solid rgba(234, 88, 12, 0.2);
}

.ftag-pending {
  background: #FEF2F2;
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.15);
}

@keyframes tag-pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

.fprogress-bar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 2px;
}

.fprogress-track {
  flex: 1;
  height: 4px;
  background: #F1F5F9;
  border-radius: 2px;
  overflow: hidden;
  max-width: 120px;
}

.fprogress-fill {
  height: 100%;
  background: linear-gradient(90deg, #F59E0B, #EA580C);
  border-radius: 2px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.fprogress-label {
  font-size: 11px;
  font-weight: 600;
  color: #EA580C;
  white-space: nowrap;
}

.fi-left .progress-ring {
  animation: progress-pulse 2s infinite;
}

@keyframes progress-pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

.guidelines {
  grid-column: span 1;
}

.glist {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gitem {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #FDFDFD;
  border: 1px solid rgba(0, 0, 0, 0.02);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.gitem:hover {
  background: #F8FAFC;
  transform: translateX(4px);
  border-color: rgba(0, 0, 0, 0.04);
}

.gicon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.gicon {
  width: 20px;
  height: 20px;
}

.g-blue {
  color: #0284C7;
  background: #F0F9FF;
}

.g-emerald {
  color: #10B981;
  background: #ECFDF5;
}

.g-indigo {
  color: #6366F1;
  background: #EEF2FF;
}

.gtext {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gt-title {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
  letter-spacing: 0.3px;
}

.gt-desc {
  font-size: 12px;
  color: #64748B;
  line-height: 1.4;
}

.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #94A3B8;
  font-size: 14px;
  line-height: 1.8;
}

.empty-svg {
  width: 36px;
  height: 36px;
  opacity: 0.2;
  margin-bottom: 8px;
}
</style>