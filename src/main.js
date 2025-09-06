const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');
const path = require('path');
const axios = require('axios');

// Initialize secure store
const store = new Store({
  encryptionKey: 'playnexus-security-key-2024'
});

class WebHeaderInspector {
  constructor() {
    this.mainWindow = null;
    this.isDev = process.argv.includes('--dev');
    
    // Security settings
    app.whenReady().then(() => {
      this.createWindow();
      this.setupMenu();
      this.setupIPC();
      
      if (!this.isDev) {
        autoUpdater.checkForUpdatesAndNotify();
      }
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      icon: path.join(__dirname, '../assets/icon.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true
      },
      titleBarStyle: 'default',
      show: false
    });

    this.mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      if (this.isDev) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    // Security: Prevent new window creation
    this.mainWindow.webContents.setWindowOpenHandler(() => {
      return { action: 'deny' };
    });

    // Security: Handle external links
    this.mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      
      if (parsedUrl.origin !== 'file://') {
        event.preventDefault();
        shell.openExternal(navigationUrl);
      }
    });
  }

  setupMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Analysis',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow.webContents.send('menu-new-analysis');
            }
          },
          {
            label: 'Export Results',
            accelerator: 'CmdOrCtrl+E',
            click: () => {
              this.exportResults();
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Tools',
        submenu: [
          {
            label: 'Settings',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              this.mainWindow.webContents.send('menu-settings');
            }
          },
          {
            label: 'Clear Cache',
            click: () => {
              this.clearCache();
            }
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Documentation',
            click: () => {
              shell.openExternal('https://docs.playnexus.com/web-header-inspector');
            }
          },
          {
            label: 'Support',
            click: () => {
              shell.openExternal('mailto:playnexushq@gmail.com?subject=Web Header Inspector Support');
            }
          },
          { type: 'separator' },
          {
            label: 'About',
            click: () => {
              this.showAbout();
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupIPC() {
    // Analyze headers
    ipcMain.handle('analyze-headers', async (event, url) => {
      try {
        const response = await axios.head(url, {
          timeout: 10000,
          maxRedirects: 5,
          validateStatus: () => true
        });

        const analysis = this.analyzeSecurityHeaders(response.headers);
        
        return {
          success: true,
          headers: response.headers,
          status: response.status,
          analysis: analysis,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    });

    // Get full response
    ipcMain.handle('get-full-response', async (event, url) => {
      try {
        const response = await axios.get(url, {
          timeout: 15000,
          maxRedirects: 5,
          validateStatus: () => true
        });

        return {
          success: true,
          headers: response.headers,
          status: response.status,
          data: response.data.substring(0, 10000), // Limit response size
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    });

    // Save settings
    ipcMain.handle('save-settings', async (event, settings) => {
      try {
        store.set('settings', settings);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Load settings
    ipcMain.handle('load-settings', async () => {
      try {
        const settings = store.get('settings', {
          timeout: 10000,
          maxRedirects: 5,
          autoAnalyze: true,
          theme: 'dark'
        });
        return { success: true, settings };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  analyzeSecurityHeaders(headers) {
    const analysis = {
      score: 0,
      maxScore: 100,
      issues: [],
      recommendations: [],
      headers: {}
    };

    // Security headers to check
    const securityHeaders = {
      'strict-transport-security': {
        name: 'HSTS',
        weight: 15,
        description: 'HTTP Strict Transport Security'
      },
      'content-security-policy': {
        name: 'CSP',
        weight: 20,
        description: 'Content Security Policy'
      },
      'x-frame-options': {
        name: 'X-Frame-Options',
        weight: 10,
        description: 'Clickjacking Protection'
      },
      'x-content-type-options': {
        name: 'X-Content-Type-Options',
        weight: 10,
        description: 'MIME Type Sniffing Protection'
      },
      'referrer-policy': {
        name: 'Referrer-Policy',
        weight: 10,
        description: 'Referrer Information Control'
      },
      'permissions-policy': {
        name: 'Permissions-Policy',
        weight: 15,
        description: 'Feature Policy Control'
      },
      'x-xss-protection': {
        name: 'X-XSS-Protection',
        weight: 5,
        description: 'XSS Filter (Legacy)'
      }
    };

    // Check each security header
    Object.keys(securityHeaders).forEach(headerName => {
      const headerInfo = securityHeaders[headerName];
      const headerValue = headers[headerName] || headers[headerName.toLowerCase()];

      if (headerValue) {
        analysis.score += headerInfo.weight;
        analysis.headers[headerName] = {
          present: true,
          value: headerValue,
          analysis: this.analyzeHeaderValue(headerName, headerValue)
        };
      } else {
        analysis.issues.push(`Missing ${headerInfo.name} header`);
        analysis.recommendations.push(`Add ${headerInfo.name}: ${headerInfo.description}`);
        analysis.headers[headerName] = {
          present: false,
          analysis: { severity: 'high', message: 'Header not present' }
        };
      }
    });

    // Check for insecure headers
    const insecureHeaders = ['server', 'x-powered-by', 'x-aspnet-version'];
    insecureHeaders.forEach(headerName => {
      const headerValue = headers[headerName] || headers[headerName.toLowerCase()];
      if (headerValue) {
        analysis.issues.push(`Information disclosure: ${headerName} header reveals server details`);
        analysis.recommendations.push(`Remove or obfuscate ${headerName} header`);
        analysis.score -= 5;
      }
    });

    // Ensure score doesn't go below 0
    analysis.score = Math.max(0, analysis.score);

    // Add grade
    if (analysis.score >= 90) analysis.grade = 'A+';
    else if (analysis.score >= 80) analysis.grade = 'A';
    else if (analysis.score >= 70) analysis.grade = 'B';
    else if (analysis.score >= 60) analysis.grade = 'C';
    else if (analysis.score >= 50) analysis.grade = 'D';
    else analysis.grade = 'F';

    return analysis;
  }

  analyzeHeaderValue(headerName, value) {
    const analysis = { severity: 'info', message: 'Header present', details: [] };

    switch (headerName.toLowerCase()) {
      case 'strict-transport-security':
        if (!value.includes('max-age=')) {
          analysis.severity = 'medium';
          analysis.message = 'HSTS missing max-age directive';
        } else if (!value.includes('includeSubDomains')) {
          analysis.severity = 'low';
          analysis.message = 'Consider adding includeSubDomains directive';
        }
        break;

      case 'content-security-policy':
        if (value.includes('unsafe-inline') || value.includes('unsafe-eval')) {
          analysis.severity = 'high';
          analysis.message = 'CSP contains unsafe directives';
        }
        break;

      case 'x-frame-options':
        if (value.toLowerCase() === 'allowall') {
          analysis.severity = 'high';
          analysis.message = 'X-Frame-Options allows framing from any origin';
        }
        break;
    }

    return analysis;
  }

  async exportResults() {
    const { filePath } = await dialog.showSaveDialog(this.mainWindow, {
      defaultPath: `header-analysis-${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (filePath) {
      this.mainWindow.webContents.send('export-results', filePath);
    }
  }

  clearCache() {
    this.mainWindow.webContents.session.clearCache();
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Cache Cleared',
      message: 'Application cache has been cleared successfully.'
    });
  }

  showAbout() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'About PlayNexus Web Header Inspector',
      message: 'PlayNexus Web Header Inspector v1.0.0',
      detail: 'Powered by PlayNexus — Subsystems: ClanForge, BotForge.\nOwned by Nortaq.\nContact: playnexushq@gmail.com\n\nProfessional web security header analysis tool for ethical security testing.'
    });
  }
}

// Initialize app
new WebHeaderInspector();

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available.');
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available.');
});

autoUpdater.on('error', (err) => {
  console.log('Error in auto-updater. ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  console.log(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded');
  autoUpdater.quitAndInstall();
});
