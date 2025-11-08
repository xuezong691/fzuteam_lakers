// 全局变量
let currentUser = {
    userid: localStorage.getItem('userid') || 'default',
    teamname: localStorage.getItem('teamname') || '默认团队'
};

let members = [];
let evaluationCooldowns = {}; // 存储评价冷却时间

// API基础URL - 根据您的后端地址调整
const API_BASE_URL = 'http://localhost:5000'; // 或者您的后端实际地址

// 技术栈选项
const TECH_STACK_OPTIONS = [
    "PPT制作", "演讲者", "写手",
    "项目经理", "需求分析", "数据分析",
    "UI设计", "平面设计", "视频剪辑", "3D建模", "摄影",
    "架构", "前端", "后端", "dba", "运维"
];

// 表情符号映射
const EMOJI_MAP = {
    0: "😭", 1: "😢", 2: "😔", 3: "😐", 4: "🙂",
    5: "😊", 6: "😄", 7: "😃", 8: "🤩", 9: "🥳", 10: "🎉"
};

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    loadMembers();
});

// 初始化页面
function initializePage() {
    document.getElementById('team-name').textContent = currentUser.teamname;
    renderTechOptions();
}

// 设置事件监听器
function setupEventListeners() {
    // 添加成员按钮
    document.getElementById('add-member-btn').addEventListener('click', showAddMemberModal);
    
    // 模态框关闭按钮
    document.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    // 添加成员表单提交
    document.getElementById('add-member-form').addEventListener('submit', handleAddMember);
    
    // 点击模态框外部关闭
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModals();
            }
        });
    });
    
    // 搜索功能
    document.getElementById('search-input').addEventListener('input', function() {
        filterMembers(this.value);
    });
}

// 渲染技术栈选项
function renderTechOptions() {
    const techOptionsContainer = document.getElementById('tech-options');
    techOptionsContainer.innerHTML = '';
    
    TECH_STACK_OPTIONS.forEach(tech => {
        const option = document.createElement('div');
        option.className = 'tech-option';
        option.innerHTML = `
            <input type="checkbox" id="tech-${tech}" value="${tech}">
            <label for="tech-${tech}">${tech}</label>
        `;
        techOptionsContainer.appendChild(option);
    });
}

// 显示添加成员模态框
function showAddMemberModal() {
    document.getElementById('add-member-modal').style.display = 'flex';
    document.getElementById('member-name').value = '';
    
    // 清除所有选中的技术栈
    document.querySelectorAll('#tech-options input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

// 关闭所有模态框
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// 处理添加成员
async function handleAddMember(e) {
    e.preventDefault();
    
    const memberName = document.getElementById('member-name').value.trim();
    if (!memberName) {
        showMessage('请输入成员姓名', 'error');
        return;
    }
    
    // 获取选中的技术栈
    const selectedTech = [];
    document.querySelectorAll('#tech-options input[type="checkbox"]:checked').forEach(checkbox => {
        selectedTech.push(checkbox.value);
    });
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/member/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userid: currentUser.userid,
                name: memberName,
                tech_stack: selectedTech
            })
        });
        
        // 检查响应状态
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        
        // 检查响应内容类型
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.log('非JSON响应:', text);
            // 即使不是JSON，如果状态码是200也认为是成功的
            if (response.status === 200) {
                showMessage('成员添加成功', 'success');
                closeModals();
                loadMembers();
                return;
            }
            throw new Error('服务器返回了非JSON格式的响应');
        }
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('成员添加成功', 'success');
            closeModals();
            loadMembers();
        } else {
            throw new Error(result.error || '添加成员失败');
        }
    } catch (error) {
        console.error('添加成员错误:', error);
        showMessage(error.message || '网络错误，请稍后重试', 'error');
    }
}

