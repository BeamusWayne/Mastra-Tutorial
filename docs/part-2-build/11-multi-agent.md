# 11. 多 Agent 协作

多 Agent 不是“多建几个 agent 就更聪明”。它适合把一个任务拆给不同角色，并让一个 supervisor 控制委派、上下文和收敛。

## 什么时候需要多 Agent

适合：

- 任务天然包含不同专业能力，例如研究、规划、写作、审查。
- 某些子任务需要不同 tools、memory 或权限。
- 需要记录每次委派结果，便于观测和审计。
- 单个 prompt 越写越长，角色边界已经混乱。

不适合：

- 一个普通问答 agent 就能完成的短任务。
- 只是为了“看起来更 agentic”。
- 对延迟非常敏感，不能接受多轮委派。
- 子 agent 之间没有清晰职责边界。

## Supervisor Agent 模式

Supervisor agent 通过 `agents` 属性持有子 agent。它根据自己的 instructions 和子 agent 的 `description` 决定何时委派。

```ts title="src/mastra/agents/travel-supervisor-agent.ts"
import { Agent } from '@mastra/core/agent'
import { travelAgent } from './travel-agent'

export const travelReviewerAgent = new Agent({
  id: 'travel-reviewer-agent',
  name: 'Travel Reviewer Agent',
  description: '审查旅行方案的预算风险、天气风险、行程密度和不确定性。',
  instructions: '你只做审查，不重新写完整行程。输出风险、问题和改进建议。',
  model: process.env.MASTRA_MODEL ?? 'openai/gpt-4o-mini',
})

export const travelSupervisorAgent = new Agent({
  id: 'travel-supervisor-agent',
  name: 'Travel Supervisor Agent',
  instructions: `
你负责协调旅行规划任务。

可用子 agent：
- travelAgent：生成完整中文旅行方案。
- travelReviewerAgent：审查方案风险并提出修改建议。

复杂旅行请求先委派给 travelAgent，再委派给 travelReviewerAgent 做审查。
最终回答要综合规划和审查结果。
`,
  model: process.env.MASTRA_MODEL ?? 'openai/gpt-4o-mini',
  agents: {
    travelAgent,
    travelReviewerAgent,
  },
})
```

关键点不是 `agents` 这行代码，而是每个子 agent 的 `description` 要清楚。Supervisor 会用这些描述判断委派对象。

## 控制委派

`delegation` 选项可以在调用时拦截或修改委派：

```ts
const result = await supervisor.generate(prompt, {
  maxSteps: 8,
  delegation: {
    onDelegationStart: ({ primitiveId, prompt, iteration }) => {
      if (iteration > 6) {
        return {
          proceed: false,
          rejectionReason: '请基于已有信息收敛，不要继续委派。',
        }
      }

      if (primitiveId === 'travel-reviewer-agent') {
        return {
          proceed: true,
          modifiedPrompt: `${prompt}\n\n请特别检查预算、天气、交通时间和老人小孩是否适合。`,
          modifiedMaxSteps: 3,
        }
      }

      return { proceed: true }
    },
  },
})
```

常见用途：

- 限制最大委派轮数。
- 给某个子 agent 附加任务约束。
- 拒绝高风险子 agent。
- 记录审计日志。

## 过滤上下文

默认情况下，子 agent 可能收到 supervisor 的对话上下文。用 `messageFilter` 可以减少泄露和 token 消耗。

```ts
delegation: {
  messageFilter: ({ messages }) => {
    return messages.slice(-6)
  },
}
```

如果 supervisor 处理的是客户数据、内部制度或高权限工具结果，不要把完整历史无脑传给所有子 agent。子 agent 只应该看到完成任务所需的最小上下文。

## Memory 隔离

Supervisor 和 subagent 的 memory 是隔离的。子 agent 会收到上下文以完成当前委派，但保存到子 agent memory 的通常是委派 prompt 和子 agent 回答，而不是整个 supervisor 历史。

这能避免两个问题：

- 子 agent 长期记住不属于它职责范围的上下文。
- supervisor 的复杂工具调用污染子 agent 的后续任务。

但这不代表可以忽略权限。子 agent 如果有自己的 tools，仍然必须做服务端权限校验。

## 和 Workflow 的选择

| 需求 | 选 Supervisor | 选 Workflow |
| - | - | - |
| 步骤顺序固定 | 不优先 | 优先 |
| 需要模型自己判断委派 | 优先 | 不优先 |
| 每一步都要确定性输入输出 | 不优先 | 优先 |
| 子任务需要不同专业 agent | 优先 | 可组合 |
| 强审计、强重试、强状态管理 | 可用但复杂 | 优先 |

一个成熟系统通常会组合二者：Workflow 控制确定流程，某些 step 调用 supervisor 或专门 agent 解决开放性任务。

## 示例运行

配套示例提供了 `npm run supervisor`：

```bash
cd examples/travel-concierge
npm run supervisor -- "我想带父母从上海去苏州两天一夜，预算 2500 元，想轻松一点"
```

这个脚本会调用 supervisor，并在 `onDelegationStart` 和 `onDelegationComplete` 中打印委派过程，便于你观察多 agent 如何协作。

