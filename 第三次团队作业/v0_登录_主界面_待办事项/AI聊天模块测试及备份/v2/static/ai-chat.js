// AI聊天模块
;(() => {
  const STORAGE_KEY = "ai_chat_history"
  const axios = window.axios
  const WELCOME_MESSAGE =
    "你好!我是小办同学，是你们的专属智能体助手，我可以帮你修改待办事项，也可以和你聊天，请问有什么我可以帮到你的吗?"

  // 获取聊天历史
  function getChatHistory() {
    const history = localStorage.getItem(STORAGE_KEY)
    return history ? JSON.parse(history) : []
  }

  // 保存聊天历史
  function saveChatHistory(history) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  }

  // 渲染聊天消息
  function renderMessages() {
    const chatMessages = document.getElementById("chatMessages")
    if (!chatMessages) return

    const history = getChatHistory()
    chatMessages.innerHTML = ""

    history.forEach((msg) => {
      const messageDiv = document.createElement("div")
      messageDiv.className = "ai-chat-message " + msg.role

      const avatarDiv = document.createElement("div")
      avatarDiv.className = "ai-chat-avatar"
      avatarDiv.textContent = msg.role === "user" ? "👤" : "🤖"

      const bubbleDiv = document.createElement("div")
      bubbleDiv.className = "ai-chat-bubble"
      bubbleDiv.textContent = msg.content

      messageDiv.appendChild(avatarDiv)
      messageDiv.appendChild(bubbleDiv)
      chatMessages.appendChild(messageDiv)
    })

    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  // 添加消息到历史
  function addMessage(role, content) {
    const history = getChatHistory()
    history.push({ role: role, content: content })
    saveChatHistory(history)
    renderMessages()
  }

  // 发送消息到AI
  async function sendMessage(message) {
    if (!message.trim()) return

    // 添加用户消息
    addMessage("user", message)

    // 显示加载状态
    const chatMessages = document.getElementById("chatMessages")
    const loadingDiv = document.createElement("div")
    loadingDiv.className = "ai-chat-message assistant"
    loadingDiv.innerHTML = `
      <div class="ai-chat-avatar">🤖</div>
      <div class="ai-chat-bubble">正在思考...</div>
    `
    loadingDiv.id = "loadingMessage"
    chatMessages.appendChild(loadingDiv)
    chatMessages.scrollTop = chatMessages.scrollHeight

    try {
      const response = await axios.post("/api/ai/chat", {
        query: message,
        paragraph: "",
      })

      // 移除加载状态
      const loading = document.getElementById("loadingMessage")
      if (loading) loading.remove()

      if (response.data.success) {
        addMessage("assistant", response.data.response)
      } else {
        addMessage("assistant", "抱歉，出现了错误：" + (response.data.message || "未知错误"))
      }
    } catch (error) {
      // 移除加载状态
      const loading = document.getElementById("loadingMessage")
      if (loading) loading.remove()

      console.error("发送消息失败:", error)
      let errorMsg = "抱歉，网络请求失败，请稍后再试。"
      if (error.response) {
        errorMsg += `\n状态码: ${error.response.status}`
        if (error.response.data && error.response.data.message) {
          errorMsg += `\n错误: ${error.response.data.message}`
        }
      } else if (error.request) {
        errorMsg += "\n无法连接到服务器，请检查后端是否运行。"
      } else {
        errorMsg += `\n${error.message}`
      }
      addMessage("assistant", errorMsg)
    }
  }

  // 清空聊天历史
  function clearHistory() {
    if (confirm("确定要清空聊天记录吗？")) {
      localStorage.removeItem(STORAGE_KEY)
      initWelcomeMessage()
      renderMessages()
    }
  }

  function initWelcomeMessage() {
    const history = getChatHistory()
    if (history.length === 0) {
      saveChatHistory([{ role: "assistant", content: WELCOME_MESSAGE }])
    }
  }

  // 初始化聊天界面
  function initAIChat() {
    const chatForm = document.getElementById("chatForm")
    const chatInput = document.getElementById("chatInput")
    const clearBtn = document.getElementById("clearChatBtn")

    if (!chatForm || !chatInput) {
      console.error("Chat form elements not found!")
      return
    }

    initWelcomeMessage()
    // 加载历史消息
    renderMessages()

    // 表单提交事件
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const message = chatInput.value.trim()
      if (message) {
        sendMessage(message)
        chatInput.value = ""
      }
    })

    // 清空历史按钮
    if (clearBtn) {
      clearBtn.addEventListener("click", clearHistory)
    }
  }

  // 导出到全局
  window.AIChat = {
    init: initAIChat,
    send: sendMessage,
    clear: clearHistory,
  }
})()
