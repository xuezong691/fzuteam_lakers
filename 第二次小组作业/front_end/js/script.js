const urgencyLabels = ["已完成", "普通", "重要", "紧急"]
// 加载任务数据
function loadTasks() {
    fetch('./json/task.json')
        .then(response => response.json())
        .then(data => {
            console.log('任务数据加载成功:', data);
            renderTasks(data);
        })
        .catch(error => {
            console.error('加载任务失败:', error);
            // 使用示例数据
            const sampleTasks = [
                {
                    num: 1,
                    time: '2025-01-15',
                    place: '办公室',
                    staff: '张三',
                    something: '完成项目报告',
                    urgency: 3
                },
                {
                    num: 2,
                    time: '2025-01-16',
                    place: '会议室',
                    staff: '李四',
                    something: '参加团队会议',
                    urgency: 2
                },
                {
                    num: 3,
                    time: '2025-01-14',
                    place: '家里',
                    staff: '自己',
                    something: '整理文档',
                    urgency: 0
                }
            ];
            renderTasks(sampleTasks);
        });
}

// 页面加载时加载任务
loadTasks()

// 渲染任务列表
function renderTasks(tasks) {
    const tasksList = document.getElementById("tasksList")
    tasksList.innerHTML = ""

    // 按紧急程度排序（紧急的在前，已完成的在后）
    tasks.sort((a, b) => {
        if (a.urgency === 0) return 1
        if (b.urgency === 0) return -1
        return b.urgency - a.urgency
    })

    tasks.forEach((task) => {
        const taskCard = document.createElement("div")
        taskCard.className = `task-card urgency-${task.urgency}`
        taskCard.innerHTML = `
            <div class="task-header">
                <span class="task-num">#${task.num}</span>
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
        `
        tasksList.appendChild(taskCard)
    })
}

//不需要ai聊天窗口，这段保留注释即可
// // 发送消息
// function sendMessage() {
//     const input = document.getElementById("messageInput")
//     const message = input.value.trim()

//     if (!message) return

//     // 显示用户消息
//     addMessage(message, "user")
//     input.value = ""

//     // 模拟AI回复
//     setTimeout(() => {
//         const aiResponse = "我已经收到你的任务信息，正在为你整理..."
//         addMessage(aiResponse, "ai")

//         // 模拟刷新任务列表
//         setTimeout(() => {
//             loadTasks()
//         }, 1000)
//     }, 500)
// }

// // 添加消息到聊天窗口
// function addMessage(text, type) {
//     const messagesContainer = document.getElementById("chatMessages")
//     const messageDiv = document.createElement("div")
//     messageDiv.className = `message ${type}`
//     messageDiv.textContent = text
//     messagesContainer.appendChild(messageDiv)
//     messagesContainer.scrollTop = messagesContainer.scrollHeight
// }

// // 回车发送
// document.getElementById("messageInput").addEventListener("keypress", (e) => {
//     if (e.key === "Enter") {
//         sendMessage()
//     }
// })


