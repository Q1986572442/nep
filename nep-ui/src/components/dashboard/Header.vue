<template>
  <header class="dashboard-header">
    <div class="header-bg"></div>
    <div class="header-border"></div>
    <div class="header-glow-line"></div>
    <div class="header-content">
      <div class="header-left">
        <div class="logo">
          <div class="logo-icon">
            <div class="icon-ring"></div>
            <div class="icon-core"></div>
          </div>
          <span class="logo-text">NEP Monitor</span>
        </div>
      </div>
      <div class="header-center">
        <div class="status-indicator">
          <span class="status-dot"></span>
          <span class="status-text">系统运行正常</span>
        </div>
      </div>
      <div class="header-right">
        <div class="time-display">
          <span class="time-value">{{ currentTime }}</span>
          <span class="date-value">{{ currentDate }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const currentTime = ref('')
const currentDate = ref('')
let timeInterval = null

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
  currentDate.value = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })
}

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.dashboard-header {
  position: relative;
  height: 62px;
  background: linear-gradient(180deg, rgba(10, 25, 49, 0.98) 0%, rgba(5, 12, 22, 0.96) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  overflow: hidden;
  z-index: 100;
}

.header-bg {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse at 20% 50%, rgba(0, 229, 255, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 50%, rgba(155, 89, 182, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 0%, rgba(64, 158, 255, 0.08) 0%, transparent 40%);
}

.header-border {
  position: absolute;
  inset: 1px;
  border-radius: 0;
  border: 1px solid transparent;
  background: linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(155, 89, 182, 0.1) 100%) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

.header-glow-line {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(0, 229, 255, 0.5) 20%, 
    rgba(155, 89, 182, 0.5) 50%, 
    rgba(0, 229, 255, 0.5) 80%, 
    transparent 100%);
  border-radius: 2px;
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.6);
}

.header-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  position: relative;
  width: 36px;
  height: 36px;
}

.icon-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(0, 229, 255, 0.6);
  animation: ringRotate 8s linear infinite;
}

.icon-ring::before {
  content: '';
  position: absolute;
  top: -4px;
  left: 50%;
  width: 6px;
  height: 6px;
  background: #00E5FF;
  border-radius: 50%;
  transform: translateX(-50%);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.9);
}

@keyframes ringRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.icon-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #00E5FF 0%, #9B59B6 100%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.7);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 2px;
  text-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
}

.header-center {
  display: flex;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(16, 172, 132, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(16, 172, 132, 0.3);
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #10AC84;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(16, 172, 132, 0.8);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

.status-text {
  font-size: 12px;
  font-weight: 500;
  color: rgba(16, 172, 132, 0.9);
}

.header-right {
  display: flex;
  align-items: center;
}

.time-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.time-value {
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  font-family: 'DIN Alternate', 'SF Mono', monospace;
  text-shadow: 0 0 15px rgba(0, 229, 255, 0.5);
  letter-spacing: 1px;
}

.date-value {
  font-size: 11px;
  color: rgba(138, 158, 188, 0.7);
  letter-spacing: 0.5px;
}
</style>