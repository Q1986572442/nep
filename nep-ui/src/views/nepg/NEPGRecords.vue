<template>
  <div class="alpine-tasks-canvas">
    <!-- 顶部控制台：完全对齐 NEPGTasks -->
    <header class="tasks-header">
      <div class="header-left">
        <h1 class="page-title">历史检测记录</h1>
        <span class="task-counter">共归档 {{ filteredRecords.length }} 份报告</span>
      </div>

      <div class="header-right">
        <div class="alpine-search">
          <el-icon class="search-icon"><Search /></el-icon>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索记录编号、工单或备注..."
            class="search-input"
          >
        </div>

        <div class="alpine-segments">
          <button
            v-for="tab in filterTabs"
            :key="tab.value"
            class="segment-btn"
            :class="{ active: currentTab === tab.value }"
            @click="currentTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </header>

    <!-- 主工作区：左列表 + 右详情 (Split-pane) -->
    <main class="tasks-workspace">
      <!-- 左侧：记录流 -->
      <aside class="task-list-pane" v-loading="isLoading">
        <div v-if="filteredRecords.length === 0 && !isLoading" class="empty-state-list">
          <el-icon class="empty-icon"><List /></el-icon>
          <p>当前分类下暂无历史记录</p>
        </div>

        <div
          v-else
          v-for="r in filteredRecords"
          :key="r.id"
          class="task-card"
          :class="{ 'is-selected': selectedRecordId === r.id }"
          @click="selectRecord(r)"
        >
          <div class="card-header">
            <span class="task-id">REC-{{ r.id }}</span>
            <span class="alpine-dot" :class="getDotClass(r.finalAqi)"></span>
          </div>
          <h3 class="task-title">
            综合 AQI: {{ r.finalAqi || 0 }} 
            <span class="title-sub">({{ getAqiText(r.finalAqi) }})</span>
          </h3>
          <div class="task-meta">
            <span class="meta-item"><el-icon><Document /></el-icon> 关联工单: {{ r.feedbackId || '独立记录' }}</span>
            <span class="meta-item"><el-icon><Calendar /></el-icon> {{ fmtTime(r.createTime) }}</span>
          </div>
        </div>
      </aside>

      <!-- 右侧：详情画板 -->
      <section class="task-detail-pane" v-loading="isLoadingDetail">
        <div v-if="!selectedRecord" class="empty-state-detail">
          <div class="glass-placeholder">
            <el-icon><DataLine /></el-icon>
          </div>
          <h3>未选择任何记录</h3>
          <p>请从左侧列表中选择一份检测报告以查阅详情</p>
        </div>

        <div v-else class="detail-content">
          <div class="detail-scroll-area">
            <div class="detail-header">
              <div class="tag-group">
                <span class="alpine-tag solid" :class="getTagClass(selectedRecord.finalAqi)">
                  {{ getAqiText(selectedRecord.finalAqi) }}
                </span>
                <span class="alpine-tag outline completed">已归档</span>
              </div>
              <h2 class="detail-title">环境空气质量检测报告</h2>
              <p class="detail-id">归档编号：REC-{{ selectedRecord.id }}</p>
            </div>

            <!-- 复用 tasks 的 section 样式展示气项 -->
            <div class="detail-section">
              <h4 class="section-title"><el-icon><DataAnalysis /></el-icon> 污染物分指数 (AQI)</h4>
              <div class="time-grid">
                <div class="time-box">
                  <span class="time-label">SO₂ 二氧化硫</span>
                  <span class="time-value">{{ selectedRecord.so2Aqi || 0 }}</span>
                </div>
                <div class="time-box">
                  <span class="time-label">CO 一氧化碳</span>
                  <span class="time-value">{{ selectedRecord.coAqi || 0 }}</span>
                </div>
                <div class="time-box">
                  <span class="time-label">PM2.5 悬浮颗粒物</span>
                  <span class="time-value">{{ selectedRecord.pm25Aqi || 0 }}</span>
                </div>
                <div class="time-box highlight-box">
                  <span class="time-label">综合空气质量指数</span>
                  <span class="time-value text-large">{{ selectedRecord.finalAqi || 0 }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4 class="section-title"><el-icon><Document /></el-icon> 现场备注信息</h4>
              <p class="section-text">{{ selectedRecord.remark || '该检测记录未留下任何现场备注信息。' }}</p>
            </div>

            <div class="detail-section">
              <h4 class="section-title"><el-icon><Timer /></el-icon> 时间节点与追溯</h4>
              <div class="time-grid">
                <div class="time-box">
                  <span class="time-label">检测完成/归档时间</span>
                  <span class="time-value">{{ fmtTime(selectedRecord.createTime) }}</span>
                </div>
                <div class="time-box">
                  <span class="time-label">工单溯源 ID</span>
                  <span class="time-value">{{ selectedRecord.feedbackId || '系统独立生成' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部操作区，对齐任务页 -->
          <div class="detail-actions">
            <button class="alpine-btn ghost" @click="handleCloseDetail">
              关闭详情
            </button>
            <button class="alpine-btn primary" @click="handlePrint">
              <el-icon><Printer /></el-icon> 打印报告
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMyAqiRecords } from '@/api/aqi'
import { ElMessage } from 'element-plus'
import {
  Search, List, Calendar, Briefcase, LocationInformation, 
  MapLocation, Document, Timer, Position, DataLine, DataAnalysis, Printer
} from '@element-plus/icons-vue'

// 核心数据状态
const records = ref([])
const isLoading = ref(false)
const isLoadingDetail = ref(false)
const searchQuery = ref('')
const currentTab = ref('all')
const selectedRecordId = ref(null)

// 衍生指标
const avgAqi = computed(() => {
  if (!records.value || records.value.length === 0) return 0
  const total = records.value.reduce((sum, r) => sum + (parseInt(r.finalAqi) || 0), 0)
  return Math.round(total / records.value.length)
})

const highRiskCount = computed(() => {
  if (!records.value) return 0
  return records.value.filter(r => (parseInt(r.finalAqi) || 0) > 100).length
})

// 分段控制器
const filterTabs = computed(() => [
  { label: '全部记录', value: 'all' },
  { label: `超标预警 (${highRiskCount.value})`, value: 'high_risk' }
])

// 列表过滤
const filteredRecords = computed(() => {
  let res = records.value
  
  if (currentTab.value === 'high_risk') {
    res = res.filter(r => (parseInt(r.finalAqi) || 0) > 100)
  }
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    res = res.filter(r => {
      return String(r.id).includes(q) ||
        String(r.feedbackId || '').includes(q) ||
        String(r.remark || '').toLowerCase().includes(q)
    })
  }
  return res
})

const selectedRecord = computed(() => {
  return records.value.find(r => r.id === selectedRecordId.value)
})

// UI 映射逻辑，严格适配 NEPGTasks 的 css class
function getAqiText(val) {
  const v = parseInt(val) || 0
  if (v <= 50) return '优'
  if (v <= 100) return '良'
  if (v <= 150) return '轻度污染'
  if (v <= 200) return '中度污染'
  return '重度/严重污染'
}

function getDotClass(val) {
  const v = parseInt(val) || 0
  if (v <= 50) return 'completed' // 绿
  if (v <= 150) return 'active'   // 黄
  return 'pending'                // 红
}

function getTagClass(val) {
  const v = parseInt(val) || 0
  if (v <= 50) return 'info'
  if (v <= 150) return 'warning'
  return 'danger'
}

function fmtTime(t) {
  if (!t) return '-'
  return String(t).replace('T', ' ').substring(0, 16)
}

function selectRecord(r) {
  isLoadingDetail.value = true
  selectedRecordId.value = r.id
  setTimeout(() => { isLoadingDetail.value = false }, 250) // 模拟面板加载感
}

function handleCloseDetail() {
  selectedRecordId.value = null
}

function handlePrint() {
  ElMessage.success('已发送打印请求')
}

// 真实接口拉取
async function fetchRecords() {
  const uid = localStorage.getItem('userId')
  if (!uid) return
  isLoading.value = true
  try {
    const res = await getMyAqiRecords()
    if (res && res.data) {
      records.value = res.data
    }
  } catch(e) { 
    console.error('AQI记录加载失败:', e) 
  } finally { 
    isLoading.value = false 
  }
}

onMounted(() => { fetchRecords() })
</script>

<style scoped>
/* 100% 像素级复用 NEPGTasks 的 CSS 架构 */
.alpine-tasks-canvas {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.tasks-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  margin-bottom: 24px;
}
.header-left { display: flex; align-items: baseline; gap: 12px; }
.page-title { font-size: 24px; font-weight: 700; color: #0F172A; margin: 0; }
.task-counter { font-size: 14px; color: #64748B; font-weight: 500; }

.header-right { display: flex; align-items: center; gap: 24px; }

.alpine-search {
  display: flex; align-items: center; gap: 8px;
  background: white; border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 8px 16px; border-radius: 12px; width: 280px;
  transition: all 0.3s;
}
.alpine-search:focus-within { border-color: #0284C7; box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1); }
.search-icon { color: #94A3B8; font-size: 16px; }
.search-input { border: none; outline: none; font-size: 14px; width: 100%; color: #0F172A; background: transparent; }
.search-input::placeholder { color: #94A3B8; }

.alpine-segments {
  display: flex; background: rgba(15, 23, 42, 0.04);
  padding: 4px; border-radius: 12px;
}
.segment-btn {
  border: none; background: transparent; padding: 6px 16px;
  border-radius: 8px; font-size: 13px; font-weight: 600; color: #64748B;
  cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.segment-btn.active { background: white; color: #0F172A; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06); }

.tasks-workspace {
  flex: 1;
  display: flex;
  gap: 24px;
  min-height: 0;
}

.task-list-pane {
  width: 380px; flex-shrink: 0;
  display: flex; flex-direction: column; gap: 12px;
  overflow-y: auto; padding-right: 8px;
}
.task-list-pane::-webkit-scrollbar { width: 4px; }
.task-list-pane::-webkit-scrollbar-thumb { background: rgba(15, 23, 42, 0.1); border-radius: 4px; }

.task-card {
  background: white; border-radius: 16px; padding: 20px;
  border: 1px solid rgba(15, 23, 42, 0.04);
  cursor: pointer; transition: all 0.2s ease;
  display: flex; flex-direction: column; gap: 12px;
}
.task-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px -8px rgba(15, 23, 42, 0.06); }
.task-card.is-selected { border-color: #0284C7; box-shadow: 0 0 0 1px #0284C7, 0 8px 24px -8px rgba(2, 132, 199, 0.15); }

.card-header { display: flex; justify-content: space-between; align-items: center; }
.task-id { font-size: 12px; color: #94A3B8; font-weight: 600; font-family: monospace; }
.alpine-dot { width: 8px; height: 8px; border-radius: 50%; }
.alpine-dot.pending { background: #EF4444; box-shadow: 0 0 0 3px #FEF2F2; }
.alpine-dot.active { background: #F59E0B; box-shadow: 0 0 0 3px #FFFBEB; }
.alpine-dot.completed { background: #10B981; box-shadow: 0 0 0 3px #F0FDF4; }

.task-title { font-size: 15px; font-weight: 600; color: #0F172A; margin: 0; line-height: 1.4; }
.title-sub { font-size: 13px; font-weight: 400; color: #64748B; margin-left: 4px; }

.task-meta { display: flex; flex-direction: column; gap: 6px; }
.meta-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748B; }

.task-detail-pane {
  flex: 1;
  background: white; border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.04);
  box-shadow: 0 4px 24px -8px rgba(15, 23, 42, 0.03);
  display: flex; flex-direction: column;
  overflow: hidden;
}

.detail-content {
  flex: 1; display: flex; flex-direction: column; min-height: 0;
}
.detail-scroll-area {
  flex: 1; overflow-y: auto; padding: 40px;
}
.detail-scroll-area::-webkit-scrollbar { display: none; }

.detail-header { margin-bottom: 40px; border-bottom: 1px solid rgba(15, 23, 42, 0.04); padding-bottom: 24px; }
.tag-group { display: flex; gap: 8px; margin-bottom: 16px; }
.alpine-tag { padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; }
.alpine-tag.solid.danger { background: #FEF2F2; color: #EF4444; }
.alpine-tag.solid.warning { background: #FFFBEB; color: #F59E0B; }
.alpine-tag.solid.info { background: #F1F5F9; color: #64748B; }
.alpine-tag.outline { background: transparent; border: 1px solid; }
.alpine-tag.outline.completed { border-color: #10B981; color: #10B981; }

.detail-title { font-size: 24px; font-weight: 700; color: #0F172A; margin: 0 0 8px 0; line-height: 1.3; }
.detail-id { font-size: 13px; color: #94A3B8; font-family: monospace; margin: 0; }

.detail-section { margin-bottom: 32px; }
.section-title { font-size: 14px; font-weight: 600; color: #0F172A; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px; }
.section-title .el-icon { color: #0284C7; font-size: 16px; }
.section-text { font-size: 14px; color: #475569; line-height: 1.6; margin: 0; }

.time-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.time-box { background: #F8FAFC; padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 4px; }
.highlight-box { background: #F0F9FF; border: 1px solid #E0F2FE; }
.time-label { font-size: 12px; color: #64748B; font-weight: 500; }
.time-value { font-size: 14px; color: #0F172A; font-weight: 600; }
.text-large { font-size: 20px; color: #0284C7; }

.detail-actions {
  flex-shrink: 0; padding: 24px 40px; background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px); border-top: 1px solid rgba(15, 23, 42, 0.04);
  display: flex; justify-content: flex-end; gap: 16px;
}

.alpine-btn {
  padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; border: none; transition: all 0.3s;
}
.alpine-btn.primary { background: #0284C7; color: white; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.2); }
.alpine-btn.primary:hover { transform: translateY(-1px); background: #0369A1; }
.alpine-btn.ghost { background: transparent; color: #64748B; }
.alpine-btn.ghost:hover { background: #F1F5F9; color: #0F172A; }

.empty-state-list { padding: 40px 20px; text-align: center; color: #94A3B8; font-size: 13px; }
.empty-state-detail { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #64748B; }
.glass-placeholder {
  width: 80px; height: 80px; border-radius: 24px; margin-bottom: 24px;
  background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
  display: flex; justify-content: center; align-items: center;
  font-size: 32px; color: #0284C7; box-shadow: 0 12px 32px rgba(2, 132, 199, 0.1);
}
.empty-state-detail h3 { font-size: 18px; color: #0F172A; margin: 0 0 8px 0; font-weight: 600; }
.empty-state-detail p { font-size: 14px; margin: 0; max-width: 260px; text-align: center; line-height: 1.5; }
</style>