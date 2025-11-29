import requests
import json
import os
import re
from docutils.nodes import paragraph
from typing import Optional, Dict, Any

def remove_think_tags(text):
    pattern = r"<\s*think\s*>(.*?)<\s*/\s*think\s*>"
    cleaned_text = re.sub(pattern, "", text, flags=re.DOTALL | re.IGNORECASE)
    return cleaned_text

class DifyAPIClient:
    """通用Dify API客户端"""

    def __init__(self, api_key, base_url="http://127.0.0.1:70"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

    def upload_file(self, file_path, user="user-123"):
        """上传文件到Dify"""
        upload_url = f"{self.base_url}/v1/files/upload"

        with open(file_path, 'rb') as f:
            files = {'file': (os.path.basename(file_path), f, 'text/plain')}
            data = {'user': user}

            response = requests.post(upload_url, headers={'Authorization': f'Bearer {self.api_key}'},
                                     files=files, data=data, timeout=60)

        if response.status_code in [200, 201]:
            result = response.json()
            print(f"✅ 文件上传成功: {result['name']}")
            return result['id']
        else:
            print(f"❌ 文件上传失败: {response.status_code}")
            return None

    def send_chat_message(self, query,paragraph_text=None, file_type=None, file_id=None,user="user-123", timeout=300):
        chat_url = f"{self.base_url}/v1/chat-messages"

        data = {
            "inputs": {},
            "query": query,
            "response_mode": "blocking",
            "user": user
        }


        if file_type is not None:
            # 顶层 files：必须有
            data["files"] = [
                {
                    "type": file_type,
                    "transfer_method": "local_file",
                    "upload_file_id": file_id
                }
            ]

            # ⚠️ inputs 里必须是“文件对象”，不是字符串
            data["inputs"]["video"] = {
                "type": file_type,
                "transfer_method": "local_file",
                "upload_file_id": file_id
            }

        if paragraph_text is not None:
            data["inputs"]["input"] = paragraph_text


        try:
            # print(data)
            response = requests.post(
                chat_url,
                headers=self.headers,
                json=data,
                timeout=timeout
            )

            if response.status_code == 200:
                return response.json().get("answer", "")
            else:
                print(f"❌ 请求失败: {response.status_code}")
                print(f"错误信息: {response.text}")
                return None

        except Exception as e:
            print(f"❌ 执行异常: {e}")
            return None

def call_for_greeting_summarize(QUERY,FILE_PATH):
    API_KEY = "app-3B6nIXQauabTT9Atpg9LkGBp"  # 你的API密钥
    BASE_URL = "http://127.0.0.1:80"  # Dify服务地址，根据你自己的地址和端口进行调整
    # FILE_PATH = "./test_file/video.mp3"  # 文件路径
    # QUERY = "总结"

    # 是否使用文件
    USE_FILE = True  # True: 上传文件, False: 不使用文件
    TIMEOUT = 300  # 超时时间（秒）
    # ==============================

    # 创建客户端
    client = DifyAPIClient(API_KEY, BASE_URL)

    # 上传文件（如果需要）
    file_id = None
    if USE_FILE and FILE_PATH:
        if not os.path.exists(FILE_PATH):
            print(f"❌ 文件不存在: {FILE_PATH}")
            return

        print(f"📤 上传文件: {FILE_PATH}")
        file_id = client.upload_file(FILE_PATH)
        if file_id is None:
            return

    # 执行工作流
    print(f"🚀 执行工作流...")
    result = client.send_chat_message(
        query=QUERY,
        file_type="audio",
        file_id=file_id,
        timeout=TIMEOUT
    )

    # 输出结果
    if result:
        return result
    else:
        print("❌ 执行失败")
        return None

def call_for_greeting_translate(QUERY,FILE_PATH):
    API_KEY = "app-yCDYXJ7bZw57zVFGiHMfky9G"  # 你的API密钥
    BASE_URL = "http://127.0.0.1:80"  # Dify服务地址，根据你自己的地址和端口进行调整
    # FILE_PATH = "./test_file/video.mp3"  # 文件路径
    # QUERY = "总结"

    # 是否使用文件
    USE_FILE = True  # True: 上传文件, False: 不使用文件
    TIMEOUT = 300  # 超时时间（秒）
    # ==============================

    # 创建客户端
    client = DifyAPIClient(API_KEY, BASE_URL)

    # 上传文件（如果需要）
    file_id = None
    if USE_FILE and FILE_PATH:
        if not os.path.exists(FILE_PATH):
            print(f"❌ 文件不存在: {FILE_PATH}")
            return

        print(f"📤 上传文件: {FILE_PATH}")
        file_id = client.upload_file(FILE_PATH)
        if file_id is None:
            return

    # 执行工作流
    print(f"🚀 执行工作流...")
    result = client.send_chat_message(
        query=QUERY,
        file_type="audio",
        file_id=file_id,
        timeout=TIMEOUT
    )

    # 输出结果
    if result:
        return result
        
    else:
        print("❌ 执行失败")
        return None

def call_for_task_generate(QUERY,PARAGRAPH):

    # ========== 配置区域 ==========
    # API_KEY = "app-5bVjdSwNuPFScqRTECnHLjQh"  # 你的API密钥  app-GcvNB2688vy0XHES3mH3hUCA
    API_KEY = "app-GcvNB2688vy0XHES3mH3hUCA"  # 你的API密钥
    BASE_URL = "http://127.0.0.1:80"  # Dify服务地址，根据你自己的地址和端口进行调整
    FILE_PATH = ""  # 文件路径
    # QUERY = "生成分解后的任务json列表"
    # PARAGRAPH = "我们小组有6个人，要求是对马原第三章进行扩展ppt汇报"

    # 是否使用文件
    USE_FILE = False  # True: 上传文件, False: 不使用文件
    TIMEOUT = 300  # 超时时间（秒）
    # ==============================

    # 创建客户端
    client = DifyAPIClient(API_KEY, BASE_URL)

    # 上传文件（如果需要）
    file_id = None
    if USE_FILE and FILE_PATH:
        if not os.path.exists(FILE_PATH):
            print(f"❌ 文件不存在: {FILE_PATH}")
            return

        print(f"📤 上传文件: {FILE_PATH}")
        file_id = client.upload_file(FILE_PATH)
        if file_id is None:
            return

    # 执行工作流
    print(f"🚀 执行工作流...")
    result = client.send_chat_message(
        query=QUERY,
        paragraph_text=PARAGRAPH,
        timeout=TIMEOUT
    )

    # 输出结果
    if result:
        return remove_think_tags(result)

    else:
        print("❌ 执行失败")
        return None

def call_for_greeting_summarize_1(QUERY):
    API_KEY = "app-dc7YUc0FdrDXlOlcqV8fuEww"  # 你的API密钥
    BASE_URL = "http://127.0.0.1:80"  # Dify服务地址，根据你自己的地址和端口进行调整
    FILE_PATH = ""  # 文件路径
    # QUERY = "总结"

    # 是否使用文件
    USE_FILE = False  # True: 上传文件, False: 不使用文件
    TIMEOUT = 300  # 超时时间（秒）
    # ==============================

    # 创建客户端
    client = DifyAPIClient(API_KEY, BASE_URL)

    # 上传文件（如果需要）
    file_id = None
    if USE_FILE and FILE_PATH:
        if not os.path.exists(FILE_PATH):
            print(f"❌ 文件不存在: {FILE_PATH}")
            return

        print(f"📤 上传文件: {FILE_PATH}")
        file_id = client.upload_file(FILE_PATH)
        if file_id is None:
            return

    # 执行工作流
    print(f"🚀 执行工作流...")
    result = client.send_chat_message(
        query=QUERY,
        timeout=TIMEOUT
    )

    # 输出结果
    if result:
        return result
    else:
        print("❌ 执行失败")
        return None

def call_for_chat(QUERY):

    # ========== 配置区域 ==========
    API_KEY = "app-7Sqz3aoSXwjp8AOCysUC3CQm"  # 你的API密钥
    BASE_URL = "http://127.0.0.1:80"  # Dify服务地址，根据你自己的地址和端口进行调整
    FILE_PATH = ""  # 文件路径
    # QUERY = "生成分解后的任务json列表"
    # PARAGRAPH = "我们小组有6个人，要求是对马原第三章进行扩展ppt汇报"

    # 是否使用文件
    USE_FILE = False  # True: 上传文件, False: 不使用文件
    TIMEOUT = 300  # 超时时间（秒）
    # ==============================

    # 创建客户端
    client = DifyAPIClient(API_KEY, BASE_URL)

    # 上传文件（如果需要）
    file_id = None
    if USE_FILE and FILE_PATH:
        if not os.path.exists(FILE_PATH):
            print(f"❌ 文件不存在: {FILE_PATH}")
            return

        print(f"📤 上传文件: {FILE_PATH}")
        file_id = client.upload_file(FILE_PATH)
        if file_id is None:
            return

    # 执行工作流
    print(f"🚀 执行工作流...")
    result = client.send_chat_message(
        query=QUERY,
        timeout=TIMEOUT
    )

    # 输出结果
    if result:
        return result

    else:
        print("❌ 执行失败")
        return None


def call_dify_agent_app(
        query: str,
        api_key: str = "app-XDuAnzjCE6RVfBu0Oa7L20tL",
        base_url: str = "http://127.0.0.1:80",
        user_id: str = "user-123",
        inputs: Optional[Dict[str, Any]] = None,
        file_id: Optional[str] = None,
        file_type: Optional[str] = None,
        conversation_id: Optional[str] = None,
        timeout: int = 300
) -> Optional[str]:
    """
    调用 Dify Agent Chat App（仅支持 streaming 模式）

    注意：
    - 必须使用已「发布」的 Agent 应用的 API Key
    - base_url 必须是 Dify 服务的实际地址（如 http://localhost:3000）
    - Agent 不支持 blocking 模式，只能用 streaming 并拼接 answer
    """
    # 🔒 安全处理：去除 API Key 前后空格
    clean_api_key = api_key.strip()
    if not clean_api_key.startswith("app-"):
        raise ValueError("API Key 必须以 'app-' 开头，请检查是否从 Dify 应用 API 页面复制")

    headers = {
        "Authorization": f"Bearer {clean_api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "inputs": inputs or {},
        "query": query,
        "response_mode": "streaming",  # ⚠️ Agent 只支持 streaming
        "user": user_id,
    }

    if conversation_id:
        payload["conversation_id"] = conversation_id

    if file_id and file_type:
        payload["files"] = [{
            "type": file_type,
            "transfer_method": "local_file",
            "upload_file_id": file_id
        }]

    try:
        response = requests.post(
            f"{base_url}/v1/chat-messages",
            headers=headers,
            json=payload,
            stream=True,
            timeout=timeout
        )

        if response.status_code != 200:
            print(f"❌ Dify 请求失败 [{response.status_code}]: {response.text}")
            return None

        full_answer = ""
        for line in response.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                if decoded.startswith("data:"):
                    json_str = decoded[5:].strip()  # 去掉 "data:"
                    if json_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(json_str)
                        if isinstance(chunk, dict) and "answer" in chunk:
                            full_answer += chunk["answer"]
                    except json.JSONDecodeError:
                        continue  # 忽略非 JSON 行

        return full_answer or None

    except requests.exceptions.Timeout:
        print(f"❌ 请求超时（>{timeout}秒），Agent 可能正在执行耗时工具")
        return None
    except Exception as e:
        print(f"❌ 调用异常: {e}")
        return None

if __name__ == "__main__":
    # ttxt = "各位同事都到齐了。好，那今天的会马上开始。今天会议的主题是有关长风公司的秋季订单。我们公司目前面临着生产能力不足的风险。现在的问题是，这笔订单一定要在10月5号前完工，大家说说看有没有什么办法能解决订单延后风险这一问题。各位同事都到齐了。好，那今天的会马上开始。今天会议的主题是有关长丰公司的秋季订单。我们公司目前面临着生产能力不足的风险。现在的问题是，这笔订单一定要在10月5号前完工，大家说说看有没有什么办法能解决订单延后风险这一问题。各位同事都到齐了。好，那今天的会马上开始。😊今天会议的主题是有关长风公司的秋季订单。我们公司目前面临着生产能力不足的风险。现在的问题是，这笔订单一定要在10月5号前完工，大家说说看有没有什么办法能解决订单延号风险这一问题。I.各位同事都到齐了啊。好，那今天的会马上开始。今天会议的主题是有关长丰公司的秋季订单。我们公司目前面临着生产能力不足的风险，现在的问题是，这笔订单一定要在10月5号前完工。大家说说看有什么办法能解决订单延后风险这一问题。"
    # print(call_for_greeting_summarize_1(ttxt))
    # call_for_greeting_translate("总结","./test_file/video.mp3")
    # print(call_for_task_generate("生成分解后的任务json列表", "我们小组有6个人，要求是对马原第三章进行扩展ppt汇报"))
    # print(call_for_chat("你好"))
    print(call_dify_agent_app(
        query = "hello",
        user_id = "1",
))

    #app-yCDYXJ7bZw57zVFGiHMfky9G
