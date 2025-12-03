// ========== 团队管理模块 ==========
// 渲染成员列表为卡片
function renderMembers(members) {
  var container = document.getElementById("memberBoard");
  if (!container) return;

  container.innerHTML = "";

  if (!members || members.length === 0) {
    var empty = document.createElement("div");
    empty.className = "member-empty";
    empty.innerHTML = `
      <div>👥</div>
      <p>暂无团队成员</p>
      <p>点击下方"添加新成员"开始创建您的团队</p>
    `;
    container.appendChild(empty);
    return;
  }

  members.forEach(function(member) {
    var card = document.createElement("div");
    card.className = "member-card";
    card.setAttribute("data-id", member.id);

    // 修复：将成员数据存储在DOM的data属性中，便于后续获取
    card.setAttribute("data-quality-score", member.quality_score || "0.00");
    card.setAttribute("data-workload-score", member.workload_score || "0.00");
    card.setAttribute("data-collaboration-score", member.collaboration_score || "0.00");
    card.setAttribute("data-completion-score", member.completion_score || "0.00");
    card.setAttribute("data-tech-stack", JSON.stringify(member.tech_stack || []));
    card.setAttribute("data-name", member.name || "未命名");

    var header = document.createElement("div");
    header.className = "member-header";

    var name = document.createElement("h3");
    name.textContent = member.name || "未命名";
    name.className = "member-name";

    var techStack = document.createElement("div");
    techStack.className = "member-tech";
    var techs = member.tech_stack && Array.isArray(member.tech_stack)
      ? member.tech_stack.join(", ")
      : "无技术栈";
    techStack.textContent = techs;

    header.appendChild(name);
    header.appendChild(techStack);

    var scores = document.createElement("div");
    scores.className = "member-scores";

    // 重构质量评分
    var quality = document.createElement("span");
    quality.innerHTML = `
      <label>质量评分</label>
      <span class="value">${(member.quality_score || 0).toFixed(1)}</span>
      <div class="score-indicator">
        <div class="score-fill" style="width: ${Math.min(100, member.quality_score || 0)}%"></div>
      </div>
    `;

    // 重构工作量评分
    var workload = document.createElement("span");
    workload.innerHTML = `
      <label>工作量</label>
      <span class="value">${(member.workload_score || 0).toFixed(1)}</span>
      <div class="score-indicator">
        <div class="score-fill" style="width: ${Math.min(100, member.workload_score || 0)}%"></div>
      </div>
    `;

    // 重构协作评分
    var collaboration = document.createElement("span");
    collaboration.innerHTML = `
      <label>协作能力</label>
      <span class="value">${(member.collaboration_score || 0).toFixed(1)}</span>
      <div class="score-indicator">
        <div class="score-fill" style="width: ${Math.min(100, member.collaboration_score || 0)}%"></div>
      </div>
    `;

    // 重构完成度评分
    var completion = document.createElement("span");
    completion.innerHTML = `
      <label>任务完成度</label>
      <span class="value">${(member.completion_score || 0).toFixed(1)}</span>
      <div class="score-indicator">
        <div class="score-fill" style="width: ${Math.min(100, member.completion_score || 0)}%"></div>
      </div>
    `;

    scores.appendChild(quality);
    scores.appendChild(workload);
    scores.appendChild(collaboration);
    scores.appendChild(completion);

    var footer = document.createElement("div");
    footer.className = "member-footer";

    var deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "member-delete-btn";
    deleteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> 删除`;
    deleteBtn.setAttribute("data-id", member.id);

    footer.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(scores);
    card.appendChild(footer);

    container.appendChild(card);
  });
}
    // 调用 /api/member/list 获取成员列表
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

            // 修正1：根据后端的响应结构，直接访问 result.members 而不是 result.data
            if (result.success) {
              // 修正2：同时兼容两种可能的结构，增加健壮性
              const members = result.members || (result.data && result.data.members) || [];

              // 新增：确保每个成员对象都包含四个评分属性（如果后端返回了这些属性）
              members.forEach(member => {
                  // 保留原有属性，只添加缺失的评分属性
                  member.quality_score = member.quality_score !== undefined ? member.quality_score : 0.0;
                  member.workload_score = member.workload_score !== undefined ? member.workload_score : 0.0;
                  member.collaboration_score = member.collaboration_score !== undefined ? member.collaboration_score : 0.0;
                  member.completion_score = member.completion_score !== undefined ? member.completion_score : 0.0;
              });

              renderMembers(members);

              // 修正3：如果成员列表为空，提供友好提示
              if (members.length === 0) {
                  const memberBoard = document.getElementById('memberBoard');
                  if (memberBoard) {
                      memberBoard.innerHTML = `
                          <div class="member-empty">
                              <div>👥</div>
                              <p>暂无团队成员</p>
                              <p>点击下方"添加新成员"开始创建您的团队</p>
                          </div>
                      `;
                  }
              }
          } else {
                // 修正4：提供更详细的错误信息
                console.error("后端返回错误:", result);
                alert(result.message || "刷新成员失败");
            }
        } catch (err) {
            console.error("刷新成员列表时发生错误:", err);

            // 修正5：尝试解析可能的后端错误
            if (err.message.includes('JSON')) {
                alert("数据解析错误: 服务器返回了无效的JSON格式。这通常表示后端代码存在错误。");
            } else if (err.message.includes('404')) {
                alert("API端点不存在: 请检查后端路由配置是否正确");
            } else {
                alert("刷新成员失败: " + (err.message || "未知错误"));
            }
        }
    }

    // 调用 /api/member/add 添加成员
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

        // 将技术栈转换为数组
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
                // 清空表单
                nameInput.value = "";
                techStackInput.value = "";

                // 重新刷新列表
                await refreshMembers();
            } else {
                alert(result.message || "添加成员失败");
            }
        } catch (err) {
            console.error(err);
            alert("添加成员失败：" + err.message);
        }
    }

    // 调用 /api/member/update 更新成员
    async function updateMember(memberId, updatedData) {
        try {
            // 获取当前用户ID
            var userId = getCurrentUserId();
            if (!userId) {
                alert("未找到用户ID，请重新登录后再试。");
                return false;
            }

            // 确保技术栈是数组格式
            if (updatedData.tech_stack && typeof updatedData.tech_stack === 'string') {
                updatedData.tech_stack = updatedData.tech_stack.split(',').map(item => item.trim()).filter(item => item);
            }

            // 新增：确保四个评分属性被包含在更新数据中
            // 如果调用者没有提供这些属性，我们保留它们的当前值（避免重置为0）
            // 注意：在实际应用中，应该先获取当前成员数据，这里提供默认值作为保护
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
                    user_id: parseInt(userId, 10), // 添加user_id
                    ...updatedData,
                    // 确保四个评分属性被包含在请求中
                    ...defaultScores
                })
            });

            // 验证响应是否为JSON
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

            // 根据 standard_response 结构处理结果
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

            // 详细错误处理
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

    // 调用 /api/member/delete 删除成员
    async function deleteMemberById(id) {
        if (!id) {
            console.error("缺少成员ID，无法删除");
            return false;
        }

        if (!confirm("确认删除这位团队成员吗？此操作不可撤销！")) {
            return false;
        }

        try {
            // 获取当前用户ID
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
                    user_id: parseInt(userId, 10) // 添加user_id
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

            // 详细错误处理
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

    // 团队管理面板内事件绑定
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
                if (target.classList.contains("member-delete-btn")) {
                    var id = target.getAttribute("data-id");
                    deleteMemberById(id);
                    return;
                }

                // 处理卡片点击 - 编辑成员
                if (target.closest(".member-card")) {
                    var card = target.closest(".member-card");
                    var id = card.getAttribute("data-id");

                    // 获取当前卡片上的数据
                    var name = card.querySelector(".member-name").textContent;
                    var techStack = card.querySelector(".member-tech").textContent.replace("技术栈: ", "");

                    // 新增：获取四个评分属性
                    var qualityScore = parseFloat(card.getAttribute("data-quality-score") || "80.0");
                    var workloadScore = parseFloat(card.getAttribute("data-workload-score") || "50.0");
                    var collaborationScore = parseFloat(card.getAttribute("data-collaboration-score") || "80.0");
                    var completionScore = parseFloat(card.getAttribute("data-completion-score") || "0.0");

                    // 显示自定义编辑对话框
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

    // 显示编辑成员对话框
    function showEditMemberDialog(memberId, memberData) {
      // 创建模态对话框容器
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';

      const techStackStr = Array.isArray(memberData.tech_stack)
        ? memberData.tech_stack.join(", ")
        : (typeof memberData.tech_stack === 'string' ? memberData.tech_stack : "");

      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-header">
            <h3>编辑团队成员</h3>
            <button class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="editName">姓名</label>
              <input type="text" id="editName" class="form-control" value="${memberData.name || ''}">
            </div>
            <div class="form-group">
              <label for="editTechStack">技术栈 (用逗号分隔)</label>
              <input type="text" id="editTechStack" class="form-control" value="${techStackStr}">
            </div>
            <div class="form-group">
              <label for="editWorkload">工作负载 (1-100)</label>
              <input type="number" id="editWorkload" class="form-control" min="0" max="100" value="${Math.round(memberData.workload_score || 50)}">
            </div>
            <div class="form-group rating-group">
              <label>质量评分</label>
              <input type="range" id="qualitySlider" min="0" max="100" value="${Math.round(memberData.quality_score || 80)}" class="rating-slider">
              <span id="qualityValue">${Math.round(memberData.quality_score || 80)}</span>/100
            </div>
            <div class="form-group rating-group">
              <label>协作评分</label>
              <input type="range" id="collaborationSlider" min="0" max="100" value="${Math.round(memberData.collaboration_score || 80)}" class="rating-slider">
              <span id="collabValue">${Math.round(memberData.collaboration_score || 80)}</span>/100
            </div>
          </div>
          <div class="modal-footer">
            <button id="cancelEdit" class="btn btn-secondary">取消</button>
            <button id="saveEdit" class="btn btn-primary">保存</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const closeBtn = modal.querySelector('.close-btn');
      const cancelBtn = modal.querySelector('#cancelEdit');
      const saveBtn = modal.querySelector('#saveEdit');
      const qualitySlider = modal.querySelector('#qualitySlider');
      const collabSlider = modal.querySelector('#collaborationSlider');
      const qualityValue = modal.querySelector('#qualityValue');
      const collabValue = modal.querySelector('#collabValue');

      qualitySlider.addEventListener('input', function() {
        qualityValue.textContent = this.value;
      });

      collabSlider.addEventListener('input', function() {
        collabValue.textContent = this.value;
      });

      function closeModal() {
        document.body.removeChild(modal);
      }

      closeBtn.addEventListener('click', closeModal);
      cancelBtn.addEventListener('click', closeModal);

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

      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          closeModal();
        }
      });
    }

    // 新增：根据评分获取对应的表情
    function getEmojiForScore(score) {
        if (score >= 80) return '😄 优秀';
        if (score >= 60) return '🙂 良好';
        if (score >= 30) return '😐 一般';
        return '😞 较差';
    }

    // 新增：添加模态对话框的样式
    function addModalStyles() {
        if (document.getElementById('modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal-overlay {
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
            }

            .modal-dialog {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
                width: 90%;
                max-width: 500px;
                overflow: hidden;
            }

            .modal-header {
                padding: 16px 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .modal-header h3 {
                margin: 0;
                font-size: 1.2rem;
                color: #333;
            }

            .close-btn {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #999;
            }

            .close-btn:hover {
                color: #333;
            }

            .modal-body {
                padding: 20px;
            }

            .form-group {
                margin-bottom: 16px;
            }

            .form-group label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
                color: #444;
            }

            .form-control {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
                box-sizing: border-box;
            }

            .form-control:focus {
                outline: none;
                border-color: #4a90e2;
                box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
            }

            .rating-group {
                margin-top: 10px;
            }

            .rating-slider-container {
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .rating-slider {
                flex: 1;
                height: 8px;
                -webkit-appearance: none;
                background: #e0e0e0;
                border-radius: 4px;
                outline: none;
            }

            .rating-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #4a90e2;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }

            .rating-slider::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #4a90e2;
                cursor: pointer;
                border: none;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }

            .rating-value {
                min-width: 50px;
                font-weight: bold;
                color: #4a90e2;
            }

            .rating-emoji {
                min-width: 70px;
                font-size: 1.2rem;
                font-weight: bold;
                text-align: center;
            }

            .modal-footer {
                padding: 12px 20px;
                border-top: 1px solid #eee;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }

            .btn {
                padding: 8px 16px;
                border-radius: 4px;
                border: none;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
            }

            .btn-primary {
                background-color: #4a90e2;
                color: white;
            }

            .btn-primary:hover {
                background-color: #3a7bc8;
            }

            .btn-secondary {
                background-color: #f0f0f0;
                color: #333;
            }

            .btn-secondary:hover {
                background-color: #e0e0e0;
            }
        `;
        document.head.appendChild(style);
    }

    // 初始化团队管理模块
    document.addEventListener("DOMContentLoaded", function() {
        // 检查团队管理面板是否存在
        if (document.getElementById("memberBoard")) {
            refreshMembers();
            initTeamManagementEvents();
        }
    });
