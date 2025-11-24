import mysql.connector
import json
import requests
from typing import Dict, List, Any

class TaskDecompositionModule:
    
    def __init__(self):
        # 数据库连接配置
        self.db_config = {
            'host': 'localhost',      # 数据库主机地址
            'user': 'root',           # 数据库用户名
            'password': '123456',     # 数据库密码
            'database': 'task_database'  # 任务数据库名称
        }
    
    def get_db_connection(self):
        """
        获取数据库连接对象
        """
        return mysql.connector.connect(**self.db_config)
    
    def generate_tasks(self, user_id: int, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        生成任务函数 - 调用外部API生成任务分解结果
        """
        try:
            # 调API
            #api_url = "YOUR_API_ENDPOINT_HERE"
            
            # 发送POST请求到任务生成API
            #response = requests.post(api_url, json=input_data)
            
            # 检查API响应状态
            if response.status_code == 200:
                # 解析API返回的JSON数据，获取任务列表
                task_list = response.json()
                
                # 将生成的任务保存到数据库
                self._save_generated_tasks(user_id, task_list)
                
                # 返回成功响应
                return {
                    "status": "success", 
                    "tasks": task_list,       # 生成的任务列表
                    "message": "任务生成成功" 
                }
            else:
                # API调用失败，返回错误信息
                return {
                    "status": "error",  
                    "message": f"API调用失败: {response.status_code}"
                }
            
        except Exception as e:
            # 捕获所有异常，返回错误信息
            return {
                "status": "error", 
                "message": f"任务生成失败: {str(e)}"  # 包含具体异常信息的错误消息
            }
    
    def _save_generated_tasks(self, user_id: int, tasks: List[Dict[str, Any]]):
        """
        保存生成的任务到数据库的私有方法
        """
        # 获取数据库连接
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        try:
            # 根据用户ID构建表名，确保每个用户有自己的任务表
            table_name = f"generated_tasks_{user_id}"
            
            # 创建任务存储表（如果不存在）
            create_table_sql = f"""
            CREATE TABLE IF NOT EXISTS {table_name} (
                id INT AUTO_INCREMENT PRIMARY KEY,        -- 主键ID，自增
                task_data JSON NOT NULL,                  -- 任务数据，JSON格式存储
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 创建时间，自动记录
            )
            """
            cursor.execute(create_table_sql)
            
            # 将整个任务列表作为JSON字符串插入数据库
            insert_sql = f"INSERT INTO {table_name} (task_data) VALUES (%s)"
            cursor.execute(insert_sql, (json.dumps(tasks),))

            conn.commit()
            
        finally:
            cursor.close()
            conn.close()
    
    def intelligent_task_matching(self, user_id: int, tasks_json: List[Dict], members_json: List[Dict]) -> Dict[str, Any]:
        """
        智能任务匹配算法函数
        """
        try:
            # 尝试从数据库获取团队成员数据
            members = self._get_team_members(user_id)
            
            # 如果数据库中没有团队成员数据，使用传入的成员数据
            if not members:
                members = members_json
            
            # 执行任务匹配算法，将任务分配给最合适的成员
            assignment_result = self._match_tasks_to_members(tasks_json, members)
            
            # 保存任务分配结果到数据库
            self._save_assignment_result(user_id, assignment_result)
            
            # 返回成功响应
            return {
                "status": "success", 
                "assignment": assignment_result,  
                "message": "任务匹配完成"  
            }
            
        except Exception as e:
            # 捕获所有异常，返回错误信息
            return {
                "status": "error",  
                "message": f"任务匹配失败: {str(e)}" 
            }
    
    def _get_team_members(self, user_id: int) -> List[Dict[str, Any]]:
        """
        从数据库获取团队成员数据的私有方法
        """
        # 连接到成员数据库（与任务数据库分开）
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='123456',
            database='member_database'  # 成员数据库
        )
        cursor = conn.cursor(dictionary=True)  # 使用字典游标，返回字典形式的结果
        
        try:
            # 根据用户ID构建成员表名
            table_name = f"member_{user_id}"
            
            # 查询该用户的所有团队成员
            cursor.execute(f"SELECT * FROM {table_name}")
            members = cursor.fetchall()  # 获取所有记录
            
            # 解析JSON格式的技术栈字段
            for member in members:
                if member.get('tech_stack'):
                    # 将JSON字符串转换为Python列表
                    member['tech_stack'] = json.loads(member['tech_stack'])
            
            return members  # 返回处理后的成员列表
            
        except Exception as e:
            # 如果获取失败，打印错误信息并返回空列表
            print(f"获取团队成员失败: {e}")
            return []
        
        finally:
            cursor.close()
            conn.close()
    
    def _match_tasks_to_members(self, tasks: List[Dict], members: List[Dict]) -> List[Dict[str, Any]]:
        """
        将任务列表分配给最合适的成员
        """
        assignment_result = []  # 初始化分配结果列表
        
        # 遍历每个任务，为每个任务找到最合适的成员
        for task in tasks:
            # 为当前任务找到最佳匹配成员
            best_match = self._find_best_member_for_task(task, members)
            
            # 构建分配结果对象
            assignment = {
                "task_id": task.get("task_id", task.get("id")),  # 任务ID，支持两种字段名
                "task_name": task.get("task_name", "未命名任务"),  # 任务名称，默认值
                "assigned_member_id": best_match["member_id"],      # 分配的成员ID
                "assigned_member_name": best_match["member_name"],  # 分配的成员姓名
                "match_score": best_match["match_score"],           # 匹配分数
                "reason": best_match["reason"]                      # 匹配原因说明
            }
            
            # 将分配结果添加到列表中
            assignment_result.append(assignment)
            
            # 更新被分配任务的成员的负载值
            self._update_member_workload(members, best_match["member_id"])
        
        return assignment_result  # 返回完整的分配结果
    
    def _find_best_member_for_task(self, task: Dict, members: List[Dict]) -> Dict[str, Any]:
        """
        为单个任务找到最合适的成员
        """
        best_match = None    # 初始化最佳匹配对象
        best_score = -1      # 初始化最佳分数
        
        # 获取任务要求的技术栈
        required_tech_stack = task.get("required_tech_stack", [])
        
        # 遍历所有成员，计算每个成员与当前任务的匹配度
        for member in members:
            # 计算技术栈匹配分数（权重60%）
            tech_match_score = self._calculate_tech_stack_match(
                required_tech_stack, 
                member.get("tech_stack", [])
            )
            
            # 计算属性综合分数（权重30%）
            attribute_score = self._calculate_attribute_score(member)
            
            # 计算负载惩罚分数（权重10%）
            workload_penalty = self._calculate_workload_penalty(member)
            
            # 计算综合评分：技术栈匹配(60%) + 属性评分(30%) + 负载惩罚(10%)
            total_score = (
                tech_match_score * 0.6 + 
                attribute_score * 0.3 + 
                workload_penalty * 0.1
            )
            
            # 如果当前成员的分数高于已知最佳分数，更新最佳匹配
            if total_score > best_score:
                best_score = total_score
                best_match = {
                    "member_id": member["id"],           # 成员ID
                    "member_name": member["name"],       # 成员姓名
                    "match_score": round(total_score, 2),  # 匹配分数
                    "reason": self._generate_match_reason(tech_match_score, attribute_score, workload_penalty)
                }
        
        # 返回最佳匹配成员信息
        return best_match
    
    def _calculate_tech_stack_match(self, required_tech: List[str], member_tech: List[str]) -> float:
        """
        计算技术栈匹配度
        """
        # 如果任务没有技术要求，则认为完全匹配
        if not required_tech:
            return 1.0
        
        # 计算交集，成员掌握且任务要求的技术
        matched_tech = set(required_tech) & set(member_tech)
        
        # 计算匹配比例
        match_ratio = len(matched_tech) / len(required_tech)
        
        # 确保匹配度不超过1.0
        return min(match_ratio, 1.0)
    
    def _calculate_attribute_score(self, member: Dict) -> float:
        """
        计算成员属性综合分
        权重：质量(50%) + 协作(30%) + 完成度(20%)
        """
        # 获取成员各项属性分数，如果不存在则设为0
        quality = member.get("quality_score", 0) or 0          # 质量分数
        collaboration = member.get("collaboration_score", 0) or 0  # 协作分数
        completion = member.get("completion_score", 0) or 0    # 完成度分数
        
        # 按照权重计算加权分数，并归一化到0-1范围
        # 原始分数范围0-10，加权后除以10得到0-1的范围
        weighted_score = (quality * 0.5 + collaboration * 0.3 + completion * 0.2) / 10
        
        return weighted_score
    
    def _calculate_workload_penalty(self, member: Dict) -> float:
        """
        计算负载惩罚系数
        """
        # 获取成员当前负载值，如果不存在则设为0
        workload = member.get("workload_score", 0) or 0
        
        # 负载值0-10转换为0-1的系数：负载越高，惩罚越大，分数越低
        return 1.0 - (workload / 10)
    
    def _generate_match_reason(self, tech_score: float, attr_score: float, workload_score: float) -> str:
        """
        根据各项分数生成匹配原因描述
        """
        reasons = []  # 初始化原因列表
        
        # 根据技术栈匹配分数添加描述
        if tech_score >= 0.8:
            reasons.append("技术栈高度匹配")
        elif tech_score >= 0.5:
            reasons.append("技术栈部分匹配")
        else:
            reasons.append("技术栈匹配度较低")
        
        # 根据属性综合分数添加描述
        if attr_score >= 0.8:
            reasons.append("综合能力优秀")
        elif attr_score >= 0.6:
            reasons.append("综合能力良好")
        
        # 根据负载情况添加描述
        if workload_score >= 0.8:
            reasons.append("当前负载较低")
        
        # 将原因列表用分号连接成字符串，如果没有原因则返回默认描述
        return "；".join(reasons) if reasons else "基于综合评估匹配"
    
    def _update_member_workload(self, members: List[Dict], member_id: int):
        """
        更新成员负载值
        每次分配任务，成员负载增加1，最高不超过10
        """
        # 遍历成员列表，找到对应的成员
        for member in members:
            if member["id"] == member_id:
                # 获取当前负载值
                current_workload = member.get("workload_score", 0) or 0
                # 负载值增加1，但不超过最大值10
                member["workload_score"] = min(current_workload + 1, 10)
                break  # 找到后退出循环
    
    def _save_assignment_result(self, user_id: int, assignment_result: List[Dict]):
        """
        保存任务分配结果到数据库的私有方法
        """
        # 获取数据库连接
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        try:
            # 根据用户ID构建分配结果表名
            table_name = f"task_assignment_{user_id}"
            
            # 创建任务分配结果表（如果不存在）
            create_table_sql = f"""
            CREATE TABLE IF NOT EXISTS {table_name} (
                id INT AUTO_INCREMENT PRIMARY KEY,              -- 主键ID，自增
                task_id INT NOT NULL,                           -- 任务ID
                task_name VARCHAR(255) NOT NULL,                -- 任务名称
                assigned_member_id INT NOT NULL,                -- 分配的成员ID
                assigned_member_name VARCHAR(255) NOT NULL,     -- 分配的成员姓名
                match_score DECIMAL(5,2),                       -- 匹配分数，最多5位，2位小数
                assignment_reason TEXT,                         -- 分配原因说明
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 分配时间，自动记录
            )
            """
            cursor.execute(create_table_sql)
            
            # 遍历分配结果，逐个插入数据库
            for assignment in assignment_result:
                insert_sql = f"""
                INSERT INTO {table_name} 
                (task_id, task_name, assigned_member_id, assigned_member_name, match_score, assignment_reason)
                VALUES (%s, %s, %s, %s, %s, %s)
                """
                # 执行插入操作
                cursor.execute(insert_sql, (
                    assignment["task_id"],              # 任务ID
                    assignment["task_name"],            # 任务名称
                    assignment["assigned_member_id"],   # 分配的成员ID
                    assignment["assigned_member_name"], # 分配的成员姓名
                    assignment["match_score"],          # 匹配分数
                    assignment["reason"]                # 分配原因
                ))
            
            conn.commit()
            
        finally:
            cursor.close()
            conn.close()
