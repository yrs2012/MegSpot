import * as GLOBAL_CONSTANT from '../../constants'
import { stat } from 'fs'
import { file } from 'jszip'
import { isDirectory, readDir, readDirSync, getFileStatSync, scanFolderSync, trimSep, formatFileSize } from '@/utils/file'
import { EOF, DELIMITER, SORTING_FILE_NAME } from '@/constants'
import Vue from 'vue'

const imageFolderStore = {
  namespaced: true,
  state: {
    imageFolders: [],
    imageList: [],
    imageConfig: {
      smooth: true,
      layout: GLOBAL_CONSTANT.LAYOUT_2X1,

      // folder compare
      speed: 1.0,
      allVideoPaused: true, // 所有视频都为暂停状态

      defaultSort: {
        order: 'asc',
        field: 'name'
      }
    },
    //当前文件夹路径
    currentPath: '',
    // 记忆文件树展开
    expandData: [],
    // 选择文件夹
    isInitFileListMap: false,
    folderFileListMap: Object.create(null) // new Map() // not support Map {}  //{/* "folderPath", [folderFileList] */}
  },
  getters: {
    imageList: (state) => state.imageList,
    imageFolders: (state) => state.imageFolders,
    getImageFolders: (state) => () => state.imageFolders,
    imageConfig: (state) => state.imageConfig,
    currentPath: (state) => state.currentPath,
    expandData: (state) => state.expandData,
    folderFileListMap: (state) => state.folderFileListMap
  },
  mutations: {
    SET_IMAGE_CONFIG: (state, configOb) => {
      const newConfig = Object.assign({}, state.imageConfig, configOb)
      state.imageConfig = newConfig
    },
    SET_IMAGE_FOLDERS: (state, folders) => {
      state.imageFolders = folders.map(trimSep)
    },
    ADD_IMAGE_FOLDER: (state, folder) => {
      if (!state.imageFolders.includes(trimSep(folder))) {
        const tmp = [...state.imageFolders]
        tmp.push(folder)
        state.imageFolders = tmp
      }
    },
    REMOVE_IMAGE_FOLDER: (state, folder) => {
      if (state.imageFolders.includes(trimSep(folder))) {
        const tmp = [...state.imageFolders]
        tmp.splice(state.imageFolders.indexOf(folder), 1)
        state.imageFolders = tmp
      }
    },
    ADD_IMAGE: (state, image) => {
      if (image && !state.imageList.includes(image)) {
        state.imageList = [...state.imageList, image]
      }
    },
    ADD_IMAGES: (state, images) => {
      images.forEach((path) => {
        if(!Object.keys(state.folderFileListMap).includes(path)) {
          let options = {
            include:['.jpg','.jpeg','.png','.svg']
          }
          let fileList  = scanFolderSync(path, options)
          if(fileList.length > 0) {
            Vue.set(state.folderFileListMap, path, fileList)
            if (!state.imageList.includes(path)) {
              state.imageList = [...state.imageList, path]
            }
          }
        }
      })
    },
    REMOVE_IMAGES: (state, images) => {
      const tmp = [...state.imageList]
      images.forEach((image) => {
        let index = tmp.indexOf(image)
        if (index > -1) {
          tmp.splice(index, 1)
        }
      })
      state.imageList = tmp
      
      images.forEach((image) => {
        if(Object.keys(state.folderFileListMap).includes(image)) {
          Vue.delete(state.folderFileListMap, image)
        }
      })
    
    },
    SET_IMAGES: (state, newImageList) => {
      state.imageList = newImageList
      var newMap = Object.create(null)
      state.imageList.forEach((path) => {
        if(Object.keys(state.folderFileListMap).includes(path)) {
          Vue.set(newMap, path, state.folderFileListMap[path])
        } else { // // 新加
          let options = {
            include:['.jpg','.jpeg','.png','.svg']
          }
          let fileList  = scanFolderSync(path, options)
          if(fileList.length > 0) {
            Vue.set(newMap, path, fileList)
            if (!state.imageList.includes(folderPath)) {
              state.imageList = [...state.imageList, folderPath]
            }
          }
        }
      })
      state.folderFileListMap = newMap
    },
    EMPTY_IMAGE: (state) => {
      state.imageList = []
      let keys = Object.keys(state.folderFileListMap)
      keys.forEach((path) => {
        Vue.delete(state.folderFileListMap, path)
      })
    },
    // 修改当前文件夹
    SET_CURRENT_FOLDER_PATH: (state, newFolderPath) => {
      state.currentPath = newFolderPath
    },
    // 记忆文件树展开情况
    ADD_IMAGE_EXPAND_DATA: (state, newOpenFolder) => {
      state.expandData.push(newOpenFolder)
    },
    REMOVE_IMAGE_EXPAND_DATA: (state, closeFolder) => {
      state.expandData = state.expandData.filter((item) => {
        return !item.startsWith(closeFolder)
      })
    },
    ADD_SELECT_FOLDER: (state, {folderPath, fileList}) => {
      if (!folderPath) {
        return
      }
      let selectFileListArray = Array.isArray(fileList) ? fileList : [fileList]
      if(selectFileListArray.length > 0) {
        Vue.set(state.folderFileListMap, folderPath, selectFileListArray)
        if (folderPath && !state.imageList.includes(folderPath)) {
          state.imageList = [...state.imageList, folderPath]
        }
      } else {
        let options = {
          include:['.jpg','.jpeg','.png','.svg']
        }
        let fileList  = scanFolderSync(folderPath, options)
        if(fileList.length > 0) {
          Vue.set(state.folderFileListMap, folderPath, fileList)
          if (!state.imageList.includes(folderPath)) {
            state.imageList = [...state.imageList, folderPath]
          }
        }
      }
    },
    REMOVE_SELECT_FOLDER: (state, folder) => {
      if(Object.keys(state.folderFileListMap).includes(folder)) {
        Vue.delete(state.folderFileListMap, folder)
      }
      // remove
      const tmp = [...state.imageList]
      let index = tmp.indexOf(folder)
      if (index > -1) {
        tmp.splice(index, 1)
        state.imageList = tmp
      }

    },
    EMPTY_SELECT_FOLDER: (state) => {
      let keys = Object.keys(state.folderFileListMap)
      keys.forEach((path) => {
        Vue.delete(state.folderFileListMap, path)
      })
      state.imageList = []
    }
  },
  actions: {
    setImageConfig({ commit }, config) {
      commit('SET_IMAGE_CONFIG', config)
    },
    setImageFolders({ commit }, folders) {
      commit('SET_IMAGE_FOLDERS', folders)
    },
    addImageFolders({ commit }, folders) {
      if (!Array.isArray(folders)) {
        commit('ADD_IMAGE_FOLDER', folders)
      } else {
        folders.forEach((item) => commit('ADD_IMAGE_FOLDER', item))
      }
    },
    removeImageFolders({ commit }, folders) {
      if (!Array.isArray(folders)) {
        commit('REMOVE_IMAGE_FOLDER', folders)
      } else {
        folders.forEach((item) => commit('REMOVE_IMAGE_FOLDER', item))
      }
    },
    addImages({ commit }, images) {
      if (!Array.isArray(images)) {
        commit('ADD_IMAGE', images)
      } else {
        commit('ADD_IMAGES', images)
      }
    },
    removeImages({ commit }, images) {
      commit('REMOVE_IMAGES', Array.isArray(images) ? images : [images])
    },
    setImages({ commit }, newImageList) {
      commit('SET_IMAGES', newImageList)
    },
    emptyImages({ commit }) {
      commit('EMPTY_IMAGE')
    },
    //修改当前文件夹路径
    setFolderPath({ commit }, newFolderPath) {
      commit('SET_CURRENT_FOLDER_PATH', newFolderPath)
    },
    // 记忆文件树展开
    addExpandData({ commit }, newFolder) {
      commit('ADD_IMAGE_EXPAND_DATA', newFolder)
    },
    removeExpandData({ commit }, newFolderArr) {
      commit('REMOVE_IMAGE_EXPAND_DATA', newFolderArr)
    },
    addSelectFolder({ commit }, {folderPath, fileList}) { // 形参名称必须与参数名称一致
      commit('ADD_SELECT_FOLDER', {folderPath, fileList})
    },
    removeSelectFolder({ commit }, selectFolder) {
      commit('REMOVE_SELECT_FOLDER', selectFolder)
    },
    emptySelectFolder({ commit }) {
      commit('EMPTY_SELECT_FOLDER')
    }
  }
}

export default imageFolderStore
