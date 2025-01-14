import fs,{ promises as fsPromises } from 'fs'
import path from 'path'
import MediaInfoFactory from "mediainfo.js";
var sizeof = require('image-size')
const { dialog } = require('@electron/remote')
import { SHARE_ZIP_EXT } from '@/tools/compress'

export const trimSep = (pathStr) => {
  let trimPath = pathStr
  if (pathStr.endsWith(path.sep)) {
    trimPath = pathStr.substring(0, pathStr.length - path.sep.length)
  }
  return trimPath
}

// 格式化文件大小  根据范围转化单位
export const formatFileSize = (fileSize) => {
  if (fileSize < 1024) {
    return fileSize + 'B'
  } else if (fileSize < 1024 * 1024) {
    return (fileSize / 1024).toFixed(2) + 'KB'
  } else if (fileSize < 1024 * 1024 * 1024) {
    return (fileSize / (1024 * 1024)).toFixed(2) + 'MB'
  } else {
    return (fileSize / (1024 * 1024 * 1024)).toFixed(2) + 'GB'
  }
}

// 获取图像、视频文件格式信息 
// const result = await analyze({
//   coverData: true,
//   file: "path/to/file",
//   format: "JSON",
//   full: true,
// });
export const analyze = async ({ coverData, file, format, full }) => {
  let fileHandle;
  let fileSize;
  let mediainfo;
  let result;

  if (coverData && !["JSON", "XML"].includes(format)) {
    throw TypeError(
      "For cover data you need to choose JSON or XML as output format!"
    );
  }

  const readChunk = async (size, offset) => {
    const buffer = new Uint8Array(size);
    await fileHandle.read(buffer, 0, size, offset);
    return buffer;
  };

  try {
    fileHandle = await fsPromises.open(file, "r");
    fileSize = (await fileHandle.stat()).size;
    // console.log("fileHandle", fileHandle.stat());
    mediainfo = await MediaInfoFactory({ format, coverData, full });
    // console.log("mediainfo", mediainfo);
    result = await mediainfo.analyzeData(() => fileSize, readChunk);
  } finally {
    fileHandle && (await fileHandle.close());
    mediainfo && mediainfo.close();
  }

  return result;
};

export const analyzeFile = async (path, options = {}) => {
  const result = await analyze(Object.assign({
    coverData: false,
    file: path,
    format: "JSON",
    full: true
  }, options));
  return result
}

// 获取文件尺寸
export const getFileSize = (path) => {
  try {
    return sizeof(path)
  } catch (e) {
    console.error(e.message)
    return {
      width: 'N/A',
      height: 'N/A'
    }
  }
}

// 获取格式化后的文件尺寸信息
export const getFormatFileSize = (path) => {
  return formatFileSize(getFileSize(path))
}

// 获取文件信息
export const getFileStat = (filepath) => {
  return new Promise((resolve, reject) => {
    fs.stat(filepath, (err, stats) => {
      if (err) return reject(err)
      return resolve(stats)
    })
  })
}
// 同步 获取文件信息
export const getFileStatSync = (filepath) => {
  return fs.statSync(filepath)
}

// 同步 读取文件内容
export const readFileSync = (filepath, arg = { encoding: 'utf-8' }) => {
  return fs.readFileSync(filepath, arg)
}

// 同步 写文件内容
export const writeFileSync = (filepath, data) => {
  return fs.writeFileSync(filepath, data, { encoding: 'utf-8' })
}

// 读取文件内容
export const readFile = (filepath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, (err, buffer) => {
      if (err) return reject(err)
      return resolve(buffer)
    })
  })
}

// [异步] 读文件夹内文件列表（第一级目录下）
export const readDir = (dir) => {
  return new Promise((resolve, reject) => {
    try {
      fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK)
      fs.readdir(path.resolve(dir), (err, files) => {
        if (err) return reject(err)
        files = files || []
        return resolve(files)
      })
    } catch (err) {
      console.error(`no access permissions! ${dir}`)
      return resolve([])
    }
  })
}

// [同步] 读文件夹内文件列表（第一级目录下）
export const readDirSync = (dir) => {
    try {
      fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK)
      return fs.readdirSync(dir,{ encoding: 'utf-8' })
    } catch (err) {
      console.error(`no access permissions! ${dir}`)
      return []
    }
}

// [同步] 检查是否为文件
export const isFile = (file) => {
  if (!isExist(file)) return false
  const stat = fs.statSync(path.resolve(file))
  return stat.isFile()
}

// [同步] 检查是否为目录
export const isDirectory = (dir) => {
  if (!isExist(dir)) return false
  const stat = fs.statSync(path.resolve(dir))
  return stat.isDirectory()
}

// [同步] 检查文件/目录是否存在
export const isExist = (filePath) => {
  return fs.existsSync(path.resolve(filePath.toString()))
}

