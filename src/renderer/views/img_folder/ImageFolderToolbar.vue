<template>
  <!-- <div flex="main:justify cross:center" class="toolbar"> -->
  <div flex="main:left cross:top" class="toolbar">    
    <div class="left" flex="cross:center" >
      <!-- 后退按钮 -->
      <div class="router-back">
        <!-- :title="`${$t('common.hotKey')}：esc`" -->
        <span @click="goBack" class="btn">
          <i class="el-icon-d-arrow-left"></i>
          {{ $t('nav.back') }}
        </span>
      </div>
      <!-- 已选 -->
      <SelectedBtn
        :selectedList="imageList"
        :focusListIndex="new Array(groupCount).fill(0).map((_, index) => index + startIndex)"
        @update="setImages"
        @remove="removeSelectFolder"
        @click="emptySelectFolder"
      />
      <!-- 分组选择 -->
      <el-input-number
        v-model="groupNum"
        @change="changeGroup"
        size="mini"
        :step="1"
        :min="1"
        :max="maxGroupNum"
        :title="$t('general.groupNum')"
        label="groupNum"
        class="group-number"
      ></el-input-number>
      <!-- 线性差值，临近差值 -->
      <el-radio-group v-model="smooth" class="smooth" size="mini">
        <el-radio-button :label="false">{{ $t('imageCenter.nearestInterpolation') }}</el-radio-button>
        <el-radio-button :label="true">{{ $t('imageCenter.bilinearInterpolation') }}</el-radio-button>
      </el-radio-group>
    </div>
    <div class="tip" flex="cross:center">
      <div class="select">
        <span v-show="showSelectedMsg" class="msg">
          {{ $t('imageCenter.shortSelectedMsg') }}
        </span>
        <!-- 空间不足, 取消选中提示 -->
        <span v-show="false && showSelectedMsg" class="msg">
          {{ $t('imageCenter.selectedMsg') }}
        </span>
      </div>
    </div>
    <div class="middle">
      <el-button-group class="gap" flex="cross:center">
        <!-- 上一帧 -->
        <el-button
          :disabled="!videoPaused"
          type="text"
          size="mini"
          @click="frameSteps(-1)"
          :title="$t('imageCenter.frameSteps1')"
        >
          <span class="svg-container" :title="$t('imageCenter.frameSteps1')">
            <svg-icon icon-class="frame" />
          </span>
        </el-button>
        <!-- 下一帧 -->
        <el-button
          :disabled="!videoPaused"
          type="text"
          size="mini"
          @click="frameSteps(1)"
          :title="$t('imageCenter.frameSteps2')"
        >
          <span class="svg-container" :title="$t('imageCenter.frameSteps2')">
            <svg-icon icon-class="frame" style="transform: rotate(180deg)" />
          </span>
        </el-button>
        <!-- 播放 -->
        <el-button type="text" :title="$t('video.play')" @click="changeStatus(CONSTANTS.IMAGE_FOLDER_PLAY_STATUS_START)">
          <span class="svg-container">
            <svg-icon icon-class="play" :clicked="!videoPaused" />
          </span>
        </el-button>
        <!-- 暂停 -->
        <el-button type="text" @click="changeStatus(CONSTANTS.IMAGE_FOLDER_PLAY_STATUS_PAUSE)" :title="$t('video.pause')">
          <span class="svg-container">
            <svg-icon icon-class="pause" :clicked="videoPaused" />
          </span>
        </el-button>
        <!-- 重置 -->
        <el-button type="text" @click="changeStatus(CONSTANTS.IMAGE_FOLDER_PLAY_STATUS_RESET)" :title="$t('video.reset')">
          <span class="svg-container">
            <svg-icon icon-class="restart" />
          </span>
        </el-button>
        <!-- <el-button type="text" @click="changeLoop" :title="$t('video.loop')">
          <span class="svg-container" flex="cross:center">
            <svg-icon icon-class="loop" :clicked="loop" />
          </span>
        </el-button> -->
        <!-- 倍速 -->
        <!-- 不加allow-create属性， 即不允许创建自定义速度，因为经测试发现视频设置3及之上的播放速度时，时快时慢 -->
        <el-select
          v-model="speed"
          placeholder="speed"
          size="mini"
          filterable
          default-first-option
          allow-create
          :title="$t('video.speed')"
          class="layout-selector"
        >
          <el-option
            v-for="({ label, value }, index) in speedOpts"
            :key="index"
            :label="label"
            :value="value"
          ></el-option>
        </el-select>
      </el-button-group>
    </div>
    <div class="right">
      <div class="tool-btns">
        <el-button-group class="gap">
          <el-button
            type="text"
            @click="pickColor"
            size="mini"
            :title="$t('imageCenter.colorPicker') + ' ' + $t('common.hotKey') + ':cmd/ctrl+p'"
          >
            <svg-icon
              icon-class="pick-color"
              :clicked="traggerRGB"
              style="font-size: 20px; margin-right: 2px; transform: translateY(2px)"
            />
          </el-button>
          <el-button
            type="text"
            size="mini"
            :title="`choose images to generate GIF`"
            @click="$refs.gifDialog.show()"
            :disabled="!videoPaused"
          >
            <span class="svg-container" :title="$t('imageCenter.generateGIF')">
              <svg-icon icon-class="gif" />
            </span>
          </el-button>
          <GifDialog ref="gifDialog" :selectList="imageList.slice(startIndex, startIndex + groupCount)"></GifDialog>
          <el-button
            :disabled="!videoPaused"
            type="text"
            size="mini"
            :title="$t('general.shareAsProject')"
            @click="handleShare"
          >
            <span class="svg-container" :title="$t('general.share')">
              <svg-icon icon-class="share" />
            </span>
          </el-button>
        </el-button-group>
        <el-divider direction="vertical"></el-divider>
        <el-button-group class="gap">
          <el-button
            type="text"
            size="mini"
            @mousedown.native="overlay(GLOBAL_CONSTANTS.DIRECTION_LEFT)"
            @mouseup.native="cancelOverlay(GLOBAL_CONSTANTS.DIRECTION_LEFT)"
            :title="$t('imageCenter.overlayLeft')"
          >
            <span class="svg-container">
              <svg-icon icon-class="direction-left" />
            </span>
          </el-button>
          <el-button
            type="text"
            size="mini"
            @mousedown.native="overlay(GLOBAL_CONSTANTS.DIRECTION_RIGHT)"
            @mouseup.native="cancelOverlay(GLOBAL_CONSTANTS.DIRECTION_RIGHT)"
            :title="$t('imageCenter.overlayRight')"
          >
            <span class="svg-container">
              <svg-icon icon-class="direction-left" class="svg-container" style="transform: rotate(180deg)" />
            </span>
          </el-button>
          <el-button
            type="text"
            size="mini"
            @mousedown.native="overlay(GLOBAL_CONSTANTS.DIRECTION_BOTTOM)"
            @mouseup.native="cancelOverlay(GLOBAL_CONSTANTS.DIRECTION_BOTTOM)"
            :title="$t('imageCenter.overlayBottom')"
          >
            <span class="svg-container">
              <svg-icon icon-class="direction-left" style="transform: rotate(-90deg)" />
            </span>
          </el-button>
          <el-button
            type="text"
            size="mini"
            @mousedown.native="overlay(GLOBAL_CONSTANTS.DIRECTION_TOP)"
            @mouseup.native="cancelOverlay(GLOBAL_CONSTANTS.DIRECTION_TOP)"
            :title="$t('imageCenter.overlayTop')"
          >
            <span class="svg-container">
              <svg-icon icon-class="direction-left" style="transform: rotate(90deg)" />
            </span>
          </el-button>
        </el-button-group>
        <el-button-group class="gap">
          <el-button type="text" @click="rotate(90)" size="mini" :title="$t('imageCenter.rotate')">
            <span class="svg-container">
              <svg-icon icon-class="rotate" />
            </span>
          </el-button>
          <el-button type="text" @click="reverse(1)" :title="$t('imageCenter.horizontalFlip')" size="mini">
            <span class="svg-container">
              <svg-icon icon-class="horizontal-flip" />
            </span>
          </el-button>
          <el-button type="text" size="mini" @click="reverse(-1)" :title="$t('imageCenter.verticalFlip')">
            <span class="svg-container">
              <svg-icon icon-class="vertical-flip" />
            </span>
          </el-button>
        </el-button-group>
        <el-divider direction="vertical"></el-divider>
        <el-button-group class="gap">
          <el-button type="text" size="mini" @click="align(false)" :title="$t('imageCenter.align')">
            <span class="svg-container">
              <svg-icon icon-class="align" />
            </span>
          </el-button>
          <el-button type="text" size="mini" @click="align(true)" :title="$t('imageCenter.align2')">
            <span class="svg-container">
              <svg-icon icon-class="align2" />
            </span>
          </el-button>
          <el-button type="text" size="mini" @click="resetCanvas(false)" :title="$t('imageCenter.adaptive')">
            <span class="svg-container">
              <svg-icon icon-class="adaptive" />
            </span>
          </el-button>
          <el-button type="text" size="mini" @click="resetCanvas(true)" :title="$t('imageCenter.fullsize')">
            <span class="svg-container">
              <svg-icon icon-class="fullsize" />
            </span>
          </el-button>
        </el-button-group>
        <el-select
          v-model="layout"
          placeholder="layout"
          class="layout-selector"
          size="mini"
          :title="$t('general.layout')"
        >
          <el-option
            v-for="item in [
              GLOBAL_CONSTANTS.LAYOUT_1X1,
              GLOBAL_CONSTANTS.LAYOUT_1X2,
              GLOBAL_CONSTANTS.LAYOUT_2X1,
              GLOBAL_CONSTANTS.LAYOUT_2X2,
              GLOBAL_CONSTANTS.LAYOUT_3X1,
              GLOBAL_CONSTANTS.LAYOUT_3X2,
              GLOBAL_CONSTANTS.LAYOUT_4X1
            ]"
            :disabled="imageList.length < parseInt(item[0]) * parseInt(item[2])"
            :key="item"
            :label="item"
            :value="item"
          ></el-option>
        </el-select>
        <el-button-group class="gap">
          <ImageSetting></ImageSetting>
        </el-button-group>
      </div>
    </div>
  </div>
