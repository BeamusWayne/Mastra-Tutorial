# 3. 项目结构

Mastra 对目录结构不强制，但 CLI 会给出一套合理默认结构。本教程沿用这套结构，因为它适合从 prototype 逐步扩展到生产项目。

```text
src/
└── mastra/
    ├── agents/
    │   └── travel-agent.ts
    ├── tools/
    │   └── city-weather-tool.ts
    ├── workflows/
    │   └── itinerary-workflow.ts
    ├── mcp/
    │   └── travel-mcp-server.ts
    └── index.ts
```

## `src/mastra/index.ts`

这是 Mastra 入口。你在这里注册 agents、workflows、storage、mcpServers、observability 等。

```ts title="src/mastra/index.ts"
import { Mastra } from '@mastra/core'
import { travelAgent } from './agents/travel-agent'
import { itineraryWorkflow } from './workflows/itinerary-workflow'

export const mastra = new Mastra({
  agents: { travelAgent },
  workflows: { itineraryWorkflow },
})
```

建议把 `index.ts` 当成注册表，而不是写业务逻辑的地方。业务逻辑应该放在 agents、tools、workflows 或普通 service 文件里。

## `agents/`

Agent 文件负责描述角色、模型、工具、记忆和运行时行为。

推荐一个文件一个主要 agent：

```text
agents/
├── travel-agent.ts
├── researcher-agent.ts
└── supervisor-agent.ts
```

如果 agent 的 instructions 很长，可以把 prompt 模板拆到单独文件，但要保证运行时仍然容易追踪。

## `tools/`

Tool 是可复用能力。每个 Tool 应该像一个小 API：

- 有唯一 `id`。
- 有清楚 `description`。
- 有 `inputSchema`。
- 尽量有 `outputSchema`。
- 返回结构稳定。

推荐按资源或领域分文件：

```text
tools/
├── weather-tool.ts
├── destination-tool.ts
└── budget-tool.ts
```

不要写一个叫 `doEverythingTool` 的万能工具。它会让模型选择困难，也会让权限和审计失控。

## `workflows/`

Workflow 适合确定流程，比如：

- 收集输入。
- 校验预算。
- 并行生成候选方案。
- 等待用户确认。
- 写入数据库或发送通知。

```text
workflows/
├── itinerary-workflow.ts
└── approval-workflow.ts
```

Workflow 文件里通常会同时出现 `createStep()` 和 `createWorkflow()`。如果步骤很多，可以把 step 拆成 `steps/` 子目录。

## `mcp/`

MCP 目录建议放两类文件：

- `*-client.ts`：连接外部 MCP server。
- `*-server.ts`：把自己的能力暴露成 MCP server。

```text
mcp/
├── github-client.ts
└── travel-mcp-server.ts
```

如果只是内部调用，不要为了“看起来高级”而使用 MCP。MCP 是跨系统边界，内部组合优先用普通 import、Tool、Agent 或 Workflow。

## `storage` 放在哪里

简单项目可以直接在 `src/mastra/index.ts` 配置 storage：

```ts
import { LibSQLStore } from '@mastra/libsql'

export const mastra = new Mastra({
  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: 'file:./mastra.db',
  }),
})
```

复杂项目可以拆到 `src/mastra/storage.ts`。重点不是文件位置，而是保证所有需要共享记忆、workflow 状态和观测数据的能力使用同一套实例级配置。

## 命名建议

| 对象 | 命名建议 | 示例 |
| - | - | - |
| Agent id | kebab-case，稳定不随变量名变化 | `travel-agent` |
| Tool id | 动词 + 资源 | `get-weather` |
| Workflow id | 业务流程名 | `build-itinerary` |
| 注册 key | TypeScript 友好的 camelCase | `travelAgent` |

注意：在 agent stream 事件里，tool 名称通常由注册对象的 key 决定，而不是 tool 的 `id`。如果你希望事件里的 `toolName` 和 `id` 对齐，可以用 `[tool.id]: tool` 作为 key。