// 加载成员列表
async function loadMembers() {
    const membersGrid = document.getElementById('members-grid');
    membersGrid.innerHTML = '<div class="loading">正在加载成员列表...</div>';
    
    try {
        // 使用GET请求，通过查询参数传递userid
        const response = await fetch(`${API_BASE_URL}/api/member/list?userid=${encodeURIComponent(currentUser.userid)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // 检查响应状态
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        
        // 检查响应内容类型
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.log('非JSON响应:', text);
            throw new Error('服务器返回了非JSON格式的响应');
        }
        
        const result = await response.json();
        
        if (result.success) {
            members = result.members || [];
            renderMembers();
        } else {
            throw new Error(result.error || '获取成员列表失败');
        }
    } catch (error) {
        console.error('获取成员列表错误:', error);
        showMessage(error.message || '网络错误，请稍后重试', 'error');
        membersGrid.innerHTML = '<div class="loading">获取成员列表失败: ' + error.message + '</div>';
    }
}

// 过滤成员
function filterMembers(searchTerm) {
    const filteredMembers = members.filter(member => 
        member.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    renderFilteredMembers(filteredMembers);
}

// 渲染过滤后的成员列表
function renderFilteredMembers(filteredMembers) {
    const membersGrid = document.getElementById('members-grid');
    membersGrid.innerHTML = '';
    
    if (filteredMembers.length === 0) {
        membersGrid.innerHTML = '<p>没有找到匹配的成员</p>';
        return;
    }
    
    filteredMembers.forEach(member => {
        const memberCard = createMemberCard(member);
        membersGrid.appendChild(memberCard);
    });
}

// 渲染成员列表
function renderMembers() {
    const membersGrid = document.getElementById('members-grid');
    membersGrid.innerHTML = '';
    
    if (members.length === 0) {
        membersGrid.innerHTML = '<p>暂无成员，请添加新成员</p>';
        document.getElementById('member-count').textContent = '0';
        return;
    }
    
    members.forEach(member => {
        const memberCard = createMemberCard(member);
        membersGrid.appendChild(memberCard);
    });
    
    // 更新成员数量
    document.getElementById('member-count').textContent = members.length;
}

// 创建成员卡片
function createMemberCard(member) {
    const memberCard = document.createElement('div');
    memberCard.className = 'member-card';
    
    memberCard.innerHTML = `
        <div class="member-header">
            <div class="member-name">${member.name}</div>
            <button class="delete-btn" data-name="${member.name}">删除</button>
        </div>
        <div class="tech-stack">
            ${member.tech_stack.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
        </div>
        <div class="scores">
            <div class="score-item">
                <span class="score-label">质量:</span>
                <span>${member.quality_score.toFixed(1)}</span>
            </div>
            <div class="score-item">
                <span class="score-label">负载:</span>
                <span>${member.workload_score.toFixed(1)}</span>
            </div>
            <div class="score-item">
                <span class="score-label">协作:</span>
                <span>${member.collaboration_score.toFixed(1)}</span>
            </div>
            <div class="score-item">
                <span class="score-label">完成度:</span>
                <span>${member.completion_score.toFixed(1)}</span>
            </div>
        </div>
        <button class="evaluate-btn" data-name="${member.name}">评价成员</button>
    `;
    
    // 添加删除按钮事件
    const deleteBtn = memberCard.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', function() {
        deleteMember(member.name);
    });
    
    // 添加评价按钮事件
    const evaluateBtn = memberCard.querySelector('.evaluate-btn');
    evaluateBtn.addEventListener('click', function() {
        showEvaluationModal(member.name);
    });
    
    return memberCard;
}

// 删除成员
async function deleteMember(memberName) {
    if (!confirm(`确定要删除成员 ${memberName} 吗？`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/member/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userid: currentUser.userid,
                member_name: memberName
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            if (response.status === 200) {
                showMessage('成员删除成功', 'success');
                loadMembers();
                return;
            }
            throw new Error('服务器返回了非JSON格式的响应');
        }
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('成员删除成功', 'success');
            loadMembers();
        } else {
            throw new Error(result.error || '删除成员失败');
        }
    } catch (error) {
        console.error('删除成员错误:', error);
        showMessage(error.message || '网络错误，请稍后重试', 'error');
    }
}

// 显示评价模态框
function showEvaluationModal(memberName) {
    const modal = document.getElementById('evaluation-modal');
    const title = document.getElementById('evaluation-title');
    const content = document.getElementById('evaluation-content');
    
    title.textContent = `评价成员: ${memberName}`;
    
    content.innerHTML = `
        <div class="evaluation-options">
            <button class="evaluation-type-btn" data-type="quality">质量评价</button>
            <button class="evaluation-type-btn" data-type="timeliness">时效评价</button>
            <button class="evaluation-type-btn" data-type="collaboration">协作评价</button>
            <button class="evaluation-type-btn" data-type="workload">负载评价</button>
        </div>
        <div id="evaluation-form"></div>
    `;
    
    modal.style.display = 'flex';
    
    // 添加评价类型按钮事件
    document.querySelectorAll('.evaluation-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            renderEvaluationForm(memberName, type);
        });
    });
}

// 渲染评价表单
function renderEvaluationForm(memberName, type) {
    const formContainer = document.getElementById('evaluation-form');
    const cooldownKey = `${currentUser.userid}-${memberName}-${type}`;
    const isOnCooldown = checkCooldown(cooldownKey);
    
    if (isOnCooldown) {
        formContainer.innerHTML = `
            <div class="cooldown-message">
                该评价功能正在冷却中，请5分钟后再试
            </div>
        `;
        return;
    }
    
    let formHTML = '';
    
    switch (type) {
        case 'quality':
        case 'collaboration':
        case 'workload':
            formHTML = `
                <div class="slider-container">
                    <label>评分 (0-10):</label>
                    <input type="range" class="slider" min="0" max="10" step="0.1" value="5">
                    <div class="emoji-display">${EMOJI_MAP[5]}</div>
                    <div class="score-display">当前评分: <span>5</span></div>
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn">取消</button>
                    <button class="submit-btn" id="submit-evaluation">提交评价</button>
                </div>
            `;
            break;
            
        case 'timeliness':
            formHTML = `
                <div class="timeliness-options">
                    <button class="timeliness-btn" data-value="true">准时</button>
                    <button class="timeliness-btn" data-value="false">超时</button>
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn">取消</button>
                    <button class="submit-btn" id="submit-evaluation">提交评价</button>
                </div>
            `;
            break;
    }
    
    formContainer.innerHTML = formHTML;
    
    // 添加事件监听器
    if (type === 'quality' || type === 'collaboration' || type === 'workload') {
        const slider = formContainer.querySelector('.slider');
        const emojiDisplay = formContainer.querySelector('.emoji-display');
        const scoreDisplay = formContainer.querySelector('.score-display span');
        
        slider.addEventListener('input', function() {
            const value = Math.round(this.value);
            emojiDisplay.textContent = EMOJI_MAP[value];
            scoreDisplay.textContent = this.value;
        });
    } else if (type === 'timeliness') {
        const buttons = formContainer.querySelectorAll('.timeliness-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', function() {
                buttons.forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
            });
        });
    }
    
    // 提交评价按钮
    document.getElementById('submit-evaluation').addEventListener('click', function() {
        submitEvaluation(memberName, type);
    });
}

// 检查冷却时间
function checkCooldown(key) {
    const now = Date.now();
    const cooldownTime = evaluationCooldowns[key];
    
    if (cooldownTime && now - cooldownTime < 5 * 60 * 1000) {
        return true; // 仍在冷却中
    }
    
    return false; // 不在冷却中
}

// 设置冷却时间
function setCooldown(key) {
    evaluationCooldowns[key] = Date.now();
}

// 提交评价
async function submitEvaluation(memberName, type) {
    let data = {
        userid: currentUser.userid,
        member_name: memberName
    };
    
    // 根据评价类型获取数据
    switch (type) {
        case 'quality':
        case 'collaboration':
        case 'workload':
            const slider = document.querySelector('.slider');
            if (!slider) {
                showMessage('请先选择评分', 'error');
                return;
            }
            data.score = parseFloat(slider.value);
            break;
            
        case 'timeliness':
            const selectedBtn = document.querySelector('.timeliness-btn.selected');
            if (!selectedBtn) {
                showMessage('请选择准时或超时', 'error');
                return;
            }
            data.is_ontime = selectedBtn.getAttribute('data-value') === 'true';
            break;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/evaluate/${type}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('评价过于频繁，请5分钟后再试');
            }
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            if (response.status === 200) {
                showMessage('评价成功', 'success');
                const cooldownKey = `${currentUser.userid}-${memberName}-${type}`;
                setCooldown(cooldownKey);
                closeModals();
                loadMembers();
                return;
            }
            throw new Error('服务器返回了非JSON格式的响应');
        }
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('评价成功', 'success');
            const cooldownKey = `${currentUser.userid}-${memberName}-${type}`;
            setCooldown(cooldownKey);
            closeModals();
            loadMembers();
        } else {
            throw new Error(result.error || '评价失败');
        }
    } catch (error) {
        console.error('评价错误:', error);
        showMessage(error.message || '网络错误，请稍后重试', 'error');
    }
}

// 显示消息提示
function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.classList.add('show');
    
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 3000);
}