</template>

<script>
import * as GLOBAL_CONSTANTS from '@/constants'
import * as CONSTANTS from './image-folder-constants'
import SelectedBtn from '@/components/selected-btn'
import { createNamespacedHelpers } from 'vuex'
import GifDialog from '@/components/gif-dialog'
import ImageSetting from '@/components/image-setting'
const { mapGetters, mapActions } = createNamespacedHelpers('imageFolderStore')
const { mapGetters: preferenceMapGetters } = createNamespacedHelpers('preferenceStore')
import { throttle } from '@/utils'
import { handleEvent } from '@/tools/hotkey'
import { ImageFolderPlayTimerManager } from '@/utils/imageFolderPlayManager'

export default {
  data() {
    return {
      CONSTANTS,
      GLOBAL_CONSTANTS,
      dialogVisible: false,
      traggerRGB: false,
      showSelectedMsg: false,
      groupNum: 0,
      startIndex: 0,
      currentTime: 0,
      timeId: null,
      offset: 0,
      loop: false,
      videoPaused: true,
      speedOpts: [
        {
          label: '2.0x',
          value: 2.0
        },
        {
          label: '1.5x',
          value: 1.5
        },
        {
          label: '1.0x',
          value: 1
        },
        {
          label: '0.75x',
          value: 0.75
        },
        {
          label: '0.5x',
          value: 0.5
        },
        {
          label: '0.25x',
          value: 0.25
        }
      ],
      hotkeyDownEvents: undefined,
      hotkeyUpEvents: undefined
    }
  },
  components: { SelectedBtn, GifDialog, ImageSetting },
  async mounted() {
    this.initHotkeyEvents()
    window.addEventListener('keydown', this.handleHotKey, true)
    window.addEventListener('keyup', this.handleHotKeyUp, true)
    this.$bus.$on('image_handleSelect', this.handleSelect)
    this.$bus.$on('allImageFolderPlayEnded', this.handleAllImageFolderPlayEnded)
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleHotKey, true)
    window.removeEventListener('keyup', this.handleHotKeyUp, true)
    this.$bus.$off('image_handleSelect', this.handleSelect)
    this.$bus.$off('allImageFolderPlayEnded', this.handleAllImageFolderPlayEnded)
  },
  methods: {
    ...mapActions(['emptySelectFolder', 'removeSelectFolder', 'setImageConfig', 'setImages']),
    initHotkeyEvents() {
      this.hotkeyDownEvents = new Map([
        [
          'back',
          () => {
            if (this.fullScreening && document.fullscreenElement && document.fullscreenElement.nodeName === 'VIDEO') {
              document.exitFullscreen()
              this.setImageConfig({ fullScreening: false })
              document.body.removeChild(document.body.lastChild)
            } else {
              this.goBack()
            }
          }
        ],
        [
          'pickColor',
          () => {
            this.pickColor()
          }
        ],
        [
          'previousGroup',
          () => {
            if (this.groupNum > 1) {
              this.groupNum--
              this.changeGroup(this.groupNum, this.groupNum + 1)
            }
          }
        ],
        [
          'nextGroup',
          () => {
            if (this.groupNum < this.maxGroupNum) {
              this.groupNum++
              this.changeGroup(this.groupNum, this.groupNum - 1)
            }
          }
        ],
        [
          'previousFrame',
          () => {
            if (this.videoPaused) {
              this.frameSteps(-1)
            }
          }
        ],
        [
          'nextFrame',
          () => {
            if (this.videoPaused) {
              this.frameSteps(1)
            }
          }
        ],
        [
          'top',
          () => {
            this.overlay(GLOBAL_CONSTANTS.DIRECTION_TOP)
          }
        ],
        [
          'left',
          () => {
            this.overlay(GLOBAL_CONSTANTS.DIRECTION_LEFT)
          }
        ],
        [
          'bottom',
          () => {
            this.overlay(GLOBAL_CONSTANTS.DIRECTION_BOTTOM)
          }
        ],
        [
          'right',
          () => {
            this.overlay(GLOBAL_CONSTANTS.DIRECTION_RIGHT)
          }
        ],
        [
          'togglePlay',
          () => {
            console.info("--------togglePlay-----IMAGE_FOLDER_PLAY_STATUS_START-")
            this.changeStatus(this.videoPaused ? CONSTANTS.IMAGE_FOLDER_PLAY_STATUS_START : CONSTANTS.IMAGE_FOLDER_PLAY_STATUS_PAUSE)
          }
        ],
        [
          'moveDown',
          () => {
            this.broadCast({
              name: 'doDrag',
              data: { offset: { x: 0, y: this.preference.moveDistance } }
            })
          }
        ],
        [
          'moveUp',
          () => {
            this.broadCast({
              name: 'doDrag',
              data: { offset: { x: 0, y: -this.preference.moveDistance } }
            })
          }
        ],
        [
          'moveRight',
          () => {
            this.broadCast({
              name: 'doDrag',
              data: { offset: { x: this.preference.moveDistance, y: 0 } }
            })
          }
        ],
        [
          'moveLeft',
          () => {
            this.broadCast({
              name: 'doDrag',
              data: { offset: { x: -this.preference.moveDistance, y: 0 } }
            })
          }
        ]
      ])

      this.hotkeyUpEvents = new Map([
        [
          'top',
          () => {
            this.cancelOverlay(GLOBAL_CONSTANTS.DIRECTION_TOP)
          }
        ],
        [
          'left',
          () => {
            this.cancelOverlay(GLOBAL_CONSTANTS.DIRECTION_LEFT)
          }
        ],
        [
          'bottom',
          () => {
            this.cancelOverlay(GLOBAL_CONSTANTS.DIRECTION_BOTTOM)
          }
        ],
        [
          'right',
          () => {
            this.cancelOverlay(GLOBAL_CONSTANTS.DIRECTION_RIGHT)
          }
        ]
      ])
    },
    handleHotKey(event) {
      handleEvent(event, this.hotkeyDownEvents)
      // // esc
      // if (event.keyCode === 27) {
      //   // 默认返回上一页， 若为  全屏状态则退出全屏
      //   if (
      //     this.fullScreening &&
      //     document.fullscreenElement &&
      //     document.fullscreenElement.nodeName === 'VIDEO'
      //   ) {
      //     document.exitFullscreen();
      //     this.setImageConfig({ fullScreening: false });
      //     document.body.removeChild(document.body.lastChild);
      //   } else {
      //     this.goBack();
      //   }
      // }
      // // cmd/ctrl+p
      // else if ((event.metaKey || event.ctrlKey) && event.keyCode === 80) {
      //   this.pickColor();
      // }
      // // cmd/ctrl + ← 向前切换一个分组
      // else if (
      //   (event.metaKey || event.ctrlKey) &&
      //   event.keyCode === 37 &&
      //   this.groupNum > 1
      // ) {
      //   this.groupNum--;
      //   this.changeGroup(this.groupNum, this.groupNum + 1);
      // }
      // // cmd/ctrl + → 向后切换一个分组
      // else if (
      //   (event.metaKey || event.ctrlKey) &&
      //   event.keyCode === 39 &&
      //   this.groupNum < this.maxGroupNum
      // ) {
      //   this.groupNum++;
      //   this.changeGroup(this.groupNum, this.groupNum - 1);
      // }
      // // cmd/ctrl + b 触发逐帧对比 向前播放 (暂停时可用)
      // else if (
      //   this.videoPaused &&
      //   (event.metaKey || event.ctrlKey) &&
      //   event.keyCode === 66
      // ) {
      //   this.frameSteps(-1);
      // }

      // // cmd/ctrl + n 触发逐帧对比 向后播放 (暂停时可用)
      // else if (
      //   this.videoPaused &&
      //   (event.metaKey || event.ctrlKey) &&
      //   event.keyCode === 78
      // ) {
      //   this.frameSteps(1);
      // }
      // // 空格键触发 播放/暂停
      // else if (event.key === ' ') {
      //   this.changeStatus(
      //     this.videoPaused
      //       ? CONSTANTS.IMAGE_FOLDER_PLAY_STATUS_START
      //       : CONSTANTS.IMAGE_FOLDER_PLAY_STATUS_PAUSE
      //   );
      // }
      // // 向上overlay 的快捷键
      // else if (event.key.toLowerCase() === 'w' || event.key === 'ArrowUp') {
      //   event.stopPropagation();
      //   this.overlay(GLOBAL_CONSTANTS.DIRECTION_TOP);
      // }
      // // 向下overlay 的快捷键
      // else if (event.key.toLowerCase() === 's' || event.key === 'ArrowDown') {
      //   event.stopPropagation();
      //   this.overlay(GLOBAL_CONSTANTS.DIRECTION_BOTTOM);
      // }
      // // 向左overlay 的快捷键
      // else if (event.key.toLowerCase() === 'a' || event.key === 'ArrowLeft') {
      //   event.stopPropagation();
      //   this.overlay(GLOBAL_CONSTANTS.DIRECTION_LEFT);
      // }
      // // 向右overlay 的快捷键
      // else if (event.key.toLowerCase() === 'd' || event.key === 'ArrowRight') {
      //   event.stopPropagation();
      //   this.overlay(GLOBAL_CONSTANTS.DIRECTION_RIGHT);
      // }
    },
    handleHotKeyUp(event) {
      handleEvent(event, this.hotkeyUpEvents)
      // // 向上overlay 的快捷键
      // if (event.key.toLowerCase() === 'w' || event.key === 'ArrowUp') {
      //   event.stopPropagation();
      //   this.cancelOverlay(GLOBAL_CONSTANTS.DIRECTION_TOP);
      // }
      // // 向下overlay 的快捷键
      // else if (event.key.toLowerCase() === 's' || event.key === 'ArrowDown') {
      //   event.stopPropagation();
      //   this.cancelOverlay(GLOBAL_CONSTANTS.DIRECTION_BOTTOM);
      // }
      // // 向左overlay 的快捷键
      // else if (event.key.toLowerCase() === 'a' || event.key === 'ArrowLeft') {
      //   event.stopPropagation();
      //   this.cancelOverlay(GLOBAL_CONSTANTS.DIRECTION_LEFT);
      // }
      // // 向右overlay 的快捷键
      // else if (event.key.toLowerCase() === 'd' || event.key === 'ArrowRight') {
      //   event.stopPropagation();
      //   this.cancelOverlay(GLOBAL_CONSTANTS.DIRECTION_RIGHT);
      // }
    },
    changeStatus(status) {
      console.info("--------ImageFolderToolbar--------changeStatus:", status)
      switch (status) {
        case 1:
        case CONSTANTS.IMAGE_FOLDER_PLAY_STATUS_START:
          this.videoPaused = false
          ImageFolderPlayTimerManager.play()
          break
        case 0:
        case CONSTANTS.IMAGE_FOLDER_PLAY_STATUS_PAUSE:
          this.videoPaused = true
          ImageFolderPlayTimerManager.pause()
          break
        case -1:
        case CONSTANTS.IMAGE_FOLDER_PLAY_STATUS_RESET:
          this.videoPaused = true
          ImageFolderPlayTimerManager.reset(true)
          break
        default:
          console.error('unknown actions:', status)
          break
      }
      this.$bus.$emit(CONSTANTS.BUS_IMAGE_FOLDER_COMPARE_ACTION, status)
    },
    broadCast({ name, data }) {
      throttle(16, () => {
        this.$bus.$emit('image_broadcast', {
          name,
          data
        })
      })()
    },
    changeLoop() {
      this.loop = !this.loop
      this.$bus.$emit('changeLoop', this.loop)
    },
    changeGroup(groupNum, oldGroupNum) {
      this.startIndex = Math.max(0, this.startIndex - this.groupCount * (oldGroupNum - groupNum))
      this.$refs.gifDialog.clear() // 清空gifDialog上次所选
      this.$bus.$emit('changeGroup', this.startIndex)
    },
    changeGroup(groupNum) {
      this.startIndex = Math.max(0, (groupNum - 1) * this.groupCount + this.offset)
      this.$bus.$emit('changeGroup', this.startIndex)
    },
    handleShare() {
      this.$bus.$emit('share')
    },
    handleSelect(data) {
      this.showSelectedMsg = !!data
    },
    handleAllImageFolderPlayEnded() {
      this.changeStatus(0)
    },
    handleReset() {
      this.$bus.$emit(CONSTANTS.BUS_IMAGE_FOLDER_COMPARE_ACTION_RESET)
      this.imgScale = 1
    },
    // handleChangeVideoPaused() {
    //   const paused = this.$parent.$refs.content.$refs['video_canvas'].every((item) => item.paused === true)
    //   if (this.videoPaused !== paused) {
    //     this.videoPaused = paused
    //   }
    // },
    goBack() {
      if (window.history.length > 1) {
        this.$router.back()
      } else {
        // 如果强制reload导致没有历史路由 唯一的历史就是当前页面 则回到默认的历史页面
        this.$router.push('/img_folder/index')
      }
    },
    resetCanvas(data) {
      this.$bus.$emit('imageCenter_resetCanvas', { name: 'reset', data })
    },
    overlay(direction) {
      this.$bus.$emit('setOverLay', {
        direction,
        status: true
      })
    },
    cancelOverlay(direction) {
      this.$bus.$emit('setOverLay', {
        direction,
        status: false
      })
    },
    async pickColor() {
      this.traggerRGB = !this.traggerRGB
      this.$bus.$emit('image_broadcast', {
        name: 'pickColor',
        data: { status: this.traggerRGB }
      })
    },
    /**
     * 图像旋转
     * @param {deg} data 旋转的角度
     */
    rotate(data) {
      this.$bus.$emit('imageCenter_rotate', { name: 'rotate', data })
    },
    /**
     * 图像镜像翻转
     * @param {boolean} data 1为水平镜像翻转， -1为垂直镜像翻转
     */
    reverse(data) {
      this.$bus.$emit('imageCenter_reverse', { name: 'reverse', data })
    },
    /**
     * 逐帧对比
     * @param {number} flag 下一帧为1，前一帧为-1
     */
    frameSteps(flag = 1) {
      this.$bus.$emit('imageFolder_frameSteps', {
        name: 'frameSteps',
        data: flag
      })
    },
    async align(beSameSize) {
      const data = await new Promise((resolve) => {
        this.$bus.$emit('imageCenter_getSelectedPosition', { name: 'getSelectedPosition', data: beSameSize }, (res) =>
          resolve(res)
        )
      })
      this.$bus.$emit('imageCenter_align', {
        name: 'align',
        data: { beSameSize, ...data }
      })
    }
  },
  computed: {
    ...mapGetters(['imageList', 'folderFileListMap', 'imageConfig']),
    ...preferenceMapGetters(['preference']),
    maxGroupNum() {
      return Math.ceil(this.imageList.length / (this.layout[0] * this.layout[2]))
    },
    // 每组图片数量
    groupCount() {
      const str = this.imageConfig.layout,
        len = str.length
      return str[len - 3] * str[len - 1]
    },
    // 所有视频都为暂停状态
    // videoPaused: {
    //   get() {
    //     return this.imageConfig.allVideoPaused
    //   },
    //   set(newVal) {
    //     this.setImageConfig({ allVideoPaused: newVal })
    //   }
    // },
    smooth: {
      get() {
        return this.imageConfig.smooth
      },
      set(newVal) {
        this.setImageConfig({ smooth: newVal })
      }
    },
    layout: {
      get() {
        return this.imageConfig.layout
      },
      set(val) {
        this.$bus.$emit('changeImageFolderSliderVisible', { value: false })
        const preNum = this.groupCount * (this.groupNum - 1)
        this.setImageConfig({ layout: val })
        const afterNum = this.groupCount * (this.groupNum - 1)
        this.offset = preNum - afterNum
        this.startIndex = Math.max(0, (this.groupNum - 1) * this.groupCount + this.offset)
        this.$bus.$emit('changeGroup', this.startIndex)
        this.groupNum = Math.floor(this.startIndex / this.groupCount)
      }
    },
    speed: {
      get() {
        return this.imageConfig.speed
      },
      set(val) {
        const type = typeof val
        let _speed = 1.0
        switch (type) {
          case 'number':
            _speed = val
            break
          case 'string':
            const reg = /^(?<num>\d+\.?\d*)[xX]?/
            const {
              groups: { num }
            } = reg.exec(val)
            if (num) {
              _speed = parseFloat(num)
            } else return
            break
          default:
            return
        }
        ImageFolderPlayTimerManager.setVelocity(_speed)
        console.log('current speed:', _speed)
        this.setImageConfig({ speed: _speed })
      }
    },
    fullScreening() {
      return this.imageConfig.fullScreening
    },
    isFixed() {
      return this.preference.videoProcessBarStyle === 'fixed'
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.toolbar {
  // height: 28px !important;  // 去掉固定高度，避免不够宽时造成的叠放
  position: relative;
  padding: 0 5px;
  flex-wrap: wrap;

  .gap + .gap {
    margin-left: 10px;
  }

  .help-info {
    color: #409eff;
    line-height: 28px;
    margin-left: 5px;
  }

  .svg-container {
    font-size: 24px;
  }

  .left {
    // width: 200px !important;
    // min-width: 200px;
    position: relative;

    .router-back {
      .btn {
        cursor: pointer;
        margin-right: 10px;
        color: $labelColor;

        &:hover {
          color: #303133;
        }
      }
    }

    .clear-images {
      margin-right: 10px;

      &:hover {
        color: #e93b3b;
      }
    }
  }

  .group-number {
    margin-top: 6px;
    margin-right: 10px;
  }
  .smooth {
    margin-top: 6px;
    flex-wrap: nowrap;
  }
  .tip {
    position: relative;
    width: 0;

    .select {
      position: absolute;
      left: 0;
      width: 100px;
      transform: translateX(-50%);

      .msg {
        font-size: 12px;
        color: red;
      }
    }
  }

  .middle {
    position: relative;

    .layout-selector {
      width: 80px;
      margin-left: 10px;
    }

    .el-button-group {
      .svg-container {
        margin-left: 0.3rem;
      }

      .progress-bar {
        margin-left: 20px;
      }
    }
  }

  .right {
    margin-left: 10px;
    .layout-selector {
      width: 80px;
      margin-left: 10px;
    }
  }
}
</style>
