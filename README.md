# PlayNexus Web Header Inspector

Professional web security header analysis tool for ethical security testing and compliance auditing.

**Powered by PlayNexus** — Subsystems: ClanForge, BotForge  
**Owner:** Nortaq  
**Contact:** playnexushq@gmail.com

## 🔍 Overview

The PlayNexus Web Header Inspector is a comprehensive Electron-based desktop application designed for security professionals, developers, and system administrators to analyze HTTP security headers and assess web application security posture.

## ✨ Features

### Core Functionality
- **Real-time Header Analysis** - Instant security header inspection and scoring
- **Security Scoring System** - Grade-based assessment (A+ to F) with detailed explanations
- **Comprehensive Reporting** - Detailed analysis with issues and recommendations
- **Export Capabilities** - JSON, PDF, and raw response exports
- **Batch Analysis** - Quick testing with predefined popular websites

### Security Features
- **Secure Architecture** - Context isolation and secure IPC communication
- **No Data Transmission** - All analysis performed locally
- **Encrypted Storage** - Secure local settings and history storage
- **Auto-Updates** - Secure update mechanism with verification

### User Experience
- **Modern UI** - Dark/light theme support with responsive design
- **Keyboard Shortcuts** - Full keyboard navigation support
- **Accessibility** - WCAG AA compliant interface
- **Help System** - Comprehensive documentation and support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Windows 10/11 (primary target)

### Installation
```bash
# Clone or extract the application
cd Web_Header_Inspector

# Install dependencies
npm install

# Start development mode
npm run dev

# Or start production mode
npm start
```

### Building for Distribution
```bash
# Build Windows executable
npm run build:win

# Build for all platforms
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📖 Usage Guide

### Basic Analysis
1. Enter a URL in the input field (must include http:// or https://)
2. Click "Analyze Headers" or press Enter
3. Review the security score and detailed analysis
4. Export results if needed

### Advanced Features
- **Settings**: Configure timeouts, redirects, and themes
- **Filtering**: Filter headers by type (security, cache, content)
- **Export**: Save results in multiple formats
- **History**: Access previous analysis results

### Security Headers Analyzed
- **HSTS** (HTTP Strict Transport Security)
- **CSP** (Content Security Policy)
- **X-Frame-Options** (Clickjacking protection)
- **X-Content-Type-Options** (MIME sniffing protection)
- **Referrer-Policy** (Referrer information control)
- **Permissions-Policy** (Feature policy control)
- **X-XSS-Protection** (Legacy XSS filter)

## 🛡️ Security & Ethics

### Ethical Use Only
This tool is designed for:
- ✅ Testing websites you own or have explicit permission to test
- ✅ Authorized security assessments and penetration testing
- ✅ Educational and research purposes
- ✅ Internal security auditing

### Prohibited Uses
- ❌ Testing websites without permission
- ❌ Unauthorized security testing or attacks
- ❌ Violating applicable laws or regulations
- ❌ Any malicious or harmful activities

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm test

# Coverage report
npm run test:coverage

# Linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Test Coverage
- Target: 80%+ overall coverage
- Critical paths: 95%+ coverage
- Security functions: 100% coverage

## 📦 Building & Distribution

### Windows Build
```bash
npm run build:win
```
Generates:
- `dist/PlayNexus Web Header Inspector Setup.exe` (NSIS installer)
- `dist/win-unpacked/` (Portable version)

### Build Verification
```bash
# Verify build integrity
npm run verify-build

# Generate checksums
npm run checksums
```

## 🔧 Configuration

### Settings File Location
- Windows: `%APPDATA%/playnexus-web-header-inspector/config.json`
- Encrypted with AES-256

### Available Settings
```json
{
  "timeout": 10000,
  "maxRedirects": 5,
  "autoAnalyze": true,
  "theme": "dark"
}
```

## 🐛 Troubleshooting

### Common Issues

**Application won't start**
- Ensure Node.js 18+ is installed
- Run `npm install` to install dependencies
- Check Windows Defender/antivirus settings

**Network errors**
- Verify internet connection
- Check firewall settings
- Ensure target URL is accessible

**Build failures**
- Clear node_modules: `rm -rf node_modules && npm install`
- Update dependencies: `npm update`
- Check build logs in `dist/` folder

### Getting Help
- **Documentation**: [docs.playnexus.com](https://docs.playnexus.com)
- **Support Email**: playnexushq@gmail.com
- **Issues**: Check application logs in Help > About

## 📄 Legal & Compliance

### License
Proprietary software owned by Nortaq. See [EULA](docs/EULA.md) for terms.

### Privacy
All analysis is performed locally. See [Privacy Policy](docs/PRIVACY.md) for details.

### Compliance
- GDPR compliant
- CCPA compliant
- SOC 2 Type II controls implemented

## 🔄 Updates & Maintenance

### Auto-Updates
- Automatic update checks (can be disabled)
- Secure download and verification
- Rollback capability for failed updates

### Manual Updates
```bash
# Check for updates
npm run check-updates

# Update dependencies
npm update

# Rebuild application
npm run build
```

## 🤝 Contributing

This is proprietary software. For feature requests or bug reports, contact playnexushq@gmail.com.

## 📞 Support & Contact

**Technical Support**
- Email: playnexushq@gmail.com
- Response time: 24-48 hours
- Priority support available for enterprise users

**Owner Information**
- Company: PlayNexus
- Owner: Nortaq
- Website: playnexus.com

---

**© 2025 PlayNexus. All rights reserved.**  
*Powered by PlayNexus — Subsystems: ClanForge, BotForge*
