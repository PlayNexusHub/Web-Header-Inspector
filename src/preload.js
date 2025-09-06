const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Header analysis
  analyzeHeaders: (url) => ipcRenderer.invoke('analyze-headers', url),
  getFullResponse: (url) => ipcRenderer.invoke('get-full-response', url),
  
  // Settings
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  
  // Menu events
  onMenuNewAnalysis: (callback) => ipcRenderer.on('menu-new-analysis', callback),
  onMenuSettings: (callback) => ipcRenderer.on('menu-settings', callback),
  onExportResults: (callback) => ipcRenderer.on('export-results', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Utility
  getVersion: () => process.versions.electron,
  getPlatform: () => process.platform
});
