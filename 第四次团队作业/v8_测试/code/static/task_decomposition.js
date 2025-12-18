// ========== 智能任务分解功能 ==========
function addCriteria(type) {
  const container = document.getElementById(type + 'Container');
  if (!container) return;

  const item = document.createElement('div');
  item.className = 'criteria-item';
  item.innerHTML = `
    <input type="text" class="criteria-input" placeholder="添加${type === 'mustHave' ? '必须满足的要求' : '可选优化'}">
    <button type="button" class="add-criteria" onclick="addCriteria('${type}')">+</button>
    <button type="button" class="delete-btn" onclick="removeItem(this)">×</button>
  `;
  container.appendChild(item);
}

function addConstraint(type) {
  const container = document.getElementById(type + 'Container');
  if (!container) return;

  const item = document.createElement('div');
  item.className = 'constraint-item';
  item.innerHTML = `
    <input type="text" class="constraint-input" placeholder="添加${type === 'forbidden' ? '禁止事项' : '前提假设'}">
    <button type="button" class="add-constraint" onclick="addConstraint('${type}')">+</button>
    <button type="button" class="delete-btn" onclick="removeItem(this)">×</button>
  `;
  container.appendChild(item);
}

function removeItem(button) {
  const item = button.parentElement;
  if (!item || !item.parentElement) return;

  if (item.parentElement.children.length > 1) {
    item.remove();
  }
}

function collectFormData() {
  const taskType = document.getElementById('taskType');
  const background = document.getElementById('background');
  const finalDeliverable = document.getElementById('finalDeliverable');
  const timeLimit = document.getElementById('timeLimit');

  if (!taskType || !background || !finalDeliverable || !timeLimit) {
    alert('表单元素未正确加载，请刷新页面重试');
    return null;
  }

  const formData = {
    task_type: taskType.value.trim(),
    background: background.value.trim(),
    final_deliverable: finalDeliverable.value.trim(),
    time_limit: parseInt(timeLimit.value) || 0,
    quality_criteria: {
      must_have: Array.from(document.querySelectorAll('#mustHaveContainer .criteria-input'))
        .map(input => input.value.trim())
        .filter(val => val),
      nice_to_have: Array.from(document.querySelectorAll('#niceToHaveContainer .criteria-input'))
        .map(input => input.value.trim())
        .filter(val => val)
    },
    constraints: {
      forbidden: Array.from(document.querySelectorAll('#forbiddenContainer .constraint-input'))
        .map(input => input.value.trim())
        .filter(val => val),
      assumptions: Array.from(document.querySelectorAll('#assumptionsContainer .constraint-input'))
        .map(input => input.value.trim())
        .filter(val => val)
    }
  };

  // 验证必填字段
  if (!formData.task_type || !formData.background || !formData.final_deliverable || !formData.time_limit) {
    alert('请填写所有必填字段！');
    return null;
  }

  if (formData.time_limit < 1 || formData.time_limit > 365) {
    alert('限定时长必须在1-365天之间！');
    return null;
  }

  return formData;
}

