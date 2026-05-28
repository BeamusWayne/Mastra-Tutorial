# 4. 第一个 Agent

Agent 是 Mastra 里最容易上手、也最容易滥用的对象。先记住一句话：

> Agent 适合让模型决定下一步，Workflow 适合你决定下一步。

本章先做一个旅行助手 Agent。它负责和用户对话、理解偏好，并在需要时调用工具。

## 最小 Agent

```ts title="src/mastra/agents/travel-agent.ts"
import { Agent } from '@mastra/core/agent'

export const travelAgent = new Agent({
  id: 'travel-agent',
  name: 'Travel Agent',
  description: '帮助用户规划城市短途旅行',
  instructions: `
    你是一名严谨的中文旅行规划助手。
    你需要先确认出发地、目的地、天数、预算和偏好。
    如果信息不足，先提问，不要编造。
    输出行程时要包含交通、住宿、餐饮、景点和预算拆分。
  `,
  model: 'openai/gpt-4o-mini',
})
```

注册：

```ts title="src/mastra/index.ts"
import { Mastra } from '@mastra/core'
import { travelAgent } from './agents/travel-agent'

export const mastra = new Mastra({
  agents: { travelAgent },
})
```

启动：

```bash
npm run dev
```

在 Studio 里找到这个 agent，输入：

```text
我想周末从上海去杭州，两天一夜，预算 1800 元，喜欢安静一点的路线。
```

## Agent 配置应该放什么

常见字段：

| 字段 | 作用 | 建议 |
| - | - | - |
| `id` | 稳定运行时标识 | 一旦上线不要随便改 |
| `name` | 展示名称 | 给 Studio 和人看 |
| `description` | 描述能力 | 子 agent 和 MCP 场景很重要 |
| `instructions` | 系统级行为约束 | 写职责、边界和输出原则 |
| `model` | 模型路由字符串 | 用配置集中管理更好 |
| `tools` | 可调用工具 | 不要一次塞太多 |
| `memory` | 记忆配置 | 多轮对话再加 |
| `workflows` | 可调用 workflow | 适合把固定流程暴露给 agent |

## instructions 怎么写

好的 instructions 不只是“你很聪明”。它应该明确：

- 角色：你是谁。
- 任务：你要完成什么。
- 边界：什么情况下要提问或拒绝。
- 工具策略：什么时候用哪个工具。
- 输出格式：用户或系统期待什么结构。

示例：

```ts
instructions: `
  你是中文旅行规划助手。
  当用户没有提供出发地、目的地、天数、预算中任意一项时，先补问。
  规划时必须考虑预算约束，不要推荐明显超预算方案。
  如果使用工具结果，优先引用工具返回的数据，不要编造实时价格。
  最终回答使用 Markdown，包含：
  - 概览
  - 每日安排
  - 预算拆分
  - 可替代方案
`
```

## 通过 Mastra 实例调用

官方文档建议通过 Mastra 实例拿 agent，而不是直接 import 后调用。

```ts
const agent = mastra.getAgentById('travel-agent')
const result = await agent.generate('帮我规划两天杭州旅行')
console.log(result.text)
```

原因是通过实例获取的 agent 可以使用实例级 storage、logger、observability 和 registry。

## `.generate()` 和 `.stream()`

`.generate()` 适合后端任务或命令行：

```ts
const response = await agent.generate('帮我规划两天杭州旅行')
console.log(response.text)
```

`.stream()` 适合 UI 实时输出：

```ts
const stream = await agent.stream('帮我规划两天杭州旅行')

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk)
}
```

## 不要急着加工具

一个新 Agent 第一轮只验证三件事：

- instructions 是否能约束风格。
- 模型是否能稳定回答。
- 输出是否满足产品需要。

只有当 agent 需要实时数据、业务系统数据、确定性计算或副作用操作时，再加 Tool。

