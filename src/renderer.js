/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import Alpine from 'alpinejs'
import './index.css'
import get from 'lodash/get';

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

const sampleCodeString = `{
  "languageCode": "EN",
  "languageName": "English",
  "strings": {
    "hello": "Hello World!",
    ...
  }
}
`

monaco.editor.defineTheme('customMonacoTheme', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#100f0e00'
  }
})

window.Alpine = Alpine

Alpine.store('files', {
  directory: undefined,
  files: [],
  regexFiles: 'translation-[A-Z]{2}.json',
  selectedFile: undefined,
  formConfig: {
    translationStringsJSONPath: '',
    languageKeyCode: '',
    bypasses: [],
    directoryPathTargetOutputDuplicate: '',
    outputDuplicateFileNameStructure: ''
  },
  currentConfig: {},
  forceShowConfig: false,
  everyFileContent: {},

  getFilteredFiles() {
    return this.files.filter(file => file.match(new RegExp(this.regexFiles)))
  },

  getSavedRegexForCurrentDirectory() {
    let paths = store.get('paths', {})
    let pathData = paths[this.directory] || {}
    return pathData.regexFiles
  },

  updateCurrentConfig() {
    let paths = store.get('paths', {})
    let pathData = paths[this.directory] || {}
    this.currentConfig = pathData
  },

  openFolder() {
    PRELOAD_CONTEXT.openDialog().then((response) => {
      if (response.directory) {
        console.log(response)
        this.directory = response.directory
        this.files = response.files
        this.regexFiles = this.getSavedRegexForCurrentDirectory() ?? 'translation-[A-Z]{2}.json'
        this.selectedFile = undefined
        this.updateCurrentConfig()
        if (monaco.editor.getModels().length > 0) {
          this.closeFilePreview()
        }
      }
    })
  },

  async readEveryFilteredFileInDirectory() {
    let outFiles = {}

    for (let file of this.getFilteredFiles()) {
      let fileContent = await PRELOAD_CONTEXT.readFile(this.directory + '/' + file)
      outFiles[file] = JSON.parse(fileContent)
    }

    return outFiles
  },

  previewFile(file) {
    PRELOAD_CONTEXT.readFile(this.directory + '/' + file)
      .then((content) => {
        this.selectedFile = {
          file,
          content
        }

        if (monaco.editor.getModels().length == 0) {
          monaco.editor.create(document.getElementById('container'), {
            value: content,
            language: 'json',
            theme: 'customMonacoTheme',
            automaticLayout: true,
            fixedOverflowWidgets: true
          })
        } else {
          monaco.editor.getModels()[0].setValue(content)
        }
      })
  },

  closeFilePreview() {
    this.selectedFile = undefined
    monaco.editor.getModels()[0].dispose()
  },

  saveRegex() {
    if (this.directory) {
      // Get already existing path object
      let paths = store.get('paths', {})
      let pathData = paths[this.directory] || {}

      store.set('paths', {
        ...paths,
        [this.directory]: {
          ...pathData,
          regexFiles: this.regexFiles
        }
      })
    }
  },

  addNewBypassRow() {
    this.formConfig.bypasses.push({
      target: undefined,
      source: undefined
    })
  },

  openFolderForPathTargetOutputDuplicate() {
    PRELOAD_CONTEXT.openDialog().then((response) => {
      if (response.directory) {
        this.formConfig.directoryPathTargetOutputDuplicate = response.directory
      }
    })
  },

  toggleShowConfig() {
    if (this.currentConfig.languageKeyCode) {
      this.formConfig = {...this.currentConfig}
      this.forceShowConfig = !this.forceShowConfig
    }
  },

  async saveDirectoryConf() {
    const config = JSON.parse(JSON.stringify(this.formConfig))

    if (config.translationStringsJSONPath && config.languageKeyCode) {
      if (!config.outputDuplicateFileNameStructure || (config.directoryPathTargetOutputDuplicate && config.outputDuplicateFileNameStructure.includes('{languageCode}'))) {
        let everyFile = await this.readEveryFilteredFileInDirectory()
        this.everyFileContent = {...everyFile}

        // Check if all files have the same structure
        // If they don't, return an error
        if (!Object.values(everyFile).every((content) => {
          const languageKey = get(content, config.languageKeyCode)
          return (typeof languageKey === 'string' && languageKey.length > 0)
        })) {
          alert('Language key code not found in all files')
          return
        }

        if (!Object.values(everyFile).every((content) => {
          const translationsObj = get(content, config.translationStringsJSONPath)
          return (typeof translationsObj === 'object' && Object.keys(translationsObj).length > 0)
        })) {
          alert('Translation strings object not found in all files')
          return
        }

        let paths = store.get('paths', {})
        let pathData = paths[this.directory] || {}

        store.set('paths', {
          ...paths,
          [this.directory]: {
            ...pathData,
            ...config
          }
        })

        this.forceShowConfig = false

        this.updateCurrentConfig()
      }
    }
  }
})

Alpine.start()