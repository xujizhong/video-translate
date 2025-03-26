// 存储页面上的所有视频元素
let videoElements = [];
let selectedVideoIndex = -1;
let ws = null;
let isProcessing = false;
let originalVolume = 0; // 存储原始音量
let subtitleOverlay = null; // 字幕覆盖层
let currentTranscription = ''; // 当前识别文本
let subtitleStyles = null; // 字幕样式设置

// 初始化：搜索并存储页面上的所有video元素
function findAllVideoElements() {
    // 从DOM获取所有视频元素
    const videos = document.querySelectorAll('video');
    videoElements = [];

    videos.forEach(video => {
        videoElements.push({
            element: video,
            id: video.id,
            src: video.src || (video.querySelector('source') ? video.querySelector('source').src : ''),
            width: video.width || video.videoWidth,
            height: video.height || video.videoHeight
        });
    });

    return videoElements.map(v => ({
        id: v.id,
        src: v.src,
        width: v.width,
        height: v.height
    }));
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 获取页面上的所有视频元素
    if (message.action === 'getVideos') {
        const videos = findAllVideoElements();
        sendResponse({ videos: videos });
        return true;
    }

    // 开始从选定的视频元素提取音频
    if (message.action === 'extractAudio') {
        if (isProcessing) {
            sendStatusToPop('已有正在处理的任务，请等待完成', 'updateStatus');
            return true;
        }

        selectedVideoIndex = message.videoIndex;
        const wsUrl = message.wsUrl;
        subtitleStyles = message.subtitleStyles || {}; // 存储字幕样式设置

        if (selectedVideoIndex < 0 || selectedVideoIndex >= videoElements.length) {
            sendStatusToPop('无效的视频索引', 'processingError');
            return true;
        }

        extractAndSendAudio(videoElements[selectedVideoIndex].element, wsUrl);
        return true;
    }

    return true; // 保持消息通道开放以进行异步响应
});

// 向popup发送状态更新
function sendStatusToPop(data, action) {
    chrome.runtime.sendMessage({
        action: action || 'updateStatus',
        status: data,
        toPopup: true
    });
}

// 向popup发送进度更新
function sendProgressToPop(progress) {
    chrome.runtime.sendMessage({
        action: 'updateProgress',
        progress: progress,
        toPopup: true
    });
}

