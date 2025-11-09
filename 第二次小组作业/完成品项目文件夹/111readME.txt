1.(丐版)直接运行back_end和my_mcp，my_mcp中即可与ai对话并令ai调用工具，
back_end返回的网页即生成的待办事项清单
不过my_mcp需要有本地ollama并且配置运行qwen3：0.6b

2.（dify+deepseek版）直接运行back_end和temp_server，自行本地部署dify，在dify中，工具->自定义->创建自定义工具，名称随便，大概是本地待办事项管理，schema:
{
  "openapi": "3.0.2",
  "info": {
    "title": "Todo Management API",
    "description": "基于 FastAPI 的待办事项管理接口",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "http://host.docker.internal:12345"
    }
  ],
  "paths": {
    "/todo/list": {
      "get": {
        "summary": "获取待办清单",
        "operationId": "generate_todo_list",
        "responses": {
          "200": {
            "description": "待办清单返回成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": { "type": "integer" },
                      "time": { "type": "string" },
                      "place": { "type": "string" },
                      "staff": { "type": "string" },
                      "something": { "type": "string" },
                      "urgency": { "type": "integer" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/todo/add": {
      "post": {
        "summary": "添加新的待办任务",
        "operationId": "add_todo_task",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "time_input": { "type": "string" },
                  "place": { "type": "string" },
                  "staff": { "type": "string" },
                  "something": { "type": "string" },
                  "urgency": { "type": "string", "default": "1" }
                },
                "required": ["time_input", "place", "staff", "something"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "待办事项添加成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": { "type": "string" },
                    "message": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/todo/delete/{record_id}": {
      "delete": {
        "summary": "根据 ID 删除待办事项",
        "operationId": "delete_todo_by_id",
        "parameters": [
          {
            "name": "record_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "待办事项删除成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": { "type": "string" },
                    "message": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/todo/{record_id}": {
      "get": {
        "summary": "根据 ID 查询待办事项",
        "operationId": "get_todo_by_id",
        "parameters": [
          {
            "name": "record_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "待办事项查询成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "id": { "type": "integer" },
                    "time": { "type": "string" },
                    "place": { "type": "string" },
                    "staff": { "type": "string" },
                    "something": { "type": "string" },
                    "urgency": { "type": "integer" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/todo/urgency": {
      "put": {
        "summary": "更新待办事项的紧急程度",
        "operationId": "update_todo_urgency",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "task_id": { "type": "string" },
                  "new_urgency": { "type": "string" }
                },
                "required": ["task_id", "new_urgency"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "待办事项紧急程度更新成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": { "type": "string" },
                    "message": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/weather/{city}": {
      "get": {
        "summary": "获取城市天气",
        "operationId": "get_weather",
        "parameters": [
          {
            "name": "city",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "城市天气查询成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": { "type": "string" },
                    "data": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
emmm然后可以对get_weather这个测试函数测试下，随便填城市，能返回结果就行，不行的话.....保存，自定义工具就创建好啦
然后去工作室，创建空白应用，类型是agent，名称，描述无所谓，创建后左侧工具一栏，添加我们的自定义工具（getWeather测试函数可有可无），然后右边自己去设置那里配大模型的api，我用的deepseek的chat模型，10块钱的感觉用不完，最后右上角发布，返回主页左侧就是完成品