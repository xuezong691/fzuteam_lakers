// static/meeting.js - 会议功能独立JS文件
document.addEventListener('DOMContentLoaded', function() {
  // 等待主页面DOM加载完成后执行（确保能获取到页面元素和核心函数）
  if (!window.getCurrentUserId) {
    console.warn('未找到系统核心函数 getCurrentUserId，会议功能可能无法正常使用');
    return;
  }

  // 获取会议功能所需DOM元素
  const audioFileInput = document.getElementById('meetingAudioFile');
  const languageSelect = document.getElementById('meetingLanguage');
  const reportTypeSelect = document.getElementById('reportType');
  const transcribeBtn = document.getElementById('startTranscribeBtn');
  const summaryBtn = document.getElementById('generateSummaryBtn');
  const clearBtn = document.getElementById('clearAllBtn');
  const transcribeResult = document.getElementById('transcribeResult');
  const summaryResult = document.getElementById('summaryResult');
  const downloadTransBtn = document.getElementById('downloadTranscribeBtn');
  const downloadSumBtn = document.getElementById('downloadSummaryBtn');

  // 检查必要DOM元素是否存在（避免报错）
  const requiredElements = [
    audioFileInput, languageSelect, reportTypeSelect,
    transcribeBtn, summaryBtn, clearBtn,
    transcribeResult, summaryResult,
    downloadTransBtn, downloadSumBtn
  ];
  if (requiredElements.some(el => !el)) {
    console.warn('会议功能所需DOM元素缺失，功能无法初始化');
    return;
  }

  // 1. 音频转文字功能
  transcribeBtn.addEventListener('click', async function() {
    const audioFile = audioFileInput.files[0];
    if (!audioFile) {
      alert('请先上传会议音频文件');
      return;
    }

    // 按钮加载状态处理
    this.textContent = '转写中...';
    this.disabled = true;
    transcribeResult.value = '正在处理音频，请稍候（大文件可能需要1-3分钟）...';

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('language', languageSelect.value);
      formData.append('user_id', getCurrentUserId()); // 复用系统用户ID逻辑

      // 调用后端音频转文字接口
      const response = await fetch('/api/meeting/audio-to-text', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        transcribeResult.value = result.transcript || '未识别到有效音频内容';
        alert('音频转写成功！');
      } else {
        transcribeResult.value = '';
        alert('转写失败：' + (result.message || '未知错误'));
      }
    } catch (error) {
      console.error('音频转写错误：', error);
      transcribeResult.value = '';
      alert('转写失败：网络异常或服务器错误');
    } finally {
      // 恢复按钮原始状态
      this.textContent = '音频转文字';
      this.disabled = false;
    }
  });

  // 2. 生成会议摘要功能
  summaryBtn.addEventListener('click', async function() {
    const sourceText = transcribeResult.value.trim();
    if (!sourceText) {
      alert('请先进行音频转写，或手动输入会议文本');
      return;
    }

    // 按钮加载状态处理
    this.textContent = '生成中...';
    this.disabled = true;
    summaryResult.value = '正在生成摘要，请稍候...';

    try {
      // 调用后端摘要生成接口
      const response = await fetch('/api/meeting/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: getCurrentUserId(),
          source_text: sourceText,
          summary_type: reportTypeSelect.value
        })
      });

      const result = await response.json();
      if (result.success) {
        summaryResult.value = result.summary || '无法生成有效摘要';
        alert('会议摘要生成成功！');
      } else {
        summaryResult.value = '';
        alert('生成失败：' + (result.message || '未知错误'));
      }
    } catch (error) {
      console.error('摘要生成错误：', error);
      summaryResult.value = '';
      alert('生成失败：网络异常或服务器错误');
    } finally {
      // 恢复按钮原始状态
      this.textContent = '生成会议摘要';
      this.disabled = false;
    }
  });

  // 3. 清空所有内容功能
  clearBtn.addEventListener('click', function() {
    if (confirm('确认要清空所有内容吗？')) {
      audioFileInput.value = ''; // 清空文件选择
      transcribeResult.value = ''; // 清空转写结果
      summaryResult.value = ''; // 清空摘要结果
    }
  });

  // 4. 下载转写文本功能
  downloadTransBtn.addEventListener('click', function() {
    const content = transcribeResult.value.trim();
    if (!content) {
      alert('没有可下载的转写内容');
      return;
    }
    // 生成带日期的文件名
    const fileName = `会议转写文本_${new Date().toLocaleDateString()}.txt`;
    downloadFile(content, fileName);
  });

  // 5. 下载摘要报告功能
  downloadSumBtn.addEventListener('click', function() {
    const content = summaryResult.value.trim();
    if (!content) {
      alert('没有可下载的摘要内容');
      return;
    }
    // 按报告类型生成文件名
    const reportType = reportTypeSelect.value;
    const fileName = `${reportType}_会议摘要_${new Date().toLocaleDateString()}.txt`;
    downloadFile(content, fileName);
  });

  // 通用文件下载工具函数
  function downloadFile(content, fileName) {
    // 创建UTF-8编码的Blob对象（避免中文乱码）
    const blob = new Blob([content], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // 创建隐藏的下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';

    // 触发下载并清理资源
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url); // 释放Blob URL资源
    }, 100);
  }
});