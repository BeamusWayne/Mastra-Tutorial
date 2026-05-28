# 9. 结构化输出与流式

Agent 的输出不一定总是 Markdown。真实应用里，很多结果要进入 UI、数据库、队列或后续 workflow，这时你需要结构化输出。

## 什么时候用结构化输出

适合：

- 从自然语言里抽取字段。
- 让 agent 产出可渲染的卡片数据。
- 把 agent 的判断交给后续业务逻辑。
- 让 workflow step 接收稳定的对象，而不是解析 Markdown。

不适合：

- 长篇解释性回答。
- 字段非常动态、无法提前建模的探索任务。
- 必须由传统代码精确计算的结果。

经验规则：只要你准备写正则去解析 agent 回答，就先考虑 `structuredOutput`。

## 最小示例

```ts title="src/scripts/structured.ts"
import { z } from 'zod'
import { mastra } from '../mastra/index'

const itinerarySchema = z.object({
  destination: z.string(),
  days: z.array(
    z.object({
      day: z.number(),
      theme: z.string(),
      activities: z.array(z.string()),
    }),
  ),
  estimatedBudgetCny: z.number(),
  riskNotes: z.array(z.string()),
})

const agent = mastra.getAgentById('travel-agent')

const result = await agent.generate('给我一个上海到杭州两天一夜的轻松行程，预算 1800 元。', {
  structuredOutput: {
    schema: itinerarySchema,
    jsonPromptInjection: true,
    errorStrategy: 'fallback',
    fallbackValue: {
      destination: '杭州',
      days: [],
      estimatedBudgetCny: 1800,
      riskNotes: ['结构化输出失败，请查看原始文本或重试。'],
    },
  },
  memory: {
    resource: 'demo-user',
    thread: 'cli-structured-output',
  },
})

console.dir(result.object, { depth: null })
```

`schema` 可以用 Zod，也可以用 JSON Schema。Zod 的优势是 TypeScript 推断和运行时校验都比较自然。

## 和 Tool 一起用

不是所有模型都能在一次调用里同时稳定处理 tools 和结构化输出。官方文档给了三个常用方案：

| 方案 | 适用场景 | 代价 |
| - | - | - |
| `jsonPromptInjection: true` | 模型不支持原生 `response_format`，或和工具调用冲突 | 依赖 prompt 约束，可靠性略低 |
| `structuredOutput.model` | 主 agent 先用工具自然语言回答，再用第二个模型抽结构 | 多一次 LLM 调用 |
| `prepareStep` | 第一步强制工具调用，后续步骤再结构化 | 代码更复杂，但可控 |

旅行助手示例使用 `jsonPromptInjection: true`，因为它最容易在不同模型上跑通。生产环境里，如果结构化对象会驱动订单、付款、权限或自动执行，建议使用单独 structuring model，并保留原始文本和结构化结果用于审计。

## 流式结构化输出

流式调用时，你可以同时拿到自然语言文本流和最终对象。

```ts
const stream = await agent.stream('生成杭州两日行程，并返回结构化对象。', {
  structuredOutput: {
    schema: itinerarySchema,
    jsonPromptInjection: true,
  },
})

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk)
}

const object = await stream.object
console.dir(object, { depth: null })
```

如果 UI 需要边生成边渲染结构，可以读 `objectStream`。如果只需要最终可用数据，等 `stream.object` 更简单。

## 错误处理

结构化输出失败通常有三类原因：

- 模型没有按 schema 输出。
- schema 太细，模型无法可靠填满。
- schema 和工具调用在模型提供商侧冲突。

Mastra 的 `errorStrategy` 可以控制失败行为：

```ts
structuredOutput: {
  schema,
  errorStrategy: 'fallback',
  fallbackValue: safeDefault,
}
```

生产建议：

- schema 先小后大，不要一开始就塞 40 个字段。
- 给数组设置清晰的字段语义，不要只写 `items: z.string()`。
- 对关键字段做服务端二次校验。
- 结构化对象只作为“模型产物”，不要直接信任为业务事实。

## 和 Workflow 的关系

Workflow step 更适合接收确定对象。常见模式是：

1. Agent 用 tools 和 memory 完成理解。
2. `structuredOutput` 把回答转成对象。
3. Workflow step 检查对象字段。
4. 传统代码做权限、价格、库存、风控等确定性判断。

不要把所有业务流程都塞进一个结构化输出 schema。schema 解决的是“输出形状”，不是“业务正确性”。

