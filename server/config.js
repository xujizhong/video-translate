// 加载环境变量
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// 打印环境变量检查（启动时调试用，生产环境中应移除）
console.log('环境变量检查：', {
    keyId: process.env.ALI_ACCESS_KEY_ID ? '已设置' : '未设置',
    keySecret: process.env.ALI_ACCESS_KEY_SECRET ? '已设置' : '未设置',
    appKey: process.env.ALI_NLS_APP_KEY ? '已设置' : '未设置'
});

// 阿里云API配置
module.exports = {
    // 阿里云访问密钥 - 从环境变量读取
    accessKeyId: process.env.ALI_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALI_ACCESS_KEY_SECRET,
    
    // NLS语音识别配置
    nls: {
        endpoint: "http://nls-meta.cn-shanghai.aliyuncs.com",
        apiVersion: "2019-02-28",
        appKey: process.env.ALI_NLS_APP_KEY,
        wsUrl: "wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1"
    },
    
    // 机器翻译配置
    translation: {
        endpoint: "mt.aliyuncs.com",
        sourceLanguage: "en",
        targetLanguage: "zh",
        scene: "general"
    },
    
    // WebSocket服务器配置
    server: {
        port: process.env.SERVER_PORT || 3000
    }
} 