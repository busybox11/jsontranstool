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

window.Alpine = Alpine

Alpine.store('files', {
  directory: undefined,
  files: [],
  regexFiles: 'translation-[A-Z]{2}.json',

  getFilteredFiles() {
    return this.files.filter(file => file.match(new RegExp(this.regexFiles)))
  },

  getSavedRegexForCurrentDirectory() {
    let paths = store.get('paths', {})
    let pathData = paths[this.directory] || {}
    return pathData.regexFiles
  },

  open() {
    PRELOAD_CONTEXT.openDialog().then((response) => {
      console.log(response)
      this.directory = response.directory
      this.files = response.files
      this.regexFiles = this.getSavedRegexForCurrentDirectory() ?? 'translation-[A-Z]{2}.json'
    })
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

      console.log({
        ...paths,
        [this.directory]: {
          ...pathData,
          regexFiles: this.regexFiles
        }
      })
    }
  }
})

Alpine.start()