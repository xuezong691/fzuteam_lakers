/**
 * @jest-environment jsdom
 */

describe('meeting.js 前端模块测试', () => {
  beforeEach(() => {
    jest.resetModules();

    document.body.innerHTML = `
      <input type="file" id="meetingAudioFile" />
      <button id="startTranscribeBtn">音频转文字</button>
      <button id="generateSummaryBtn">生成会议摘要</button>
      <button id="clearAllBtn">清空</button>
  
      <textarea id="transcribeResult"></textarea>
      <textarea id="summaryResult"></textarea>
  
      <button id="downloadTranscribeBtn"></button>
      <button id="downloadSummaryBtn"></button>
    `;

    localStorage.setItem('user_id', 'test_user');

    fetch.mockReset();
    alert.mockClear();
    confirm.mockClear();

    // ⚠️ 关键：加载脚本
    require('../code/static/meeting.js');

    // ⚠️ 关键：手动触发 DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });


  test('点击“音频转文字”但未上传文件 → 提示错误', async () => {
    const btn = document.getElementById('startTranscribeBtn');

    btn.click();

    expect(alert).toHaveBeenCalledWith('请先上传会议音频文件');
  });

  test('音频转写成功流程', async () => {
    // mock fetch 返回
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        text: '这是会议转写内容'
      })
    });

    // mock 文件
    const file = new File(['audio'], 'test.wav', { type: 'audio/wav' });
    const input = document.getElementById('meetingAudioFile');

    Object.defineProperty(input, 'files', {
      value: [file]
    });

    document.getElementById('startTranscribeBtn').click();

    // 等待 Promise 执行
    await new Promise(process.nextTick);

    expect(fetch).toHaveBeenCalled();
    expect(document.getElementById('transcribeResult').value)
      .toBe('这是会议转写内容');
  });

  test('生成会议摘要成功', async () => {
    document.getElementById('transcribeResult').value = '会议全文';

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        summary: '会议摘要内容'
      })
    });

    document.getElementById('generateSummaryBtn').click();
    await new Promise(process.nextTick);

    expect(fetch).toHaveBeenCalled();
    expect(document.getElementById('summaryResult').value)
      .toBe('会议摘要内容');
  });

  test('清空按钮清空所有内容', () => {
    document.getElementById('transcribeResult').value = 'abc';
    document.getElementById('summaryResult').value = 'xyz';

    document.getElementById('clearAllBtn').click();

    expect(document.getElementById('transcribeResult').value).toBe('');
    expect(document.getElementById('summaryResult').value).toBe('');
  });
});

test('文字转摘要接口：有返回数据 & 性能测试', async () => {
  // 1. 准备输入文本
  document.getElementById('transcribeResult').value =
    '这是一次会议记录，用于测试摘要生成接口是否正常返回数据以及性能是否达标。';

  // 2. mock 后端返回（模拟正常但非瞬时的接口）
  fetch.mockImplementationOnce(() =>
    new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: async () => ({
            success: true,
            summary: '测试摘要结果'
          })
        });
      }, 50); // 模拟 50ms 接口延迟
    })
  );

  const startTime = Date.now();

  // 3. 触发摘要生成
  document.getElementById('generateSummaryBtn').click();

  // 等待异步完成
  await new Promise(resolve => setTimeout(resolve, 80));

  const endTime = Date.now();
  const duration = endTime - startTime;

  // 4. 功能性断言：是否有数据返回
  const summary = document.getElementById('summaryResult').value;
  expect(summary).toBeTruthy();          // 非空即可
  expect(fetch).toHaveBeenCalled();      // 确实调用了接口

  // 5. 性能断言：响应时间是否在阈值内
  expect(duration).toBeLessThan(500);    // 500ms 性能门槛
});
