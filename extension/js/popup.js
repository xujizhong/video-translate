document.addEventListener('DOMContentLoaded', async () => {
    const extractBtn = document.getElementById('extractBtn');
    const statusDiv = document.getElementById('status');
    const progressBar = document.getElementById('progressBar');
    const wsUrlInput = document.getElementById('wsUrl');
    const videoSelect = document.getElementById('videoSelect');
    
    // 字幕选项元素
    const subtitlePosition = document.getElementById('subtitlePosition');
    const subtitleSize = document.getElementById('subtitleSize');
    const textColor = document.getElementById('textColor');
    const bgColor = document.getElementById('bgColor');
    const bgOpacity = document.getElementById('bgOpacity');
    
    // 获取当前标签页
    let currentTab;
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
    
    // 查询页面中的所有视频元素
    chrome.tabs.sendMessage(currentTab.id, { action: 'getVideos' }, (response) => {
        if (response && response.videos && response.videos.length > 0) {
            // 清空现有选项
            videoSelect.innerHTML = '';
            
            // 添加找到的视频元素
            response.videos.forEach((video, index) => {
                const option = document.createElement('option');
                option.value = index;
                
                // 构建描述性标签
                let description = `视频 ${index + 1}`;
                if (video.id) description += ` (ID: ${video.id})`;
                if (video.width && video.height) description += ` [${video.width}x${video.height}]`;
                if (video.src) description += ` - ${video.src.substring(0, 30)}...`;
                
                option.textContent = description;
                videoSelect.appendChild(option);
            });
        } else {
            statusDiv.textContent = '页面上未找到视频元素';
        }
    });
    
    // 提取按钮点击事件
    extractBtn.addEventListener('click', () => {
        const wsUrl = wsUrlInput.value.trim();
        const selectedVideoIndex = videoSelect.value;
        
        if (!wsUrl) {
            statusDiv.textContent = '请输入WebSocket服务器地址';
            return;
        }
        
        if (!selectedVideoIndex) {
            statusDiv.textContent = '请选择一个视频元素';
            return;
        }
        
        // 获取字幕样式设置
        const subtitleStyles = {
            position: subtitlePosition.value,
            size: subtitleSize.value,
            textColor: textColor.value,
            bgColor: bgColor.value,
            bgOpacity: bgOpacity.value
        };
        
        // 禁用按钮
        extractBtn.disabled = true;
        statusDiv.textContent = '准备提取音频...（处理期间可以正常听到声音）';
        progressBar.hidden = false;
        progressBar.value = 0;
        
        // 发送消息到content脚本，开始提取选定视频的音频
        chrome.tabs.sendMessage(
            currentTab.id, 
            { 
                action: 'extractAudio', 
                videoIndex: parseInt(selectedVideoIndex),
                wsUrl: wsUrl,
                subtitleStyles: subtitleStyles
            }
        );
    });
    
    // 监听来自content script的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'updateStatus') {
            statusDiv.textContent = message.status;
        } else if (message.action === 'updateProgress') {
            progressBar.value = message.progress;
        } else if (message.action === 'processingComplete') {
            statusDiv.textContent = '音频提取和发送完成！音量已恢复原始设置。';
            progressBar.hidden = true;
            extractBtn.disabled = false;
        } else if (message.action === 'processingError') {
            statusDiv.textContent = `错误: ${message.error}`;
            progressBar.hidden = true;
            extractBtn.disabled = false;
        }
    });
}); 