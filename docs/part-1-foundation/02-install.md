# 2. 安装与第一次运行

Mastra 推荐用 CLI 创建项目：

```bash
npm create mastra@latest
```

如果你已经有项目，可以使用：

```bash
npx mastra init
```

这两种方式会比手动搭建更省事。手动安装适合你想完全理解项目结构，或需要嵌入已有复杂工程。

## 环境要求

建议使用：

- Node.js 22.13 或更高版本。当前 Mastra `@mastra/core@1.37.1`、`mastra@1.10.2` 等包的 `engines` 均要求 `>=22.13.0`。
- npm、pnpm、yarn、bun 任意一种包管理器。
- TypeScript。
- 至少一个模型供应商 API Key。

本教程示例以 npm 为主，其他包管理器命令可自行替换。

## CLI 创建项目

```bash
npm create mastra@latest
cd my-mastra-app
npm run dev
```

启动后通常会进入 Mastra Studio。Studio 是本地调试入口，可以测试 agent、查看工具调用、运行 workflow、观察 memory 和 traces。

## 手动安装

如果要从零手动搭建：

```bash
mkdir my-first-agent
cd my-first-agent
npm init -y
npm install -D typescript @types/node mastra@latest
npm install @mastra/core@latest zod@^4
```

`package.json` 至少需要：

```json title="package.json"
{
  "type": "module",
  "scripts": {
    "dev": "mastra dev",
    "build": "mastra build"
  }
}
```

`tsconfig.json` 推荐使用现代 ESM 配置：

```json title="tsconfig.json"
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

!!! warning

    不要把新项目配置成 CommonJS。Mastra 官方手动安装文档明确要求现代 `module` 和 `moduleResolution` 设置，否则容易出现模块解析错误。

## 配置模型密钥

不同供应商需要不同环境变量。例如你使用 OpenAI 兼容供应商时，通常会设置：

```bash title=".env"
OPENAI_API_KEY=sk-...
```

如果你用 Google Gemini：

```bash title=".env"
GOOGLE_GENERATIVE_AI_API_KEY=...
```

Mastra 的模型字符串通常是：

```ts
model: 'provider/model-name'
```

例如：

```ts
model: 'openai/gpt-4o-mini'
model: 'google/gemini-2.5-pro'
```

具体可用模型以 Mastra 官方 models 页面和你安装的版本为准。

## 最小 Agent

创建：

```bash
mkdir -p src/mastra/agents
```

```ts title="src/mastra/agents/assistant-agent.ts"
import { Agent } from '@mastra/core/agent'

export const assistantAgent = new Agent({
  id: 'assistant-agent',
  name: 'Assistant Agent',
  instructions: 'You are a concise assistant for TypeScript developers.',
  model: 'openai/gpt-4o-mini',
})
```

注册：

```ts title="src/mastra/index.ts"
import { Mastra } from '@mastra/core'
import { assistantAgent } from './agents/assistant-agent'

export const mastra = new Mastra({
  agents: { assistantAgent },
})
```

运行：

```bash
npm run dev
```

打开 Studio 后，你应该能看到 `assistantAgent` 或对应注册项。

## 第一次调试看什么

第一次不要急着加工具。先确认：

- Agent 能被 Studio 发现。
- 模型密钥正确。
- 简单问题能得到回答。
- 控制台没有模块解析错误。
- 修改 instructions 后热更新正常。

这一步跑通后，再进入 Tool 和 Workflow。
