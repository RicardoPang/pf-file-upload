<template>
  <div class="file-item">
    <div class="file-item-top">
      <span>{{ fileName }} {{ fileSize }}</span>
    </div>
    <div class="file-item-progress">
      <el-progress
        :percentage="progress > 100 ? 100 : progress"
        :show-text="false"
        :color="'#265AEB'"
        :stroke-width="10"
      >
      </el-progress>
    </div>
    <div class="file-item-value">
      <span class="percentage-value">{{ progress }}% done</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  fileName: {
    type: String,
    default: null
  },
  fileSize: {
    type: String,
    default: '0'
  },
  progress: {
    type: Number,
    default: 0
  }
})
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
