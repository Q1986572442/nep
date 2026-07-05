<template>
  <div class="manage-page">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <el-icon :size="22"><Collection /></el-icon>
        </div>
        <div>
          <h3>文献发布管理</h3>
          <span class="header-sub">发布环保知识、规章条例、作业标准等文献</span>
        </div>
      </div>
      <button class="publish-btn" @click="openDialog(null)">
        <el-icon><Plus /></el-icon>
        <span>发布文献</span>
      </button>
    </div>

    <!-- 状态筛选 + 数据表格 -->
    <div class="table-card" v-loading="loading">
      <!-- 筛选 Tab -->
      <div class="filter-tabs">
        <button
          v-for="tab in statusTabs" :key="tab.value"
          class="filter-tab"
          :class="{ active: statusFilter === tab.value }"
          @click="switchFilter(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
      <el-table :data="list" stripe class="knowledge-table" highlight-current-row>
        <el-table-column type="index" :index="rowIndex" label="序号" width="62" align="center" />
        <el-table-column label="文献信息" min-width="340">
          <template #default="{ row }">
            <div class="doc-info">
              <div class="doc-cover" v-if="row.coverImage">
                <img :src="row.coverImage" alt="" />
              </div>
              <div class="doc-cover doc-cover-fallback" v-else>
                <el-icon :size="18"><Document /></el-icon>
              </div>
              <div class="doc-text">
                <span class="doc-title" @click="previewArticle(row)">{{ row.title }}</span>
                <span class="doc-summary">{{ row.summary || '暂无摘要' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="105" align="center">
          <template #default="{ row }">
            <span class="cat-badge" :class="'cat-' + (row.category || 'AIR').toLowerCase()">
              {{ catLabel(row.category) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="source-text">{{ row.source || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="浏览" width="72" align="center" sortable>
          <template #default="{ row }">
            <span class="view-count">{{ row.viewCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <span class="status-badge" :class="row.status === 1 ? 'on' : 'off'">
              {{ row.status === 1 ? '已发布' : '草稿' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发布时间" width="120" align="center">
          <template #default="{ row }">{{ fmt(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <button class="row-btn edit" @click="openDialog(row)" title="编辑">
                <el-icon :size="15"><Edit /></el-icon>
              </button>
              <button class="row-btn view" @click="previewArticle(row)" title="预览">
                <el-icon :size="15"><View /></el-icon>
              </button>
              <button class="row-btn del" @click="handleDelete(row.id)" title="删除">
                <el-icon :size="15"><Delete /></el-icon>
              </button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-box" v-if="total > size">
        <el-pagination
          v-model:current-page="page" :page-size="size" :total="total"
          layout="total, prev, pager, next" @current-change="fetchList" background
        />
      </div>
    </div>

    <!-- ===== 发布 / 编辑对话框 ===== -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑文献' : '发布新文献'"
      width="860px" destroy-on-close top="3vh"
      class="publish-dialog" :show-close="false"
    >
      <template #header>
        <div class="dialog-header-sticky">
          <div class="dialog-header">
            <div class="dialog-header-left">
              <div class="dialog-icon">
                <el-icon :size="20"><EditPen /></el-icon>
              </div>
              <div>
                <div class="dialog-title">{{ isEdit ? '编辑文献' : '发布新文献' }}</div>
                <div class="dialog-sub">{{ isEdit ? '修改文献信息并保存' : '填写文献信息并发布到知识库' }}</div>
              </div>
            </div>
            <button class="dialog-close" @click="dialogVisible = false">
              <el-icon :size="20"><Close /></el-icon>
            </button>
          </div>
        </div>
      </template>

      <el-form :model="form" label-position="top" class="publish-form">
        <div class="form-row two-col">
          <el-form-item label="文献标题" required class="grow-3">
            <el-input v-model="form.title" placeholder="请输入文献标题" maxlength="200" show-word-limit size="large" />
          </el-form-item>
          <el-form-item label="分类" required>
            <el-select v-model="form.category" placeholder="选择分类" style="width:150px" size="large">
              <el-option v-for="opt in catOptions" :key="opt.value"
                :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
        </div>

        <div class="form-row two-col">
          <el-form-item label="来源 / 作者">
            <el-input v-model="form.source" placeholder="如：中国环境科学研究院" />
          </el-form-item>
          <el-form-item label="发布状态">
            <div class="status-toggle">
              <button type="button" class="toggle-option" :class="{ active: form.status === 1 }" @click="form.status = 1">
                <span class="toggle-dot on"></span> 发布
              </button>
              <button type="button" class="toggle-option" :class="{ active: form.status === 0 }" @click="form.status = 0">
                <span class="toggle-dot off"></span> 存为草稿
              </button>
            </div>
          </el-form-item>
        </div>

        <el-form-item label="内容摘要">
          <el-input v-model="form.summary" type="textarea" :rows="2"
            placeholder="简要概述文献内容，将展示在列表页" maxlength="500" show-word-limit />
        </el-form-item>

        <!-- 封面图 -->
        <el-form-item label="封面图片">
          <div class="cover-section">
            <div class="cover-preview" v-if="form.coverImage">
              <img :src="form.coverImage" alt="封面预览" />
              <div class="cover-mask">
                <button class="cover-action" @click="form.coverImage = ''">
                  <el-icon :size="18"><Delete /></el-icon>
                </button>
                <span class="cover-ready">封面已就绪</span>
              </div>
            </div>
            <div class="cover-upload-area" v-else>
              <el-upload :show-file-list="false" :before-upload="handleCoverUpload" accept="image/*" drag>
                <el-icon :size="28"><Plus /></el-icon>
                <span class="upload-text">点击或拖拽上传封面图</span>
                <span class="upload-sub">JPG / PNG / WebP，建议 1200×630，≤ 5MB</span>
              </el-upload>
            </div>
          </div>
        </el-form-item>

        <!-- 正文 -->
        <el-form-item label="正文内容">
          <el-input v-model="form.content" type="textarea" :rows="10"
            placeholder="支持 HTML 格式。可粘贴图文内容，或直接编写 HTML 代码。" />
        </el-form-item>

        <!-- 附件 -->
        <el-form-item label="附件文件">
          <div class="attachment-section">
            <div class="attach-file-list" v-if="attachList.length > 0">
              <div class="attach-file-chip" v-for="(att, idx) in attachList" :key="idx">
                <div class="chip-icon" :class="fileTypeClass(att)">
                  <el-icon :size="14"><Document /></el-icon>
                </div>
                <span class="chip-name">{{ urlToName(att) }}</span>
                <button class="chip-remove" @click="removeAttachment(idx)">
                  <el-icon :size="12"><Close /></el-icon>
                </button>
              </div>
            </div>
            <el-upload
              :show-file-list="false" :before-upload="handleAttachUpload"
              :disabled="uploadingAttach"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z,.txt,.html"
            >
              <button type="button" class="attach-add-btn" :class="{ uploading: uploadingAttach }">
                <el-icon><Upload /></el-icon>
                <span>{{ uploadingAttach ? '上传中...' : (attachList.length > 0 ? '添加更多' : '上传附件') }}</span>
              </button>
            </el-upload>
            <span class="upload-hint">支持 PDF / Word / Excel / ZIP，上限 50MB，可多选</span>
          </div>
        </el-form-item>

        <el-form-item label="标签">
          <el-input v-model="tagsInput" placeholder="多个标签以逗号分隔，如：PM2.5, 防护指南, 大气污染" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <button class="footer-btn cancel" @click="dialogVisible = false">取消</button>
          <button class="footer-btn confirm" @click="handleSave" :disabled="saving">
            <el-icon v-if="saving" class="spin"><Loading /></el-icon>
            <span>{{ saving ? '保存中...' : (isEdit ? '更新文献' : '发布文献') }}</span>
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Upload, Link, Delete, Collection, Document,
  Edit, View, EditPen, Close, Loading
} from '@element-plus/icons-vue'
import { getKnowledgePage, createKnowledge, updateKnowledge, deleteKnowledge } from '@/api/knowledge'
import { uploadImage, uploadDoc } from '@/api/file'

const router = useRouter()
const list = ref([])
const loading = ref(false)
const saving = ref(false)
const page = ref(1)
const size = ref(10)
const total = ref(0)
const statusFilter = ref('all')

const statusTabs = [
  { label: '全部文献', value: 'all' },
  { label: '已发布', value: '1' },
  { label: '草稿', value: '0' }
]

function switchFilter(val) {
  statusFilter.value = val
  page.value = 1
  fetchList()
}

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const tagsInput = ref('')
const uploadingAttach = ref(false)

const catOptions = [
  { label: '大气环境', value: 'AIR' },
  { label: '水环境', value: 'WATER' },
  { label: '土壤环境', value: 'SOIL' },
  { label: '噪声污染', value: 'NOISE' },
  { label: '生态保护', value: 'ECOLOGY' }
]

const emptyForm = () => ({
  title: '', category: 'AIR', source: '', status: 1,
  summary: '', content: '', coverImage: '', attachmentUrl: '', tags: ''
})
const form = ref(emptyForm())
const attachList = ref([])

// ===== 工具函数 =====
function urlToName(att) {
  if (typeof att === 'object' && att.name) return att.name
  if (typeof att === 'string') {
    const parts = att.replace(/\\/g, '/').split('/')
    return parts[parts.length - 1] || att
  }
  return '未知文件'
}

function fileTypeClass(att) {
  const name = urlToName(att).toLowerCase()
  if (name.endsWith('.pdf')) return 'type-pdf'
  if (name.match(/\.(doc|docx)$/)) return 'type-doc'
  if (name.match(/\.(xls|xlsx)$/)) return 'type-xls'
  if (name.match(/\.(zip|rar|7z)$/)) return 'type-zip'
  return 'type-other'
}

function catLabel(cat) {
  const opt = catOptions.find(o => o.value === cat)
  return opt ? opt.label : (cat || '-')
}

function rowIndex(idx) { return (page.value - 1) * size.value + idx + 1 }
function fmt(t) {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 10)
}

// ===== 数据 =====
async function fetchList() {
  loading.value = true
  try {
    const params = {}
    const s = statusFilter.value
    if (s !== 'all') params.status = Number(s)
    const res = await getKnowledgePage(page.value, size.value, params)
    list.value = res.data || []
    total.value = res.total || 0
  } catch (e) { /* */ } finally { loading.value = false }
}

// ===== 对话框 =====
function openDialog(row) {
  if (row) {
    isEdit.value = true; editId.value = row.id
    // 显式转换 status 为数字，防 API 返回字符串导致严格相等比较失败
    const st = Number(row.status)
    form.value = {
      title: row.title || '', category: row.category || 'AIR', source: row.source || '',
      status: (st === 0 || st === 1) ? st : 1,
      summary: row.summary || '', content: row.content || '',
      coverImage: row.coverImage || '', attachmentUrl: row.attachmentUrl || '', tags: row.tags || ''
    }
    tagsInput.value = parseTags(row.tags)
    attachList.value = parseAttachArray(row.attachmentUrl)
  } else {
    isEdit.value = false; editId.value = null
    form.value = emptyForm()
    tagsInput.value = ''
    attachList.value = []
  }
  dialogVisible.value = true
}

function parseAttachArray(raw) {
  if (!raw) return []
  try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr.filter(Boolean) : [raw] }
  catch { return [raw] }
}

function parseTags(tagsStr) {
  if (!tagsStr) return ''
  try { return JSON.parse(tagsStr).join(', ') } catch { return tagsStr.replace(/[\[\]"]/g, '') }
}

// ===== 上传 =====
async function handleCoverUpload(file) {
  if (file.size > 5 * 1024 * 1024) { ElMessage.warning('图片大小不能超过5MB'); return false }
  try {
    const res = await uploadImage(file)
    form.value.coverImage = res.data
    ElMessage.success('封面上传成功')
  } catch (e) { ElMessage.error('上传失败') }
  return false
}

async function handleAttachUpload(file) {
  if (file.size > 50 * 1024 * 1024) { ElMessage.warning('附件不能超过50MB'); return false }
  uploadingAttach.value = true
  try {
    const res = await uploadDoc(file)
    attachList.value.push({ url: res.data, name: file.name })
    ElMessage.success('附件上传成功')
  } catch (e) { ElMessage.error('上传失败') }
  finally { uploadingAttach.value = false }
  return false
}

function removeAttachment(idx) { attachList.value.splice(idx, 1) }

// ===== 保存 / 删除 =====
async function handleSave() {
  if (!form.value.title.trim()) { ElMessage.warning('请输入文献标题'); return }
  saving.value = true
  try {
    const payload = { ...form.value }
    payload.attachmentUrl = attachList.value.length > 0 ? JSON.stringify(attachList.value) : ''
    if (tagsInput.value.trim()) {
      payload.tags = JSON.stringify(tagsInput.value.split(/[,，]/).map(t => t.trim()).filter(Boolean))
    } else { payload.tags = '[]' }
    if (isEdit.value) { await updateKnowledge(editId.value, payload); ElMessage.success('文献更新成功') }
    else {
      await createKnowledge(payload)
      ElMessage.success(payload.status === 0 ? '文献已存为草稿' : '文献发布成功')
    }
    dialogVisible.value = false
    page.value = 1
    fetchList()
  } catch (e) { ElMessage.error('保存失败: ' + (e.response?.data?.message || e.message || '未知错误')) }
  finally { saving.value = false }
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定删除该文献？删除后不可恢复。', '确认删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    await deleteKnowledge(id)
    ElMessage.success('文献已删除')
    fetchList()
  } catch (e) { if (e !== 'cancel') ElMessage.error('删除失败') }
}

function previewArticle(row) { router.push(`/admin/knowledge/${row.id}`) }

onMounted(fetchList)
</script>

<style scoped>
.manage-page {
  padding: 24px 28px; height: 100%;
  display: flex; flex-direction: column; gap: 20px;
  overflow-y: auto; background: linear-gradient(180deg, #F8FAFC 0%, #F4F6F5 100%);
}
.manage-page::-webkit-scrollbar { display: none; }

/* ===== 页头 ===== */
.page-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 22px 32px; flex-shrink: 0;
  background: rgba(255,255,255,0.7); backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.9); border-radius: 20px;
  box-shadow: 0 4px 24px -6px rgba(0,0,0,0.04);
}
.header-left { display: flex; align-items: center; gap: 16px; }
.header-icon {
  width: 46px; height: 46px; border-radius: 14px; display: flex;
  align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(42,72,58,0.06), rgba(42,72,58,0.12));
  color: #2A483A;
}
.header-left h3 { margin: 0; font-size: 20px; font-weight: 700; color: #1C2421; line-height: 1.3; }
.header-sub { font-size: 12px; color: #74807B; font-weight: 500; }
.publish-btn {
  display: inline-flex; align-items: center; gap: 7px;
  height: 42px; padding: 0 22px; border: none; border-radius: 14px;
  background: linear-gradient(135deg, #1C2421, #2A483A); color: #fff;
  font-size: 14px; font-weight: 700; cursor: pointer;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 4px 16px rgba(42,72,58,0.2);
}
.publish-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(42,72,58,0.3); }
.publish-btn:active { transform: scale(0.97); }

/* ===== 表格卡片 ===== */
.table-card {
  flex: 1; min-height: 0; display: flex; flex-direction: column;
  background: rgba(255,255,255,0.7); backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.9); border-radius: 20px;
  box-shadow: 0 4px 24px -6px rgba(0,0,0,0.04);
  padding: 8px 8px 0; overflow: hidden;
}

/* 筛选 Tabs */
.filter-tabs { display: flex; gap: 4px; padding: 12px 16px 8px; }
.filter-tab {
  height: 34px; padding: 0 16px; border: none; border-radius: 10px;
  background: transparent; color: #74807B; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px;
}
.filter-tab:hover { background: rgba(28,36,33,0.04); color: #1C2421; }
.filter-tab.active { background: rgba(42,72,58,0.06); color: #2A483A; }
.tab-count {
  font-size: 11px; font-weight: 700; background: rgba(28,36,33,0.06);
  padding: 1px 7px; border-radius: 6px;
}
.filter-tab.active .tab-count { background: rgba(42,72,58,0.12); }

.knowledge-table { flex: 1; }
.knowledge-table :deep(.el-table__header th) {
  background: rgba(28,36,33,0.02); color: #74807B; font-weight: 600;
  font-size: 12px; letter-spacing: 0.3px; border-bottom: 1px solid rgba(28,36,33,0.06); height: 44px;
}
.knowledge-table :deep(.el-table__body td) {
  border-bottom: 1px solid rgba(28,36,33,0.03); padding: 12px 0;
}
.knowledge-table :deep(.el-table__body tr) { transition: all 0.2s; }
.knowledge-table :deep(.el-table__body tr:hover) { background: rgba(42,72,58,0.025); }
.knowledge-table :deep(.el-table__row--striped) { background: rgba(28,36,33,0.012); }

/* 文献信息列 */
.doc-info { display: flex; align-items: center; gap: 14px; }
.doc-cover {
  width: 52px; height: 36px; border-radius: 8px; overflow: hidden;
  flex-shrink: 0; border: 1px solid rgba(0,0,0,0.05);
}
.doc-cover img { width: 100%; height: 100%; object-fit: cover; }
.doc-cover-fallback {
  background: rgba(28,36,33,0.04); display: flex;
  align-items: center; justify-content: center; color: #A0AAB2;
}
.doc-text { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.doc-title {
  font-size: 14px; font-weight: 600; color: #1C2421; cursor: pointer;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  transition: color 0.2s;
}
.doc-title:hover { color: #2A483A; }
.doc-summary {
  font-size: 12px; color: #A0AAB2; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}

/* 分类徽章 */
.cat-badge {
  display: inline-block; padding: 3px 10px; border-radius: 7px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
}
.cat-badge.cat-air { background: rgba(64,158,255,0.08); color: #409EFF; }
.cat-badge.cat-water { background: rgba(56,189,248,0.08); color: #38BDF8; }
.cat-badge.cat-soil { background: rgba(245,158,11,0.08); color: #F59E0B; }
.cat-badge.cat-noise { background: rgba(239,68,68,0.08); color: #EF4444; }
.cat-badge.cat-ecology { background: rgba(42,168,118,0.08); color: #2AA876; }

.source-text { font-size: 13px; color: #74807B; }
.view-count { font-size: 13px; font-weight: 600; color: #74807B; font-variant-numeric: tabular-nums; }

/* 状态 */
.status-badge {
  display: inline-block; padding: 3px 10px; border-radius: 7px;
  font-size: 11px; font-weight: 700;
}
.status-badge.on { background: rgba(42,168,118,0.08); color: #2AA876; }
.status-badge.off { background: rgba(28,36,33,0.04); color: #A0AAB2; }

/* 操作按钮行 */
.row-actions { display: flex; gap: 4px; justify-content: center; }
.row-btn {
  width: 34px; height: 34px; border: none; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s; background: transparent; color: #A0AAB2;
}
.row-btn:hover { color: #1C2421; background: rgba(28,36,33,0.05); }
.row-btn.edit:hover { color: #409EFF; background: rgba(64,158,255,0.08); }
.row-btn.view:hover { color: #2AA876; background: rgba(42,168,118,0.08); }
.row-btn.del:hover { color: #EF4444; background: rgba(239,68,68,0.08); }

.pagination-box { display: flex; justify-content: center; padding: 12px 0; }

/* ===== 对话框 ===== */
:deep(.publish-dialog) {
  background: #fff; border-radius: 24px; overflow: hidden;
  box-shadow: 0 32px 80px -16px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.04);
  animation: dialogIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes dialogIn {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
:deep(.publish-dialog .el-dialog__header) { padding: 0; margin: 0; border: none; }
:deep(.publish-dialog .el-dialog__body) { padding: 8px 32px 8px; max-height: 60vh; overflow-y: auto; }
:deep(.publish-dialog .el-dialog__body)::-webkit-scrollbar { width: 3px; }
:deep(.publish-dialog .el-dialog__body)::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 2px; }
:deep(.publish-dialog .el-dialog__footer) { padding: 16px 32px 24px; }

/* 毛玻璃固定头 */
.dialog-header-sticky {
  position: sticky; top: 0; z-index: 10;
  background: rgba(255,255,255,0.78); backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid rgba(28,36,33,0.04);
  padding: 20px 32px 16px; margin: 0;
}

.dialog-header { display: flex; justify-content: space-between; align-items: center; }
.dialog-header-left { display: flex; align-items: center; gap: 14px; }
.dialog-icon {
  width: 44px; height: 44px; border-radius: 14px; display: flex;
  align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(42,72,58,0.08), rgba(42,72,58,0.15));
  color: #2A483A;
}
.dialog-title { font-size: 19px; font-weight: 700; color: #1C2421; line-height: 1.3; }
.dialog-sub { font-size: 12px; color: #A0AAB2; font-weight: 500; }
.dialog-close {
  width: 38px; height: 38px; border-radius: 50%; border: none;
  background: rgba(28,36,33,0.04); color: #74807B; display: flex;
  align-items: center; justify-content: center; cursor: pointer;
  transition: all 0.2s; flex-shrink: 0;
}
.dialog-close:hover { background: rgba(28,36,33,0.1); color: #1C2421; transform: rotate(90deg); }

/* 表单 */
.publish-form { --el-form-label-font-size: 13px; }
.publish-form :deep(.el-form-item__label) {
  font-weight: 600; color: #74807B; padding-bottom: 5px;
  font-size: 13px; letter-spacing: 0.2px;
}
.publish-form :deep(.el-input__wrapper) {
  border-radius: 10px; box-shadow: none; border: 1px solid rgba(28,36,33,0.1);
  transition: all 0.25s; padding: 0 14px;
}
.publish-form :deep(.el-input__wrapper:hover) { border-color: rgba(28,36,33,0.2); background: rgba(28,36,33,0.005); }
.publish-form :deep(.el-input__wrapper.is-focus) {
  border-color: #2A483A; box-shadow: 0 0 0 3px rgba(42,72,58,0.06); background: #fff;
  transform: translateY(-1px);
}
.publish-form :deep(.el-textarea__inner) {
  border-radius: 10px; border: 1px solid rgba(28,36,33,0.1); transition: all 0.25s;
  font-size: 14px; line-height: 1.7; padding: 12px 14px;
}
.publish-form :deep(.el-textarea__inner:focus) {
  border-color: #2A483A; box-shadow: 0 0 0 3px rgba(42,72,58,0.06); transform: translateY(-1px);
}
.publish-form :deep(.el-select .el-input__wrapper) { border-radius: 10px; }
.publish-form :deep(.el-form-item) { margin-bottom: 20px; }

.form-row { display: flex; gap: 16px; }
.form-row.two-col > .el-form-item { flex: 1; }
.form-row.two-col > .grow-3 { flex: 3; }

/* 状态切换 */
.status-toggle { display: flex; gap: 2px; background: rgba(28,36,33,0.04); padding: 3px; border-radius: 10px; width: fit-content; }
.toggle-option {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 12px; border: none; border-radius: 8px; background: transparent;
  font-size: 13px; font-weight: 600; color: #74807B; cursor: pointer;
  transition: all 0.25s; white-space: nowrap;
}
.toggle-option:hover { color: #1C2421; }
.toggle-option.active { background: #fff; color: #1C2421; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.toggle-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
.toggle-dot.on { background: #2AA876; box-shadow: 0 0 0 2px rgba(42,168,118,0.2); }
.toggle-dot.off { background: #A0AAB2; }

/* 封面上传 */
.cover-section { }
.cover-preview { position: relative; display: inline-block; border-radius: 14px; overflow: hidden; }
.cover-preview img {
  width: 300px; height: 170px; object-fit: cover; display: block;
  border: 1px solid rgba(0,0,0,0.06); border-radius: 14px;
}
.cover-mask {
  position: absolute; inset: 0; background: rgba(0,0,0,0.25); border-radius: 14px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; opacity: 0; transition: opacity 0.25s;
}
.cover-preview:hover .cover-mask { opacity: 1; }
.cover-action {
  width: 38px; height: 38px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.95); color: #EF4444; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.cover-action:hover { transform: scale(1.1); }
.cover-ready { font-size: 12px; color: #fff; font-weight: 600; }

.cover-upload-area { width: 100%; }
:deep(.cover-upload-area .el-upload) { width: 100%; }
:deep(.cover-upload-area .el-upload-dragger) {
  width: 100%; height: 130px; border: 2px dashed rgba(28,36,33,0.1); border-radius: 14px;
  background: rgba(28,36,33,0.01); display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px; transition: all 0.3s;
}
:deep(.cover-upload-area .el-upload-dragger:hover) {
  border-color: #2A483A; background: rgba(42,72,58,0.03); transform: translateY(-2px);
  box-shadow: 0 8px 24px -8px rgba(42,72,58,0.08);
}
.upload-text { font-size: 13px; font-weight: 500; color: #74807B; }
.upload-sub { font-size: 11px; color: #A0AAB2; }

/* 附件区域 */
.attachment-section { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.attach-file-list { display: flex; gap: 6px; flex-wrap: wrap; }
.attach-file-chip {
  display: flex; align-items: center; gap: 8px; padding: 6px 8px 6px 10px;
  background: #F4F6F5; border-radius: 10px; border: 1px solid rgba(28,36,33,0.04);
  transition: all 0.2s;
}
.attach-file-chip:hover { background: #EEF0EF; transform: translateY(-1px); }
.chip-icon {
  width: 30px; height: 30px; border-radius: 8px; display: flex;
  align-items: center; justify-content: center; background: #fff;
}
.chip-icon.type-pdf { color: #EF4444; background: #FEF2F2; }
.chip-icon.type-doc { color: #3B82F6; background: #EFF6FF; }
.chip-icon.type-xls { color: #10B981; background: #ECFDF5; }
.chip-icon.type-zip { color: #F59E0B; background: #FFFBEB; }
.chip-icon.type-other { color: #6B7280; background: #F9FAFB; }
.chip-name { font-size: 12px; font-weight: 500; color: #1C2421; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chip-remove {
  width: 20px; height: 20px; border-radius: 50%; border: none;
  background: transparent; color: #A0AAB2; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.chip-remove:hover { background: rgba(239,68,68,0.1); color: #EF4444; transform: scale(1.15); }
.attach-add-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 36px; padding: 0 16px; border: 1px dashed rgba(28,36,33,0.15);
  border-radius: 10px; background: transparent; color: #74807B;
  font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.attach-add-btn:hover { border-color: #2A483A; color: #2A483A; background: rgba(42,72,58,0.03); transform: translateY(-1px); }
.attach-add-btn.uploading { opacity: 0.5; pointer-events: none; }
.upload-hint { font-size: 11px; color: #A0AAB2; margin-left: 4px; }

/* 对话框底部 */
.dialog-footer { display: flex; justify-content: flex-end; gap: 12px; }
.footer-btn {
  height: 44px; padding: 0 28px; border: none; border-radius: 14px;
  font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s;
  display: inline-flex; align-items: center; gap: 6px;
}
.footer-btn.cancel { background: rgba(28,36,33,0.05); color: #74807B; }
.footer-btn.cancel:hover { background: rgba(28,36,33,0.1); color: #1C2421; }
.footer-btn.confirm {
  background: linear-gradient(135deg, #1C2421, #2A483A); color: #fff;
  box-shadow: 0 4px 16px rgba(42,72,58,0.2);
}
.footer-btn.confirm:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(42,72,58,0.3); }
.footer-btn.confirm:active:not(:disabled) { transform: scale(0.97); }
.footer-btn.confirm:disabled { opacity: 0.5; cursor: not-allowed; }
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>

<style>
/* ===== 分类选择框 · 专属定制样式 ===== */
/* 选中态外框 */
.publish-dialog .el-select__wrapper,
html.dark .publish-dialog .el-select__wrapper {
  border-radius: 11px;
  padding: 0 14px;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  min-height: 42px;
}
/* 浅色主题 */
.publish-dialog .el-select__wrapper {
  background: rgba(28,36,33,0.025);
  box-shadow: 0 0 0 1px rgba(28,36,33,0.08) inset;
}
.publish-dialog .el-select__wrapper:hover {
  background: rgba(28,36,33,0.04);
  box-shadow: 0 0 0 1px rgba(28,36,33,0.15) inset;
}
.publish-dialog .el-select__wrapper.is-focus {
  background: #fff;
  box-shadow: 0 0 0 2px rgba(42,72,58,0.15), 0 0 0 1px #2A483A inset;
}
/* 深色主题 */
html.dark .publish-dialog .el-select__wrapper {
  background: rgba(255,255,255,0.04) !important;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.08) inset !important;
}
html.dark .publish-dialog .el-select__wrapper:hover {
  background: rgba(255,255,255,0.07) !important;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.14) inset !important;
}
html.dark .publish-dialog .el-select__wrapper.is-focus {
  background: rgba(255,255,255,0.1) !important;
  box-shadow: 0 0 0 2px rgba(103,194,58,0.2), 0 0 0 1px #67C23A inset !important;
}

/* 选中项文字 */
.publish-dialog .el-select__selected-item {
  font-weight: 600; font-size: 14px; letter-spacing: 0.2px;
}
html.dark .publish-dialog .el-select__selected-item { color: #E4E7ED !important; }

/* 下拉箭头 */
.publish-dialog .el-select__caret {
  color: #74807B; transition: transform 0.3s, color 0.2s; font-size: 12px;
}
.publish-dialog .el-select__wrapper.is-focus .el-select__caret {
  color: #2A483A; transform: rotate(180deg);
}
html.dark .publish-dialog .el-select__caret { color: #909399; }
html.dark .publish-dialog .el-select__wrapper.is-focus .el-select__caret { color: #67C23A; }

/* === 下拉菜单面板 === */
html.dark .el-select-dropdown {
  background: rgba(34,34,56,0.92) !important;
  backdrop-filter: blur(40px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(40px) saturate(200%) !important;
  border: 1px solid rgba(255,255,255,0.06) !important;
  border-radius: 14px !important;
  box-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.04) !important;
  overflow: hidden;
}
html.dark .el-select-dropdown__item {
  display: flex; align-items: center;
  height: 38px; line-height: 1; margin: 2px 6px; padding: 0 16px; border-radius: 10px;
  color: #C0C4CC !important; font-weight: 500; font-size: 13px;
  transition: all 0.15s;
}
html.dark .el-select-dropdown__item.hover,
html.dark .el-select-dropdown__item:hover,
html.dark .el-select-dropdown__item.is-hovering {
  background: rgba(103,194,58,0.08) !important; color: #67C23A !important;
}
html.dark .el-select-dropdown__item.selected {
  background: rgba(103,194,58,0.12) !important; color: #67C23A !important; font-weight: 700;
}
</style>
