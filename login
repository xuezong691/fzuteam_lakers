import flask
from flask import Flask, request, render_template_string, redirect, url_for, session
import re
import pymysql  # 需先安装：pip install pymysql

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # 用于session加密

# 数据库连接配置
DB_CONFIG = {
    'host': 'localhost',  # 数据库主机地址
    'user': 'root',  # 数据库账号
    'password': '123456',  # 数据库密码
    'db': 'lakers',  # 数据库名称
    'cursorclass': pymysql.cursors.DictCursor
}


# 验证账号密码格式（8-15位数字或英文字符）
def validate_format(input_str):
    return bool(re.fullmatch(r'^[a-zA-Z0-9]{8,15}$', input_str))


# 首页路由
@app.route('/')
def index():
    if 'userid' in session:
        return render_template_string('''
            <h1>欢迎回来，{{ session.team_name }} 团队的用户 {{ session.userid }}</h1>
            <a href="/logout">退出登录</a>
        ''')
    return redirect(url_for('login'))


# 注册页面路由
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        team_name = request.form.get('team_name', '').strip()

        # 格式验证
        if not validate_format(username):
            return "账号必须是8-15位数字或英文字符", 400
        if not validate_format(password):
            return "密码必须是8-15位数字或英文字符", 400
        if not team_name:
            return "团队名称不能为空", 400

        # 检查用户是否已存在
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            if cursor.fetchone():
                conn.close()
                return "该账号已被注册", 400

            # 插入新用户
            cursor.execute("""
                INSERT INTO users (username, password, team_name, userid)
                VALUES (%s, %s, %s, %s)
            """, (username, password, team_name, username))
        conn.commit()
        conn.close()

        return redirect(url_for('login'))

    # 显示注册表单
    return render_template_string('''
        <h1>注册</h1>
        <form method="post">
            <div>
                <label>账号（8-15位数字或英文字符）：</label>
                <input type="text" name="username" required minlength="8" maxlength="15">
            </div>
            <div>
                <label>密码（8-15位数字或英文字符）：</label>
                <input type="password" name="password" required minlength="8" maxlength="15">
            </div>
            <div>
                <label>团队名称：</label>
                <input type="text" name="team_name" required>
            </div>
            <button type="submit">注册</button>
        </form>
        <p>已有账号？<a href="/login">登录</a></p>
    ''')


# 登录页面路由
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        # 格式验证
        if not validate_format(username) or not validate_format(password):
            return "账号或密码格式不正确", 400

        # 验证用户
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            cursor.execute("SELECT password, team_name, userid FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
        conn.close()

        if not user or user['password'] != password:
            return "账号或密码错误", 401

        # 保存session
        session['userid'] = user['userid']
        session['team_name'] = user['team_name']

        return redirect(url_for('index'))

    # 显示登录表单
    return render_template_string('''
        <h1>登录</h1>
        <form method="post">
            <div>
                <label>账号：</label>
                <input type="text" name="username" required minlength="8" maxlength="15">
            </div>
            <div>
                <label>密码：</label>
                <input type="password" name="password" required minlength="8" maxlength="15">
            </div>
            <button type="submit">登录</button>
        </form>
        <p>没有账号？<a href="/register">注册</a></p>
    ''')


# 退出登录路由
@app.route('/logout')
def logout():
    session.pop('userid', None)
    session.pop('team_name', None)
    return redirect(url_for('login'))


# 初始化数据库表（首次运行时需执行）
def init_db():
    conn = pymysql.connect(**DB_CONFIG)
    with conn.cursor() as cursor:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(15) NOT NULL UNIQUE,
                password VARCHAR(15) NOT NULL,
                team_name VARCHAR(50) NOT NULL,
                userid VARCHAR(15) NOT NULL
            )
        ''')
    conn.commit()
    conn.close()


if __name__ == '__main__':
    init_db()  # 首次运行初始化表后，后续可注释掉
    app.run(debug=True, host='0.0.0.0', port=8080)  # 关键：host设为0.0.0.0
