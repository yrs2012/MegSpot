<template>
  <div class="image-floder-center" flex="dir:top box:first">
    <ImageFolderToolbar v-bind:snapshotMode="snapshotMode"></ImageFolderToolbar>
    <ImageFolderContent v-bind:snapshotMode="snapshotMode" ref="content" class="content-container"></ImageFolderContent>
  </div>
</template>

<script>
import ImageFolderToolbar from './ImageFolderToolbar'
import ImageFolderContent from './ImageFolderContent'

export default {
  name: 'image-floder-compare',
  components: {
    ImageFolderToolbar,
    ImageFolderContent
  },
  computed: {
    snapshotMode() {
      return Boolean(this.$route.query.snapshotMode) || false
    }
  },
  provide() {
    return {
      getSnapshotMode: () => this.snapshotMode
    }
  }
}
</script>
<style lang="scss" scoped>
.image-floder-center {
  height: 100%;
  .content-container {
    background: #f4f4f5;
  }
}
</style>
