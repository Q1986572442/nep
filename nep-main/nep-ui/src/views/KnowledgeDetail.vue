<template>
  <div class="swiss-page-container">
    <header class="action-console glass-panel fixed-section">
      <div class="console-left">
        <button class="swiss-btn icon-btn" @click="$router.back()" title="返回列表">
          <el-icon><ArrowLeft /></el-icon>
        </button>
        <div class="title-group">
          <h2 class="page-title">文献详情</h2>
          <span class="page-subtitle">Knowledge Base Reader</span>
        </div>
      </div>

      <div class="console-right" v-if="docData">
        <div class="info-capsule code-capsule">
          <el-icon><Collection /></el-icon>
          <span>档案编号：{{ String(docData.id || '').padStart(6, '0') }}</span>
        </div>
      </div>
    </header>

    <main class="stretch-section glass-panel scrollable-card" v-loading="loading">
      <div class="scroll-area padding-area">
        
        <div v-if="errorMsg" class="empty-state-view">
          <el-icon class="placeholder-icon" style="color: #D9534F"><WarningFilled /></el-icon>
          <p>{{ errorMsg }}</p>
          <button class="swiss-btn primary-btn" @click="fetchDetail" style="margin-top: 12px;">重新加载</button>
        </div>

        <div v-else-if="!docData && !loading" class="empty-state-view">
          <el-icon class="placeholder-icon"><DocumentDelete /></el-icon>
          <p>该文献已被撤档或不存在</p>
          <button class="swiss-btn primary-btn" @click="$router.back()" style="margin-top: 12px;">返回知识库</button>
        </div>

        <article v-else-if="docData" class="reader-article">
          
          <div class="article-cover" v-if="docData?.coverImage">
            <img :src="docData.coverImage" :alt="docData?.title" />
            <div class="cover-overlay"></div>
          </div>

          <header class="article-header">
            <h1 class="article-title">{{ docData?.title || '未命名文献' }}</h1>
            
            <div class="article-meta">
              <span class="meta-tag" :class="'cat-' + (docData?.category || 'AIR').toLowerCase()">
                {{ catLabel(docData?.category) }}
              </span>
              <span class="meta-item"><el-icon><Location /></el-icon> {{ docData?.source || '东软环保公众监督系统' }}</span>
              <span class="meta-item"><el-icon><Calendar /></el-icon> {{ fmtDate(docData?.createTime) }}</span>
              <span class="meta-item"><el-icon><View /></el-icon> {{ docData?.viewCount || 0 }} 次浏览</span>
            </div>
          </header>

          <section class="article-abstract glass-quote" v-if="docData?.summary">
            <div class="abstract-label"><el-icon><Reading /></el-icon> 内容提要</div>
            <p>{{ docData.summary }}</p>
          </section>

          <section 
            class="article-body" 
            v-html="docData?.content || '<div class=\'empty-body\'>暂无正文内容</div>'"
          ></section>

          <section class="article-attachments" v-if="attachments && attachments.length > 0">
            <h3 class="attachments-title"><el-icon><FolderOpened /></el-icon> 附件文件 ({{ attachments.length }})</h3>
            <div class="attachments-list">
              <div class="attachment-item" v-for="(att, idx) in attachments" :key="idx">
                <div class="att-info">
                  <el-icon class="att-icon"><Document /></el-icon>
                  <span class="att-name">{{ att?.name || '未知文件' }}</span>
                </div>
                <button class="action-text-btn" @click="att && downloadAttachment(att)">
                  <el-icon><Download /></el-icon> 下载附件
                </button>
              </div>
            </div>
          </section>

        </article>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getKnowledgeById, downloadKnowledgeFile } from '@/api/knowledge'
import { ElMessage } from 'element-plus'
import { 
  ArrowLeft, Calendar, View, Location, Collection, 
  Reading, Document, Download, WarningFilled, FolderOpened, DocumentDelete 
} from '@element-plus/icons-vue'

const route = useRoute()
const docData = ref(null)
const loading = ref(true)
const errorMsg = ref('')

const attachments = computed(() => {
  const doc = docData.value
  if (!doc || !doc?.attachmentUrl) return []
  return parseAttachments(doc.attachmentUrl)
})

function catLabel(cat) {
  if (!cat) return '综合文献'
  const map = { AIR: '大气环境', WATER: '水环境', SOIL: '土壤环境', NOISE: '噪声污染', ECOLOGY: '生态保护' }
  return map[cat] || cat
}

function fmtDate(t) {
  if (!t) return '-'
  return String(t).replace('T', ' ').substring(0, 10)
}

function parseAttachments(raw) {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter(Boolean).map(normalize) : [normalize(raw)]
  } catch { return [normalize(raw)] }
}

function normalize(item) {
  if (typeof item === 'object' && item?.url) return { url: item.url, name: item.name || getName(item.url) }
  if (typeof item === 'string') return { url: item, name: getName(item) }
  return { url: '', name: '未知文件' }
}

function getName(url) {
  if (!url) return '未知文件'
  const parts = url.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || '下载文件'
}

