// API 基础地址
const API_BASE_URL = "http://localhost:3000/api"

// 账号密码验证正则（8位数字或英文字符）
const ACCOUNT_REGEX = /^[a-zA-Z0-9]{8}$/

// 切换到注册页面
function switchToRegister() {
  const loginForm = document.querySelector(".login-form")
  const registerForm = document.querySelector(".register-form")

  loginForm.classList.remove("active")
  loginForm.classList.add("slide-out-left")

  setTimeout(() => {
    loginForm.classList.remove("slide-out-left")
    registerForm.classList.add("active")
  }, 300)
}

// 切换到登录页面
function switchToLogin() {
  const loginForm = document.querySelector(".login-form")
  const registerForm = document.querySelector(".register-form")

  registerForm.classList.remove("active")
  registerForm.classList.add("slide-out-right")

  setTimeout(() => {
    registerForm.classList.remove("slide-out-right")
    loginForm.classList.add("active")
  }, 300)
}

// 验证账号密码格式
function validateAccount(value, fieldName) {
  if (!value) {
    alert(`${fieldName}不能为空`)
    return false
  }
  if (!ACCOUNT_REGEX.test(value)) {
    alert(`${fieldName}必须是8位数字或英文字符`)
    return false
  }
  return true
}

// 登录表单提交
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const formData = new FormData(e.target)
  const data = {}
  formData.forEach((value, key) => {
    data[key] = value
  })

  // 验证格式
  if (!validateAccount(data.username, "账号")) return
  if (!validateAccount(data.password, "密码")) return

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (result.success) {
      alert("登录成功！")
      // 保存用户信息到 localStorage
      localStorage.setItem("userId", result.data.userId)
      localStorage.setItem("teamName", result.data.teamName)

      // 显示欢迎页面
      showWelcomePage(result.data.userId, result.data.teamName)
    } else {
      alert(result.message || "登录失败")
    }
  } catch (error) {
    console.error("登录错误:", error)
    alert("登录失败，请检查网络连接")
  }
})

// 注册表单提交
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const formData = new FormData(e.target)
  const data = {}
  formData.forEach((value, key) => {
    data[key] = value
  })

  // 验证格式
  if (!validateAccount(data.username, "账号")) return
  if (!validateAccount(data.password, "密码")) return
  if (!data.teamname || data.teamname.trim() === "") {
    alert("团队名称不能为空")
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (result.success) {
      alert("注册成功！请登录")
      // 清空表单
      e.target.reset()
      // 切换到登录页面
      switchToLogin()
    } else {
      alert(result.message || "注册失败")
    }
  } catch (error) {
    console.error("注册错误:", error)
    alert("注册失败，请检查网络连接")
  }
})

// 显示欢迎页面
function showWelcomePage(userId, teamName) {
  document.querySelector(".form-wrapper").style.display = "none"
  document.getElementById("welcomeContainer").style.display = "block"
  document.getElementById("displayUserId").textContent = userId
  document.getElementById("displayTeamName").textContent = teamName
}

// 退出登录
function logout() {
  localStorage.removeItem("userId")
  localStorage.removeItem("teamName")
  document.querySelector(".form-wrapper").style.display = "block"
  document.getElementById("welcomeContainer").style.display = "none"
  document.getElementById("loginForm").reset()
}

// 页面加载时检查是否已登录
window.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("userId")
  const teamName = localStorage.getItem("teamName")

  if (userId && teamName) {
    showWelcomePage(userId, teamName)
  }
})

// 声明 serialize 函数
function serialize(form, options) {
  const obj = {}
  if (options.hash) {
    const elements = form.querySelectorAll("input, select, textarea")
    elements.forEach((element) => {
      if (element.name) {
        obj[element.name] = element.value
      }
    })
  }
  return obj
}

// 声明 fetch 函数
const fetch = window.fetch || require("node-fetch")
