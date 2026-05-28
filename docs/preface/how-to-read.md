# 怎么读

建议按“先跑通，再拆解，再生产化”的顺序阅读。

## 30 分钟路线

适合只想快速判断 Mastra 是否值得投入的人：

1. 读 [Mastra 是什么](../part-1-foundation/00-what-is-mastra.md)。
2. 读 [核心心智模型](../part-1-foundation/01-mental-model.md)。
3. 运行 `examples/travel-concierge`。
4. 看 [API 速查](../appendix/A-api-cheatsheet.md)。

## 半天路线

适合准备写第一个 prototype 的人：

1. 完整读第一部。
2. 跟着第二部写 Agent、Tool、Workflow。
3. 给示例项目换成自己的模型供应商。
4. 用 Studio 测试 agent 对话和 workflow 执行。

## 上线路线

适合准备把 Mastra 接入产品的人：

1. 先读第二部，把业务能力拆成 Agent、Tool、Workflow、Memory。
2. 再读第三部，补齐观测、评测、部署、安全。
3. 写一份自己的“能力清单”和“风险清单”。
4. 用小流量真实用户数据验证记忆、工具和审批边界。

## 代码阅读约定

教程里会使用这些路径：

```text
src/mastra/index.ts          Mastra 入口
src/mastra/agents/           Agent 定义
src/mastra/tools/            Tool 定义
src/mastra/workflows/        Workflow 定义
src/mastra/mcp/              MCP Client 或 Server
```

示例项目里会尽量把业务逻辑写得短，但保留真实项目需要的结构。

