<template>
  <div class="notification-page">
    <div class="page-header glass-panel">
      <div class="header-left">
        <div class="header-icon-box">
          <el-icon :size="22"><Bell /></el-icon>
        </div>
        <div>
          <h2 class="page-title">通知中心</h2>
          <p class="page-subtitle">系统消息与业务提醒</p>
        </div>
      </div>
      <div class="header-right">
        <button class="mark-all-btn" @click="handleReadAll" :disabled="unreadCount === 0">
          <el-icon><Check /></el-icon>
          <span>{{ unreadCount > 0 ? `全部已读 (${unreadCount})` : '无未读' }}</span>
        </button>
      </div>
    </div>

    <div class="notification-list" v-loading="loading">
      <template v-for="item in notifications" :key="item.id">
        <div
          class="notif-item glass-panel"
          :class="{ unread: item.isRead === 0 }"
          @click="handleRead(item)"
        >
          <div class="notif-icon" :class="'type-' + (item.type || 'system').toLowerCase()">
            <el-icon :size="18">
              <Bell v-if="item.type === 'ASSIGN'" />
              <ChatDotRound v-else-if="item.type === 'FEEDBACK'" />
              <Notification v-else />
            </el-icon>
          </div>
          <div class="notif-content">
            <div class="notif-header">
              <span class="notif-type-tag">{{ typeLabel(item.type) }}</span>
              <span class="notif-title">{{ item.title }}</span>
              <span v-if="item.isRead === 0" class="unread-dot"></span>
            </div>
            <div class="notif-text">{{ item.content || '' }}</div>
            <div class="notif-time">{{ formatTime(item.createTime) }}</div>
          </div>
          <button class="notif-delete" @click.stop="handleDelete(item.id)" title="删除">
            <el-icon :size="14"><Close /></el-icon>
          </button>
        </div>
      </template>

      <div v-if="!loading && notifications.length === 0" class="empty-state">
        <div class="empty-icon-ring">
          <el-icon :size="32"><Bell /></el-icon>
        </div>
        <p class="empty-title">暂无通知</p>
        <p class="empty-desc">当反馈被指派、检测完成或有系统消息时，这里会收到提醒</p>
      </div>
    </div>

    <div class="pagination-wrapper" v-if="total > size">
      <el-pagination v-model:current-page="page" :page-size="size" :total="total" layout="total, prev, pager, next" @current-change="fetchData" background />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getNotificationPage, getUnreadCount, readNotification, readAllNotifications, deleteNotification } from '@/api/notification'
import { ElMessage } from 'element-plus'
import { Bell, ChatDotRound, Notification, Check, Close } from '@element-plus/icons-vue'

function typeLabel(type) {
  const map = { ASSIGN: '新任务', FEEDBACK: '反馈进度', SYSTEM: '系统', NEWS: '新闻' }
  return map[type] || '消息'
}

const notifications = ref([])
const loading = ref(false)
const unreadCount = ref(0)
const page = ref(1)
const size = ref(10)
const total = ref(0)
const userId = ref(Number(localStorage.getItem('userId') || 0))

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t.replace(' ', 'T') + (t.includes('+') ? '' : '+08:00'))
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + ' 分钟前'
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + ' 小时前'
  if (diff < 172_800_000) return '昨天 ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0')
  return t.replace('T', ' ').substring(0, 10)
}

async function fetchData() {
  loading.value = true
  try {
    const [notifRes, countRes] = await Promise.all([
      getNotificationPage(page.value, size.value, userId.value),
      getUnreadCount(userId.value)
    ])
    notifications.value = notifRes.data || []
    total.value = notifRes.total || 0
    unreadCount.value = countRes.data?.unreadCount || 0
  } catch (e) {} finally { loading.value = false }
}

async function handleRead(item) {
  if (item.isRead === 0) {
    try {
      await readNotification(item.id)
      item.isRead = 1
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (e) {}
  }
}

async function handleReadAll() {
  try {
    await readAllNotifications(userId.value)
    notifications.value.forEach(n => n.isRead = 1)
    unreadCount.value = 0
    ElMessage.success('已全部标记为已读')
  } catch (e) {}
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定删除该通知？', '提示', { type: 'warning' })
    await deleteNotification(id)
    notifications.value = notifications.value.filter(n => n.id !== id)
    ElMessage.success('已删除')
  } catch (e) {}
}

