<template>
  <teleport to="body">
    <transition name="tpd-fade">
      <div v-if="visible" class="tpd-overlay" @click.self="$emit('close')">
        <div class="tpd-dialog">
          <div class="tpd-header">
            <div class="tpd-header-left">
              <div class="tpd-icon"><el-icon :size="20"><Setting /></el-icon></div>
              <div>
                <div class="tpd-title">系统偏好</div>
                <div class="tpd-sub">自定义界面主题外观</div>
              </div>
            </div>
            <button class="tpd-close" @click="$emit('close')">
              <el-icon :size="18"><Close /></el-icon>
            </button>
          </div>

          <div class="tpd-body">
            <div class="tpd-section-title">主题外观</div>
            <div class="tpd-themes">
              <div class="tpd-card" :class="{ active: mode === 'light' }" @click="pick('light')">
                <div class="tpd-preview light">
                  <div class="tpd-pv-top"></div>
                  <div class="tpd-pv-side"></div>
                  <div class="tpd-pv-body">
                    <div class="tpd-pv-line short"></div>
                    <div class="tpd-pv-line"></div>
                  </div>
                </div>
                <span class="tpd-label">浅色</span>
              </div>
              <div class="tpd-card" :class="{ active: mode === 'dark' }" @click="pick('dark')">
                <div class="tpd-preview dark">
                  <div class="tpd-pv-top"></div>
                  <div class="tpd-pv-side"></div>
                  <div class="tpd-pv-body">
                    <div class="tpd-pv-line short"></div>
                    <div class="tpd-pv-line"></div>
                  </div>
                </div>
                <span class="tpd-label">深色</span>
              </div>
              <div class="tpd-card" :class="{ active: mode === 'system' }" @click="pick('system')">
                <div class="tpd-preview system">
                  <div class="tpd-pv-top"></div>
                  <div class="tpd-pv-side"></div>
                  <div class="tpd-pv-body">
                    <div class="tpd-pv-line short"></div>
                    <div class="tpd-pv-line"></div>
                  </div>
                </div>
                <span class="tpd-label">跟随系统</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { useDarkMode } from '@/composables/useDarkMode'
import { Setting, Close } from '@element-plus/icons-vue'

defineProps({ visible: Boolean })
defineEmits(['close'])
const { mode, setMode } = useDarkMode()
function pick(m) { setMode(m) }
</script>

<style scoped>
.tpd-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.3); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.tpd-dialog {
  width: 460px; background: #fff; border-radius: 22px;
  box-shadow: 0 32px 64px rgba(0,0,0,0.15); overflow: hidden;
}
.tpd-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24px 28px 16px;
}
.tpd-header-left { display: flex; align-items: center; gap: 12px; }
.tpd-icon {
  width: 40px; height: 40px; border-radius: 12px; display: flex;
  align-items: center; justify-content: center;
  background: rgba(245,158,11,0.08); color: #F59E0B;
}
.tpd-title { font-size: 17px; font-weight: 700; color: #1C2421; line-height: 1.3; }
.tpd-sub { font-size: 12px; color: #A0AAB2; }
.tpd-close {
  width: 34px; height: 34px; border-radius: 50%; border: none;
  background: rgba(28,36,33,0.04); color: #74807B; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.tpd-close:hover { background: rgba(28,36,33,0.1); color: #1C2421; }

.tpd-body { padding: 8px 28px 28px; }
.tpd-section-title {
  font-size: 12px; font-weight: 700; color: #A0AAB2;
  letter-spacing: 0.5px; margin-bottom: 14px;
}

.tpd-themes { display: flex; gap: 12px; }
.tpd-card {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 14px 10px; border-radius: 14px; cursor: pointer;
  border: 2px solid transparent; transition: all 0.25s;
}
.tpd-card:hover { background: rgba(28,36,33,0.03); }
.tpd-card.active {
  border-color: #2A483A; background: rgba(42,72,58,0.04);
  box-shadow: 0 0 0 3px rgba(42,72,58,0.06);
}
.tpd-label { font-size: 12px; font-weight: 600; color: #74807B; }
.tpd-card.active .tpd-label { color: #2A483A; }

.tpd-preview {
  width: 90px; height: 60px; border-radius: 10px; overflow: hidden;
  position: relative; border: 1px solid rgba(0,0,0,0.08);
}
.tpd-preview.light { background: #F4F6F5; }
.tpd-preview.dark { background: #1a1a2e; }
.tpd-preview.system { background: linear-gradient(135deg, #F4F6F5 50%, #1a1a2e 50%); }
.tpd-pv-top { position: absolute; top: 0; left: 0; right: 0; height: 10px; }
.tpd-preview.light .tpd-pv-top { background: #fff; }
.tpd-preview.dark .tpd-pv-top { background: #2d2d44; }
.tpd-preview.system .tpd-pv-top { background: linear-gradient(90deg, #fff 50%, #2d2d44 50%); }
.tpd-pv-side { position: absolute; left: 0; top: 10px; bottom: 0; width: 16px; }
.tpd-preview.light .tpd-pv-side { background: #e8ece9; }
.tpd-preview.dark .tpd-pv-side { background: #252540; }
.tpd-preview.system .tpd-pv-side { background: linear-gradient(180deg, #e8ece9 50%, #252540 50%); }
.tpd-pv-body { position: absolute; left: 20px; top: 14px; right: 6px; bottom: 6px; display: flex; flex-direction: column; gap: 4px; }
.tpd-pv-line { height: 4px; border-radius: 2px; width: 100%; }
.tpd-preview.light .tpd-pv-line { background: #d5dcd8; }
.tpd-preview.dark .tpd-pv-line { background: #3d3d60; }
.tpd-preview.system .tpd-pv-line { background: linear-gradient(90deg, #d5dcd8 50%, #3d3d60 50%); }
.tpd-pv-line.short { width: 60%; }

.tpd-fade-enter-active, .tpd-fade-leave-active { transition: opacity 0.25s ease; }
.tpd-fade-enter-from, .tpd-fade-leave-to { opacity: 0; }
</style>
