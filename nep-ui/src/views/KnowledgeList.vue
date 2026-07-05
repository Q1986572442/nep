<template>
  <div class="swiss-page-container">
    <header class="action-console glass-panel fixed-section">
      <div class="console-left">
        <h2 class="page-title">环保知识库</h2>
        <span class="page-subtitle">系统规范、作业指导与环保法规全案检索</span>
      </div>

      <div class="console-right">
        <div class="search-capsule">
          <el-icon><Search /></el-icon>
          <el-input
            v-model="searchQuery"
            placeholder="搜索文献题名..."
            clearable
            class="keyword-input"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </div>
        
        <div class="search-capsule">
          <span class="filter-label">类目</span>
          <el-select
            v-model="filterType"
            placeholder="全部分类"
            clearable
            class="swiss-select"
            popper-class="swiss-select-dropdown"
            @change="handleSearch"
          >
            <el-option label="全部分类" value="" />
            <el-option label="大气环境" value="AIR" />
            <el-option label="水环境" value="WATER" />
            <el-option label="土壤环境" value="SOIL" />
            <el-option label="噪声污染" value="NOISE" />
            <el-option label="生态保护" value="ECOLOGY" />
          </el-select>
        </div>

        <el-button class="swiss-btn icon-btn" @click="handleReset" title="重置视图">
          <el-icon><RefreshRight /></el-icon>
        </el-button>
      </div>
    </header>

    <main class="stretch-section glass-panel scrollable-card" v-loading="loading">
      <div class="panel-header">
        <span class="header-text">检索结果</span>
        <span class="item-count">共检索到 {{ total || 0 }} 份文献</span>
      </div>

      <div class="scroll-area padding-area">
        <div v-if="errorMsg" class="empty-state-view">
          <el-icon class="placeholder-icon" style="color: #D9534F"><WarningFilled /></el-icon>
          <p>{{ errorMsg }}</p>
          <button class="swiss-btn primary-btn" @click="fetchData" style="margin-top: 12px;">重新加载</button>
        </div>

        <div v-else-if="!knowledgeList || knowledgeList.length === 0" class="empty-state-view">
          <el-icon class="placeholder-icon"><Document /></el-icon>
          <p>暂无相关文献记录</p>
        </div>

        <div v-else class="knowledge-grid">
          <div
            v-for="doc in knowledgeList"
            :key="doc?.id"
            class="knowledge-card"
            @click="doc?.id && $router.push(goDetail(doc.id))"
          >
            <div class="card-header">
              <div class="card-icon" :class="fileCls(doc?.attachmentUrl)">
                <el-icon><Document /></el-icon>
                <span>{{ fileCls(doc?.attachmentUrl) }}</span>
              </div>
              <div class="card-category" :class="'cat-' + (doc?.category || 'AIR').toLowerCase()">
                {{ catLabel(doc?.category) }}
              </div>
            </div>
            
            <div class="card-body">
              <h3 class="doc-title">{{ doc?.title || '未命名文献' }}</h3>
              <p class="doc-desc">{{ doc?.summary || '暂无文献摘要说明' }}</p>
            </div>

            <div class="card-footer">
              <span class="meta-time"><el-icon><Calendar /></el-icon> {{ fmtDate(doc?.createTime) }}</span>
              <button class="action-text-btn" @click.stop="doc && downloadDoc(doc)">下载附件</button>
            </div>
          </div>
        </div>
      </div>

      <div class="list-pagination" v-if="total > size">
        <el-pagination
          v-model:current-page="page"
          :page-size="size"
          :total="total"
          layout="prev, pager, next"
          class="swiss-pagination"
          @current-change="fetchData"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getKnowledgePage, downloadKnowledgeFile } from '@/api/knowledge'
import { rolePath } from '@/utils/roleRouter'
import { Search, RefreshRight, Document, Calendar, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const knowledgeList = ref([])
const loading = ref(true)
const errorMsg = ref('')
const page = ref(1)
const size = ref(16)
const total = ref(0)
const filterType = ref('')
const searchQuery = ref('')

function goDetail(id) { return rolePath('/knowledge/' + id) }

function catLabel(cat) {
  const map = { AIR: '大气环境', WATER: '水环境', SOIL: '土壤环境', NOISE: '噪声污染', ECOLOGY: '生态保护' }
  return map[cat] || cat || '综合'
}

function fmtDate(t) { if (!t) return '-'; return String(t).replace('T', ' ').substring(0, 10) }

// 【核心修复】：增强类型的判断逻辑，彻底解决 url.split 报错
function fileCls(rawUrl) {
  if (!rawUrl) return 'DOC'
  let url = rawUrl
  try { 
    const arr = JSON.parse(rawUrl); 
    if (Array.isArray(arr) && arr.length > 0) {
      const firstItem = arr[0]
      url = typeof firstItem === 'object' && firstItem !== null && firstItem.url 
        ? firstItem.url 
        : firstItem
    } else if (typeof arr === 'object' && arr !== null && arr.url) {
      url = arr.url
    }
  } catch {}
  
  if (typeof url !== 'string') return 'DOC'

  const ext = url.split('.').pop()?.toLowerCase() || ''
  if (['pdf'].includes(ext)) return 'PDF'
  if (['xls', 'xlsx'].includes(ext)) return 'XLS'
  if (['doc', 'docx'].includes(ext)) return 'DOC'
  if (['zip', 'rar', '7z'].includes(ext)) return 'ZIP'
  return 'DOC'
}

function handleSearch() { page.value = 1; fetchData() }
function handleReset() { filterType.value = ''; searchQuery.value = ''; handleSearch() }

async function downloadDoc(doc) {
  if (!doc?.attachmentUrl) { ElMessage.warning('该文献暂无可下载的附件'); return }
  const urls = parseAttachUrls(doc.attachmentUrl)
  if (!urls || urls.length === 0) { ElMessage.warning('该文献暂无可下载的附件'); return }
  const url = typeof urls[0] === 'object' ? urls[0].url : urls[0]
  const filename = url?.split('/')?.pop() || doc?.title || 'download'
  try {
    const blob = await downloadKnowledgeFile(url, filename)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = filename; a.click()
    ElMessage.success('附件下载成功')
  } catch (e) { ElMessage.error('下载失败，附件可能不存在') }
}

function parseAttachUrls(raw) {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return [typeof arr === 'string' ? arr : (arr?.url || '')]
    return arr.filter(Boolean).map(item => typeof item === 'object' && item.url ? item.url : typeof item === 'string' ? item : '').filter(Boolean)
  } catch { return [raw] }
}

