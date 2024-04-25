<template>
  <div class="file-item">
    <div class="file-item-top">
      <span>{{ file.name }} {{ fileSize(file.totalSize) }}</span>
    </div>
    <div class="file-item-progress">
      <el-progress
        :percentage="Math.min(fileProgress(file), 100)"
        :show-text="false"
        :color="'#265AEB'"
        :stroke-width="10"
      >
      </el-progress>
    </div>
    <div class="file-item-value">
      <span class="percentage-value">{{ fileProgress(file) }}% done</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  file: {
    type: Object,
    default: null
  },
  progress: {
    type: Number,
    default: 0,
    required: false
  }
})

function fileSize(size) {
  if (!size) {
    return ''
  }
  size = +size
  const sizes = ['B', 'KB', 'MB', 'GB']
  let i = 0
  while (size >= 1024 && i < sizes.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(2)} ${sizes[i]}`
}

const fileProgress = (file) => {
  if (props.progress) {
    return props.progress
  }
  return +((file.uploadedSize / file.totalSize) * 100).toFixed(2)
}
</script>

<style lang="less" scoped>
.file-item {
  display: flex;
  flex-direction: column;
  margin-top: 32px;
  color: #6b7280;
  font-weight: 600;

  .file-item-top {
    display: flex;
    margin-bottom: 8px;
  }
  .file-item-top span {
    flex: 1;
  }
  .file-item-value {
    margin-top: 8px;
  }
}
.file-item:first-child {
  margin-top: 0;
}
</style>
