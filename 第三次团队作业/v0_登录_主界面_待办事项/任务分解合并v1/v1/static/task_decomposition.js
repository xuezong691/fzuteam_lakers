// ========== 智能任务分解功能 ==========
function addCriteria(type) {
    const container = document.getElementById(type + 'Container');
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
    if (item.parentElement.children.length > 1) {
        item.remove();
    }
}

function collectFormData() {
    const formData = {
        task_type: document.getElementById('taskType').value,
        background: document.getElementById('background').value,
        final_deliverable: document.getElementById('finalDeliverable').value,
        time_limit: parseInt(document.getElementById('timeLimit').value),
        quality_criteria: {
            must_have: Array.from(document.querySelectorAll('#mustHaveContainer .criteria-input')).map(input => input.value).filter(val => val),
            nice_to_have: Array.from(document.querySelectorAll('#niceToHaveContainer .criteria-input')).map(input => input.value).filter(val => val)
        },
        constraints: {
            forbidden: Array.from(document.querySelectorAll('#forbiddenContainer .constraint-input')).map(input => input.value).filter(val => val),
            assumptions: Array.from(document.querySelectorAll('#assumptionsContainer .constraint-input')).map(input => input.value).filter(val => val)
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
必须满足的要求: ${formData.quality_criteria.must_have.join(', ')}
可选优化: ${formData.quality_criteria.nice_to_have.join(', ')}
禁止事项: ${formData.constraints.forbidden.join(', ')}
前提假设: ${formData.constraints.assumptions.join(', ')}
        `.trim();

        console.log('发送到API的数据:', { user_id: userId, text: requestText });

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
        console.log('API响应:', result);
        
        if (!result.tasks || !Array.isArray(result.tasks)) {
            throw new Error('API返回数据格式错误');
        }

        // 显示结果
        displayTaskResults(result.tasks);
        
        // 显示匹配按钮
        document.getElementById('matchTaskBtn').style.display = 'block';
        
    } catch (error) {
        console.error('Error generating tasks:', error);
        alert('生成任务失败: ' + error.message);
        // 如果API调用失败，使用模拟数据
        await generateMockTasks();
    } finally {
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
    }
}

// 模拟任务生成（备用）
async function generateMockTasks() {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockTasks = [
        {
            things: "研究马原第三章内容，并进行扩展，如添加案例分析或现实应用",
            tech_stack: "excel.everything",
            member: "港爷"
        },
        {
            things: "制作PPT幻灯片，包括布局设计和内容整合",
            tech_stack: "cpp",
            member: "sam"
        },
        {
            things: "管理项目进度，协调小组成员，并准备演讲部分",
            tech_stack: "PM,BasketBall",
            member: "gary"
        }
    ];

    displayTaskResults(mockTasks);
    document.getElementById('matchTaskBtn').style.display = 'block';
}

function displayTaskResults(tasks) {
    const taskResult = document.getElementById('taskResult');
    const taskCards = document.getElementById('taskCards');
    
    taskCards.innerHTML = '';
    
    tasks.forEach((task, index) => {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.innerHTML = `
            <h5>任务 ${index + 1}</h5>
            <p><strong>任务内容:</strong> ${task.things || '暂无描述'}</p>
            <p><strong>技术栈:</strong> ${task.tech_stack || '无特定要求'}</p>
            <div class="task-meta">
                <span class="assigned-to">${task.member || '未分配'}</span>
                <span>自动分配</span>
            </div>
        `;
        taskCards.appendChild(card);
    });
    
    taskResult.style.display = 'block';
}

async function matchTasks() {
    const taskCards = document.querySelectorAll('.task-card');
    if (taskCards.length === 0) {
        alert('请先生成任务！');
        return;
    }

    const matchBtn = document.getElementById('matchTaskBtn');
    const originalText = matchBtn.innerHTML;
    
    matchBtn.innerHTML = '<span class="loading"></span> 匹配中...';
    matchBtn.disabled = true;

    try {
        // 这里可以调用任务匹配的API
        // 目前使用前端模拟
        await matchMockTasks();
        
    } catch (error) {
        console.error('Error matching tasks:', error);
        alert('任务匹配失败: ' + error.message);
    } finally {
        matchBtn.innerHTML = originalText;
        matchBtn.disabled = false;
    }
}

// 模拟任务匹配（备用）
async function matchMockTasks() {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockMatches = [
        {
            task_name: "研究马原第三章内容",
            assigned_member: "港爷",
            match_score: 95,
            reason: "擅长理论研究和内容扩展",
            tech_stack: "excel.everything"
        },
        {
            task_name: "制作PPT幻灯片",
            assigned_member: "sam",
            match_score: 88,
            reason: "具有PPT设计和编程能力",
            tech_stack: "cpp"
        },
        {
            task_name: "管理项目进度",
            assigned_member: "gary",
            match_score: 92,
            reason: "具有项目管理经验和团队协调能力",
            tech_stack: "PM,BasketBall"
        }
    ];

    displayMatchResults(mockMatches);
}

function displayMatchResults(matchResult) {
    const matchSection = document.getElementById('matchResult');
    const matchCards = document.getElementById('matchCards');
    
    matchCards.innerHTML = '';
    
    matchResult.forEach((match, index) => {
        const card = document.createElement('div');
        card.className = 'match-card';
        card.innerHTML = `
            <h5>${match.task_name || `任务 ${index + 1}`}</h5>
            <p><strong>分配给:</strong> ${match.assigned_member || '未分配'}</p>
            <p><strong>匹配度:</strong> ${match.match_score ? match.match_score + '%' : '未知'}</p>
            <p><strong>技术栈:</strong> ${match.tech_stack || '无'}</p>
            <p><strong>理由:</strong> ${match.reason || '基于技术栈和能力匹配'}</p>
            <div class="match-meta">
                <span class="assigned-to">${match.assigned_member || '待分配'}</span>
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
    const taskInputForm = document.getElementById('taskInputForm');

    if (generateTaskBtn) {
        generateTaskBtn.addEventListener('click', generateTasks);
    }
    if (matchTaskBtn) {
        matchTaskBtn.addEventListener('click', matchTasks);
    }
    if (taskInputForm) {
        taskInputForm.addEventListener('submit', function(e) {
            e.preventDefault();
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