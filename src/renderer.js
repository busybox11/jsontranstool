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
import union from 'lodash/union';
import cloneDeep from 'lodash/cloneDeep';

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

window._get = get

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
    defaultLanguage: '',
    bypasses: [],
    directoryPathTargetOutputDuplicate: '',
    outputDuplicateFileNameStructure: ''
  },
  currentConfig: {},
  forceShowConfig: false,
  everyFileContent: {},
  allTranslationsKeys: [],
  searchTranslationsQuery: '',
  selectedTranslationObj: {
    key: null,
    newKey: null,
    translations: {}
  },

  shouldShowFilePreview() { return (this.directory == undefined || !this.currentConfig.languageKeyCode) || (this.forceShowConfig || this.selectedFile !== undefined) },

  getKnownDirectories() {
    const allPaths = Object.keys(store.get('paths'))
    return allPaths.map(path => {
      let pathSplit = path.split('/')
      const dirName = pathSplit.pop()
      const dirPath = pathSplit.join('/')

      return {
        dirName, dirPath, fullPath: path
      }
    })
  },

  getFilteredFiles() {
    return this.files
                  .filter(file => file.match(new RegExp(this.regexFiles)))
                  .map(file => {
                    return {
                      name: file,
                      type: file.split('.').pop().toLowerCase()
                    }
                  })
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

  updateTranslationsKeys() {
    if (this.currentConfig.translationStringsJSONPath) {
      const everyFileContent = this.everyFileContent

      for (let file of Object.values(everyFileContent)) {
        this.allTranslationsKeys = union(this.allTranslationsKeys, Object.keys(get(file, this.currentConfig.translationStringsJSONPath)))
      }
    }
  },

  getAllTranslationsForKey(key) {
    const everyFileContent = this.everyFileContent

    let outTranslations = {}

    for (let file of Object.values(everyFileContent)) {
      const translation = get(file, `${this.currentConfig.translationStringsJSONPath}.${key}`)
      const languageCode = get(file, this.currentConfig.languageKeyCode)

      outTranslations[languageCode] = {
        translation
      }
    }

    return outTranslations
  },

  openCustomDirectoryPath(path) {
    let response = PRELOAD_CONTEXT.directoryData(path)
    console.log(response)
    this.forceShowConfig = false
    this.everyFileContent = {}
    this.directory = response.directory
    this.files = response.files
    this.regexFiles = this.getSavedRegexForCurrentDirectory() ?? 'translation-[A-Z]{2}.json'
    this.selectedFile = undefined
    this.searchTranslationsQuery = ''
    this.selectedTranslationObj = {
      key: null,
      newKey: null,
      translations: {}
    }
    this.updateCurrentConfig()

    this.readEveryFilteredFileInDirectory().then(everyFile => {
      this.everyFileContent = {...everyFile}
      this.updateTranslationsKeys()
    })

    if (monaco.editor.getModels().length > 0) {
      this.closeFilePreview()
    }
  },

  openFolder() {
    PRELOAD_CONTEXT.openDialog().then((selectedPath) => {
      if (selectedPath == undefined && this.directory != undefined) {
        return
      }

      this.openCustomDirectoryPath(selectedPath)
    })
  },

  async readEveryFilteredFileInDirectory() {
    let outFiles = {}

    for (let file of this.getFilteredFiles()) {
      let fileContent = await PRELOAD_CONTEXT.readFile(this.directory + '/' + file.name)
      outFiles[file.name] = JSON.parse(fileContent)
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
      if (response) {
        this.formConfig.directoryPathTargetOutputDuplicate = response
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
    const config = cloneDeep(this.formConfig)

    if (config.translationStringsJSONPath && config.languageKeyCode) {
      if (!config.outputDuplicateFileNameStructure || (config.directoryPathTargetOutputDuplicate && config.outputDuplicateFileNameStructure.includes('{languageCode}'))) {
        let everyFile = await this.readEveryFilteredFileInDirectory()
        this.everyFileContent = cloneDeep(everyFile)

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

        // Check if all bypasses are valid
        const allLanguageKeys = Object.values(everyFile).map((content) => get(content, config.languageKeyCode))
        for (let bypass of config.bypasses) {
          if (bypass.target && bypass.source) {
            if (!allLanguageKeys.includes(bypass.target)) {
              alert('Target language key not found in all files')
              return
            }

            if (!allLanguageKeys.includes(bypass.source)) {
              alert('Source language key not found in all files')
              return
            }
          } else {
            alert('Bypasses must have a target and a source')
            return
          }
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
  },

  getDetectedLanguages(targetKeyCodePath = undefined) {
    return Object.keys(this.everyFileContent).map((file) => {
      return get(this.everyFileContent[file], targetKeyCodePath ?? this.currentConfig.languageKeyCode, file)
    })
  },

  get getFilteredTranslationKeys() {
    return this.allTranslationsKeys?.filter(key => key.toLowerCase().includes(this.searchTranslationsQuery.toLowerCase()))
  },

  createNewTranslation() {
    let newTranslationKey = this.searchTranslationsQuery ?? ''
    const everyFileContent = this.everyFileContent

    let translationsEmptyObj = {}

    for (let file of Object.values(everyFileContent)) {
      const languageCode = get(file, this.currentConfig.languageKeyCode)

      translationsEmptyObj[languageCode] = {
        translation: ''
      }
    }

    this.selectedTranslationObj = {
      key: '',
      newKey: newTranslationKey,
      translations: translationsEmptyObj
    }
  },

  showTranslationKey(key) {
    this.selectedTranslationObj = {
      key,
      newKey: key,
      translations: this.getAllTranslationsForKey(key)
    }
  },

  closeTranslationKeyView() {
    this.selectedTranslationObj = {
      key: null,
      newKey: null,
      translations: {}
    }
  }
})

Alpine.start()