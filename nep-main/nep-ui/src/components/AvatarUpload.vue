<template>
  <div class="avatar-upload">
    <el-upload
      class="avatar-uploader"
      :action="uploadUrl"
      :headers="headers"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      name="file"
    >
      <div class="avatar-wrapper" :style="{ width: size+'px', height: size+'px' }">
        <el-avatar v-if="displayUrl" :size="size" :src="displayUrl" />
        <div v-else class="upload-placeholder">
          <el-icon :size="size * 0.35"><Plus /></el-icon>
        </div>
        <!-- hover 遮罩：提示可更换 -->
        <div class="avatar-overlay" v-if="displayUrl">
          <el-icon :size="size * 0.3"><Camera /></el-icon>
          <span>更换</span>
        </div>
      </div>
    </el-upload>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Camera } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  size: { type: Number, default: 100 }
})
const emit = defineEmits(['update:modelValue', 'uploaded'])

const uploadUrl = '/api/file/avatar'
const internalUrl = ref('')

watch(() => props.modelValue, (val) => {
  if (val && !internalUrl.value) internalUrl.value = val
}, { immediate: true })

const displayUrl = computed(() => internalUrl.value || props.modelValue)

const headers = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

function beforeUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) { ElMessage.error('只能上传图片文件！'); return false }
  if (!isLt5M) { ElMessage.error('图片大小不能超过5MB！'); return false }
  return true
}

function handleSuccess(response) {
  if (response.code === 200) {
    internalUrl.value = response.data
    emit('update:modelValue', response.data)
    emit('uploaded', response.data)
    // 不弹提示——上传成功仅表示文件已就绪，保存由父组件统一处理
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

function handleError() {
  ElMessage.error('上传失败，请重试')
}
</script>

<style scoped>
.avatar-wrapper {
  position: relative; border-radius: 50%; overflow: hidden;
  cursor: pointer;
}
.upload-placeholder {
  width: 100%; height: 100%; border: 2px dashed rgba(28,36,33,0.15);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.25s; color: #A0AAB2; background: rgba(28,36,33,0.02);
}
.upload-placeholder:hover { border-color: #2A483A; color: #2A483A; background: rgba(42,72,58,0.04); }

/* hover 遮罩：提示可更换 */
.avatar-overlay {
  position: absolute; inset: 0; border-radius: 50%;
  background: rgba(0,0,0,0.35); color: #fff;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  opacity: 0; transition: opacity 0.25s; font-size: 11px; font-weight: 600;
}
.avatar-wrapper:hover .avatar-overlay { opacity: 1; }

.avatar-uploader :deep(.el-upload) {
  display: inline-flex; align-items: center; justify-content: center;
}
.avatar-uploader :deep(.el-avatar) {
  border-radius: 50%; overflow: hidden; flex-shrink: 0; display: block;
}
.avatar-uploader :deep(.el-avatar img) {
  width: 100%; height: 100%; object-fit: cover;
}
</style>
