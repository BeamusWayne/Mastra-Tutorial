# 5. Tool 设计

Tool 是 Agent 接触外部世界的方式。它可以查数据库、调 API、做计算、写文件、发消息，也可以触发内部业务动作。

Mastra 官方推荐用 `createTool()` 定义工具，并用 schema 描述输入输出。

## 最小 Tool

```ts title="src/mastra/tools/city-weather-tool.ts"
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export const cityWeatherTool = createTool({
  id: 'get-city-weather',
  description: '查询城市的示例天气信息。用于旅行规划时判断天气风险。',
  inputSchema: z.object({
    city: z.string().describe('中文或英文城市名'),
  }),
  outputSchema: z.object({
    city: z.string(),
    summary: z.string(),
    temperatureCelsius: z.number(),
    travelAdvice: z.string(),
  }),
  execute: async ({ city }) => {
    return {
      city,
      summary: '晴，微风',
      temperatureCelsius: 24,
      travelAdvice: '适合步行和户外景点，建议带防晒。',
    }
  },
})
```

接入 Agent：

```ts title="src/mastra/agents/travel-agent.ts"
import { Agent } from '@mastra/core/agent'
import { cityWeatherTool } from '../tools/city-weather-tool'

export const travelAgent = new Agent({
  id: 'travel-agent',
  name: 'Travel Agent',
  instructions: `
    你是中文旅行规划助手。
    当用户询问目的地天气、季节风险或户外安排时，使用 cityWeatherTool。
  `,
  model: 'openai/gpt-4o-mini',
  tools: { cityWeatherTool },
})
```

## Tool 的输入输出设计

一个 Tool 的质量主要由四件事决定：

- `id` 是否稳定。
- `description` 是否能让模型判断调用时机。
- `inputSchema` 是否最小且明确。
- `outputSchema` 是否能支撑后续推理。

不推荐：

```ts
inputSchema: z.object({
  query: z.string(),
})
```

更推荐：

```ts
inputSchema: z.object({
  destination: z.string().describe('目的地城市'),
  startDate: z.string().describe('YYYY-MM-DD'),
  days: z.number().int().min(1).max(14),
})
```

字段越明确，模型越不容易传错参数，你的运行时也越容易验证。

## `execute` 的签名

当前 `createTool()` 的 `execute` 接收两个参数：

```ts
execute: async (inputData, context) => {
  // inputData 来自 inputSchema
  // context 包含 requestContext、tracingContext、abortSignal 等
}
```

你也可以直接解构第一个参数：

```ts
execute: async ({ city }) => {
  return { city }
}
```

不要把旧版本里“所有东西都从一个大对象解构”的写法混进新项目。Mastra v1 迁移文档说明，`createTool` 已经改成输入和上下文分离。

## 什么时候需要 `toModelOutput`

有时工具返回的数据很大，应用需要完整数据，但模型只需要摘要。此时用 `toModelOutput`。

```ts
export const hotelSearchTool = createTool({
  id: 'search-hotels',
  description: '搜索酒店候选',
  inputSchema: z.object({
    city: z.string(),
  }),
  outputSchema: z.object({
    hotels: z.array(
      z.object({
        name: z.string(),
        price: z.number(),
        raw: z.unknown(),
      }),
    ),
  }),
  execute: async ({ city }) => {
    return {
      hotels: [
        { name: `${city} 静安旅店`, price: 420, raw: { source: 'demo' } },
      ],
    }
  },
  toModelOutput: output => ({
    type: 'text',
    value: output.hotels.map(h => `${h.name}: ${h.price} 元/晚`).join('\n'),
  }),
})
```

这样模型看到的是精简文本，你的应用仍能拿到完整 tool result。

## 需要审批的 Tool

读操作通常可以直接执行。写操作要谨慎，例如：

- 发邮件。
- 创建订单。
- 删除文件。
- 修改数据库。
- 调用付费 API。

这些工具应该使用人工审批或业务权限控制。Mastra 的 Tool 和 Agent approval 能支持这类 human-in-the-loop 流程，生产项目不要把高风险操作直接交给模型。

## Tool 设计清单

上线前检查：

- Tool 是否只做一件事？
- description 是否写明调用时机？
- 输入是否有 schema？
- 输出是否稳定？
- 是否处理 API 失败和超时？
- 是否隐藏了敏感字段？
- 是否需要审批？
- 是否有日志或 trace 能回放？

