import { TimingObject } from 'timing-object'
import { setTimingsrc } from 'timingsrc'
import { getType, getUuidv4 } from '@/utils'
import store from '../store'

export const DEFAULT_TIMING_FN = ({ acceleration, position, timestamp, velocity }) => {
  return {
    acceleration,
    position,
    timestamp,
    velocity
  }
}

export class ImageFolderPlayTimer {
  constructor() {
    this.timeConfigs = new Map()
    this.ready = false
    this.maxDuration = 0
  }

  play(options) {
    if (!this.ready) return
    const speed = store.getters?.['imageFolderStore/imageConfig']?.speed || 1
    
  }

  pause() {
    if (!this.ready) return
  }

  reset(pause = false) {
    if (!this.ready) return
    
  }

  checkStatus() {
   
    console.log(
      'video timer ready status',
      this.ready,
      Array.from(this.timeConfigs.values()).every((item) => item.video.readyState >= 2)
    )
    return this.ready
  }

  cleartimeConfigs(validArr) {
    console.log('cleartimeConfigs')
    this.timeConfigs = null
    this.timeConfigs = new Map()
    this.reset()
  }

  getStatus() {
    return this.ready
  }

  gettimeConfigs() {
    return this.timeConfigs
  }
}

export const ImageFolderPlayTimerManager = new ImageFolderPlayTimer()
