const WebSocket = require("ws");
const RPCClient = require("@alicloud/pop-core").RPCClient;
const Nls = require("alibabacloud-nls");
const alimt20181012 = require("@alicloud/alimt20181012");
const OpenApi = require("@alicloud/openapi-client");
const Util = require("@alicloud/tea-util");

// 导入配置文件
const config = require("./config.js");

// 初始化阿里云NLS客户端
var nlsClient = new RPCClient({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    endpoint: config.nls.endpoint,
    apiVersion: config.nls.apiVersion,
});

// 机器翻译客户端
class TranslationClient {
    /**
     * 初始化翻译客户端
     * @returns 翻译客户端实例
     */
    static createClient() {
        let clientConfig = new OpenApi.Config({
            accessKeyId: config.accessKeyId,
            accessKeySecret: config.accessKeySecret,
        });
        clientConfig.endpoint = config.translation.endpoint;
        return new alimt20181012.default(clientConfig);
    }
}

/**
 * WebSocket消息格式化函数
 * @param {string} msg - WebSocket消息
 * @returns {string} 格式化后的结果
 */
const formatMessage = (msg) => {
    return JSON.parse(msg)?.payload?.result;
};

/**
 * 发送WebSocket消息到客户端
 * @param {WebSocket} ws - WebSocket连接
 * @param {string} type - 消息类型
 * @param {object} data - 消息数据
 */
function sendMessage(ws, type, data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, data }));
    }
}

/**
 * 主函数 - 初始化并启动WebSocket服务器
 */
const main = async () => {
    try {
        // 获取Token
        const tokenResult = await nlsClient.request("CreateToken");
        console.log("token = " + tokenResult.Token.Id);
        console.log("expireTime = " + tokenResult.Token.ExpireTime);

        // 创建翻译客户端
        let translationClient = TranslationClient.createClient();

        // 启动WebSocket服务器
        const wss = new WebSocket.Server({ port: config.server.port });
        console.log(`WebSocket服务器已启动，监听端口${config.server.port}`);

        // 处理客户端连接
        wss.on("connection", (ws) => handleClientConnection(ws, tokenResult.Token.Id, translationClient));
    } catch (error) {
        console.error("服务器启动失败:", error);
    }
};

/**
 * 处理客户端WebSocket连接
 * @param {WebSocket} ws - WebSocket连接
 * @param {string} token - 认证token
 * @param {object} translationClient - 翻译客户端
 */
async function handleClientConnection(ws, token, translationClient) {
    console.log("客户端已连接");
    let clientWs = ws;
    
    // 初始化语音识别服务
    let speechTranscription = new Nls.SpeechTranscription({
        url: config.nls.wsUrl,
        appkey: config.nls.appKey,
        token: token,
    });

    // 设置语音识别事件监听器
    setupSpeechTranscriptionListeners(speechTranscription, clientWs, translationClient);

    try {
        // 启动语音识别服务
        await speechTranscription.start(speechTranscription.defaultStartParams(), true, 6000);
    } catch (error) {
        console.log("启动识别服务失败:", error);
        sendMessage(clientWs, "error", {
            message: "启动识别服务失败",
            details: error.message,
        });
    }

    // 处理客户端消息
    ws.on("message", async (message) => {
        try {
            let audioBuffer = Buffer.from(message, "binary");
            if (!speechTranscription.sendAudio(audioBuffer)) {
                console.log("发送音频失败");
                sendMessage(clientWs, "error", { message: "发送音频数据失败" });
            }
        } catch (error) {
            console.log("sendAudio失败:", error);
            sendMessage(clientWs, "error", {
                message: "发送音频数据出错",
                details: error.message,
            });
        }
    });

    // 处理客户端断开连接
    ws.on("close", async () => {
        console.log("客户端连接已关闭，停止识别");
        try {
            await speechTranscription.close();
            console.log("识别服务已关闭");
        } catch (error) {
            console.log("关闭识别服务失败:", error);
        }
    });
}

/**
 * 设置语音识别事件监听器
 * @param {object} st - 语音识别实例
 * @param {WebSocket} clientWs - 客户端WebSocket连接
 * @param {object} translationClient - 翻译客户端
 */
function setupSpeechTranscriptionListeners(st, clientWs, translationClient) {
    // 识别开始事件
    st.on("started", (msg) => {
        console.log("识别已开始:", formatMessage(msg));
        sendMessage(clientWs, "started", { result: formatMessage(msg) || "识别已开始" });
    });

    // 识别结果变化事件
    st.on("changed", async (msg) => {
        const result = formatMessage(msg);
        console.log("识别中间结果:", result);
        
        try {
            // 调用翻译API
            let translateRequest = new alimt20181012.TranslateGeneralRequest({
                formatType: "text",
                sourceLanguage: config.translation.sourceLanguage,
                targetLanguage: config.translation.targetLanguage,
                sourceText: result,
                scene: config.translation.scene,
            });
            
            let runtime = new Util.RuntimeOptions({});
            const translationResult = await translationClient.translateGeneralWithOptions(
                translateRequest,
                runtime
            );
            
            sendMessage(clientWs, "changed", { 
                result: translationResult.body?.data?.translated || "" 
            });
        } catch (error) {
            console.log("翻译失败:", error.message);
            if (error.data && error.data["Recommend"]) {
                console.log("诊断地址:", error.data["Recommend"]);
            }
        }
    });

    // 识别完成事件
    st.on("completed", (msg) => {
        const result = formatMessage(msg);
        console.log("识别完成:", result);
        sendMessage(clientWs, "completed", { result: result || "" });
    });

    // 识别关闭事件
    st.on("closed", () => {
        console.log("识别会话已关闭");
        sendMessage(clientWs, "closed", { message: "识别会话已关闭" });
    });

    // 识别失败事件
    st.on("failed", (msg) => {
        console.log("识别失败:", formatMessage(msg));
        sendMessage(clientWs, "error", { 
            message: "识别失败", 
            details: formatMessage(msg) 
        });
    });

    // 识别开始事件
    st.on("begin", (msg) => {
        console.log("语音开始:", formatMessage(msg));
    });

    // 识别结束事件
    st.on("end", (msg) => {
        console.log("语音结束:", formatMessage(msg));
    });
}

// 启动服务器
main();
