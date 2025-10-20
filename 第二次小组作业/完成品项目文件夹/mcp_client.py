"""
1.创建客户端实例
2.获取工具，资源，prompt
3.执行工具
"""
import asyncio
from fastmcp import Client

async def run():
    client = Client('mcp_server.py')
    async with client:
        tools = await client.list_tools()
        tool = tools[0]
        tool_result = await client.call_tool(tool.name,{"city":"fuzhou"})
        print(tool_result)


if __name__ == '__main__':
    asyncio.run(run())