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
import './index.css';

window.Alpine = Alpine

Alpine.store('files', {
  directory: undefined,
  files: [],
  regexFile: 'translation-[A-Z]{2}.json',

  getFilteredFiles() {
    return this.files.filter(file => file.match(new RegExp(this.regexFile)))
  },

  open() {
    PRELOAD_CONTEXT.openDialog().then((response) => {
      console.log(response);
      this.directory = response.directory
      this.files = response.files
    })
  }
})

Alpine.start()