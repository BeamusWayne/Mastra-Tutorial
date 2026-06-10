# 资料来源

本教程以官方资料为准，并在 2026-05-28 做过一次校准；2026-06-10 又将配套示例项目与下方 npm 包版本更新到当时的最新稳定版。

## 官方仓库

- Mastra GitHub 仓库：[https://github.com/mastra-ai/mastra](https://github.com/mastra-ai/mastra)
- 本教程参考 commit：`ad911714f6be2538b8bd20afac50221c388ec65c`
- 官方 README：[https://github.com/mastra-ai/mastra/blob/main/README.md](https://github.com/mastra-ai/mastra/blob/main/README.md)

## 官方文档

- Docs 首页：[https://mastra.ai/docs](https://mastra.ai/docs)
- Agents overview：[https://mastra.ai/docs/agents/overview](https://mastra.ai/docs/agents/overview)
- Tools with agents：[https://mastra.ai/docs/agents/using-tools](https://mastra.ai/docs/agents/using-tools)
- Structured output：[https://mastra.ai/docs/agents/structured-output](https://mastra.ai/docs/agents/structured-output)
- Supervisor agents：[https://mastra.ai/docs/agents/supervisor-agents](https://mastra.ai/docs/agents/supervisor-agents)
- Processors：[https://mastra.ai/docs/agents/processors](https://mastra.ai/docs/agents/processors)
- Guardrails：[https://mastra.ai/docs/agents/guardrails](https://mastra.ai/docs/agents/guardrails)
- Workflows overview：[https://mastra.ai/docs/workflows/overview](https://mastra.ai/docs/workflows/overview)
- Memory overview：[https://mastra.ai/docs/memory/overview](https://mastra.ai/docs/memory/overview)
- RAG overview：[https://mastra.ai/docs/rag/overview](https://mastra.ai/docs/rag/overview)
- MCP overview：[https://mastra.ai/docs/mcp/overview](https://mastra.ai/docs/mcp/overview)
- Request context：[https://mastra.ai/docs/server/request-context](https://mastra.ai/docs/server/request-context)
- Streaming overview：[https://mastra.ai/docs/streaming/overview](https://mastra.ai/docs/streaming/overview)
- Studio overview：[https://mastra.ai/docs/studio/overview](https://mastra.ai/docs/studio/overview)
- Observability overview：[https://mastra.ai/docs/observability/overview](https://mastra.ai/docs/observability/overview)
- Evals overview：[https://mastra.ai/docs/evals/overview](https://mastra.ai/docs/evals/overview)

## API Reference

- `Agent`：[https://mastra.ai/reference/agents/agent](https://mastra.ai/reference/agents/agent)
- `Agent.generate()`：[https://mastra.ai/reference/agents/generate](https://mastra.ai/reference/agents/generate)
- Agent streaming：[https://mastra.ai/reference/streaming/agents/stream](https://mastra.ai/reference/streaming/agents/stream)
- `createTool()`：[https://mastra.ai/reference/tools/create-tool](https://mastra.ai/reference/tools/create-tool)
- `createStep()`：[https://mastra.ai/reference/workflows/step](https://mastra.ai/reference/workflows/step)
- `createWorkflow()`：[https://mastra.ai/reference/workflows/workflow](https://mastra.ai/reference/workflows/workflow)
- `Memory`：[https://mastra.ai/reference/memory/memory-class](https://mastra.ai/reference/memory/memory-class)
- `MCPClient`：[https://mastra.ai/reference/tools/mcp-client](https://mastra.ai/reference/tools/mcp-client)
- `MCPServer`：[https://mastra.ai/reference/tools/mcp-server](https://mastra.ai/reference/tools/mcp-server)
- `Processor` Interface：[https://mastra.ai/reference/processors/processor-interface](https://mastra.ai/reference/processors/processor-interface)

## npm 版本

2026-06-10 查询结果：

| 包 | 版本 |
| - | - |
| `@mastra/core` | `1.41.0` |
| `mastra` | `1.12.2` |
| `@mastra/memory` | `1.20.2` |
| `@mastra/mcp` | `1.9.1` |

如果你读到本教程时这些版本已经更新，优先以官方文档和对应版本的 changelog 为准。
