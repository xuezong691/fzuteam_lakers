// 技术栈选项
const TECH_STACK_OPTIONS = [
    'PPT制作', '演讲者', '写手', '项目经理', '需求分析', '数据分析',
    'UI设计', '平面设计', '视频剪辑', '3D建模', '摄影', '架构',
    '前端', '后端', 'dba', '运维'
];

// 初始化函数
document.addEventListener('DOMContentLoaded', function() {
    initializeTechTools();
    setupEventListeners();
});

// 初始化技术工具选择
function initializeTechTools() {
    const container = document.getElementById('techToolsContainer');
    TECH_STACK_OPTIONS.forEach(tech => {
        const option = document.createElement('div');
        option.className = 'tech-tool-option';
        option.innerHTML = `
            <input type="checkbox" id="tech_${tech}" name="tech_tools" value="${tech}">
            <label for="tech_${tech}">${tech}</label>
        `;
        container.appendChild(option);
    });
}

// 设置事件监听器
function setupEventListeners() {
    const generateTaskBtn = document.getElementById('generateTaskBtn');
    const matchTaskBtn = document.getElementById('matchTaskBtn');
    const taskInputForm = document.getElementById('taskInputForm');

    generateTaskBtn.addEventListener('click', generateTasks);
    matchTaskBtn.addEventListener('click', matchTasks);
    taskInputForm.addEventListener('submit', function(e) {
        e.preventDefault();
    });
}

// 添加标准项
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

// 添加约束项
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

// 添加成功指标
function addMetric() {
    const container = document.getElementById('successMetricsContainer');
    const item = document.createElement('div');
    item.className = 'metric-item';
    item.innerHTML = `
        <input type="text" class="metric-input" placeholder="添加成功指标">
        <button type="button" class="add-metric" onclick="addMetric()">+</button>
        <button type="button" class="delete-btn" onclick="removeItem(this)">×</button>
    `;
    container.appendChild(item);
}

// 删除项目
function removeItem(button) {
    const item = button.parentElement;
    if (item.parentElement.children.length > 1) {
        item.remove();
    }
}

// 收集表单数据
function collectFormData() {
    const formData = {
        task_type: document.getElementById('taskType').value,
        background: document.getElementById('background').value,
        final_deliverable: document.getElementById('finalDeliverable').value,
        deadline: document.getElementById('deadline').value,
        tech_tools: Array.from(document.querySelectorAll('input[name="tech_tools"]:checked')).map(cb => cb.value),
        quality_criteria: {
            must_have: Array.from(document.querySelectorAll('#mustHaveContainer .criteria-input')).map(input => input.value).filter(val => val),
            nice_to_have: Array.from(document.querySelectorAll('#niceToHaveContainer .criteria-input')).map(input => input.value).filter(val => val)
        },
        constraints: {
            forbidden: Array.from(document.querySelectorAll('#forbiddenContainer .constraint-input')).map(input => input.value).filter(val => val),
            assumptions: Array.from(document.querySelectorAll('#assumptionsContainer .constraint-input')).map(input => input.value).filter(val => val)
        },
        success_metrics: Array.from(document.querySelectorAll('#successMetricsContainer .metric-input')).map(input => input.value).filter(val => val)
    };

    // 验证必填字段
    if (!formData.task_type || !formData.background || !formData.final_deliverable || !formData.deadline || formData.success_metrics.length === 0) {
        alert('请填写所有必填字段！');
        return null;
    }

    return formData;
}

// 生成任务
async function generateTasks() {
    const formData = collectFormData();
    if (!formData) return;

    const generateBtn = document.getElementById('generateTaskBtn');
    const originalText = generateBtn.innerHTML;
    
    // 显示加载状态
    generateBtn.innerHTML = '<span class="loading"></span> 生成中...';
    generateBtn.disabled = true;

    try {
        const response = await fetch('/api/generate-tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('生成任务失败');
        }

        const result = await response.json();
        
        // 保存结果到本地存储
        localStorage.setItem('generatedTasks', JSON.stringify(result));
        
        // 显示结果
        displayTaskResults(result);
        
        // 显示匹配按钮
        document.getElementById('matchTaskBtn').style.display = 'block';
        
    } catch (error) {
        console.error('Error generating tasks:', error);
        alert('生成任务失败，请重试');
    } finally {
        // 恢复按钮状态
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
    }
}