async function downloadAttachment(att) {
  const url = att?.url || ''
  const name = att?.name || 'download'
  try {
    const blob = await downloadKnowledgeFile(url, name)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = name; a.click()
    ElMessage.success('附件下载成功')
  } catch (e) { ElMessage.error('下载失败') }
}

async function fetchDetail() {
  loading.value = true; errorMsg.value = ''
  try {
    const res = await getKnowledgeById(route.params.id)
    docData.value = res?.data || null
  } catch (e) {
    console.error('详情加载失败:', e)
    errorMsg.value = e?.response?.data?.message || e?.message || '请求失败'
    docData.value = null
  } finally { loading.value = false }
}

onMounted(() => fetchDetail())
</script>

<style scoped>
/* ========== 全局主容器与基础结构 ========== */
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

.fixed-section { flex-shrink: 0; }
.stretch-section { flex: 1; min-height: 0; }

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
.scroll-area::-webkit-scrollbar { display: none; }
.padding-area { padding: 32px 40px; }

/* ========== 顶部控制台 ========== */
.action-console {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
}

.console-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-group {
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: #1C2421;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 12px;
  color: #74807B;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  color: #1C2421;
  font-size: 18px;
}

.icon-btn:hover {
  background: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.primary-btn { padding: 0 24px; height: 44px; background: #2A483A; color: #fff; }
.primary-btn:hover { background: #1C2421; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(42, 72, 58, 0.3); }

.info-capsule {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 100px;
  padding: 8px 16px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  font-size: 13px;
  font-weight: 600;
  color: #74807B;
}
.code-capsule { font-family: monospace; letter-spacing: 0.5px; }

/* ========== 缺省状态 ========== */
.empty-state-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  min-height: 500px;
}
.placeholder-icon { font-size: 56px; margin-bottom: 16px; opacity: 0.5; }

/* ========== 沉浸式阅读器内容区 ========== */
.reader-article {
  max-width: 860px; /* 限制阅读宽度，类似Medium体验 */
  margin: 0 auto;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

/* 封面区 */
.article-cover {
  position: relative;
  width: 100%;
  height: 320px;
  overflow: hidden;
}

.article-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 120px;
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,1));
}

/* 头部信息 */
.article-header {
  padding: 40px 60px 24px;
  text-align: center;
}

.article-title {
  font-size: 32px;
  font-weight: 800;
  color: #1C2421;
  line-height: 1.4;
  margin: 0 0 24px;
  letter-spacing: -0.5px;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 13px;
  color: #94A3B8;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 标签颜色映射复用 */
.meta-tag { font-weight: 700; padding: 4px 10px; border-radius: 8px; font-size: 12px; }
.cat-air { color: #409EFF; background: rgba(64, 158, 255, 0.1); }
.cat-water { color: #2AA876; background: rgba(42, 168, 118, 0.1); }
.cat-soil { color: #E6A23C; background: rgba(230, 162, 60, 0.1); }
.cat-noise { color: #F56C6C; background: rgba(245, 108, 108, 0.1); }
.cat-ecology { color: #67C23A; background: rgba(103, 194, 58, 0.1); }

/* 摘要高亮块 */
.article-abstract {
  margin: 0 60px 32px;
  background: rgba(42, 72, 58, 0.03);
  border-left: 4px solid #2A483A;
  padding: 24px 32px;
  border-radius: 0 12px 12px 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.7;
}

.abstract-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #1C2421;
  margin-bottom: 12px;
  font-size: 14px;
}

.article-abstract p { margin: 0; }

/* 动态富文本正文 */
.article-body {
  padding: 0 60px 48px;
  font-size: 16px;
  line-height: 2;
  color: #334155;
}

.article-body :deep(h2), 
.article-body :deep(h3) {
  font-size: 22px;
  font-weight: 700;
  color: #1C2421;
  margin: 40px 0 20px;
}

.article-body :deep(p) { margin: 0 0 24px; }
.article-body :deep(img) { 
  max-width: 100%; 
  border-radius: 16px; 
  margin: 32px 0; 
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}
.article-body :deep(a) { color: #2A483A; text-decoration: none; font-weight: 600; }
.article-body :deep(a:hover) { text-decoration: underline; }

.empty-body {
  text-align: center;
  color: #94A3B8;
  padding: 60px 0;
  font-style: italic;
  background: rgba(0,0,0,0.02);
  border-radius: 12px;
}

/* 附件区 */
.article-attachments {
  margin: 0 60px 60px;
  padding-top: 32px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.attachments-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #1C2421;
  margin: 0 0 20px;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attachment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.04);
  padding: 16px 20px;
  border-radius: 12px;
  transition: all 0.2s;
}

.attachment-item:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.att-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.att-icon {
  font-size: 20px;
  color: #94A3B8;
}

.att-name {
  font-size: 14px;
  font-weight: 600;
  color: #1C2421;
}

.action-text-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 700;
  color: #2A483A;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.action-text-btn:hover {
  background: rgba(42, 72, 58, 0.08);
  color: #1C2421;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .padding-area { padding: 16px; }
  .article-header { padding: 32px 24px 20px; }
  .article-title { font-size: 24px; }
  .article-abstract, .article-body, .article-attachments { margin-left: 24px; margin-right: 24px; }
  .article-cover { height: 200px; }
  .cover-overlay { height: 80px; }
}
</style>