// taskManager.js

(function () {


  // 渲染任务列表为卡片
function renderTasks(tasks) {
  var board = document.getElementById("taskBoard");
  if (!board) return;

  board.innerHTML = "";

  if (!tasks || tasks.length === 0) {
    var empty = document.createElement("p");
    empty.className = "task-empty";
    empty.textContent = "没有任务，试试添加一条或点击“刷新任务”。";
    board.appendChild(empty);
    return;
  }

  tasks.forEach(function (task) {
    var card = document.createElement("div");
    card.className = "task-card";

    // === 标题 ===
    var title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.something || "未填写任务内容";

    // === 任务内容（描述）===
    var content = document.createElement("div");
    content.className = "task-content";
    content.textContent = task.something || "无描述";

    // === 元信息：日期 • 地点 • 负责人 ===
    var meta = document.createElement("div");
    meta.className = "task-meta";

    // 只显示值，不加“日期：”前缀（更简洁）
    var timeSpan = document.createElement("span");
    timeSpan.textContent = task.time || "未设置";

    var placeSpan = document.createElement("span");
    placeSpan.textContent = task.place || "未设置";

    var staffSpan = document.createElement("span");
    staffSpan.textContent = task.staff || "未指定";

    meta.appendChild(timeSpan);
    meta.appendChild(placeSpan);
    meta.appendChild(staffSpan);

    // === 底部：紧急程度 + 删除按钮 ===
    var footer = document.createElement("div");
    footer.className = "task-footer";

    // 紧急程度文本和样式
    var urgencyText = "一般";
    var urgencyClass = "urgency-low";

    switch (String(task.urgency)) {
      case "2":
        urgencyText = "重要";
        urgencyClass = "urgency-medium";
        break;
      case "3":
        urgencyText = "紧急";
        urgencyClass = "urgency-high";
        break;
      default:
        // 默认为 1 或无效值
        urgencyText = "一般";
        urgencyClass = "urgency-low";
    }

    var urgencySpan = document.createElement("span");
    urgencySpan.className = "task-urgency " + urgencyClass;
    urgencySpan.textContent = urgencyText;

    var deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "task-delete-btn";
    deleteBtn.setAttribute("data-id", task.id);
    deleteBtn.innerHTML = "🗑"; // 使用图标更简洁

    footer.appendChild(urgencySpan);
    footer.appendChild(deleteBtn);

    // 组装卡片
    card.appendChild(title);
    // card.appendChild(content); // 👈 补上任务内容区域
    card.appendChild(meta);
    card.appendChild(footer);

    board.appendChild(card);
  });
}
  // 调用 /api/task/refresh 获取任务列表
  async function refreshTasks() {
    var userId = getCurrentUserId();
    if (!userId) {
      alert("未找到用户ID，请重新登录后再试。");
      return;
    }

    try {
      var response = await fetch("/api/task/refresh", {
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
        renderTasks(result.tasks || []);
      } else {
        alert(result.message || "刷新任务失败");
      }
    } catch (err) {
      console.error(err);
      alert("刷新任务失败：" + err.message);
    }
  }

  // 调用 /api/task/add 添加任务
  async function handleAddTask(event) {
    event.preventDefault();

    var userId = getCurrentUserId();
    if (!userId) {
      alert("未找到用户ID，请重新登录后再试。");
      return;
    }

    var timeInput = document.getElementById("taskTime");
    var placeInput = document.getElementById("taskPlace");
    var staffInput = document.getElementById("taskStaff");
    var urgencySelect = document.getElementById("taskUrgency");
    var somethingInput = document.getElementById("taskSomething");

    var payload = {
      user_id: parseInt(userId, 10),
      time: timeInput.value,
      place: placeInput.value,
      staff: staffInput.value,
      something: somethingInput.value,
      urgency: parseInt(urgencySelect.value || "1", 10)
    };

    if (!payload.time || !payload.something) {
      alert("日期和任务内容为必填项。");
      return;
    }

    try {
      var response = await fetch("/api/task/add", {
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
        placeInput.value = "";
        staffInput.value = "";
        somethingInput.value = "";
        urgencySelect.value = "1";
        // 重新刷新列表
        await refreshTasks();
      } else {
        alert(result.message || "添加任务失败");
      }
    } catch (err) {
      console.error(err);
      alert("添加任务失败：" + err.message);
    }
  }

  // 调用 /api/task/delete 删除任务
  async function deleteTaskById(id) {
    if (!id) return;
    if (!confirm("确认删除这条任务吗？")) return;

    try {
      var response = await fetch("/api/task/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: id })
      });

      if (!response.ok) {
        throw new Error("网络错误，状态码：" + response.status);
      }

      var result = await response.json();
      if (result.success) {
        await refreshTasks();
      } else {
        alert(result.message || "删除任务失败");
      }
    } catch (err) {
      console.error(err);
      alert("删除任务失败：" + err.message);
    }
  }

  // 事项看板内事件绑定（按钮、卡片删除）
  function initTodoTaskEvents() {
    var refreshBtn = document.getElementById("btnRefreshTasks");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        refreshTasks();
      });
    }

    var taskForm = document.getElementById("taskForm");
    if (taskForm) {
      taskForm.addEventListener("submit", handleAddTask);
    }

    var taskBoard = document.getElementById("taskBoard");
    if (taskBoard) {
      taskBoard.addEventListener("click", function (event) {
        var target = event.target;
        if (target.classList.contains("task-delete-btn")) {
          var id = target.getAttribute("data-id");
          deleteTaskById(id);
        }
      });
    }
  }

  // 页面加载完成后初始化事件
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTodoTaskEvents);
  } else {
    initTodoTaskEvents();
  }
})();