async function fetchData() {
  loading.value = true; errorMsg.value = ''
  try {
    const params = {}
    if (filterType.value) params.category = filterType.value
    if (searchQuery.value) params.keyword = searchQuery.value
    const res = await getKnowledgePage(page.value, size.value, params)
    knowledgeList.value = res?.data || []
    total.value = res?.total || 0
  } catch (e) {
    console.error('加载失败:', e)
    errorMsg.value = e?.response?.data?.message || e?.message || '请求失败'
    knowledgeList.value = []; total.value = 0
  } finally { loading.value = false }
}

onMounted(() => fetchData())
</script>

<style scoped>
/* ========== 全局主容器 ========== */
.swiss-page-container {
  max-width: 1440px;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 32px;
  box-sizing: border-box;
  color: #1C2421;
}

.fixed-section {
  flex-shrink: 0;
}

.stretch-section {
  flex: 1;
  min-height: 0;
}

/* 核心毛玻璃面板：完美融入生态 */
.glass-panel {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  box-shadow: 0 8px 32px -8px rgba(0, 0, 0, 0.04), inset 0 2px 4px rgba(255, 255, 255, 0.6);
}

.scrollable-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.scroll-area {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
}

.scroll-area::-webkit-scrollbar {
  display: none;
}

/* ========== 顶部控制台 ========== */
.action-console {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 32px;
}

.console-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #1C2421;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 13px;
  color: #74807B;
  font-weight: 500;
}

.console-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 搜索和过滤胶囊 */
.search-capsule {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 100px;
  padding: 6px 16px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.keyword-input :deep(.el-input__wrapper) {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0;
  width: 160px;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: #74807B;
}

.swiss-select :deep(.el-input__wrapper) {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0;
  width: 100px;
}

.swiss-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 100px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  color: #1C2421;
}

.icon-btn:hover {
  background: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.primary-btn {
  padding: 0 20px;
  height: 40px;
  background: #2A483A;
  color: #fff;
}

.primary-btn:hover {
  background: #1C2421;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(42, 72, 58, 0.3);
}

/* ========== 主列表面板 ========== */
.panel-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px 16px;
  border-bottom: 1px solid rgba(28, 36, 33, 0.04);
}

.header-text {
  font-size: 16px;
  font-weight: 700;
  color: #1C2421;
}

.item-count {
  font-size: 13px;
  color: #74807B;
  font-weight: 600;
  background: rgba(28, 36, 33, 0.05);
  padding: 4px 12px;
  border-radius: 12px;
}

.padding-area {
  padding: 24px 28px;
}

/* 缺省状态 */
.empty-state-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  min-height: 400px;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* ===== 网格系统及文献卡片 ===== */
.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.knowledge-card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.knowledge-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.08);
  background: #fff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-icon {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.03);
  color: #1C2421;
}

.card-icon.PDF { color: #D9534F; background: rgba(217, 83, 79, 0.1); }
.card-icon.DOC { color: #2563EB; background: rgba(37, 99, 235, 0.1); }
.card-icon.XLS { color: #2AA876; background: rgba(42, 168, 118, 0.1); }
.card-icon.ZIP { color: #F5A623; background: rgba(245, 166, 35, 0.1); }

.card-category {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
}

/* 颜色体系与环保业务契合 */
.cat-air { color: #409EFF; background: rgba(64, 158, 255, 0.1); }
.cat-water { color: #2AA876; background: rgba(42, 168, 118, 0.1); }
.cat-soil { color: #E6A23C; background: rgba(230, 162, 60, 0.1); }
.cat-noise { color: #F56C6C; background: rgba(245, 108, 108, 0.1); }
.cat-ecology { color: #67C23A; background: rgba(103, 194, 58, 0.1); }

.card-body {
  flex-grow: 1;
}

.doc-title {
  font-size: 16px;
  font-weight: 700;
  color: #1C2421;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.doc-desc {
  font-size: 13px;
  color: #74807B;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px dashed rgba(0, 0, 0, 0.06);
}

.meta-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #94A3B8;
}

.action-text-btn {
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: #2A483A;
  cursor: pointer;
  padding: 0;
}

.action-text-btn:hover {
  color: #1C2421;
  text-decoration: underline;
}

/* 分页器底座 */
.list-pagination {
  padding: 16px;
  border-top: 1px solid rgba(28, 36, 33, 0.06);
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

:deep(.swiss-pagination) {
  --el-pagination-bg-color: transparent;
}
</style>