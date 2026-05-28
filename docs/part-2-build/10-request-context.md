# 10. RequestContext

`RequestContext` 是 Mastra 里传递“本次请求上下文”的机制。它和 Memory 不同：

- Memory 记录跨轮对话和长期状态。
- RequestContext 只描述当前请求的用户、租户、语言、权限、实验分组等运行时信息。

## 为什么需要它

不要把用户身份、租户 ID、套餐等级、权限范围塞进 prompt。模型可以看到 prompt，但真正的业务边界应该由服务端上下文控制。

典型用途：

- 根据用户套餐选择模型。
- 根据 locale 调整 instructions。
- 在 tool 里读取 authenticated user id。
- 在 workflow step 里读取 tenant id。
- 用 schema 校验中间件是否正确注入上下文。
- 用 Mastra 保留 key 保护 memory resource/thread。

## 创建和传入

```ts
import { RequestContext } from '@mastra/core/request-context'

type TravelRequestContext = {
  userId: string
  locale: 'zh-CN' | 'en-US'
  tier: 'free' | 'pro'
}

const requestContext = new RequestContext<TravelRequestContext>()
requestContext.set('userId', 'demo-user')
requestContext.set('locale', 'zh-CN')
requestContext.set('tier', 'pro')

const result = await agent.generate(prompt, {
  requestContext,
})
```

`RequestContext<T>` 会给 `.set()` 和 `.get()` 提供类型约束。生产项目建议把 context 类型放到单独文件，供 Agent、Tool、Workflow 共享。

## Agent 里动态读取

Agent 的 `instructions`、`model`、`tools`、`memory`、`agents`、`workflows`、`inputProcessors`、`outputProcessors` 等配置都可以是函数，并从 `requestContext` 读取值。

```ts
export const travelAgent = new Agent({
  id: 'travel-agent',
  name: 'Travel Agent',
  requestContextSchema: z.object({
    userId: z.string().optional(),
    locale: z.enum(['zh-CN', 'en-US']).optional(),
    tier: z.enum(['free', 'pro']).optional(),
  }),
  instructions: ({ requestContext }) => {
    const locale = requestContext?.get('locale') ?? 'zh-CN'
    return locale === 'en-US'
      ? 'You are a careful travel planning assistant.'
      : '你是一名严谨的中文旅行规划助手。'
  },
  model: ({ requestContext }) => {
    return requestContext?.get('tier') === 'pro' ? 'openai/gpt-4o' : 'openai/gpt-4o-mini'
  },
})
```

`requestContextSchema` 会在 `generate()` 或 `stream()` 开始时校验上下文。校验失败时，Agent 会在发起 LLM 调用前报错。

## Tool 里做权限判断

Tool 的 schema 只校验模型传入参数，不等于权限系统。权限应该在 `execute` 里用 `requestContext` 判断。

```ts
export const budgetTool = createTool({
  id: 'estimate-trip-budget',
  requestContextSchema: z.object({
    userId: z.string().optional(),
    tier: z.enum(['free', 'pro']).optional(),
  }),
  inputSchema: z.object({
    destination: z.string(),
    days: z.number().int().min(1).max(14),
    style: z.enum(['budget', 'balanced', 'comfort']),
  }),
  execute: async (input, context) => {
    const tier = context?.requestContext?.get('tier') ?? 'free'
    const maxDays = tier === 'pro' ? 14 : 5

    if (input.days > maxDays) {
      throw new Error(`当前套餐最多只能估算 ${maxDays} 天行程`)
    }

    return estimateBudget(input)
  },
})
```

Tool 的 `requestContextSchema` 校验失败时，会返回错误对象，而不是像 Agent 那样直接抛出。这一点在 workflow 里调用 tool 时要特别注意。

## Workflow 里传递

Workflow 的 `run.start()` 也接受 `requestContext`：

```ts
const run = await workflow.createRun()

await run.start({
  inputData,
  requestContext,
})
```

step 的 `execute` 可以读取它：

```ts
execute: async ({ inputData, requestContext }) => {
  const userId = requestContext?.get('userId') ?? 'anonymous'
  return { ...inputData, owner: userId }
}
```

如果 workflow 声明 `requestContextSchema`，Mastra 会在 run 开始时校验。step 也可以声明自己的 schema，用于局部约束。

## 保留 key

Mastra 提供两个和 Memory 隔离相关的保留 key：

| Key | 作用 |
| - | - |
| `MASTRA_RESOURCE_ID_KEY` | 强制 memory resource 使用服务端认证后的用户 ID |
| `MASTRA_THREAD_ID_KEY` | 强制 thread 使用服务端校验后的 thread ID |

多租户应用里，客户端传来的 `resource` 和 `thread` 不能直接信任。更稳妥的做法是在认证中间件中设置这些 key，让服务端上下文覆盖客户端参数。

## 工程建议

- 把 RequestContext 当成请求级依赖注入，不要当数据库。
- 所有高风险 tool 都从 RequestContext 取用户和权限。
- Agent/Workflow/Tool 都写 `requestContextSchema`，让契约显式化。
- 不把 token、密钥、完整隐私数据放进 context，除非对应 tool 必须使用。
- 对客户端可编辑的 context 做白名单，不允许用户伪造 `tier`、`tenantId`、`role`。

