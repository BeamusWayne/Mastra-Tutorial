# 10. 部署路线

Mastra 可以作为独立服务部署，也可以嵌入现有 Node、Next.js、React 等应用。选择部署方式时，不要只看“能不能跑”，还要看状态、存储、任务恢复和观测。

## 本地构建

常见脚本：

```json title="package.json"
{
  "scripts": {
    "dev": "mastra dev",
    "build": "mastra build"
  }
}
```

开发：

```bash
npm run dev
```

构建：

```bash
npm run build
```

## 部署前检查

| 项 | 检查 |
| - | - |
| 环境变量 | 模型 key、数据库 URL、MCP token 是否在部署环境配置 |
| Storage | Memory、Workflow 状态是否使用持久化存储 |
| 并发 | 长任务和工具调用是否限制并发 |
| 超时 | 外部 API 是否设置超时和重试 |
| 日志 | 是否能按 runId、threadId、userId 排查 |
| 安全 | 高风险工具是否加审批和权限 |

## Storage 是上线分界线

开发时用内存或本地文件可以快速启动，但生产环境要明确持久化策略。

Memory、Workflow suspend/resume、Observability 都可能依赖 storage。没有稳定 storage，服务重启后上下文和执行状态可能丢失。

示例：

```ts
import { LibSQLStore } from '@mastra/libsql'

export const storage = new LibSQLStore({
  id: 'mastra-storage',
  url: process.env.MASTRA_DATABASE_URL!,
})
```

生产环境不要把 `file:./mastra.db` 放在短生命周期容器里，除非你明确知道文件卷如何持久化。

## 工作流运行器

简单项目可以使用 Mastra 内置执行引擎。复杂项目如果需要托管型长任务、重试和可恢复执行，可以考虑官方文档中提到的 workflow runners，例如 Inngest 或 Temporal 相关方案。

选择依据：

- 任务是否超过普通 HTTP 请求生命周期。
- 是否需要跨部署恢复。
- 是否需要强重试和可视化任务管理。
- 是否有严格审计要求。

## Serverless 注意事项

Serverless 适合轻量 agent API，但要小心：

- 冷启动会影响延迟。
- 本地文件 storage 不可靠。
- 长时间 stream 可能受平台限制。
- 后台任务和 workflow resume 需要额外设计。
- MCP stdio server 在 serverless 中通常不如远程 HTTP MCP 稳定。

## 推荐上线步骤

1. 先用独立 Mastra server 跑通。
2. 配置持久化 storage。
3. 接入基础 observability。
4. 对高风险工具加审批。
5. 准备一组 evals 做回归。
6. 小流量发布，只开放低风险能力。
7. 再逐步开放写操作、自动化任务和外部 MCP。

上线 agent 的核心原则是：先让它可观察，再让它更自主。

