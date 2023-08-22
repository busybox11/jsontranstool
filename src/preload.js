// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { ipcRenderer, contextBridge } = require('electron')
const fs = require('fs')
const git = require('simple-git')

import { Translator } from "./translations"

let translator
let trackedGitRepos = []

const gitStatus = () => {
  // Get git branches
  trackedGitRepos.forEach((repoPath) => {
    git(repoPath).branch((err, branchSummary) => {
      if (err) {
        console.warn(err)
      } else {
        window.postMessage({
          type: 'gitBranches',
          status: branchSummary,
          repoPath
        }, '*')
      }
    })
  });
}

contextBridge.exposeInMainWorld('PRELOAD_CONTEXT', {
  openDialog() {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('openFolderDialog')

      ipcRenderer.on('openFolderDialogResponse', (event, response) => {
        resolve(response?.[0])
      })
    })
  },

  gitStatus() {
    gitStatus()
  },

  trackGitRepo(path) {
    trackedGitRepos.push(path)
    gitStatus()
  },

  directoryData(path) {
    try {
      if (path == undefined) {
        trackedGitRepos = []
      } else {
        trackedGitRepos.push(path)
        gitStatus()
      }
    } catch (e) {
      console.warn(e)
    }

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

      gitStatus()
    })
  },

  writeFile(filePath, content) {
    return new Promise((resolve, reject) => {
      resolve(fs.writeFileSync(filePath, content, { encoding: 'utf8', flag: 'w' }))

      gitStatus()
    })
  },

  initTranslator(config) {
    translator = new Translator(JSON.parse(config))
  },

  async translate(text, targetLang) {
    if (targetLang.toLowerCase() == 'en') {
      targetLang = 'en-US'
    }

    if (targetLang.toLowerCase() == 'pt') {
      targetLang = 'pt-PT'
    }

    try {
      return await translator.translate(text, targetLang)
    } catch (e) {
      throw e
    }
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