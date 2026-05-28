# Travel Concierge

这是 Mastra 中文教程配套示例项目，展示一个旅行助手如何组合：

- Agent：中文旅行规划助手
- Tool：查询示例天气、估算预算
- Workflow：生成并校验行程
- Memory：记住用户旅行偏好
- MCPServer：把旅行能力暴露给外部 MCP 客户端
- Structured output：返回可被程序读取的行程对象
- RequestContext：传递用户、语言和套餐上下文
- Supervisor agent：协调规划和审查两个子 agent

## 运行

```bash
npm install
cp .env.example .env
npm run dev
```

命令行测试 Agent：

```bash
npm run ask -- "我周末想从上海去杭州，两天一夜，预算 1800 元，喜欢安静一点的路线"
```

命令行测试 Workflow：

```bash
npm run workflow
```

结构化输出：

```bash
npm run structured -- "给我一个上海到杭州两天一夜的轻松行程，预算 1800 元"
```

流式输出：

```bash
npm run stream -- "流式生成一个上海到苏州两天一夜旅行建议，预算 2000 元"
```

RequestContext：

```bash
npm run context -- "我想从上海去南京玩 6 天，预算 3500 元，帮我判断是否合理"
```

Supervisor agent：

```bash
npm run supervisor -- "我想带父母从上海去苏州两天一夜，预算 2500 元，想轻松一点"
```
