# 6. Workflow 编排

Workflow 用来表达确定性的多步骤流程。它和 Agent 的区别是：Workflow 的步骤由你定义，Agent 的步骤由模型决定。

旅行助手里，一个“生成行程”的流程可以拆成：

1. 标准化用户输入。
2. 生成候选行程。
3. 校验预算。
4. 输出最终结果。

## 创建 Step

Mastra 用 `createStep()` 定义步骤。每个 step 有输入 schema、输出 schema 和 `execute`。

```ts title="src/mastra/workflows/itinerary-workflow.ts"
import { createStep } from '@mastra/core/workflows'
import { z } from 'zod'

const normalizeRequest = createStep({
  id: 'normalize-request',
  description: '标准化旅行需求',
  inputSchema: z.object({
    origin: z.string(),
    destination: z.string(),
    days: z.number().int().min(1),
    budgetCny: z.number().positive(),
    preference: z.string().optional(),
  }),
  outputSchema: z.object({
    route: z.string(),
    days: z.number(),
    budgetCny: z.number(),
    preference: z.string(),
  }),
  execute: async ({ inputData }) => {
    return {
      route: `${inputData.origin} -> ${inputData.destination}`,
      days: inputData.days,
      budgetCny: inputData.budgetCny,
      preference: inputData.preference ?? '轻松、低风险',
    }
  },
})
```

注意 workflow step 的 `execute` 参数是一个对象，常用字段是 `inputData`、`mastra`、`getStepResult`、`state`、`setState`、`suspend`、`requestContext`。

## 创建 Workflow

```ts title="src/mastra/workflows/itinerary-workflow.ts"
import { createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'

export const itineraryWorkflow = createWorkflow({
  id: 'build-itinerary',
  inputSchema: z.object({
    origin: z.string(),
    destination: z.string(),
    days: z.number().int().min(1),
    budgetCny: z.number().positive(),
    preference: z.string().optional(),
  }),
  outputSchema: z.object({
    route: z.string(),
    summary: z.string(),
    estimatedCostCny: z.number(),
    withinBudget: z.boolean(),
  }),
})
  .then(normalizeRequest)
  .then(buildPlan)
  .then(checkBudget)
  .commit()
```

最后的 `.commit()` 很重要。没有 commit，workflow 没有完成定义。

## 在 Step 里调用 Agent

Workflow 可以调用 agent。推荐通过 `mastra.getAgentById()` 获取已注册 agent。

```ts
const buildPlan = createStep({
  id: 'build-plan',
  inputSchema: normalizeRequest.outputSchema,
  outputSchema: z.object({
    route: z.string(),
    summary: z.string(),
    estimatedCostCny: z.number(),
    budgetCny: z.number(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgentById('travel-agent')
    const response = await agent.generate(
      `为路线 ${inputData.route} 规划 ${inputData.days} 天行程。偏好：${inputData.preference}`,
    )

    return {
      route: inputData.route,
      summary: response.text,
      estimatedCostCny: Math.round(inputData.budgetCny * 0.85),
      budgetCny: inputData.budgetCny,
    }
  },
})
```

这种组合很常见：Workflow 控制流程，Agent 负责开放生成。

## 运行 Workflow

注册：

```ts title="src/mastra/index.ts"
import { Mastra } from '@mastra/core'
import { itineraryWorkflow } from './workflows/itinerary-workflow'

export const mastra = new Mastra({
  workflows: { itineraryWorkflow },
})
```

调用：

```ts
const workflow = mastra.getWorkflow('itineraryWorkflow')
const run = await workflow.createRun()

const result = await run.start({
  inputData: {
    origin: '上海',
    destination: '杭州',
    days: 2,
    budgetCny: 1800,
    preference: '安静、不要太赶',
  },
})

if (result.status === 'success') {
  console.log(result.result)
}
```

`result.status` 是判别字段。不要直接假设一定成功。可能状态包括 `success`、`failed`、`suspended`、`tripwire`、`paused`。

## 什么时候引入 Workflow

当你的 agent prompt 里出现这些句子时，通常该考虑 workflow：

- “先做 A，再做 B，然后做 C。”
- “如果不满足条件，就停止。”
- “这个步骤需要人工确认。”
- “需要记录每一步状态。”
- “失败后要从中间恢复。”

Workflow 会让流程变得可测试、可观测、可恢复。不要把固定业务流程藏在 agent 的自然语言 instructions 里。

