# Mastra 中文教程

一本面向 TypeScript 开发者的 Mastra 中文教程。它不是官方文档的逐页翻译，而是按真实工程路径重写的学习指南：先建立心智模型，再做可运行项目，最后进入记忆、RAG、MCP、评测、观测和部署。

本教程基于：

- Mastra 官方仓库：`mastra-ai/mastra`，参考 commit `ad911714f6be2538b8bd20afac50221c388ec65c`
- npm 包版本检查时间：2026-05-28
- 当前 npm 版本：`@mastra/core@1.37.1`、`mastra@1.10.2`、`@mastra/memory@1.20.0`、`@mastra/mcp@1.8.1`

## 这本教程适合谁

- 想从零开始理解 Mastra 的新人
- 已经写过 LangChain、AI SDK、OpenAI tools，想换成 TypeScript-first agent 框架的开发者
- 需要把 agent 放进真实产品，而不只是写 demo 的工程师
- 想理解 Agent、Workflow、Memory、RAG、MCP、Observability 应该如何组合的人

## 内容结构

```text
docs/
├── preface/              阅读方式和设计原则
├── part-1-foundation/    基础：Mastra 是什么、何时使用、项目结构
├── part-2-build/         实战：Agent、Tool、Workflow、Memory、RAG、MCP、结构化输出、多 Agent
├── part-3-production/    生产化：观测、评测、Guardrails、部署、安全
└── appendix/             API 速查、排障手册、资料来源

examples/
└── travel-concierge/     可运行的旅行助手示例项目
```

每个核心章节都尽量遵循同一节奏：

1. 心智模型：先讲这个能力解决什么问题。
2. 最小实践：给出可复制代码。
3. 工程判断：说明什么时候该用，什么时候不该用。
4. 坑点清单：列出容易踩错的 API、状态和部署问题。

## 本地预览

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
mkdocs serve
```

构建检查：

```bash
mkdocs build --strict
```

## 运行示例项目

```bash
cd examples/travel-concierge
npm install
cp .env.example .env
npm run dev
```

也可以直接跑一次命令行请求：

```bash
npm run ask -- "我周末想从上海出发去杭州，两天一夜，预算 1800 元"
```

更多示例脚本：

```bash
npm run workflow
npm run structured -- "给我一个上海到杭州两天一夜的轻松行程，预算 1800 元"
npm run context -- "我想从上海去南京玩 6 天，预算 3500 元"
npm run supervisor -- "我想带父母从上海去苏州两天一夜，预算 2500 元"
```

## 发布到 GitHub Pages

仓库包含 GitHub Pages workflow：`.github/workflows/deploy.yml`。推送到 `main` 后会安装 MkDocs 依赖、执行 `mkdocs build --strict`，并把 `site/` 发布到 GitHub Pages。

## 版权

教程内容采用 MIT License。Mastra 本体采用其官方仓库声明的许可协议，本教程不复制或再授权 Mastra 源码。