// 显示任务结果
function displayTaskResults(tasks) {
    const taskResult = document.getElementById('taskResult');
    const taskCards = document.getElementById('taskCards');
    
    taskCards.innerHTML = '';
    
    tasks.forEach((task, index) => {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.innerHTML = `
            <h5>${task.task_name || `任务 ${index + 1}`}</h5>
            <p><strong>描述:</strong> ${task.description || '暂无描述'}</p>
            <p><strong>技术要求:</strong> ${Array.isArray(task.required_skills) ? task.required_skills.join(', ') : task.required_skills}</p>
            <p><strong>预估工时:</strong> ${task.estimated_hours || '未知'} 小时</p>
            <div class="task-meta">
                <span class="priority ${(task.priority || 'medium').toLowerCase()}">${task.priority || '中'}优先级</span>
                <span>${task.deadline || '无截止时间'}</span>
            </div>
        `;
        taskCards.appendChild(card);
    });
    
    taskResult.style.display = 'block';
}

// 智能任务匹配
async function matchTasks() {
    const generatedTasks = localStorage.getItem('generatedTasks');
    if (!generatedTasks) {
        alert('请先生成任务！');
        return;
    }

    const matchBtn = document.getElementById('matchTaskBtn');
    const originalText = matchBtn.innerHTML;
    
    // 显示加载状态
    matchBtn.innerHTML = '<span class="loading"></span> 匹配中...';
    matchBtn.disabled = true;

    try {
        const tasks = JSON.parse(generatedTasks);
        
        const response = await fetch('/api/match-tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tasks: tasks })
        });

        if (!response.ok) {
            throw new Error('任务匹配失败');
        }

        const matchResult = await response.json();
        
        // 显示匹配结果
        displayMatchResults(matchResult);
        
    } catch (error) {
        console.error('Error matching tasks:', error);
        alert('任务匹配失败，请重试');
    } finally {
        // 恢复按钮状态
        matchBtn.innerHTML = originalText;
        matchBtn.disabled = false;
    }
}

// 显示匹配结果
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
            <p><strong>理由:</strong> ${match.reason || '基于技术栈和能力匹配'}</p>
            <div class="match-meta">
                <span class="assigned-to">${match.assigned_member || '待分配'}</span>
                <span>${match.estimated_completion || '未知'}</span>
            </div>
        `;
        matchCards.appendChild(card);
    });
    
    matchSection.style.display = 'block';
}

// 导出功能供其他模块使用
window.TaskDecompositionModule = {
    generateTasks,
    matchTasks,
    collectFormData
};

// 增强的日期处理函数
function formatDate(dateString) {
    if (!dateString) return '';
    
    // 尝试多种日期格式
    const formats = [
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/,  // YYYY-MM-DD
        /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // YYYY/MM/DD
        /^(\d{4})(\d{2})(\d{2})$/,         // YYYYMMDD
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/,   // DD-MM-YYYY
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/  // DD/MM/YYYY
    ];
    
    for (let format of formats) {
        const match = dateString.match(format);
        if (match) {
            let year, month, day;
            
            if (format === formats[3] || format === formats[4]) {
                // DD-MM-YYYY 或 DD/MM/YYYY 格式
                day = match[1].padStart(2, '0');
                month = match[2].padStart(2, '0');
                year = match[3];
            } else {
                // 其他格式
                year = match[1];
                month = match[2].padStart(2, '0');
                day = match[3].padStart(2, '0');
            }
            
            // 验证日期有效性
            const date = new Date(`${year}-${month}-${day}`);
            if (!isNaN(date.getTime()) && date.getFullYear() == year) {
                return `${year}-${month}-${day}`;
            }
        }
    }
    
    // 如果格式不匹配，尝试用 Date 对象解析
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }
    
    // 返回原始值并显示错误
    alert('日期格式不正确，请使用 YYYY-MM-DD 格式');
    throw new Error('Invalid date format');
}