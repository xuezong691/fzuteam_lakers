"""
团队管理模块 
"""

from flask import Blueprint, request, jsonify
from flask_restful import Api, Resource
import mysql.connector
import json
from datetime import datetime, timedelta
import logging

# 创建蓝图实例
team_bp = Blueprint('team', __name__)
api = Api(team_bp)

# 配置日志系统
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 技术栈选项
TECH_STACK_OPTIONS = [
    "PPT制作", "演讲者", "写手",
    "项目经理", "需求分析", "数据分析",
    "UI设计", "平面设计", "视频剪辑", "3D建模", "摄影",
    "架构", "前端", "后端", "dba", "运维"
]

class DatabaseManager:
    """数据库管理类 - 严格按照需求文档配置"""
    
    @staticmethod
    def create_database_if_not_exists():
        """创建数据库（如果不存在）"""
        try:
            # 先连接MySQL服务器（不指定数据库）
            conn = mysql.connector.connect(
                host='localhost',
                user='root',
                password='123456'
            )
            cursor = conn.cursor()
            
            # 创建数据库
            cursor.execute("CREATE DATABASE IF NOT EXISTS member_database")
            conn.commit()
            
            cursor.close()
            conn.close()
            
            logger.info("数据库 member_database 创建/验证成功")
            return True
        except Exception as e:
            logger.error(f"创建数据库失败: {e}")
            return False
    
    @staticmethod
    def get_connection():
        """
        获取MySQL数据库连接 - 严格按需求文档配置
        """
        try:
            # 先确保数据库存在
            if not DatabaseManager.create_database_if_not_exists():
                return None
                
            conn = mysql.connector.connect(
                host='localhost',
                user='root',
                password='123456',
                database='member_database'
            )
            return conn
        except Exception as e:
            logger.error(f"数据库连接失败: {e}")
            return None
    
    @staticmethod
    def get_member_table_name(userid):
        """根据用户ID生成成员表名 - 格式: member_userid"""
        return f"member_{userid}"
    
    @staticmethod
    def create_member_table_if_not_exists(userid):
        """
        创建成员数据表 - 严格按需求文档表结构
        """
        conn = DatabaseManager.get_connection()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            table_name = DatabaseManager.get_member_table_name(userid)
            
            # 严格按照需求文档的表结构
            create_table_query = f"""
            CREATE TABLE IF NOT EXISTS {table_name} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                tech_stack JSON,
                quality_score DECIMAL(5,2) DEFAULT 0.00,
                workload_score DECIMAL(5,2) DEFAULT 0.00,
                collaboration_score DECIMAL(5,2) DEFAULT 0.00,
                completion_score DECIMAL(5,2) DEFAULT 0.00
            )
            """
            cursor.execute(create_table_query)
            conn.commit()
            logger.info(f"成员表 {table_name} 创建/验证成功")
            return True
        except Exception as e:
            logger.error(f"创建成员表失败: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

class EvaluationManager:
    """评价管理类"""
    
    @staticmethod
    def can_evaluate(userid, member_name, evaluation_type):
        """
        检查是否可以对成员进行评价（5分钟冷却）
        由于需求文档表结构没有时间字段，这里简化处理
        """
        # 在实际项目中，这里应该添加冷却时间逻辑
        # 但由于表结构限制，暂时返回True
        return True
    
    @staticmethod
    def update_evaluation_time(userid, member_name):
        """
        更新成员的最后评价时间
        由于需求文档表结构没有时间字段，这里空实现
        """
        pass

class AddMember(Resource):
    """添加成员"""
    
    def post(self):
        """
        POST /api/member/add
        请求体:
        {
            "userid": "用户ID",
            "name": "成员姓名",
            "tech_stack": ["前端", "UI设计"]
        }
        """
        data = request.get_json()
        
        # 验证必需字段
        if 'userid' not in data or 'name' not in data:
            return {'error': '缺少必需字段: userid 或 name'}, 400
        
        userid = data['userid']
        name = data['name']
        tech_stack = data.get('tech_stack', [])
        
        # 验证技术栈
        if not isinstance(tech_stack, list):
            return {'error': 'tech_stack必须是数组'}, 400
        
        for tech in tech_stack:
            if tech not in TECH_STACK_OPTIONS:
                return {'error': f'无效的技术栈: {tech}'}, 400
        
        # 创建成员表（如果不存在）
        if not DatabaseManager.create_member_table_if_not_exists(userid):
            return {'error': '数据库操作失败'}, 500
        
        conn = DatabaseManager.get_connection()
        if not conn:
            return {'error': '数据库连接失败'}, 500
        
        try:
            cursor = conn.cursor()
            table_name = DatabaseManager.get_member_table_name(userid)
            
            # 检查成员是否已存在
            check_query = f"SELECT name FROM {table_name} WHERE name = %s"
            cursor.execute(check_query, (name,))
            if cursor.fetchone():
                return {'error': '成员已存在'}, 409
            
            # 插入新成员 - 严格按照表结构字段
            insert_query = f"""
            INSERT INTO {table_name} 
            (name, tech_stack, quality_score, workload_score, collaboration_score, completion_score) 
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (
                name, 
                json.dumps(tech_stack), 
                0.00,  # quality_score 默认值
                0.00,  # workload_score 默认值  
                0.00,  # collaboration_score 默认值
                0.00   # completion_score 默认值
            ))
            conn.commit()
            
            logger.info(f"用户 {userid} 成功添加成员 {name}")
            return {
                'success': True,
                'message': '成员添加成功',
                'member_name': name
            }, 201
            
        except Exception as e:
            logger.error(f"添加成员失败: {e}")
            return {'error': '添加成员失败'}, 500
        finally:
            cursor.close()
            conn.close()

class DeleteMember(Resource):
    """删除成员"""
    
    def post(self):
        """
        POST /api/member/delete
        请求体:
        {
            "userid": "用户ID",
            "member_name": "成员姓名"
        }
        """
        data = request.get_json()
        
        if 'userid' not in data or 'member_name' not in data:
            return {'error': '缺少必需字段: userid 或 member_name'}, 400
        
        userid = data['userid']
        member_name = data['member_name']
        
        conn = DatabaseManager.get_connection()
        if not conn:
            return {'error': '数据库连接失败'}, 500
        
        try:
            cursor = conn.cursor()
            table_name = DatabaseManager.get_member_table_name(userid)
            
            # 检查成员是否存在
            check_query = f"SELECT name FROM {table_name} WHERE name = %s"
            cursor.execute(check_query, (member_name,))
            if not cursor.fetchone():
                return {'error': '成员不存在'}, 404
            
            # 删除成员
            delete_query = f"DELETE FROM {table_name} WHERE name = %s"
            cursor.execute(delete_query, (member_name,))
            conn.commit()
            
            logger.info(f"用户 {userid} 成功删除成员 {member_name}")
            return {
                'success': True,
                'message': '成员删除成功'
            }, 200
            
        except Exception as e:
            logger.error(f"删除成员失败: {e}")
            return {'error': '删除成员失败'}, 500
        finally:
            cursor.close()
            conn.close()

class GetTeamMembers(Resource):
    """获取团队成员列表"""
    
    def post(self):
        """
        POST /api/member/list
        请求体:
        {
            "userid": "用户ID"
        }
        
        返回格式:
        {
            "success": true,
            "members": [
                {
                    "id": 1,
                    "name": "张三",
                    "tech_stack": ["前端", "UI设计"],
                    "quality_score": 8.5,
                    "workload_score": 6.0,
                    "collaboration_score": 7.5,
                    "completion_score": 9.0
                }
            ],
            "total_count": 1
        }
        """
        data = request.get_json()
        
        if 'userid' not in data:
            return {'error': '缺少必需字段: userid'}, 400
        
        userid = data['userid']
        
        # 创建成员表（如果不存在）
        if not DatabaseManager.create_member_table_if_not_exists(userid):
            return {'error': '数据库操作失败'}, 500
        
        conn = DatabaseManager.get_connection()
        if not conn:
            return {'error': '数据库连接失败'}, 500
        
        try:
            cursor = conn.cursor(dictionary=True)
            table_name = DatabaseManager.get_member_table_name(userid)
            
            # 查询所有成员
            query = f"SELECT * FROM {table_name} ORDER BY id ASC"
            cursor.execute(query)
            members = cursor.fetchall()
            
            # 处理数据格式
            formatted_members = []
            for member in members:
                # 处理JSON格式的技术栈
                if member['tech_stack']:
                    tech_stack = json.loads(member['tech_stack'])
                else:
                    tech_stack = []
                
                # 转换Decimal为float以便JSON序列化
                formatted_member = {
                    'id': member['id'],
                    'name': member['name'],
                    'tech_stack': tech_stack,
                    'quality_score': float(member['quality_score']) if member['quality_score'] is not None else 0.0,
                    'workload_score': float(member['workload_score']) if member['workload_score'] is not None else 0.0,
                    'collaboration_score': float(member['collaboration_score']) if member['collaboration_score'] is not None else 0.0,
                    'completion_score': float(member['completion_score']) if member['completion_score'] is not None else 0.0
                }
                formatted_members.append(formatted_member)
            
            logger.info(f"用户 {userid} 获取团队成员列表，共 {len(formatted_members)} 人")
            return {
                'success': True,
                'members': formatted_members,
                'total_count': len(formatted_members)
            }, 200
            
        except Exception as e:
            logger.error(f"获取团队成员失败: {e}")
            return {'error': '获取团队成员失败'}, 500
        finally:
            cursor.close()
            conn.close()

class QualityEvaluation(Resource):
    """质量评价"""
    
    def post(self):
        """
        POST /api/evaluate/quality
        请求体:
        {
            "userid": "用户ID",
            "member_name": "成员姓名", 
            "score": 8.5  # 0-10分
        }
        """
        data = request.get_json()
        
        if 'userid' not in data or 'member_name' not in data or 'score' not in data:
            return {'error': '缺少必需字段: userid, member_name 或 score'}, 400
        
        userid = data['userid']
        member_name = data['member_name']
        
        # 验证分数
        try:
            score = float(data['score'])
            if score < 0 or score > 10:
                return {'error': '分数必须在 0-10 之间'}, 400
        except (ValueError, TypeError):
            return {'error': '分数必须是数字'}, 400
        
        # 检查冷却时间
        if not EvaluationManager.can_evaluate(userid, member_name, 'quality'):
            return {'error': '评价过于频繁，请5分钟后再试'}, 429
        
        conn = DatabaseManager.get_connection()
        if not conn:
            return {'error': '数据库连接失败'}, 500
        
        try:
            cursor = conn.cursor()
            table_name = DatabaseManager.get_member_table_name(userid)
            
            # 更新质量评分 - 使用quality_score字段
            update_query = f"UPDATE {table_name} SET quality_score = %s WHERE name = %s"
            cursor.execute(update_query, (score, member_name))
            
            if cursor.rowcount == 0:
                return {'error': '成员不存在'}, 404
            
            conn.commit()
            
            # 更新评价时间
            EvaluationManager.update_evaluation_time(userid, member_name)
            
            logger.info(f"用户 {userid} 对成员 {member_name} 进行质量评价: {score}分")
            return {
                'success': True,
                'message': '质量评价成功',
                'score': score
            }, 200
            
        except Exception as e:
            logger.error(f"质量评价失败: {e}")
            return {'error': '质量评价失败'}, 500
        finally:
            cursor.close()
            conn.close()

class TimelinessEvaluation(Resource):
    """时效评价"""
    
    def post(self):
        """
        POST /api/evaluate/timeliness
        请求体:
        {
            "userid": "用户ID",
            "member_name": "成员姓名", 
            "is_ontime": true  # true=准时, false=超时
        }
        """
        data = request.get_json()
        
        if 'userid' not in data or 'member_name' not in data or 'is_ontime' not in data:
            return {'error': '缺少必需字段: userid, member_name 或 is_ontime'}, 400
        
        userid = data['userid']
        member_name = data['member_name']
        is_ontime = data['is_ontime']
        
        if not isinstance(is_ontime, bool):
            return {'error': 'is_ontime必须是布尔值'}, 400
        
        if not EvaluationManager.can_evaluate(userid, member_name, 'timeliness'):
            return {'error': '评价过于频繁，请5分钟后再试'}, 429
        
        conn = DatabaseManager.get_connection()
        if not conn:
            return {'error': '数据库连接失败'}, 500
        
        try:
            cursor = conn.cursor()
            table_name = DatabaseManager.get_member_table_name(userid)
            
            # 获取当前完成度评分 - 使用completion_score字段
            query = f"SELECT completion_score FROM {table_name} WHERE name = %s"
            cursor.execute(query, (member_name,))
            result = cursor.fetchone()
            
            if not result:
                return {'error': '成员不存在'}, 404
            
            current_score = result[0]
            
            # 根据准时/超时计算新分数
            if is_ontime:
                new_score = min(current_score + 1, 10)  # 准时加1分，最高10分
                action = "准时"
            else:
                new_score = max(current_score - 2, 0)   # 超时扣2分，最低0分
                action = "超时"
            
            # 更新完成度评分 - 使用completion_score字段
            update_query = f"UPDATE {table_name} SET completion_score = %s WHERE name = %s"
            cursor.execute(update_query, (new_score, member_name))
            conn.commit()
            
            # 更新评价时间
            EvaluationManager.update_evaluation_time(userid, member_name)
            
            logger.info(f"用户 {userid} 对成员 {member_name} 进行时效评价: {action}, 新分数: {new_score}")
            return {
                'success': True,
                'message': f'时效评价成功 - {action}',
                'old_score': float(current_score),
                'new_score': float(new_score)
            }, 200
            
        except Exception as e:
            logger.error(f"时效评价失败: {e}")
            return {'error': '时效评价失败'}, 500
        finally:
            cursor.close()
            conn.close()

class CollaborationEvaluation(Resource):
    """协作评价"""
    
    def post(self):
        """
        POST /api/evaluate/collaboration
        请求体:
        {
            "userid": "用户ID",
            "member_name": "成员姓名", 
            "score": 7.5  # 0-10分
        }
        """
        data = request.get_json()
        
        if 'userid' not in data or 'member_name' not in data or 'score' not in data:
            return {'error': '缺少必需字段: userid, member_name 或 score'}, 400
        
        userid = data['userid']
        member_name = data['member_name']
        
        try:
            score = float(data['score'])
            if score < 0 or score > 10:
                return {'error': '分数必须在 0-10 之间'}, 400
        except (ValueError, TypeError):
            return {'error': '分数必须是数字'}, 400
        
        if not EvaluationManager.can_evaluate(userid, member_name, 'collaboration'):
            return {'error': '评价过于频繁，请5分钟后再试'}, 429
        
        conn = DatabaseManager.get_connection()
        if not conn:
            return {'error': '数据库连接失败'}, 500
        
        try:
            cursor = conn.cursor()
            table_name = DatabaseManager.get_member_table_name(userid)
            
            # 更新协作评分 - 使用collaboration_score字段
            update_query = f"UPDATE {table_name} SET collaboration_score = %s WHERE name = %s"
            cursor.execute(update_query, (score, member_name))
            
            if cursor.rowcount == 0:
                return {'error': '成员不存在'}, 404
            
            conn.commit()
            
            EvaluationManager.update_evaluation_time(userid, member_name)
            
            logger.info(f"用户 {userid} 对成员 {member_name} 进行协作评价: {score}分")
            return {
                'success': True,
                'message': '协作评价成功',
                'score': score
            }, 200
            
        except Exception as e:
            logger.error(f"协作评价失败: {e}")
            return {'error': '协作评价失败'}, 500
        finally:
            cursor.close()
            conn.close()

class WorkloadEvaluation(Resource):
    """负载评价"""
    
    def post(self):
        """
        POST /api/evaluate/workload
        请求体:
        {
            "userid": "用户ID",
            "member_name": "成员姓名", 
            "score": 6.0  # 0-10分
        }
        """
        data = request.get_json()
        
        if 'userid' not in data or 'member_name' not in data or 'score' not in data:
            return {'error': '缺少必需字段: userid, member_name 或 score'}, 400
        
        userid = data['userid']
        member_name = data['member_name']
        
        try:
            score = float(data['score'])
            if score < 0 or score > 10:
                return {'error': '分数必须在 0-10 之间'}, 400
        except (ValueError, TypeError):
            return {'error': '分数必须是数字'}, 400
        
        if not EvaluationManager.can_evaluate(userid, member_name, 'workload'):
            return {'error': '评价过于频繁，请5分钟后再试'}, 429
        
        conn = DatabaseManager.get_connection()
        if not conn:
            return {'error': '数据库连接失败'}, 500
        
        try:
            cursor = conn.cursor()
            table_name = DatabaseManager.get_member_table_name(userid)
            
            # 更新负载评分 - 使用workload_score字段
            update_query = f"UPDATE {table_name} SET workload_score = %s WHERE name = %s"
            cursor.execute(update_query, (score, member_name))
            
            if cursor.rowcount == 0:
                return {'error': '成员不存在'}, 404
            
            conn.commit()
            
            EvaluationManager.update_evaluation_time(userid, member_name)
            
            logger.info(f"用户 {userid} 对成员 {member_name} 进行负载评价: {score}分")
            return {
                'success': True,
                'message': '负载评价成功',
                'score': score
            }, 200
            
        except Exception as e:
            logger.error(f"负载评价失败: {e}")
            return {'error': '负载评价失败'}, 500
        finally:
            cursor.close()
            conn.close()

# 注册API路由
api.add_resource(AddMember, '/api/member/add')
api.add_resource(DeleteMember, '/api/member/delete')
api.add_resource(GetTeamMembers, '/api/member/list')  # 新增获取成员列表API
api.add_resource(QualityEvaluation, '/api/evaluate/quality')
api.add_resource(TimelinessEvaluation, '/api/evaluate/timeliness')
api.add_resource(CollaborationEvaluation, '/api/evaluate/collaboration')
api.add_resource(WorkloadEvaluation, '/api/evaluate/workload')

# 测试代码
if __name__ == '__main__':
    from flask import Flask
    app = Flask(__name__)
    app.register_blueprint(team_bp)
    
    @app.route('/')
    def hello():
        return "团队管理模块运行中 - 自动创建数据库和表"
    
    # 启动时自动创建数据库
    DatabaseManager.create_database_if_not_exists()
    
    app.run(debug=True, port=5000)