// 路径后缀名
export const getExtname = (filepath, filterDot = false) => {
  const ext = path.extname(filepath).toLocaleLowerCase()
  if (filterDot && ext.length >= 2 && ext[0] === '.') {
    return ext.slice(1)
  }
  return ext
}

export const watchFile = (filePath) => {
  return fs.watch(filePath)
}

export const getFilePath = async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'select a file path',
    properties: ['openFile'],
    filters: [
      { name: 'MegSpot Project', extensions: [SHARE_ZIP_EXT] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  return !canceled && filePaths.length > 0 ? filePaths[0] : false
}

export const getDirectoryPath = async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'select a directory path',
    properties: ['openDirectory']
  })
  return !canceled && filePaths.length > 0 ? filePaths[0] : false
}

const useCollator = (locale = 'zh') => {
  const collator = new Intl.Collator(locale, {
    numeric: true,
    sensitivity: 'base'
  })
  return {
    collator: collator,
    collatorIsNumeric: collator.resolvedOptions().numeric
  }
}

const FileNameMatch = /^(.*?)(\.([^.]*))?$/

function extractNameAndExtension(str, dotFilesAsNames) {
  const match = str ? FileNameMatch.exec(str) : []

  let result = [(match && match[1]) || '', (match && match[3]) || '']

  // if the dotFilesAsNames option is selected, treat an empty filename with an extension
  // or a filename that starts with a dot, as a dotfile name
  if (dotFilesAsNames && ((!result[0] && result[1]) || (result[0] && result[0].charAt(0) === '.'))) {
    result = [result[0] + '.' + result[1], '']
  }

  return result
}

const { collator, collatorIsNumeric } = useCollator('en')

// Compares fileNames by name, then by extension
export const arraySortByName = (a, b) => {
  const [nameA, extensionA] = extractNameAndExtension(a)
  const [nameB, extensionB] = extractNameAndExtension(b)

  let result = collator.compare(nameA, nameB)

  if (collatorIsNumeric && result === 0 && nameA !== nameB) {
    return nameA < nameB ? -1 : 1
  } else if (result === 0 && nameA === nameB) {
    // filename are equal, compare extensions
    result = collator.compare(extensionA, extensionB)
    // compare(`foo1`, `foo01`) === 0
    if (collatorIsNumeric && result === 0 && extensionA !== extensionB) {
      return extensionA < extensionB ? -1 : 1
    }
  }

  return result
}

/**
 * @function 遍历文件目录，返回所有文件清单
 * @param {String} dir 文件目录
 * @param {Object} options 可选
 *                 - options.include: 只包含include中的文件 ['.xy', '.a', ... ]
 *                 - options.hiddenFiles: 隐藏.开头的文件
 *                 - options.onlyDir: boolean 默认false 是否返回文件夹目录
 *                 - options.onlyFile: boolean 默认false 是否返回子目录
 */
export const scanFolderSync = (dir, options = {}) => {
  console.info("add folder folderPath:", dir)

  if (!(options && typeof options === 'object')) {
    throw new Error('Invalid options')
  }
  if (!isDirectory(dir)) {
    console.error("scanFolderSync Invalid directory:", dir)
  }

  const include = Array.isArray(options.include) && options.include.length > 0 ? options.include : null
  const hiddenFiles = typeof options.hiddenFiles === 'boolean' ? options.hiddenFiles : true
  const onlyDir = typeof options.onlyDir === 'boolean' ? options.onlyDir : false
  const onlyFile = typeof options.onlyFile === 'boolean' ? options.onlyFile : true
  const dirData = { 
    label: path.basename(dir),
    dirPath: path.resolve(dir),
    children: []
  }

  let files = readDirSync(dir)
  if (hiddenFiles) {
    files = files.filter((item) => !item.startsWith('.'))
  }

  var hasChildren = false
  for (let i = 0; i < files.length; i++) {
    const filename = files[i]
    const filePath = path.resolve(dir, filename)
    if (isDirectory(filePath)) {
      if (!onlyFile) { // && !folderBlackList.includes(filename)
        dirData.children.push(filePath)
      }
      hasChildren = true
    } else if (!onlyDir && isFile(filePath)) {
      if (include && !include.includes(getExtname(filePath))) continue
      dirData.children = dirData.children || []
      dirData.children.push({
        label: filename,
        dirPath: filePath
      })
    }
  }
  if(!onlyFile) {
    dirData.children.sort((a, b) => {
      return a.dirPath - b.dirPath
    })
  }
  let sortList = dirData.children.sort((a, b) => arraySortByName(a.label, b.label))
  let fileInfoList = sortList.map((item) => {
    return item.dirPath;
  })
  return fileInfoList
}