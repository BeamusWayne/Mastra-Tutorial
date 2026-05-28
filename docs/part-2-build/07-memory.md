# 7. Memory 记忆系统

Memory 让 agent 能跨多轮交互保持上下文。它可以保存消息历史、用户偏好、长期观察和语义召回结果。

先记住两个词：

- `resource`：谁或哪个业务实体。
- `thread`：哪一次会话或任务。

这两个标识决定记忆的隔离边界。

## 安装

```bash
npm install @mastra/memory@latest @mastra/libsql@latest
```

Memory 需要 storage 才能持久化消息历史。开发环境可以用 LibSQL。

## 配置 Storage

```ts title="src/mastra/index.ts"
import { Mastra } from '@mastra/core'
import { LibSQLStore } from '@mastra/libsql'

export const mastra = new Mastra({
  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: 'file:./mastra.db',
  }),
})
```

## 给 Agent 加 Memory

```ts title="src/mastra/agents/travel-agent.ts"
import { Agent } from '@mastra/core/agent'
import { Memory } from '@mastra/memory'

export const travelAgent = new Agent({
  id: 'travel-agent',
  name: 'Travel Agent',
  instructions: '你是中文旅行规划助手。',
  model: 'openai/gpt-4o-mini',
  memory: new Memory({
    options: {
      lastMessages: 20,
      workingMemory: {
        enabled: true,
      },
    },
  }),
})
```

## 调用时传入记忆范围

```ts
await travelAgent.generate('记住我喜欢安静的路线。', {
  memory: {
    resource: 'user-123',
    thread: 'travel-planning-001',
  },
})

await travelAgent.generate('我喜欢什么样的路线？', {
  memory: {
    resource: 'user-123',
    thread: 'travel-planning-001',
  },
})
```

如果 `resource` 或 `thread` 换了，agent 看到的记忆也会不同。

!!! warning

    一个 thread 创建后有固定 owner，也就是 `resourceId`。不要把同一个 thread id 给不同用户复用，否则查询和写入会出错，也会造成权限风险。

## 三类常用记忆

| 类型 | 作用 | 适合保存 |
| - | - | - |
| Message history | 最近对话历史 | 多轮上下文 |
| Working memory | 持久结构化用户资料 | 偏好、目标、约束 |
| Semantic recall | 按语义检索过往内容 | 长期历史中相关片段 |

更长的对话可以考虑 Observational Memory。它用后台 agent 将旧消息压缩成观察记录，减少上下文压力。

## Working memory 模板

工作记忆适合保存稳定偏好：

```ts
memory: new Memory({
  options: {
    workingMemory: {
      enabled: true,
      template: `
# 用户旅行偏好
- 出发城市：
- 偏好节奏：
- 饮食禁忌：
- 酒店偏好：
- 预算习惯：
`,
    },
  },
})
```

不要把所有聊天记录都塞进 working memory。它应该像用户档案，而不是流水账。

## 多 agent 记忆边界

在 supervisor agent 委托 subagent 时，Mastra 会自动隔离 subagent 的 thread，并为 subagent 生成稳定 resource id。这样每个 subagent 能保留自己的长期记忆，又不会直接污染 supervisor 的完整对话历史。

如果你直接调用多个 agent，并希望它们共享记忆，可以给它们传同一个 `resource`。如果还传同一个 `thread`，它们会共享更紧密的会话历史。

## 生产建议

- 用户级数据用稳定 `resource`。
- 任务级会话用稳定 `thread`。
- 不要跨租户共享 resource。
- 对敏感内容使用 processor 或 transform 做过滤。
- 对长期记忆做可查看、可删除的用户控制。
- 在 traces 中检查每次请求实际注入了哪些记忆。

Memory 的风险不是“记不住”，而是“记错、记多、越权记”。上线前要把边界设计清楚。

