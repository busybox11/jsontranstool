// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const {ipcRenderer, contextBridge} = require('electron')
const fs = require('fs')

import { Translator } from "./translations"

let translator

contextBridge.exposeInMainWorld('PRELOAD_CONTEXT', {
  openDialog() {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('openFolderDialog')

      ipcRenderer.on('openFolderDialogResponse', (event, response) => {
        resolve(response?.[0])
      })
    })
  },

  directoryData(path) {
    return {
      directory: path,
      files: (!path)
        ? []
        : fs.readdirSync(path, { withFileTypes: true })
          .filter(fileItem => fileItem.isFile())
          .map(fileItem => fileItem.name)
    }
  },

  readFile(filePath) {
    return new Promise((resolve, reject) => {
      resolve(fs.readFileSync(filePath, 'utf8'))
    })
  },

  initTranslator(config) {
    translator = new Translator(JSON.parse(config))
  },

  async translate(text, targetLang) {
    if (targetLang.toLowerCase() == 'en') {
      targetLang = 'en-US'
    }

    return await translator.translate(text, targetLang)
  },

  resetTranslator() {
    translator = undefined
  }
})

contextBridge.exposeInMainWorld('store', {
  get(key, defaultValue) {
    return ipcRenderer.sendSync('electron-store-get', key, defaultValue)
  },

  set(property, val) {
    ipcRenderer.send('electron-store-set', property, val);
  }
})