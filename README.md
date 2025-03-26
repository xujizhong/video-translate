# Video Translate

一个强大的AI驱动实时音视频字幕翻译工具，可以从视频中提取音频并进行实时语音识别和翻译，生成多语言字幕。

中文 | [English](README.en.md)

## ✨ 核心功能

- 🎬 **视频音频提取** - 从本地视频文件中提取音频
- 🎙️ **AI语音识别** - 基于阿里云NLS的高精度语音识别
- 🌐 **实时翻译** - 英文到中文的实时翻译（更多语言支持正在开发中）
- 📝 **字幕生成** - 生成并同步显示字幕
- ⏱️ **实时处理** - 低延迟的实时音频处理
- 🔄 **流式处理** - 流式音频传输和处理

## 🖥️ 支持的视频平台

本工具作为浏览器扩展，支持以下主流视频平台：

- **YouTube** - 全球最大的视频分享平台
- **Bilibili** - 中国领先的视频弹幕网站
- **TED** - 思想传播平台

支持所有使用HTML5标准`<video>`标签的网站，覆盖绝大多数现代视频网站。

## 💡 当前翻译支持说明

**注意**：当前版本仅支持从**英语**翻译到**中文**的单向翻译。这是由于初始开发阶段的限制，翻译方向在代码中是固定的。在未来的版本中，我们计划实现多种语言之间的双向翻译功能，让用户可以自由选择源语言和目标语言。


## 🎥 演示视频

### YouTube 视频演示
![YouTube 演示](assets/youtube.gif)

### TED 视频演示
![TED 演示](assets/ted.gif) 

## 🚀 快速开始

### 前提条件

- Node.js >= 14.0.0
- 阿里云账号及相关服务开通（语音识别、机器翻译）

### 阿里云服务开通指南

在使用本工具前，您需要开通以下阿里云服务：

1. **智能语音交互服务 (NLS)**
   - 访问 [智能语音交互控制台](https://nls-portal.console.aliyun.com/overview) 开通服务
   - 在 [NLS应用管理页面](https://nls-portal.console.aliyun.com/applist) 创建项目，获取appKey

2. **机器翻译服务**
   - 访问 [机器翻译控制台](https://mt.console.aliyun.com/basic) 开通服务

3. **获取AccessKey**
   - 登录阿里云控制台，获取AccessKey ID和AccessKey Secret
   - 请确保用户有相关服务的访问权限

### 配置

1. 克隆仓库:
   ```bash
   git clone https://github.com/xujizhong/video-translate.git
   cd video-translate
   ```

2. 安装服务器依赖:
   ```bash
   npm run install-server
   ```

3. 配置环境变量:
   ```bash
   # 进入server目录
   cd server
   
   # 复制环境变量模板
   cp .env.example .env
   
   # 编辑环境变量文件，添加您的阿里云密钥
   vi .env
   ```
   
   环境变量文件(.env)中需要设置以下内容:
   ```
   # 阿里云访问密钥
   ALI_ACCESS_KEY_ID=您的accessKeyId
   ALI_ACCESS_KEY_SECRET=您的accessKeySecret
   
   # 阿里云NLS应用密钥
   ALI_NLS_APP_KEY=您的appKey
   
   # 服务器端口设置
   SERVER_PORT=3000
   ```

4. 配置文件已设置为从环境变量读取敏感信息，无需额外修改。

### 启动服务

启动服务器（处理AI语音识别和翻译）:
```bash
npm run server
```

开发模式启动（自动重载）:
```bash
npm run dev
```

### 使用方法

1. 安装Chrome插件
   - 打开Chrome浏览器，访问 `chrome://extensions/`
   - 开启右上角的"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目中的 `extension` 目录

2. 启动服务端
   - 确保服务端正在运行（默认端口3000）
   - 如果端口被占用，可以在 `.env` 文件中修改 `SERVER_PORT`

3. 使用插件
   - 访问视频网站
   - 播放视频时，点击Chrome工具栏中的插件图标
   - 插件会自动识别当前播放的视频并开始处理
   - 实时查看识别结果和翻译字幕

## 🛠️ 技术架构

- **前端**: 原生JavaScript、Web Audio API、WebSocket
- **后端**: Node.js、WebSocket、阿里云语音识别服务
- **AI服务**: 
  - 阿里云语音识别 (NLS)
  - 阿里云机器翻译

## 📋 后续开发计划

- [ ] **多语言翻译支持** - 实现多种语言之间的互相翻译
  - [ ] 添加语言选择界面
  - [ ] 支持常见语言如中文、英语、日语、韩语、法语、德语等
  - [ ] 允许用户自定义源语言和目标语言
- [ ] 支持更多视频格式
- [ ] 添加字幕下载功能
- [ ] 添加字幕样式自定义
- [ ] 提供字幕时间轴编辑
- [ ] 离线翻译模式

## 🔒 注意事项

- 大型视频文件可能导致浏览器内存不足
- 确保网络连接稳定以获得最佳实时翻译效果
- 阿里云服务使用需遵循阿里云相关服务条款
- **安全提示**: 请勿将包含敏感信息的.env文件提交到代码仓库
- **翻译限制**: 当前版本仅支持英文到中文的翻译

## 👏 致谢

特别感谢 [Cursor](https://www.cursor.com/) 编辑器及其强大的AI辅助功能，本项目的大部分代码重构、文档编写和配置优化都是在Cursor的帮助下完成的。

## 📄 许可证

MIT 