onMounted(fetchData)
</script>

<style scoped>
.notification-page { width: 100%; padding: 28px 32px; height: 100%; display: flex; flex-direction: column; gap: 20px; box-sizing: border-box; }
.page-header { display: flex; justify-content: space-between; align-items: center; padding: 22px 32px; border-radius: 20px; flex-shrink: 0; }
.header-left { display: flex; align-items: center; gap: 14px; }
.header-icon-box { width: 44px; height: 44px; border-radius: 14px; background: rgba(42,72,58,0.08); color: #2A483A; display: flex; align-items: center; justify-content: center; }
.page-title { font-size: 20px; font-weight: 700; margin: 0; color: #1C2421; line-height: 1.3; }
.page-subtitle { font-size: 12px; color: #74807B; margin: 2px 0 0; }

.mark-all-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 36px; padding: 0 16px; border: 1px solid rgba(28,36,33,0.1); border-radius: 10px;
  background: #fff; color: #74807B; font-size: 12px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.mark-all-btn:hover:not(:disabled) { border-color: #2A483A; color: #2A483A; }
.mark-all-btn:disabled { opacity: 0.4; cursor: default; }

.notification-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
.notification-list::-webkit-scrollbar { width: 3px; }
.notification-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 3px; }

.notif-item {
  display: flex; align-items: flex-start; gap: 16px;
  padding: 16px 24px; border-radius: 14px; cursor: pointer;
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative; overflow: hidden;
}
.notif-item::after {
  content: ''; position: absolute; inset: 0; border-radius: 14px;
  background: radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(42,72,58,0.04) 0%, transparent 60%);
  opacity: 0; transition: opacity 0.3s;
}
.notif-item:active::after { opacity: 1; }
.notif-item:hover { transform: translateX(4px); box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
.notif-item.unread { background: rgba(59,130,246,0.04); border: 1px solid rgba(59,130,246,0.12); }

.notif-icon {
  width: 46px; height: 46px; border-radius: 13px; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;
}
.notif-icon.type-assign { background: rgba(59,130,246,0.08); color: #3B82F6; }
.notif-icon.type-feedback { background: rgba(42,168,118,0.08); color: #2AA876; }
.notif-icon.type-system { background: rgba(28,36,33,0.05); color: #74807B; }
.notif-icon.type-news { background: rgba(245,158,11,0.08); color: #F59E0B; }

.notif-content { flex: 1; min-width: 0; }
.notif-header { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.notif-type-tag {
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 5px; white-space: nowrap;
}
.notif-item.unread .notif-type-tag { background: rgba(59,130,246,0.1); color: #3B82F6; }
.notif-item:not(.unread) .notif-type-tag { background: rgba(28,36,33,0.03); color: #A0AAB2; }
.notif-title { font-size: 14px; font-weight: 600; color: #1C2421; }
.unread-dot { width: 7px; height: 7px; border-radius: 50%; background: #3B82F6; flex-shrink: 0; margin-left: auto; }
.notif-text { font-size: 13px; color: #74807B; margin-bottom: 4px; line-height: 1.5; }
.notif-time { font-size: 11px; color: #A0AAB2; }

.notif-delete {
  width: 30px; height: 30px; border-radius: 8px; border: none;
  background: transparent; color: #A0AAB2; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; margin-top: 1px; opacity: 0;
}
.notif-item:hover .notif-delete { opacity: 1; }
.notif-delete:hover { background: rgba(239,68,68,0.08); color: #EF4444; }

/* 空态 */
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 80px 20px; }
.empty-icon-ring {
  width: 80px; height: 80px; border-radius: 50%;
  background: rgba(28,36,33,0.03); display: flex;
  align-items: center; justify-content: center; color: #A0AAB2; margin-bottom: 20px;
}
.empty-title { font-size: 16px; font-weight: 600; color: #1C2421; margin: 0 0 6px; }
.empty-desc { font-size: 13px; color: #A0AAB2; margin: 0; max-width: 340px; text-align: center; }

.pagination-wrapper { display: flex; justify-content: center; flex-shrink: 0; }
.glass-panel { background: rgba(255,255,255,0.6); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.8); box-shadow: 0 8px 32px -8px rgba(0,0,0,0.04); }
</style>
