// ========== 团队管理模块 ==========
// 渲染成员列表为卡片（修复类名缺失问题）
function renderMembers(members) {
  var container = document.getElementById("memberBoard");
  if (!container) return;

  container.innerHTML = "";
  // 响应式网格布局，适配不同屏幕
  container.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4";

  if (!members || members.length === 0) {
    // 空状态美化，匹配卡片风格
    var empty = document.createElement("div");
    empty.className = "member-empty col-span-full flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-200";
    empty.innerHTML = `
      <div class="text-5xl mb-4">👥</div>
      <p class="text-gray-500 text-lg">暂无团队成员</p>
      <p class="text-gray-400 mt-2">点击下方"添加新成员"开始创建您的团队</p>
    `;
    container.appendChild(empty);
    return;
  }

  members.forEach(function(member) {
    var card = document.createElement("div");
    // 核心卡片样式（参考示例）+ 交互效果
    card.className = "member-card bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 hover:border-indigo-200 transition-all duration-300 cursor-pointer overflow-hidden";
    // 保留所有数据属性，确保交互正常
    card.setAttribute("data-id", member.id);
    card.setAttribute("data-quality-score", member.quality_score || "0.00");
    card.setAttribute("data-workload-score", member.workload_score || "0.00");
    card.setAttribute("data-collaboration-score", member.collaboration_score || "0.00");
    card.setAttribute("data-completion-score", member.completion_score || "0.00");
    card.setAttribute("data-tech-stack", JSON.stringify(member.tech_stack || []));
    card.setAttribute("data-name", member.name || "未命名");

    // 卡片头部（参考示例样式，添加功能类名）
    var header = document.createElement("div");
    header.className = "p-4 border-b border-gray-100";

    var name = document.createElement("h3");
    // 关键修复：添加 member-name 类名，确保事件处理能获取到姓名
    name.className = "member-name text-lg font-semibold text-gray-800 flex items-center gap-2";
    name.innerHTML = `<span>👤</span>${member.name || "未命名"}`;

    var techStack = document.createElement("div");
    // 关键修复：添加 member-tech 类名，确保事件处理能获取到技术栈
    techStack.className = "member-tech mt-1 text-sm text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full inline-block";
    var techs = member.tech_stack && Array.isArray(member.tech_stack)
      ? member.tech_stack.join(", ")
      : "无技术栈";
    techStack.textContent = techs;

    header.appendChild(name);
    header.appendChild(techStack);

    // 评分区域（参考示例的卡片式评分项）
    var scores = document.createElement("div");
    scores.className = "p-4 grid grid-cols-2 gap-3";

    // 质量评分
    var quality = document.createElement("div");
    quality.className = "bg-gray-50 p-3 rounded-lg border-l-2 border-indigo-500";
    quality.innerHTML = `
      <label class="text-xs text-gray-500 block mb-1">质量评分</label>
      <span class="text-indigo-600 font-semibold">${(member.quality_score || 0).toFixed(1)}</span>
      <div class="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
        <div class="h-full bg-indigo-500 rounded-full" style="width: ${Math.min(100, member.quality_score || 0)}%"></div>
      </div>
    `;

    // 工作量评分
    var workload = document.createElement("div");
    workload.className = "bg-gray-50 p-3 rounded-lg border-l-2 border-blue-500";
    workload.innerHTML = `
      <label class="text-xs text-gray-500 block mb-1">工作量</label>
      <span class="text-blue-600 font-semibold">${(member.workload_score || 0).toFixed(1)}</span>
      <div class="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
        <div class="h-full bg-blue-500 rounded-full" style="width: ${Math.min(100, member.workload_score || 0)}%"></div>
      </div>
    `;

    // 协作评分
    var collaboration = document.createElement("div");
    collaboration.className = "bg-gray-50 p-3 rounded-lg border-l-2 border-purple-500";
    collaboration.innerHTML = `
      <label class="text-xs text-gray-500 block mb-1">协作能力</label>
      <span class="text-purple-600 font-semibold">${(member.collaboration_score || 0).toFixed(1)}</span>
      <div class="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
        <div class="h-full bg-purple-500 rounded-full" style="width: ${Math.min(100, member.collaboration_score || 0)}%"></div>
      </div>
    `;

    // 完成度评分
    var completion = document.createElement("div");
    completion.className = "bg-gray-50 p-3 rounded-lg border-l-2 border-green-500";
    completion.innerHTML = `
      <label class="text-xs text-gray-500 block mb-1">任务完成度</label>
      <span class="text-green-600 font-semibold">${(member.completion_score || 0).toFixed(1)}</span>
      <div class="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
        <div class="h-full bg-green-500 rounded-full" style="width: ${Math.min(100, member.completion_score || 0)}%"></div>
      </div>
    `;

    scores.appendChild(quality);
    scores.appendChild(workload);
    scores.appendChild(collaboration);
    // scores.appendChild(completion);

    // 卡片底部（参考示例的按钮样式）
    var footer = document.createElement("div");
    footer.className = "p-3 flex justify-end";

    var deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "member-delete-btn text-red-500 hover:text-white hover:bg-red-500 border border-red-500 px-3 py-1 rounded-md text-sm transition-colors duration-200 flex items-center gap-1";
    deleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> 删除`;
    deleteBtn.setAttribute("data-id", member.id);

    footer.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(scores);
    card.appendChild(footer);

    container.appendChild(card);
  });
}

// 以下所有函数完全保留原有逻辑，确保交互和后端通信正常
async function refreshMembers() {
    var userId = getCurrentUserId();
    if (!userId) {
        alert("未找到用户ID，请重新登录后再试。");
        return;
    }

    try {
        var response = await fetch("/api/member/list", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: parseInt(userId, 10)
            })
        });

        if (!response.ok) {
            throw new Error("网络错误，状态码：" + response.status);
        }

        var result = await response.json();

        if (result.success) {
          const members = result.members || (result.data && result.data.members) || [];

          members.forEach(member => {
              member.quality_score = member.quality_score !== undefined ? member.quality_score : 0.0;
              member.workload_score = member.workload_score !== undefined ? member.workload_score : 0.0;
              member.collaboration_score = member.collaboration_score !== undefined ? member.collaboration_score : 0.0;
              member.completion_score = member.completion_score !== undefined ? member.completion_score : 0.0;
          });

          renderMembers(members);

          if (members.length === 0) {
              const memberBoard = document.getElementById('memberBoard');
              if (memberBoard) {
                  memberBoard.innerHTML = `
                      <div class="member-empty col-span-full flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          <div class="text-5xl mb-4">👥</div>
                          <p class="text-gray-500 text-lg">暂无团队成员</p>
                          <p class="text-gray-400 mt-2">点击下方"添加新成员"开始创建您的团队</p>
                      </div>
                  `;
              }
          }
      } else {
            console.error("后端返回错误:", result);
            alert(result.message || "刷新成员失败");
        }
    } catch (err) {
        console.error("刷新成员列表时发生错误:", err);

        if (err.message.includes('JSON')) {
            alert("数据解析错误: 服务器返回了无效的JSON格式。这通常表示后端代码存在错误。");
        } else if (err.message.includes('404')) {
            alert("API端点不存在: 请检查后端路由配置是否正确");
        } else {
            alert("刷新成员失败: " + (err.message || "未知错误"));
        }
    }
}

async function handleAddMember(event) {
    event.preventDefault();

    var userId = getCurrentUserId();
    if (!userId) {
        alert("未找到用户ID，请重新登录后再试。");
        return;
    }

    var nameInput = document.getElementById("memberName");
    var techStackInput = document.getElementById("memberTechStack");

    var name = nameInput.value.trim();
    var techStack = techStackInput.value.trim();

    if (!name) {
        alert("成员姓名为必填项。");
        return;
    }

    var techStackArray = [];
    if (techStack) {
        techStackArray = techStack.split(",").map(function(item) {
            return item.trim();
        }).filter(function(item) {
            return item !== "";
        });
    }

    var payload = {
        user_id: parseInt(userId, 10),
        name: name,
        tech_stack: techStackArray
    };

    try {
        var response = await fetch("/api/member/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("网络错误，状态码：" + response.status);
        }

        var result = await response.json();
        if (result.success) {
            nameInput.value = "";
            techStackInput.value = "";
            await refreshMembers();
        } else {
            alert(result.message || "添加成员失败");
        }
    } catch (err) {
        console.error(err);
        alert("添加成员失败：" + err.message);
    }
}

async function updateMember(memberId, updatedData) {
    try {
        var userId = getCurrentUserId();
        if (!userId) {
            alert("未找到用户ID，请重新登录后再试。");
            return false;
        }

        if (updatedData.tech_stack && typeof updatedData.tech_stack === 'string') {
            updatedData.tech_stack = updatedData.tech_stack.split(',').map(item => item.trim()).filter(item => item);
        }

        const defaultScores = {
            quality_score: updatedData.quality_score !== undefined ? updatedData.quality_score : 0.0,
            workload_score: updatedData.workload_score !== undefined ? updatedData.workload_score : 0.0,
            collaboration_score: updatedData.collaboration_score !== undefined ? updatedData.collaboration_score : 0.0,
            completion_score: updatedData.completion_score !== undefined ? updatedData.completion_score : 0.0
        };

        var response = await fetch("/api/member/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: memberId,
                user_id: parseInt(userId, 10),
                ...updatedData,
                ...defaultScores
            })
        });

        const contentType = response.headers.get("content-type");
        if (contentType && !contentType.includes("application/json")) {
            throw new Error("服务器返回了无效的响应格式");
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`请求失败: ${response.status} ${response.statusText}` +
                (errorData.message ? ` - ${errorData.message}` : ''));
        }

        var result = await response.json();

        if (result.success) {
            await refreshMembers();
            alert("成员信息更新成功！");
            return true;
        } else {
            console.error("更新成员失败:", result);
            alert(result.message || "更新成员失败");
            return false;
        }
    } catch (err) {
        console.error("更新成员时发生错误:", err);

        let errorMessage = err.message;
        if (errorMessage.includes('JSON') || errorMessage.includes('Unexpected token')) {
            errorMessage = "服务器返回了无效的JSON格式。请检查后端是否正确导入了json模块。";
        } else if (errorMessage.includes('404')) {
            errorMessage = "API端点不存在。请检查后端路由配置。";
        }

        alert("更新成员失败: " + errorMessage);
        return false;
    }
}

async function deleteMemberById(id) {
    if (!id) {
        console.error("缺少成员ID，无法删除");
        return false;
    }

    if (!confirm("确认删除这位团队成员吗？此操作不可撤销！")) {
        return false;
    }

    try {
        var userId = getCurrentUserId();
        if (!userId) {
            alert("未找到用户ID，请重新登录后再试。");
            return false;
        }

        var response = await fetch("/api/member/delete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: id,
                user_id: parseInt(userId, 10)
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`请求失败: ${response.status} ${response.statusText}` +
                (errorData.message ? ` - ${errorData.message}` : ''));
        }

        var result = await response.json();

        if (result.success) {
            await refreshMembers();
            alert("成员删除成功！");
            return true;
        } else {
            console.error("删除成员失败:", result);
            alert(result.message || "删除成员失败");
            return false;
        }
    } catch (err) {
        console.error("删除成员时发生错误:", err);

        let errorMessage = err.message;
        if (errorMessage.includes('JSON') || errorMessage.includes('Unexpected token')) {
            errorMessage = "服务器返回了无效的JSON格式。这通常表示后端代码存在错误。";
        } else if (errorMessage.includes('403') || errorMessage.includes('权限')) {
            errorMessage = "您没有权限执行此操作。请确认您是该成员的所有者。";
        }

        alert("删除成员失败: " + errorMessage);
        return false;
    }
}

function initTeamManagementEvents() {
    var refreshBtn = document.getElementById("btnRefreshMembers");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", function() {
            refreshMembers();
        });
    }

    var memberForm = document.getElementById("memberForm");
    if (memberForm) {
        memberForm.addEventListener("submit", handleAddMember);
    }

    var memberBoard = document.getElementById("memberBoard");
    if (memberBoard) {
        memberBoard.addEventListener("click", function(event) {
            var target = event.target;

            // 处理删除按钮点击
            if (target.classList.contains("member-delete-btn") || target.closest(".member-delete-btn")) {
                var deleteBtn = target.closest(".member-delete-btn");
                var id = deleteBtn.getAttribute("data-id");
                deleteMemberById(id);
                return;
            }

            // 处理卡片点击（弹出编辑弹窗）
            if (target.closest(".member-card")) {
                var card = target.closest(".member-card");
                var id = card.getAttribute("data-id");

                // 关键修复：确保能正确获取姓名和技术栈
                var nameElement = card.querySelector(".member-name");
                var techStackElement = card.querySelector(".member-tech");

                // 容错处理：防止元素不存在导致报错
                var name = nameElement ? nameElement.textContent.replace("👤", "").trim() : "未命名";
                var techStack = techStackElement ? techStackElement.textContent.trim() : "无技术栈";

                // 从data属性获取评分数据（更可靠的方式）
                var qualityScore = parseFloat(card.getAttribute("data-quality-score") || "80.0");
                var workloadScore = parseFloat(card.getAttribute("data-workload-score") || "50.0");
                var collaborationScore = parseFloat(card.getAttribute("data-collaboration-score") || "80.0");
                var completionScore = parseFloat(card.getAttribute("data-completion-score") || "0.0");

                // 弹出编辑弹窗
                showEditMemberDialog(id, {
                    name: name,
                    tech_stack: techStack,
                    quality_score: qualityScore,
                    workload_score: workloadScore,
                    collaboration_score: collaborationScore,
                    completion_score: completionScore
                });
            }
        });
    }
}

function showEditMemberDialog(memberId, memberData) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';

  const techStackStr = Array.isArray(memberData.tech_stack)
    ? memberData.tech_stack.join(", ")
    : (typeof memberData.tech_stack === 'string' ? memberData.tech_stack : "");

  modal.innerHTML = `
    <div class="modal-dialog rounded-xl shadow-lg max-w-md w-full">
      <div class="modal-header bg-white rounded-t-xl p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-800">编辑团队成员</h3>
        <button class="close-btn text-gray-500 hover:text-gray-800 transition-colors text-xl">&times;</button>
      </div>
      <div class="modal-body bg-white p-4">
        <div class="form-group mb-4">
          <label for="editName" class="block text-sm text-gray-600 mb-1">姓名</label>
          <input type="text" id="editName" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors" value="${memberData.name || ''}">
        </div>
        <div class="form-group mb-4">
          <label for="editTechStack" class="block text-sm text-gray-600 mb-1">技术栈 (用逗号分隔)</label>
          <input type="text" id="editTechStack" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors" value="${techStackStr}">
        </div>
        <div class="form-group mb-4">
          <label for="editWorkload" class="block text-sm text-gray-600 mb-1">工作负载 (1-100)</label>
          <input type="number" id="editWorkload" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors" min="0" max="100" value="${Math.round(memberData.workload_score || 50)}">
        </div>
        <div class="form-group mb-4">
          <label class="block text-sm text-gray-600 mb-1">质量评分</label>
          <div class="flex items-center gap-3">
            <input type="range" id="qualitySlider" min="0" max="100" value="${Math.round(memberData.quality_score || 80)}" class="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-500">
            <span id="qualityValue" class="text-indigo-600 font-semibold min-w-[40px] text-center">${Math.round(memberData.quality_score || 80)}</span>
          </div>
        </div>
        <div class="form-group mb-2">
          <label class="block text-sm text-gray-600 mb-1">协作评分</label>
          <div class="flex items-center gap-3">
            <input type="range" id="collaborationSlider" min="0" max="100" value="${Math.round(memberData.collaboration_score || 80)}" class="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-purple-500">
            <span id="collabValue" class="text-purple-600 font-semibold min-w-[40px] text-center">${Math.round(memberData.collaboration_score || 80)}</span>
          </div>
        </div>
      </div>
      <div class="modal-footer bg-white rounded-b-xl p-4 border-t border-gray-100 flex justify-end gap-3">
        <button id="cancelEdit" class="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">取消</button>
        <button id="saveEdit" class="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors">保存</button>
      </div>
    </div>
  `;

  // 模态框基础样式
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    backdrop-filter: blur(2px);
  `;

  document.body.appendChild(modal);

  // 获取弹窗内元素
  const closeBtn = modal.querySelector('.close-btn');
  const cancelBtn = modal.querySelector('#cancelEdit');
  const saveBtn = modal.querySelector('#saveEdit');
  const qualitySlider = modal.querySelector('#qualitySlider');
  const collabSlider = modal.querySelector('#collaborationSlider');
  const qualityValue = modal.querySelector('#qualityValue');
  const collabValue = modal.querySelector('#collabValue');

  // 评分滑块交互
  qualitySlider.addEventListener('input', function() {
    qualityValue.textContent = this.value;
  });

  collabSlider.addEventListener('input', function() {
    collabValue.textContent = this.value;
  });

  // 关闭弹窗函数
  function closeModal() {
    document.body.removeChild(modal);
  }

  // 绑定关闭事件
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal();
    }
  });

  // 保存按钮事件
  saveBtn.addEventListener('click', function() {
    const updatedData = {
      name: modal.querySelector('#editName').value.trim(),
      tech_stack: modal.querySelector('#editTechStack').value.split(',')
        .map(item => item.trim())
        .filter(item => item),
      workload_score: parseInt(modal.querySelector('#editWorkload').value),
      quality_score: parseInt(qualitySlider.value),
      collaboration_score: parseInt(collabSlider.value),
      completion_score: memberData.completion_score
    };

    if (!updatedData.name) {
      alert("姓名不能为空");
      return;
    }

    updateMember(memberId, updatedData);
    closeModal();
  });
}

function getEmojiForScore(score) {
    if (score >= 80) return '😄 优秀';
    if (score >= 60) return '🙂 良好';
    if (score >= 30) return '😐 一般';
    return '😞 较差';
}

// 确保DOM加载完成后初始化事件
document.addEventListener("DOMContentLoaded", function() {
    // 初始化团队管理事件
    initTeamManagementEvents();
    // 刷新成员列表
    if (document.getElementById("memberBoard")) {
        refreshMembers();
    }
});

// 补充：如果页面中缺少getCurrentUserId函数，添加默认实现（根据实际项目调整）
function getCurrentUserId() {
    // 这里替换为实际的用户ID获取逻辑，例如从localStorage、cookie或全局变量
    return localStorage.getItem('userId') || '1'; // 临时默认值，需根据项目修改
}