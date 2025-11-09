from flask import Flask, request, jsonify
import json
import os

app = Flask(__name__)
DATA_FILE = "todo_data.json"

# 全局变量声明
todo_data = []

def save_to_json(data):
    """将数据保存到JSON文件"""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return "数据保存成功"

def load_from_json():
    """从JSON文件加载数据"""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

# 初始化数据
def init_data():
    global todo_data
    initial_data = [
        {"num": 1, "time": "2024-01-15", "place": "办公室", "staff": "张三", "something": "完成报告", "urgency": 1},
    ]
    todo_data = initial_data
    save_to_json(todo_data)

# 调用初始化函数
init_data()

@app.route('/')
def index():
    """首页"""
    return """
    <html>
        <head><title>待办事项API</title></head>
        <body>
            <h1>待办事项API服务</h1>
            <p>使用POST请求访问 <code>/api/chat</code> 与系统交互</p>
            <p>示例命令:</p>
            <ul>
                <li>"保存" - 保存数据到JSON文件</li>
                <li>"加载" - 从JSON文件加载数据</li>
                <li>"清单" - 查看所有待办事项</li>
            </ul>
        </body>
    </html>
    """

@app.route('/index/chat', methods=['GET', 'POST'])
def chat():
    """聊天接口 - 支持GET和POST请求"""
    global todo_data
    
    # 处理GET请求
    if request.method == 'GET':
        return jsonify({
            "response": "请使用POST方法发送消息",
            "示例": {
                "message": "清单"
            },
            "当前数据": todo_data
        })
    
    # 处理POST请求
    data = request.get_json()
    
    # 如果没有JSON数据，尝试从表单获取
    if not data:
        data = request.form
    
    message = data.get('message', '').lower()
    
    if '保存' in message:
        save_to_json(todo_data)
        return jsonify({"response": "数据已保存", "data": todo_data})
    
    elif '加载' in message:
        todo_data = load_from_json()
        return jsonify({"response": f"已加载 {len(todo_data)} 条数据", "data": todo_data})
    
    elif '清单' in message or '列表' in message:
        return jsonify({"response": "待办清单", "data": todo_data})
    
    else:
        return jsonify({"response": f"收到: {message}", "data": todo_data})

# 添加其他API端点用于直接操作
@app.route('/index/save', methods=['GET'])
def api_save():
    """直接保存数据的API"""
    global todo_data
    save_to_json(todo_data)
    return jsonify({"response": "数据已保存", "data": todo_data})

@app.route('/index/load', methods=['GET'])
def api_load():
    """直接加载数据的API"""
    global todo_data
    todo_data = load_from_json()
    return jsonify({"response": f"已加载 {len(todo_data)} 条数据", "data": todo_data})

@app.route('/index/list', methods=['GET'])
def api_list():
    """直接获取清单的API"""
    global todo_data
    return jsonify({"response": "待办清单", "data": todo_data})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