// 创建字幕覆盖层
function createSubtitleOverlay(videoElement) {
    // 移除现有的字幕覆盖层（如果有）
    if (subtitleOverlay) {
        // 停止监听视频尺寸变化
        if (subtitleOverlay.resizeObserver) {
            subtitleOverlay.resizeObserver.disconnect();
        }
        
        // 移除事件监听器
        if (subtitleOverlay.eventListeners) {
            document.removeEventListener('fullscreenchange', subtitleOverlay.eventListeners.fullscreenchange);
            document.removeEventListener('webkitfullscreenchange', subtitleOverlay.eventListeners.fullscreenchange);
            document.removeEventListener('mozfullscreenchange', subtitleOverlay.eventListeners.fullscreenchange);
            document.removeEventListener('MSFullscreenChange', subtitleOverlay.eventListeners.fullscreenchange);
            window.removeEventListener('resize', subtitleOverlay.eventListeners.resize);
        }
        
        // 清除防抖定时器
        if (subtitleOverlay.resizeTimeout) {
            clearTimeout(subtitleOverlay.resizeTimeout);
        }
        
        subtitleOverlay.remove();
        subtitleOverlay = null;
    }
    
    // 创建新的字幕覆盖层
    subtitleOverlay = document.createElement('div');
    subtitleOverlay.className = 'video-subtitle-overlay';
    
    // 应用基本样式
    subtitleOverlay.style.position = 'absolute';
    subtitleOverlay.style.left = '0';
    subtitleOverlay.style.width = '100%';
    subtitleOverlay.style.padding = '10px';
    subtitleOverlay.style.boxSizing = 'border-box';
    subtitleOverlay.style.textAlign = 'center';
    subtitleOverlay.style.zIndex = '10000';
    subtitleOverlay.style.pointerEvents = 'none'; // 允许点击穿透
    subtitleOverlay.style.maxWidth = '80%'; // 限制最大宽度
    subtitleOverlay.style.margin = '0 auto'; // 水平居中
    subtitleOverlay.style.wordWrap = 'break-word'; // 允许单词内换行
    subtitleOverlay.style.whiteSpace = 'pre-wrap'; // 保留空格并允许换行
    subtitleOverlay.style.lineHeight = '1.5'; // 行间距
    subtitleOverlay.style.maxHeight = '30%'; // 限制最大高度
    subtitleOverlay.style.overflow = 'hidden'; // 超出部分隐藏
    
    // 应用用户指定的样式
    if (subtitleStyles) {
        // 字幕位置
        if (subtitleStyles.position === 'top') {
            subtitleOverlay.style.top = '10%';
            subtitleOverlay.style.bottom = 'auto';
        } else if (subtitleStyles.position === 'middle') {
            subtitleOverlay.style.top = '50%';
            subtitleOverlay.style.bottom = 'auto';
            subtitleOverlay.style.transform = 'translateY(-50%)';
        } else { // bottom (default)
            subtitleOverlay.style.bottom = '10%';
            subtitleOverlay.style.top = 'auto';
        }
        
        // 字幕大小
        if (subtitleStyles.size === 'small') {
            subtitleOverlay.style.fontSize = '16px';
        } else if (subtitleStyles.size === 'large') {
            subtitleOverlay.style.fontSize = '24px';
        } else { // medium (default)
            subtitleOverlay.style.fontSize = '20px';
        }
        
        // 文字颜色
        if (subtitleStyles.textColor) {
            subtitleOverlay.style.color = subtitleStyles.textColor;
        } else {
            subtitleOverlay.style.color = '#ffffff';
        }
        
        // 背景颜色和透明度
        if (subtitleStyles.bgColor && subtitleStyles.bgOpacity !== undefined) {
            const r = parseInt(subtitleStyles.bgColor.slice(1, 3), 16);
            const g = parseInt(subtitleStyles.bgColor.slice(3, 5), 16);
            const b = parseInt(subtitleStyles.bgColor.slice(5, 7), 16);
            subtitleOverlay.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${subtitleStyles.bgOpacity})`;
        } else {
            subtitleOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        }
    } else {
        // 默认样式
        subtitleOverlay.style.bottom = '10%';
        subtitleOverlay.style.color = '#fff';
        subtitleOverlay.style.textShadow = '0 0 2px #000';
        subtitleOverlay.style.fontSize = '18px';
        subtitleOverlay.style.fontWeight = 'bold';
        subtitleOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    }
    
    // 始终添加文字阴影以提高可读性
    subtitleOverlay.style.textShadow = '0 0 2px #000';
    subtitleOverlay.style.fontWeight = 'bold';
    
    // 查找适合放置字幕的容器
    let subtitleContainer = findAppropriateContainer(videoElement);
    
    // 将字幕覆盖层添加到合适的容器
    subtitleContainer.appendChild(subtitleOverlay);
    
    // 调整字幕层的尺寸和位置以匹配视频
    adjustSubtitlePosition(videoElement);
    
    // 监听视频尺寸变化以重新调整字幕位置
    const resizeObserver = new ResizeObserver(() => {
        adjustSubtitlePosition(videoElement);
    });
    resizeObserver.observe(videoElement);
    
    // 保存ResizeObserver的引用以便之后清理
    subtitleOverlay.resizeObserver = resizeObserver;
    
    // 监听全屏变化事件
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // 监听窗口大小变化事件
    window.addEventListener('resize', handleWindowResize);
    
    // 保存事件监听器引用以便之后清理
    subtitleOverlay.eventListeners = {
        fullscreenchange: handleFullscreenChange,
        resize: handleWindowResize
    };
    
    return subtitleOverlay;
}

// 查找适合放置字幕的容器
function findAppropriateContainer(videoElement) {
    // 获取视频元素的计算样式
    const videoStyle = window.getComputedStyle(videoElement);
    
    // 检查是否在YouTube上
    const isYouTube = window.location.hostname.includes('youtube.com');
    
    if (isYouTube) {
        // 尝试查找YouTube特定的播放器容器
        // 通常这是一个ID为"movie_player"的div
        const youtubePlayer = document.getElementById('movie_player');
        if (youtubePlayer) {
            // 确保容器是相对定位的
            const containerStyle = window.getComputedStyle(youtubePlayer);
            if (containerStyle.position !== 'static') {
                return youtubePlayer;
            }
        }
        
        // 如果找不到特定容器，尝试查找.html5-video-container
        const videoContainer = document.querySelector('.html5-video-container');
        if (videoContainer) {
            return videoContainer;
        }
    }
    
    // 如果视频是绝对定位，查找相对定位的父容器
    if (videoStyle.position === 'absolute') {
        let parent = videoElement.parentElement;
        while (parent) {
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.position === 'relative' || parentStyle.position === 'fixed') {
                return parent;
            }
            parent = parent.parentElement;
        }
    }
    
    // 默认情况：使用视频的直接父容器
    const videoContainer = videoElement.parentElement;
    const computedStyle = window.getComputedStyle(videoContainer);
    if (computedStyle.position === 'static') {
        videoContainer.style.position = 'relative';
    }
    
    return videoContainer;
}

// 调整字幕层的尺寸和位置以匹配视频
function adjustSubtitlePosition(videoElement) {
    if (!subtitleOverlay) return;
    
    // 获取视频的尺寸和位置
    const videoRect = videoElement.getBoundingClientRect();
    
    // 获取视频的容器尺寸和位置
    const containerRect = subtitleOverlay.parentElement.getBoundingClientRect();
    
    // 以容器为参考系，计算视频的相对位置
    const relativeLeft = videoRect.left - containerRect.left;
    const relativeTop = videoRect.top - containerRect.top;
    
    // 调整字幕层的位置和尺寸，使其对齐视频
    if (window.location.hostname.includes('youtube.com')) {
        // YouTube特殊处理
        subtitleOverlay.style.left = '0';
        subtitleOverlay.style.width = '100%';
    } else {
        // 常规处理 - 修改以支持居中
        subtitleOverlay.style.left = `${relativeLeft}px`;
        subtitleOverlay.style.width = `${videoRect.width}px`;
        // 确保居中对齐
        subtitleOverlay.style.right = 'auto';
        subtitleOverlay.style.marginLeft = 'auto';
        subtitleOverlay.style.marginRight = 'auto';
        // 调整left值以实现80%宽度的居中效果
        if (subtitleOverlay.style.maxWidth) {
            try {
                const maxWidthStr = subtitleOverlay.style.maxWidth;
                // 从"80%"这样的字符串中提取数字部分
                const percentValue = parseFloat(maxWidthStr);
                // 确保有一个有效的百分比值，否则使用默认值80%
                const maxWidthPercent = !isNaN(percentValue) ? percentValue / 100 : 0.8;
                const actualWidth = Math.min(videoRect.width, videoRect.width * maxWidthPercent);
                const offset = (videoRect.width - actualWidth) / 2;
                subtitleOverlay.style.left = `${relativeLeft + offset}px`;
                subtitleOverlay.style.width = `${actualWidth}px`;
            } catch (error) {
                console.error('解析字幕宽度时出错:', error);
                // 出错时使用默认值
                const defaultWidth = videoRect.width * 0.8;
                const defaultOffset = (videoRect.width - defaultWidth) / 2;
                subtitleOverlay.style.left = `${relativeLeft + defaultOffset}px`;
                subtitleOverlay.style.width = `${defaultWidth}px`;
            }
        }
    }
    
    // 强制先计算字幕实际高度
    const subtitleHeight = subtitleOverlay.offsetHeight;
    
    // 确保底部字幕不超出视频范围
    const maxBottomPosition = videoRect.height * 0.95;
    
    // 更新位置样式（如果需要）
    if (subtitleStyles && subtitleStyles.position === 'top') {
        // 顶部位置：视频顶部向下10%位置
        subtitleOverlay.style.top = `${relativeTop + videoRect.height * 0.1}px`;
        subtitleOverlay.style.bottom = 'auto';
    } else if (subtitleStyles && subtitleStyles.position === 'middle') {
        // 中间位置：垂直居中
        const middlePosition = relativeTop + (videoRect.height / 2) - (subtitleHeight / 2);
        subtitleOverlay.style.top = `${middlePosition}px`;
        subtitleOverlay.style.bottom = 'auto';
    } else {
        // 底部位置（默认）：视频底部向上10%位置或根据字幕高度调整
        const bottomPosition = relativeTop + videoRect.height - subtitleHeight - (videoRect.height * 0.1);
        // 确保不会超出视频顶部
        const adjustedPosition = Math.max(relativeTop, Math.min(bottomPosition, relativeTop + maxBottomPosition - subtitleHeight));
        subtitleOverlay.style.top = `${adjustedPosition}px`;
        subtitleOverlay.style.bottom = 'auto';
    }
}

// 更新字幕文本
function updateSubtitle(text) {
    if (subtitleOverlay) {
        // 设置字幕文本
        subtitleOverlay.textContent = text || '正在识别...';
        currentTranscription = text || '';
        
        // 文本更新后重新调整位置，因为高度可能变化
        if (videoElements[selectedVideoIndex]) {
            // 使用延迟来确保DOM完成更新
            setTimeout(() => {
                adjustSubtitlePosition(videoElements[selectedVideoIndex].element);
            }, 0);
        }
    }
}

// 从视频元素中提取音频并发送到WebSocket服务器
async function extractAndSendAudio(videoElement, wsUrl) {
    isProcessing = true;
    try {
        sendStatusToPop('正在准备音频流...');

        // 存储原始音量
        originalVolume = videoElement.volume;
        
        // 确保声音是开启的
        videoElement.muted = false;
        videoElement.volume = 1.0;

        // 创建字幕覆盖层
        createSubtitleOverlay(videoElement);
        updateSubtitle('准备中...');

        // 创建WebSocket连接
        ws = new WebSocket(wsUrl);
        
        ws.onopen = function() {
            sendStatusToPop('WebSocket连接已建立，开始提取音频...');
            captureAndSendAudio(videoElement);
        };
        
        ws.onmessage = function(event) {
            try {
                const message = JSON.parse(event.data);
                
                if (message.type === 'changed') {
                    // 实时更新识别结果到视频上
                    updateSubtitle(message.data.result || '正在识别...');
                    sendStatusToPop(`识别中: ${message.data.result || ''}`, 'updateStatus');
                } else if (message.type === 'completed') {
                    // 显示最终识别结果
                    updateSubtitle(message.data.result || '识别完成');
                    sendStatusToPop(`识别完成: ${message.data.result || ''}`, 'updateStatus');
                }
            } catch (error) {
                console.error('处理WebSocket消息出错:', error);
            }
        };
        
        ws.onerror = function(error) {
            sendStatusToPop(`WebSocket错误: ${error}`, 'processingError');
            videoElement.volume = originalVolume; // 恢复原始音量
            isProcessing = false;
        };
        
        ws.onclose = function() {
            sendStatusToPop('WebSocket连接已关闭');
        };
        
    } catch (error) {
        sendStatusToPop(`处理出错: ${error.message}`, 'processingError');
        videoElement.volume = originalVolume; // 恢复原始音量
        isProcessing = false;
    }
}

// 从视频流中捕获音频并发送到WebSocket
async function captureAndSendAudio(videoElement) {
    try {
        // 创建一个AudioContext，设置采样率为16000
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 16000,
        });
        
        sendStatusToPop('正在创建音频处理节点...');
        
        // 创建MediaElementAudioSourceNode来从视频元素捕获音频流
        const source = audioContext.createMediaElementSource(videoElement);
        
        // 创建ScriptProcessorNode来处理音频数据
        // 注意：ScriptProcessorNode已被弃用，但在许多浏览器中仍然可用
        // 未来可能需要迁移到AudioWorklet
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        
        // 创建分析器节点，用于分析音频数据
        const analyser = audioContext.createAnalyser();
        
        // 连接节点：source -> analyser -> destination（确保音频可以播放）
        // 同时连接到processor进行处理
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        source.connect(processor);
        processor.connect(audioContext.destination);
        
        let audioBuffer = [];
        const bufferSize = 16000; // 每秒16000个样本
        let totalSent = 0;
        let totalBuffers = Math.ceil(videoElement.duration * 16000 / bufferSize);
        
        // 如果无法确定视频长度，使用替代估计
        if (!isFinite(totalBuffers) || totalBuffers <= 0) {
            totalBuffers = 100; // 默认假设
        }
        
        sendStatusToPop('开始捕获音频数据...');
        updateSubtitle('开始识别...');
        
        // 处理音频数据
        processor.onaudioprocess = function(e) {
            if (ws.readyState !== WebSocket.OPEN) {
                sendStatusToPop('WebSocket连接已关闭，停止处理', 'processingError');
                // 断开连接
                cleanup();
                return;
            }
            
            // 获取音频数据
            const inputData = e.inputBuffer.getChannelData(0);
            
            // 将数据添加到缓冲区
            audioBuffer = audioBuffer.concat(Array.from(inputData));
            
            // 当缓冲区足够大时，发送数据
            if (audioBuffer.length >= bufferSize) {
                sendAudioChunk(audioBuffer.slice(0, bufferSize));
                audioBuffer = audioBuffer.slice(bufferSize);
                
                totalSent++;
                const progress = Math.min(Math.round((totalSent / totalBuffers) * 100), 95);
                sendProgressToPop(progress);
                sendStatusToPop(`正在发送音频数据... ${progress}%`);
            }
        };
        
        // 清理函数 - 断开所有连接并恢复原始状态
        function cleanup() {
            source.disconnect(processor);
            source.disconnect(analyser);
            processor.disconnect(audioContext.destination);
            analyser.disconnect(audioContext.destination);
            
            // 关闭WebSocket
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            
            // 恢复原始音量
            videoElement.volume = originalVolume;
            
            // 保留字幕覆盖层显示最终识别结果
            // 如果需要，可以在一段时间后自动移除
            if (subtitleOverlay) {
                // 可选：设置一个定时器在一段时间后移除字幕
                // setTimeout(() => {
                //     if (subtitleOverlay) {
                //         // 停止监听视频尺寸变化
                //         if (subtitleOverlay.resizeObserver) {
                //             subtitleOverlay.resizeObserver.disconnect();
                //         }
                //         
                //         // 移除事件监听器
                //         if (subtitleOverlay.eventListeners) {
                //             document.removeEventListener('fullscreenchange', subtitleOverlay.eventListeners.fullscreenchange);
                //             document.removeEventListener('webkitfullscreenchange', subtitleOverlay.eventListeners.fullscreenchange);
                //             document.removeEventListener('mozfullscreenchange', subtitleOverlay.eventListeners.fullscreenchange);
                //             document.removeEventListener('MSFullscreenChange', subtitleOverlay.eventListeners.fullscreenchange);
                //             window.removeEventListener('resize', subtitleOverlay.eventListeners.resize);
                //         }
                //         
                //         // 清除防抖定时器
                //         if (subtitleOverlay.resizeTimeout) {
                //             clearTimeout(subtitleOverlay.resizeTimeout);
                //         }
                //         
                //         subtitleOverlay.remove();
                //         subtitleOverlay = null;
                //     }
                // }, 60000); // 例如60秒后移除
            }
            
            isProcessing = false;
        }
        
        // 当视频结束时，发送剩余数据并关闭连接
        videoElement.addEventListener('ended', function onEnded() {
            if (audioBuffer.length > 0) {
                sendAudioChunk(audioBuffer);
            }
            
            cleanup();
            
            sendStatusToPop('音频数据发送完成', 'processingComplete');
            sendProgressToPop(100);
            
            // 移除事件监听器
            videoElement.removeEventListener('ended', onEnded);
        });
        
        // 开始播放视频以触发音频流
        videoElement.currentTime = 0;
        videoElement.play();
        
    } catch (error) {
        sendStatusToPop(`处理出错: ${error.message}`, 'processingError');
        // 恢复原始音量
        videoElement.volume = originalVolume;
        isProcessing = false;
    }
}

// 发送音频数据块到WebSocket服务器
function sendAudioChunk(audioData) {
    try {
        // 将Float32Array转换为Int16Array (16位PCM)
        const pcmData = convertFloat32ToInt16(audioData);
        
        // 发送数据
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(pcmData.buffer);
        }
    } catch (error) {
        sendStatusToPop(`发送数据出错: ${error.message}`, 'processingError');
    }
}

// 将Float32Array转换为Int16Array (16位PCM)
function convertFloat32ToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        // 将-1.0 ~ 1.0的浮点数转换为-32768 ~ 32767的整数
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
}

// 页面加载完成后进行初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始扫描视频元素
    findAllVideoElements();
});

// 监听DOM变动，以检测新添加的视频元素
const observer = new MutationObserver(function(mutations) {
    let videoAdded = false;
    
    mutations.forEach(function(mutation) {
        // 检查是否有新的视频元素被添加
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            for (let i = 0; i < mutation.addedNodes.length; i++) {
                const node = mutation.addedNodes[i];
                
                // 检查节点本身是否是视频元素
                if (node.nodeName === 'VIDEO') {
                    videoAdded = true;
                    break;
                }
                
                // 检查节点是否包含视频元素
                if (node.querySelectorAll) {
                    const videos = node.querySelectorAll('video');
                    if (videos.length > 0) {
                        videoAdded = true;
                        break;
                    }
                }
            }
        }
    });
    
    // 如果找到新的视频元素，更新列表
    if (videoAdded) {
        findAllVideoElements();
    }
});

// 开始监视DOM变动
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// 处理全屏变化事件
function handleFullscreenChange() {
    if (subtitleOverlay && videoElements[selectedVideoIndex]) {
        // 给DOM一点时间来更新布局
        setTimeout(() => {
            adjustSubtitlePosition(videoElements[selectedVideoIndex].element);
        }, 100);
    }
}

// 处理窗口大小变化事件
function handleWindowResize() {
    if (subtitleOverlay && videoElements[selectedVideoIndex]) {
        // 节流函数以避免频繁调用
        if (subtitleOverlay.resizeTimeout) {
            clearTimeout(subtitleOverlay.resizeTimeout);
        }
        
        subtitleOverlay.resizeTimeout = setTimeout(() => {
            adjustSubtitlePosition(videoElements[selectedVideoIndex].element);
            subtitleOverlay.resizeTimeout = null;
        }, 100);
    }
} 