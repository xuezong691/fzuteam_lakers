"""
调用大语言模型
调用mcp_client
"""
import asyncio
import json
from fastmcp import Client
from lazy_object_proxy.utils import await_
from openai import OpenAI
from typing import List,Dict

class userclient:
    def __init__(self, script = "mcp_server.py",model="qwen3:0.6b"):#  qwen2.5:0.5b  qwen3:4b  qwen3:0.6b
        self.model = model
        self.mcp_client = Client(script)
        self.openai_client = OpenAI(
            base_url="http://127.0.0.1:11434/v1",############
            api_key="None"
        )
        self.messages = [
            {
                "role":"system",
                "content":"你需要调用工具"
            }
        ]
        self.tools = []


    async def prepare_tools(self):
        tools = await self.mcp_client.list_tools() ##需将其转换为openai规定的特殊格式
        tools = [
            {
                "type":"function",
                "function":{
                    "name":tool.name,
                    "description":tool.description,
                    "input_schema":tool.inputSchema,
                }
            }
            for tool in tools
        ]
        return tools


    async def chat(self,message:List[Dict]):

        if not self.tools:
            self.tools = await self.prepare_tools()

        response = self.openai_client.chat.completions.create(
            model=self.model,
            messages=message,
            tools=self.tools,
        )
        print(response)

      #若非调用工具则直接返回聊天内容
        if response.choices[0].finish_reason != "tool_calls":
            return response.choices[0].message.content
            # return response

        #是调用工具则执行工具
        for tool_call in response.choices[0].message.tool_calls:

            response = await self.mcp_client.call_tool(
                tool_call.function.name,
                json.loads(tool_call.function.arguments)
            )
            return response.content[0].text
            # return response


    async def loop(self):
        async with self.mcp_client:
            while True:
                self.messages.pop()
                question = input("user: ")
                message = {
                    "role":"user",
                    "content": question
                }
                self.messages.append(message)
                response_message = await self.chat(self.messages)
                print("ai: ", response_message)
                print()


async def main():
    user_client = userclient()
    await user_client.loop()

if __name__ == '__main__':
    asyncio.run(main())
