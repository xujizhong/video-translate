// 监听插件图标点击事件
chrome.action.onClicked.addListener((tab) => {
    // 如果需要做一些初始化操作，可以在这里进行
});

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 转发从content script收到的消息到popup
    if (message.toPopup) {
        delete message.toPopup;
        chrome.runtime.sendMessage(message);
    }
    
    // 如果需要进行一些后台操作，可以在这里进行
    
    return true; // 保持消息通道开放以进行异步响应
}); 