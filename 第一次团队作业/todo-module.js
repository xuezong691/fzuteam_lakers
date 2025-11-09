// 紧急程度标签
const urgencyLabels = ["已完成", "普通", "重要", "紧急"];

// 全局变量：存储当前任务列表
let currentTasks = [];

// 从localStorage获取userid（登录后保存的）
function getUserId() {
    return localStorage.getItem('userid') || '1'; // 默认为1，实际应从登录模块获取
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
    setupFormSubmit();
});

/**
 * 加载任务数据
 */
function loadTasks() {
    // 方式1: 从本地JSON文件加载（开发测试用）
    fetch('./data/tasks.json')
        .then(response => response.json())
        .then(data => {
            console.log('任务数据加载成功:', data);
            currentTasks = data;
            renderTasks(data);
        })
        .catch(error => {
            console.error('从JSON加载失败，尝试从后端加载:', error);
            // 方式2: 从后端API加载（生产环境）
            loadTasksFromBackend();
        });
}

/**
 * 从后端加载任务数据
 */
function loadTasksFromBackend() {
    const userId = getUserId();
    
    fetch(`/api/tasks/${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('从后端加载任务成功:', data.tasks);
                currentTasks = data.tasks;
                renderTasks(data.tasks);
            } else {
                console.error('加载失败:', data.message);
                showEmptyState();
            }
        })
        .catch(error => {
            console.error('后端请求失败:', error);
            // 使用示例数据
            useSampleData();
        });
}

/**
 * 使用示例数据（后备方案）
 */
function useSampleData() {
    const sampleTasks = [
        {
            id: 1,
            time: '2025-01-15',
            place: '办公室',
            staff: '张三',
            something: '完成项目报告',
            urgency: 3
        },
        {
            id: 2,
            time: '2025-01-16',
            place: '会议室',
            staff: '李四',
            something: '参加团队会议',
            urgency: 2
        },
        {
            id: 3,
            time: '2025-01-14',
            place: '家里',
            staff: '自己',
            something: '整理文档',
            urgency: 0
        }
    ];
    currentTasks = sampleTasks;
    renderTasks(sampleTasks);
}

/**
 * 渲染任务列表
 */
function renderTasks(tasks) {
    const tasksList = document.getElementById('tasksList');
    const emptyState = document.getElementById('emptyState');
    
    // 清空现有内容
    tasksList.innerHTML = '';
    
    // 如果没有任务，显示空状态
    if (!tasks || tasks.length === 0) {
        showEmptyState();
        return;
    }
    
    // 隐藏空状态
    emptyState.style.display = 'none';
    
    // 按紧急程度排序（紧急的在前，已完成的在后）
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.urgency === 0) return 1;
        if (b.urgency === 0) return -1;
        return b.urgency - a.urgency;
    });
    
    // 渲染每个任务卡片
    sortedTasks.forEach(task => {
        const taskCard = createTaskCard(task);
        tasksList.appendChild(taskCard);
    });
}

/**
 * 创建任务卡片DOM元素
 */
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-card urgency-${task.urgency}`;
    card.onclick = () => openEditModal(task);
    
    card.innerHTML = `
        <div class="task-header">
            <span class="task-num">#${task.id}</span>
            <span class="task-urgency">${urgencyLabels[task.urgency]}</span>
        </div>
        <div class="task-content">${task.something}</div>
        <div class="task-details">
            <div class="task-detail">
                <span class="task-detail-label">📅</span>
                <span>${task.time}</span>
            </div>
            <div class="task-detail">
                <span class="task-detail-label">📍</span>
                <span>${task.place}</span>
            </div>
            <div class="task-detail">
                <span class="task-detail-label">👤</span>
                <span>${task.staff}</span>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * 显示空状态
 */
function showEmptyState() {
    const tasksList = document.getElementById('tasksList');
    const emptyState = document.getElementById('emptyState');
    
    tasksList.innerHTML = '';
    emptyState.style.display = 'block';
}

/**
 * 刷新任务列表
 */
function refreshTasks() {
    console.log('刷新任务列表...');
    
    // 添加刷新动画
    const refreshBtn = document.querySelector('.refresh-btn');
    const refreshIcon = document.querySelector('.refresh-icon');
    
    refreshIcon.style.transform = 'rotate(360deg)';
    refreshBtn.disabled = true;
    
    // 重新加载数据
    loadTasks();
    
    // 恢复按钮状态
    setTimeout(() => {
        refreshIcon.style.transform = 'rotate(0deg)';
        refreshBtn.disabled = false;
    }, 500);
}

/**
 * 打开编辑模态框
 */
function openEditModal(task) {
    console.log('编辑任务:', task);
    
    // 填充表单数据
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTime').value = task.time;
    document.getElementById('editPlace').value = task.place;
    document.getElementById('editStaff').value = task.staff;
    document.getElementById('editSomething').value = task.something;
    document.getElementById('editUrgency').value = task.urgency;
    
    // 显示模态框
    document.getElementById('modalOverlay').style.display = 'flex';
    
    // 防止背景滚动
    document.body.style.overflow = 'hidden';
}

/**
 * 关闭模态框
 */
function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // 重置表单
    document.getElementById('editForm').reset();
}

/**
 * 设置表单提交事件
 */
function setupFormSubmit() {
    const form = document.getElementById('editForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 获取表单数据
        const taskData = {
            id: document.getElementById('editTaskId').value,
            time: document.getElementById('editTime').value,
            place: document.getElementById('editPlace').value,
            staff: document.getElementById('editStaff').value,
            something: document.getElementById('editSomething').value,
            urgency: parseInt(document.getElementById('editUrgency').value)
        };
        
        // 调用更新函数
        updateTask(taskData);
    });
}

/**
 * 更新任务（调用后端API）
 */
function updateTask(taskData) {
    console.log('更新任务:', taskData);
    
    const userId = getUserId();
    
    // 调用后端API
    fetch(`/api/tasks/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: userId,
            taskId: taskData.id,
            taskData: taskData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('更新成功:', data.message);
            
            // 显示成功提示
            showNotification('✅ 更新成功！', 'success');
            
            // 更新本地数据
            const index = currentTasks.findIndex(t => t.id == taskData.id);
            if (index !== -1) {
                currentTasks[index] = taskData;
            }
            
            // 重新渲染
            renderTasks(currentTasks);
            
            // 关闭模态框
            closeModal();
        } else {
            console.error('更新失败:', data.message);
            showNotification('❌ 更新失败：' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('请求失败:', error);
        
        // 开发环境：模拟成功更新
        console.log('开发模式：模拟更新成功');
        
        // 更新本地数据
        const index = currentTasks.findIndex(t => t.id == taskData.id);
        if (index !== -1) {
            currentTasks[index] = taskData;
        }
        
        // 重新渲染
        renderTasks(currentTasks);
        
        // 显示提示
        showNotification('✅ 本地更新成功（开发模式）', 'success');
        
        // 关闭模态框
        closeModal();
    });
}

/**
 * 显示通知消息
 */
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// 点击遮罩层关闭模态框
document.addEventListener('click', function(e) {
    if (e.target.id === 'modalOverlay') {
        closeModal();
    }
});

// ESC键关闭模态框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});
