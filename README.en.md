# Video Translate

A powerful AI-driven real-time video subtitle translation tool that extracts audio from videos, performs real-time speech recognition and translation, generating multilingual subtitles.

[中文文档](README.md) | English

## ✨ Core Features

- 🎬 **Video Audio Extraction** - Extract audio from local video files
- 🎙️ **AI Speech Recognition** - High-precision speech recognition based on Alibaba Cloud NLS
- 🌐 **Real-time Translation** - Real-time translation from English to Chinese (more language support in development)
- 📝 **Subtitle Generation** - Generate and synchronously display subtitles
- ⏱️ **Real-time Processing** - Low-latency real-time audio processing
- 🔄 **Stream Processing** - Streaming audio transmission and processing

## 🖥️ Supported Video Platforms

This tool, as a browser extension, supports the following mainstream video platforms:

- **YouTube** - World's largest video sharing platform
- **Bilibili** - China's leading video platform with danmaku
- **TED** - Ideas worth spreading

Supports all websites using the HTML5 standard `<video>` tag, covering the vast majority of modern video sites.

## 💡 Current Translation Support Note

**Note**: The current version only supports one-way translation from **English** to **Chinese**. This is due to limitations in the initial development phase, with the translation direction fixed in the code. In future versions, we plan to implement bidirectional translation functionality between multiple languages, allowing users to freely choose source and target languages.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 14.0.0
- Alibaba Cloud account and relevant services activated (Speech Recognition, Machine Translation)

### Alibaba Cloud Service Activation Guide

Before using this tool, you need to activate the following Alibaba Cloud services:

1. **Intelligent Speech Interaction Service (NLS)**
   - Visit [Intelligent Speech Interaction Console](https://nls-portal.console.aliyun.com/overview) to activate the service
   - Create a project in the [NLS Application Management Page](https://nls-portal.console.aliyun.com/applist) to obtain an appKey

2. **Machine Translation Service**
   - Visit [Machine Translation Console](https://mt.console.aliyun.com/basic) to activate the service

3. **Obtain AccessKey**
   - Log in to the Alibaba Cloud console to obtain AccessKey ID and AccessKey Secret
   - Ensure the user has access permissions for the relevant services

### Configuration

1. Clone the repository:
   ```bash
   git clone https://github.com/xujizhong/video-translate.git
   cd video-translate
   ```

2. Install server dependencies:
   ```bash
   npm run install-server
   ```

3. Configure environment variables:
   ```bash
   # Enter the server directory
   cd server
   
   # Copy the environment variable template
   cp .env.example .env
   
   # Edit the environment variable file, add your Alibaba Cloud keys
   vi .env
   ```
   
   The environment variable file (.env) needs to set the following:
   ```
   # Alibaba Cloud access keys
   ALI_ACCESS_KEY_ID=your-accessKeyId
   ALI_ACCESS_KEY_SECRET=your-accessKeySecret
   
   # Alibaba Cloud NLS application key
   ALI_NLS_APP_KEY=your-appKey
   
   # Server port setting
   SERVER_PORT=3000
   ```
4. Configuration files are set to read sensitive information from environment variables, no additional modifications needed.

### Starting the Service

Start the server (handling AI speech recognition and translation):
```bash
npm run server
```

Start in development mode (auto-reload):
```bash
npm run dev
```

### How to Use

1. Install Chrome Extension
   - Open Chrome browser and visit `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the `extension` directory in the project

2. Start the Server
   - Ensure the server is running (default port 3000)
   - If the port is occupied, you can modify `SERVER_PORT` in the `.env` file

3. Using the Extension
   - Visit video websites
   - When playing a video, click the extension icon in the Chrome toolbar
   - The extension will automatically detect the currently playing video and start processing
   - View recognition results and translated subtitles in real-time

## 🛠️ Technical Architecture

- **Frontend**: Native JavaScript, Web Audio API, WebSocket
- **Backend**: Node.js, WebSocket, Alibaba Cloud Speech Recognition Service
- **AI Services**: 
  - Alibaba Cloud Speech Recognition (NLS)
  - Alibaba Cloud Machine Translation

## 📋 Future Development Plans

- [ ] **Multi-language Translation Support** - Implement translation between multiple languages
  - [ ] Add language selection interface
  - [ ] Support common languages such as Chinese, English, Japanese, Korean, French, German, etc.
  - [ ] Allow users to customize source and target languages
- [ ] Support more video formats
- [ ] Add subtitle download functionality
- [ ] Add subtitle style customization
- [ ] Provide subtitle timeline editing
- [ ] Offline translation mode

## 🔒 Notes

- Large video files may cause browser memory insufficiency
- Ensure stable network connection for best real-time translation results
- Use of Alibaba Cloud services must comply with Alibaba Cloud service terms
- **Security Tip**: Do not commit .env files containing sensitive information to code repositories
- **Translation Limitation**: Current version only supports English to Chinese translation

## 👏 Acknowledgements

Special thanks to [Cursor](https://www.cursor.com/) editor and its powerful AI assistance features. Most of the code refactoring, documentation writing, and configuration optimization for this project were completed with the help of Cursor. 

## 📄 License

MIT 
