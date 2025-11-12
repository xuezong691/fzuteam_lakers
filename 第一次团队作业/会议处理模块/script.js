// 全局状态管理
const state = {
  audioFile: null,
  transcript: '',
  summary: ''
};

// DOM 元素获取
const elements = {
  audioFile: document.getElementById('audioFile'),
  fileInfo: document.getElementById('fileInfo'),
  fileName: document.getElementById('fileName'),
  fileSize: document.getElementById('fileSize'),
  removeFile: document.getElementById('removeFile'),
  transcribeBtn: document.getElementById('transcribeBtn'),
  transcribeLoading: document.getElementById('transcribeLoading'),
  transcribeError: document.getElementById('transcribeError'),
  transcribeErrorText: document.getElementById('transcribeErrorText'),
  transcribeResult: document.getElementById('transcribeResult'),
  transcriptContent: document.getElementById('transcriptContent'),
  copyTranscript: document.getElementById('copyTranscript'),
  summaryBtn: document.getElementById('summaryBtn'),
  summaryLoading: document.getElementById('summaryLoading'),
  summaryError: document.getElementById('summaryError'),
  summaryErrorText: document.getElementById('summaryErrorText'),
  summaryResult: document.getElementById('summaryResult'),
  summaryContent: document.getElementById('summaryContent'),
  copySummary: document.getElementById('copySummary'),
  copyToast: document.getElementById('copyToast')
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// 显示复制成功提示
const showCopyToast = () => {
  elements.copyToast.classList.remove('opacity-0');
  elements.copyToast.classList.add('opacity-100');
  setTimeout(() => {
    elements.copyToast.classList.remove('opacity-100');
    elements.copyToast.classList.add('opacity-0');
  }, 2000);
};

// 重置状态
const resetState = (resetFile = true) => {
  if (resetFile) {
    state.audioFile = null;
    elements.audioFile.value = '';
    elements.fileInfo.classList.add('hidden');
  }
  
  state.transcript = '';
  state.summary = '';
  
  elements.transcribeBtn.disabled = true;
  elements.transcribeLoading.classList.add('hidden');
  elements.transcribeError.classList.add('hidden');
  elements.transcribeResult.classList.add('hidden');
  elements.transcriptContent.textContent = '';
  
  elements.summaryBtn.disabled = true;
  elements.summaryLoading.classList.add('hidden');
  elements.summaryError.classList.add('hidden');
  elements.summaryResult.classList.add('hidden');
  elements.summaryContent.innerHTML = '';
};

// 音频文件选择处理
elements.audioFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // 验证文件格式和大小
  const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/x-m4a'];
  const maxSize = 100 * 1024 * 1024; // 100MB
  
  if (!allowedTypes.includes(file.type)) {
    alert('请上传 MP3、WAV 或 M4A 格式的音频文件');
    elements.audioFile.value = '';
    return;
  }
  
  if (file.size > maxSize) {
    alert('文件大小不能超过 100MB');
    elements.audioFile.value = '';
    return;
  }
  
  // 保存文件并更新UI
  state.audioFile = file;
  elements.fileName.textContent = file.name;
  elements.fileSize.textContent = `${formatFileSize(file.size)} · ${file.type.split('/')[1].toUpperCase()}`;
  elements.fileInfo.classList.remove('hidden');
  
  // 启用转文字按钮，重置后续状态
  elements.transcribeBtn.disabled = false;
  resetState(false);
});

// 移除已选文件
elements.removeFile.addEventListener('click', () => {
  resetState(true);
});

// 转文字功能
elements.transcribeBtn.addEventListener('click', async () => {
  if (!state.audioFile) return;
  
  // 更新UI状态
  elements.transcribeBtn.disabled = true;
  elements.transcribeLoading.classList.remove('hidden');
  elements.transcribeError.classList.add('hidden');
  
  try {
    // 构建FormData
    const formData = new FormData();
    formData.append('audioFile', state.audioFile);
    
    // 调用后端转文字接口（实际使用时替换为真实接口地址）
    const response = await fetch('/api/audio/transcribe', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || '音频转文字失败');
    }
    
    // 保存结果并更新UI
    state.transcript = result.transcript;
    elements.transcriptContent.textContent = state.transcript;
    elements.transcribeLoading.classList.add('hidden');
    elements.transcribeResult.classList.remove('hidden');
    
    // 启用生成纪要按钮
    elements.summaryBtn.disabled = false;
  } catch (error) {
    // 错误处理
    elements.transcribeLoading.classList.add('hidden');
    elements.transcribeErrorText.textContent = error.message;
    elements.transcribeError.classList.remove('hidden');
    elements.transcribeBtn.disabled = false; // 允许重试
  }
});

// 复制转文字结果
elements.copyTranscript.addEventListener('click', () => {
  navigator.clipboard.writeText(state.transcript).then(showCopyToast);
});

// 生成纪要功能
elements.summaryBtn.addEventListener('click', async () => {
  if (!state.transcript) return;
  
  // 更新UI状态
  elements.summaryBtn.disabled = true;
  elements.summaryLoading.classList.remove('hidden');
  elements.summaryError.classList.add('hidden');
  
  try {
    // 调用后端生成纪要接口（实际使用时替换为真实接口地址）
    const response = await fetch('/api/transcript/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript: state.transcript }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || '生成纪要失败');
    }
    
    // 保存结果并更新UI（支持富文本格式）
    state.summary = result.summary;
    elements.summaryContent.innerHTML = state.summary
      .replace(/\n/g, '<br>')
      .replace(/### (.*)/g, '<h3>$1</h3>')
      .replace(/## (.*)/g, '<h2>$1</h2>')
      .replace(/- (.*)/g, '<p class="flex"><span class="text-primary mr-2 mt-1">•</span>$1</p>');
    elements.summaryLoading.classList.add('hidden');
    elements.summaryResult.classList.remove('hidden');
  } catch (error) {
    // 错误处理
    elements.summaryLoading.classList.add('hidden');
    elements.summaryErrorText.textContent = error.message;
    elements.summaryError.classList.remove('hidden');
    elements.summaryBtn.disabled = false; // 允许重试
  }
});

// 复制纪要结果
elements.copySummary.addEventListener('click', () => {
  // 复制纯文本（去除HTML标签）
  const plainText = state.summary.replace(/<[^>]*>/g, '');
  navigator.clipboard.writeText(plainText).then(showCopyToast);
});

// 初始化状态
resetState(true);