async function generateTasks() {
  const formData = collectFormData();
  if (!formData) return;

  const generateBtn = document.getElementById('generateTaskBtn');
  if (!generateBtn) return;

  const originalText = generateBtn.innerHTML;
  generateBtn.innerHTML = '<span class="loading"></span> 生成中...';
  generateBtn.disabled = true;

  try {
    // 获取当前用户ID
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error('未找到用户ID，请重新登录');
    }

    // 构建请求文本
    const requestText = `
任务类型: ${formData.task_type}
项目背景: ${formData.background}
最终交付成果: ${formData.final_deliverable}
限定时长: ${formData.time_limit}天
必须满足的要求: ${formData.quality_criteria.must_have.join('，') || '无'}
可选优化: ${formData.quality_criteria.nice_to_have.join('，') || '无'}
禁止事项: ${formData.constraints.forbidden.join('，') || '无'}
前提假设: ${formData.constraints.assumptions.join('，') || '无'}
    `.trim();

    // 调用后端API生成任务
    const response = await fetch('/api/task_generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: parseInt(userId),
        text: requestText
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`生成任务失败: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    // 验证API响应
    if (!result || !result.success) {
      throw new Error('任务生成失败：' + (result.message || '未知错误'));
    }

    // 关键修复：result字段是JSON字符串，需要再次解析
    let tasks;
    try {
      tasks = JSON.parse(result.result);
    } catch (parseError) {
      console.error('解析任务数据失败:', parseError);
      throw new Error('返回数据格式错误，请联系管理员');
    }

    // 验证任务数据
    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error('未获取到有效任务列表');
    }

    // 显示结果
    displayTaskResults(tasks);

    // 显示匹配按钮
    const matchBtn = document.getElementById('matchTaskBtn');
    if (matchBtn) {
      matchBtn.style.display = 'block';
    }
  } catch (error) {
    console.error('Error generating tasks:', error);
    alert('生成任务失败: ' + error.message);

    // 显示错误信息
    const taskResult = document.getElementById('taskResult');
    if (taskResult) {
      taskResult.innerHTML = `<div class="error-message">错误: ${escapeHtml(error.message)}</div>`;
      taskResult.style.display = 'block';
    }
  } finally {
    if (generateBtn) {
      generateBtn.innerHTML = originalText;
      generateBtn.disabled = false;
    }
  }
}

function displayTaskResults(tasks) {
  const taskResult = document.getElementById('taskResult');
  const taskCards = document.getElementById('taskCards');

  if (!taskResult || !taskCards) {
    console.error('任务结果显示区域未找到');
    return;
  }

  taskCards.innerHTML = '';

  // 确保任务数组有效
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    taskResult.innerHTML = '<div class="error-message">未获取到有效任务数据</div>';
    taskResult.style.display = 'block';
    return;
  }

  tasks.forEach((task, index) => {
    // 安全处理可能为undefined的字段
    const things = task.things || '任务内容未定义';
    const techStack = task.tech_stack || '无特定要求';
    const member = task.member || '未分配';

    const card = document.createElement('div');
    card.className = 'task-card';
    card.innerHTML = `
      <h5>任务 ${index + 1}</h5>
      <p><strong>任务内容:</strong> ${escapeHtml(things)}</p>
      <p><strong>技术栈:</strong> ${escapeHtml(techStack)}</p>
      <div class="task-meta">
        <span class="assigned-to">${escapeHtml(member)}</span>
        <span>自动分配</span>
      </div>
    `;
    taskCards.appendChild(card);
  });

  taskResult.style.display = 'block';
}

// HTML转义函数，防止XSS攻击
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function matchTasks() {
  const taskCards = document.querySelectorAll('.task-card');
  if (taskCards.length === 0) {
    alert('请先生成任务！');
    return;
  }

  const matchBtn = document.getElementById('matchTaskBtn');
  if (!matchBtn) return;

  const originalText = matchBtn.innerHTML;
  matchBtn.innerHTML = '<span class="loading"></span> 匹配中...';
  matchBtn.disabled = true;

  try {
    // 这里应该调用真实API，暂时使用模拟数据
    await matchMockTasks();
  } catch (error) {
    console.error('Error matching tasks:', error);
    alert('任务匹配失败: ' + error.message);
  } finally {
    matchBtn.innerHTML = originalText;
    matchBtn.disabled = false;
  }
}

// 模拟任务匹配
async function matchMockTasks() {
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 模拟匹配结果
  const mockMatches = [
    {
      task_name: "制定项目计划，协调小组成员，监控进度确保7天内完成",
      assigned_member: "gary",
      match_score: 95,
      reason: "擅长项目管理和进度协调",
      tech_stack: "PM,BasketBall"
    },
    {
      task_name: "深入研究马原第三章核心内容，收集相关扩展材料以丰富汇报",
      assigned_member: "港爷",
      match_score: 92,
      reason: "擅长理论研究和资料收集",
      tech_stack: "excel,everything"
    },
    {
      task_name: "基于研究内容设计并制作PPT幻灯片，确保视觉清晰和逻辑连贯，且总时长在10分钟以内",
      assigned_member: "sam",
      match_score: 88,
      reason: "具有PPT设计和编程能力",
      tech_stack: "cpp"
    },
    {
      task_name: "编写与PPT配套的演讲稿，确保内容准确且演讲时间在10分钟以内",
      assigned_member: "港爷",
      match_score: 85,
      reason: "擅长内容编写和演讲表达",
      tech_stack: "excel,everything"
    },
    {
      task_name: "整合PPT和演讲稿，进行最终审查和计时测试，优化内容以确保质量并包含扩展内容",
      assigned_member: "gary",
      match_score: 90,
      reason: "具有质量控制和整合能力",
      tech_stack: "PM,BasketBall"
    }
  ];

  displayMatchResults(mockMatches);
}

function displayMatchResults(matchResult) {
  const matchSection = document.getElementById('matchResult');
  const matchCards = document.getElementById('matchCards');

  if (!matchSection || !matchCards) {
    console.error('匹配结果显示区域未找到');
    return;
  }

  matchCards.innerHTML = '';

  if (!matchResult || !Array.isArray(matchResult) || matchResult.length === 0) {
    matchSection.innerHTML = '<div class="error-message">未获取到匹配结果</div>';
    matchSection.style.display = 'block';
    return;
  }

  matchResult.forEach((match, index) => {
    const taskName = match.task_name || `未命名任务 ${index + 1}`;
    const assignedMember = match.assigned_member || '未分配';
    const matchScore = match.match_score || '未知';
    const techStack = match.tech_stack || '无';
    const reason = match.reason || '基于能力匹配';

    const card = document.createElement('div');
    card.className = 'match-card';
    card.innerHTML = `
      <h5>${escapeHtml(taskName)}</h5>
      <p><strong>分配给:</strong> ${escapeHtml(assignedMember)}</p>
      <p><strong>匹配度:</strong> ${matchScore}%</p>
      <p><strong>技术栈:</strong> ${escapeHtml(techStack)}</p>
      <p><strong>匹配理由:</strong> ${escapeHtml(reason)}</p>
      <div class="match-meta">
        <span class="assigned-to">${escapeHtml(assignedMember)}</span>
        <span>智能匹配</span>
      </div>
    `;
    matchCards.appendChild(card);
  });

  matchSection.style.display = 'block';
}

// 初始化事件监听
function initTaskDecomposition() {
  const generateTaskBtn = document.getElementById('generateTaskBtn');
  const matchTaskBtn = document.getElementById('matchTaskBtn');

  if (generateTaskBtn) {
    generateTaskBtn.addEventListener('click', generateTasks);
  }

  if (matchTaskBtn) {
    matchTaskBtn.addEventListener('click', matchTasks);
  }

  // 表单提交处理
  const taskInputForm = document.getElementById('taskInputForm');
  if (taskInputForm) {
    taskInputForm.addEventListener('submit', function(e) {
      e.preventDefault();
      generateTasks();
    });
  }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  initTaskDecomposition();
});

// 导出到全局
window.TaskDecomposition = {
  init: initTaskDecomposition,
  generateTasks: generateTasks,
  matchTasks: matchTasks,
  addCriteria: addCriteria,
  addConstraint: addConstraint,
  removeItem: removeItem
};