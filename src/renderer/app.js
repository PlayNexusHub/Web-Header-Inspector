// PlayNexus Web Header Inspector - Main Application Logic
class WebHeaderInspectorApp {
  constructor() {
    this.currentResults = null;
    this.settings = {
      timeout: 10000,
      maxRedirects: 5,
      autoAnalyze: true,
      theme: 'dark'
    };
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.setupMenuListeners();
    await this.loadSettings();
    this.applyTheme();
  }

  setupEventListeners() {
    // URL Analysis
    document.getElementById('analyzeBtn').addEventListener('click', () => {
      this.analyzeUrl();
    });

    document.getElementById('fullResponseBtn').addEventListener('click', () => {
      this.getFullResponse();
    });

    document.getElementById('urlInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.analyzeUrl();
      }
    });

    // Auto-analyze on paste
    document.getElementById('urlInput').addEventListener('paste', () => {
      if (this.settings.autoAnalyze) {
        setTimeout(() => this.analyzeUrl(), 100);
      }
    });

    // Quick URL buttons
    document.querySelectorAll('.quick-url').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        document.getElementById('urlInput').value = url;
        this.analyzeUrl();
      });
    });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });

    // Settings modal
    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.showSettings();
    });

    document.getElementById('closeSettings').addEventListener('click', () => {
      this.hideSettings();
    });

    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('resetSettings').addEventListener('click', () => {
      this.resetSettings();
    });

    // Help modal
    document.getElementById('helpBtn').addEventListener('click', () => {
      this.showHelp();
    });

    document.getElementById('closeHelp').addEventListener('click', () => {
      this.hideHelp();
    });

    // Export functions
    document.getElementById('exportJsonBtn').addEventListener('click', () => {
      this.exportJson();
    });

    document.getElementById('copyRawBtn').addEventListener('click', () => {
      this.copyRawResponse();
    });

    // Header filtering
    document.getElementById('headerFilter').addEventListener('input', (e) => {
      this.filterHeaders(e.target.value);
    });

    document.getElementById('headerTypeFilter').addEventListener('change', (e) => {
      this.filterHeadersByType(e.target.value);
    });

    // Retry button
    document.getElementById('retryBtn').addEventListener('click', () => {
      this.analyzeUrl();
    });

    // Modal close on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    });
  }

  setupMenuListeners() {
    if (window.electronAPI) {
      window.electronAPI.onMenuNewAnalysis(() => {
        document.getElementById('urlInput').value = '';
        this.clearResults();
      });

      window.electronAPI.onMenuSettings(() => {
        this.showSettings();
      });

      window.electronAPI.onExportResults((event, filePath) => {
        this.exportToFile(filePath);
      });
    }
  }

  async analyzeUrl() {
    const url = document.getElementById('urlInput').value.trim();
    
    if (!url) {
      this.showError('Please enter a valid URL');
      return;
    }

    if (!this.isValidUrl(url)) {
      this.showError('Please enter a valid URL (must include http:// or https://)');
      return;
    }

    this.showLoading();

    try {
      const result = await window.electronAPI.analyzeHeaders(url);
      
      if (result.success) {
        this.currentResults = result;
        this.displayResults(result);
      } else {
        this.showError(result.error || 'Failed to analyze headers');
      }
    } catch (error) {
      this.showError('Network error: ' + error.message);
    }
  }

  async getFullResponse() {
    const url = document.getElementById('urlInput').value.trim();
    
    if (!url) {
      this.showError('Please enter a valid URL');
      return;
    }

    this.showLoading();

    try {
      const result = await window.electronAPI.getFullResponse(url);
      
      if (result.success) {
        this.currentResults = result;
        this.displayResults(result);
        this.switchTab('raw');
      } else {
        this.showError(result.error || 'Failed to get full response');
      }
    } catch (error) {
      this.showError('Network error: ' + error.message);
    }
  }

  displayResults(result) {
    this.hideLoading();
    this.hideError();
    
    // Show results section
    document.getElementById('resultsContent').classList.remove('hidden');

    // Update overview
    this.updateOverview(result);
    
    // Update security score
    if (result.analysis) {
      this.updateSecurityScore(result.analysis);
      this.updateSecuritySummary(result.analysis);
      this.updateIssues(result.analysis.issues);
      this.updateRecommendations(result.analysis.recommendations);
    }

    // Update headers
    this.updateHeaders(result.headers);

    // Update raw response
    if (result.data) {
      this.updateRawResponse(result);
    }
  }

  updateOverview(result) {
    // Status code
    const statusElement = document.getElementById('statusCode');
    statusElement.textContent = result.status || 'Unknown';
    statusElement.className = 'status-code';
    
    if (result.status >= 200 && result.status < 300) {
      statusElement.classList.add('success');
    } else if (result.status >= 300 && result.status < 400) {
      statusElement.classList.add('redirect');
    } else if (result.status >= 400) {
      statusElement.classList.add('error');
    }

    // Analysis time
    document.getElementById('analysisTime').textContent = 
      new Date(result.timestamp).toLocaleTimeString();

    // Headers count
    const headersCount = Object.keys(result.headers || {}).length;
    document.getElementById('headersCount').textContent = headersCount;

    // Security headers count
    const securityHeaders = this.getSecurityHeadersCount(result.headers || {});
    document.getElementById('securityHeadersCount').textContent = securityHeaders;
  }

  updateSecurityScore(analysis) {
    const scoreValue = document.getElementById('scoreValue');
    const scoreGrade = document.getElementById('scoreGrade');
    const scoreFill = document.getElementById('scoreFill');
    const scoreDescription = document.getElementById('scoreDescription');

    // Animate score
    let currentScore = 0;
    const targetScore = analysis.score;
    const increment = targetScore / 50;

    const animateScore = () => {
      currentScore += increment;
      if (currentScore >= targetScore) {
        currentScore = targetScore;
        scoreValue.textContent = Math.round(currentScore);
      } else {
        scoreValue.textContent = Math.round(currentScore);
        requestAnimationFrame(animateScore);
      }
    };

    animateScore();

    // Update grade and description
    scoreGrade.textContent = analysis.grade;
    scoreDescription.textContent = this.getScoreDescription(analysis.grade);

    // Update progress bar
    scoreFill.style.width = `${analysis.score}%`;

    // Update circle gradient
    const circle = document.querySelector('.score-circle');
    const percentage = (analysis.score / 100) * 360;
    circle.style.background = `conic-gradient(var(--primary-color) ${percentage}deg, var(--border-color) ${percentage}deg)`;
  }

  updateSecuritySummary(analysis) {
    const summaryElement = document.getElementById('securitySummary');
    
    let summary = `<p><strong>Grade ${analysis.grade}</strong> - ${this.getScoreDescription(analysis.grade)}</p>`;
    
    if (analysis.issues.length > 0) {
      summary += `<p><strong>${analysis.issues.length}</strong> security issues found.</p>`;
    }
    
    if (analysis.recommendations.length > 0) {
      summary += `<p><strong>${analysis.recommendations.length}</strong> recommendations for improvement.</p>`;
    }

    summaryElement.innerHTML = summary;
  }

  updateHeaders(headers) {
    const headersList = document.getElementById('headersList');
    headersList.innerHTML = '';

    Object.entries(headers).forEach(([name, value]) => {
      const headerItem = document.createElement('div');
      headerItem.className = 'header-item';
      
      const analysis = this.analyzeHeaderSecurity(name, value);
      
      headerItem.innerHTML = `
        <div>
          <div class="header-name">${this.escapeHtml(name)}</div>
          <div class="header-value">${this.escapeHtml(value)}</div>
        </div>
        <div class="header-analysis">
          <div class="severity-${analysis.severity}">${analysis.message}</div>
        </div>
      `;
      
      headersList.appendChild(headerItem);
    });
  }

  updateIssues(issues) {
    const issuesList = document.getElementById('issuesList');
    issuesList.innerHTML = '';

    if (issues.length === 0) {
      issuesList.innerHTML = '<p class="text-center">No security issues found! 🎉</p>';
      return;
    }

    issues.forEach(issue => {
      const issueItem = document.createElement('div');
      issueItem.className = 'issue-item';
      issueItem.innerHTML = `
        <div class="issue-content">
          <strong>⚠️ ${this.escapeHtml(issue)}</strong>
        </div>
      `;
      issuesList.appendChild(issueItem);
    });
  }

  updateRecommendations(recommendations) {
    const recommendationsList = document.getElementById('recommendationsList');
    recommendationsList.innerHTML = '';

    if (recommendations.length === 0) {
      recommendationsList.innerHTML = '<p class="text-center">No recommendations at this time.</p>';
      return;
    }

    recommendations.forEach(recommendation => {
      const recommendationItem = document.createElement('div');
      recommendationItem.className = 'recommendation-item';
      recommendationItem.innerHTML = `
        <div class="recommendation-content">
          <strong>💡 ${this.escapeHtml(recommendation)}</strong>
        </div>
      `;
      recommendationsList.appendChild(recommendationItem);
    });
  }

  updateRawResponse(result) {
    const rawResponse = document.getElementById('rawResponse');
    
    let content = `HTTP/${result.status || 'Unknown'}\n\n`;
    content += 'Headers:\n';
    
    Object.entries(result.headers || {}).forEach(([name, value]) => {
      content += `${name}: ${value}\n`;
    });
    
    if (result.data) {
      content += '\n\nResponse Body:\n';
      content += result.data;
    }
    
    rawResponse.textContent = content;
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
  }

  filterHeaders(query) {
    const headers = document.querySelectorAll('.header-item');
    const lowerQuery = query.toLowerCase();

    headers.forEach(header => {
      const name = header.querySelector('.header-name').textContent.toLowerCase();
      const value = header.querySelector('.header-value').textContent.toLowerCase();
      
      if (name.includes(lowerQuery) || value.includes(lowerQuery)) {
        header.style.display = 'flex';
      } else {
        header.style.display = 'none';
      }
    });
  }

  filterHeadersByType(type) {
    const headers = document.querySelectorAll('.header-item');
    
    headers.forEach(header => {
      const name = header.querySelector('.header-name').textContent.toLowerCase();
      let show = true;

      switch (type) {
        case 'security':
          show = this.isSecurityHeader(name);
          break;
        case 'cache':
          show = this.isCacheHeader(name);
          break;
        case 'content':
          show = this.isContentHeader(name);
          break;
        case 'all':
        default:
          show = true;
      }

      header.style.display = show ? 'flex' : 'none';
    });
  }

  showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('errorState').classList.add('hidden');
    document.getElementById('resultsContent').classList.add('hidden');
  }

  hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
  }

  showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('resultsContent').classList.add('hidden');
  }

  hideError() {
    document.getElementById('errorState').classList.add('hidden');
  }

  clearResults() {
    document.getElementById('resultsContent').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
    document.getElementById('loadingState').classList.add('hidden');
  }

  showSettings() {
    // Populate current settings
    document.getElementById('timeoutSetting').value = this.settings.timeout;
    document.getElementById('redirectsSetting').value = this.settings.maxRedirects;
    document.getElementById('autoAnalyzeSetting').checked = this.settings.autoAnalyze;
    document.getElementById('themeSetting').value = this.settings.theme;
    
    document.getElementById('settingsModal').classList.remove('hidden');
  }

  hideSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
  }

  async saveSettings() {
    this.settings = {
      timeout: parseInt(document.getElementById('timeoutSetting').value),
      maxRedirects: parseInt(document.getElementById('redirectsSetting').value),
      autoAnalyze: document.getElementById('autoAnalyzeSetting').checked,
      theme: document.getElementById('themeSetting').value
    };

    if (window.electronAPI) {
      await window.electronAPI.saveSettings(this.settings);
    }

    this.applyTheme();
    this.hideSettings();
  }

  resetSettings() {
    this.settings = {
      timeout: 10000,
      maxRedirects: 5,
      autoAnalyze: true,
      theme: 'dark'
    };

    this.showSettings();
  }

  async loadSettings() {
    if (window.electronAPI) {
      const result = await window.electronAPI.loadSettings();
      if (result.success) {
        this.settings = { ...this.settings, ...result.settings };
      }
    }
  }

  applyTheme() {
    document.body.setAttribute('data-theme', this.settings.theme);
  }

  showHelp() {
    document.getElementById('helpModal').classList.remove('hidden');
  }

  hideHelp() {
    document.getElementById('helpModal').classList.add('hidden');
  }

  exportJson() {
    if (!this.currentResults) {
      alert('No results to export');
      return;
    }

    const dataStr = JSON.stringify(this.currentResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `header-analysis-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  copyRawResponse() {
    const rawResponse = document.getElementById('rawResponse');
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(rawResponse.textContent).then(() => {
        // Show success feedback
        const btn = document.getElementById('copyRawBtn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      });
    }
  }

  // Utility methods
  isValidUrl(string) {
    try {
      new URL(string);
      return string.startsWith('http://') || string.startsWith('https://');
    } catch (_) {
      return false;
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getSecurityHeadersCount(headers) {
    const securityHeaders = [
      'strict-transport-security',
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy',
      'permissions-policy',
      'x-xss-protection'
    ];

    return securityHeaders.filter(header => 
      headers[header] || headers[header.toLowerCase()]
    ).length;
  }

  getScoreDescription(grade) {
    const descriptions = {
      'A+': 'Excellent security configuration',
      'A': 'Very good security configuration',
      'B': 'Good security configuration',
      'C': 'Average security configuration',
      'D': 'Poor security configuration',
      'F': 'Very poor security configuration'
    };
    return descriptions[grade] || 'Unknown';
  }

  isSecurityHeader(name) {
    const securityHeaders = [
      'strict-transport-security', 'content-security-policy', 'x-frame-options',
      'x-content-type-options', 'referrer-policy', 'permissions-policy',
      'x-xss-protection', 'expect-ct', 'feature-policy'
    ];
    return securityHeaders.includes(name);
  }

  isCacheHeader(name) {
    const cacheHeaders = [
      'cache-control', 'expires', 'etag', 'last-modified', 'if-none-match',
      'if-modified-since', 'pragma'
    ];
    return cacheHeaders.includes(name);
  }

  isContentHeader(name) {
    const contentHeaders = [
      'content-type', 'content-length', 'content-encoding', 'content-disposition',
      'content-language', 'content-range', 'accept-ranges'
    ];
    return contentHeaders.includes(name);
  }

  analyzeHeaderSecurity(name, value) {
    const lowerName = name.toLowerCase();
    
    // Security headers analysis
    if (this.isSecurityHeader(lowerName)) {
      return { severity: 'info', message: 'Security header present' };
    }
    
    // Information disclosure headers
    const infoHeaders = ['server', 'x-powered-by', 'x-aspnet-version'];
    if (infoHeaders.includes(lowerName)) {
      return { severity: 'medium', message: 'Information disclosure' };
    }
    
    return { severity: 'info', message: 'Standard header' };
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new WebHeaderInspectorApp();
});
