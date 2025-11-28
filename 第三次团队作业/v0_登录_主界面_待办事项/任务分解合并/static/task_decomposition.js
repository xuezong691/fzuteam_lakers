// 初始化函数
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

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
        time_limit: parseInt(document.getElementById('timeLimit').value),
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
    if (!formData.task_type || !formData.background || !formData.final_deliverable || !formData.time_limit || formData.success_metrics.length === 0) {
        alert('请填写所有必填字段！');
        return null;
    }

    // 验证限定时长
    if (formData.time_limit < 1 || formData.time_limit > 365) {
        alert('限定时长必须在1-365天之间！');
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
        // 调用后端API生成任务
        const response = await fetch('/api/ai/generate-tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'generate-tasks',
                ...formData
            })
        });

        if (!response.ok) {
            throw new Error('生成任务失败');
        }

        const result = await response.json();
        
        // 保存结果到本地存储
        localStorage.setItem('generatedTasks', JSON.stringify(result));
        
        // 显示结果
        displayTaskResults(result);
        
        // 发送分解后的任务数据到后端
        await sendDecomposedTasksToBackend(result, formData);
        
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

// 发送分解后的任务数据到后端
async function sendDecomposedTasksToBackend(decomposedTasks, originalFormData) {
    try {
        // 构建发送到后端的数据结构
        const backendData = {
            original_request: originalFormData,
            decomposed_tasks: decomposedTasks,
            decomposition_metadata: {
                total_tasks: decomposedTasks.length,
                total_estimated_hours: decomposedTasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0),
                average_priority: calculateAveragePriority(decomposedTasks),
                decomposition_timestamp: new Date().toISOString()
            }
        };

        // 发送到后端保存
        const saveResponse = await fetch('/api/tasks/save-decomposition', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(backendData)
        });

        if (!saveResponse.ok) {
            console.warn('保存任务分解结果到后端失败，但前端操作继续');
        } else {
            console.log('任务分解结果已成功保存到后端');
        }
    } catch (error) {
        console.error('发送分解任务到后端时出错:', error);
        // 不阻止用户继续操作，只是记录错误
    }
}

// 计算平均优先级
function calculateAveragePriority(tasks) {
    const priorityWeights = {
        'high': 3,
        'medium': 2,
        'low': 1
    };
    
    const totalWeight = tasks.reduce((sum, task) => {
        return sum + (priorityWeights[task.priority?.toLowerCase()] || 1);
    }, 0);
    
    const average = totalWeight / tasks.length;
    
    if (average >= 2.5) return 'high';
    if (average >= 1.5) return 'medium';
    return 'low';
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
            <p><strong>技术要求:</strong> ${Array.isArray(task.required_skills) ? task.required_skills.join(', ') : task.required_skills || '无特定要求'}</p>
            <p><strong>预估工时:</strong> ${task.estimated_hours || '未知'} 小时</p>
            <p><strong>依赖关系:</strong> ${task.dependencies ? task.dependencies.join(', ') : '无'}</p>
            <div class="task-meta">
                <span class="priority ${(task.priority || 'medium').toLowerCase()}">${task.priority || '中'}优先级</span>
                <span>限时: ${task.time_limit || '未知'} 天</span>
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
        
        // 调用后端API进行任务匹配
        const response = await fetch('/api/ai/match-tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                action: 'match-tasks',
                tasks: tasks 
            })
        });

        if (!response.ok) {
            throw new Error('任务匹配失败');
        }

        const matchResult = await response.json();
        
        // 显示匹配结果
        displayMatchResults(matchResult);
        
        // 发送匹配结果到后端
        await sendMatchResultsToBackend(matchResult, tasks);
        
    } catch (error) {
        console.error('Error matching tasks:', error);
        alert('任务匹配失败，请重试');
    } finally {
        // 恢复按钮状态
        matchBtn.innerHTML = originalText;
        matchBtn.disabled = false;
    }
}

// 发送匹配结果到后端
async function sendMatchResultsToBackend(matchResults, originalTasks) {
    try {
        const matchData = {
            match_results: matchResults,
            original_tasks: originalTasks,
            match_timestamp: new Date().toISOString(),
            total_matched_tasks: matchResults.length,
            average_match_score: matchResults.reduce((sum, match) => sum + (match.match_score || 0), 0) / matchResults.length
        };

        const saveResponse = await fetch('/api/tasks/save-matches', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(matchData)
        });

        if (!saveResponse.ok) {
            console.warn('保存匹配结果到后端失败');
        } else {
            console.log('任务匹配结果已成功保存到后端');
        }
    } catch (error) {
        console.error('发送匹配结果到后端时出错:', error);
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
            <p><strong>预计完成时间:</strong> ${match.estimated_completion || '未知'}</p>
            <div class="match-meta">
                <span class="assigned-to">${match.assigned_member || '待分配'}</span>
                <span>限时: ${match.time_limit || '未知'} 天</span>
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
    collectFormData,
    sendDecomposedTasksToBackend,
    sendMatchResultsToBackend
};