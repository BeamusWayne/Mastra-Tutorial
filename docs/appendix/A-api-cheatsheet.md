# A. API 速查

本页只列高频 API，完整参数以官方 reference 为准。

## Agent

```ts
import { Agent } from '@mastra/core/agent'

export const agent = new Agent({
  id: 'my-agent',
  name: 'My Agent',
  description: 'What this agent does',
  instructions: 'System-level behavior',
  model: 'openai/gpt-4o-mini',
  tools: {},
  memory: undefined,
})
```

调用：

```ts
const agent = mastra.getAgentById('my-agent')
const result = await agent.generate('Hello')
const stream = await agent.stream('Hello')
```

## Tool

```ts
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export const tool = createTool({
  id: 'my-tool',
  description: 'What this tool does',
  inputSchema: z.object({ value: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async inputData => {
    return { result: inputData.value }
  },
})
```

`execute` 当前推荐签名：

```ts
execute: async (inputData, context) => {}
```

## Workflow

```ts
import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'

const step = createStep({
  id: 'step-1',
  inputSchema: z.object({ message: z.string() }),
  outputSchema: z.object({ formatted: z.string() }),
  execute: async ({ inputData }) => ({
    formatted: inputData.message.toUpperCase(),
  }),
})

export const workflow = createWorkflow({
  id: 'my-workflow',
  inputSchema: z.object({ message: z.string() }),
  outputSchema: z.object({ formatted: z.string() }),
})
  .then(step)
  .commit()
```

运行：

```ts
const workflow = mastra.getWorkflow('workflow')
const run = await workflow.createRun()
const result = await run.start({ inputData: { message: 'hello' } })
```

## Memory

```ts
import { Memory } from '@mastra/memory'

memory: new Memory({
  options: {
    lastMessages: 20,
    workingMemory: { enabled: true },
  },
})
```

调用时：

```ts
await agent.generate('...', {
  memory: {
    resource: 'user-123',
    thread: 'thread-456',
  },
})
```

## Structured Output

```ts
import { z } from 'zod'

const result = await agent.generate('Extract itinerary', {
  structuredOutput: {
    schema: z.object({
      destination: z.string(),
      days: z.array(z.string()),
    }),
    jsonPromptInjection: true,
    errorStrategy: 'fallback',
    fallbackValue: {
      destination: 'unknown',
      days: [],
    },
  },
})

console.log(result.object)
```

流式：

```ts
const stream = await agent.stream('Extract itinerary', {
  structuredOutput: { schema },
})

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk)
}

console.log(await stream.object)
```

## RequestContext

```ts
import { RequestContext } from '@mastra/core/request-context'

type AppContext = {
  userId: string
  tier: 'free' | 'pro'
}

const requestContext = new RequestContext<AppContext>()
requestContext.set('userId', 'user-123')
requestContext.set('tier', 'pro')

await agent.generate('...', { requestContext })
```

Agent/Tool/Workflow 都可以声明 `requestContextSchema`：

```ts
requestContextSchema: z.object({
  userId: z.string(),
  tier: z.enum(['free', 'pro']),
})
```

## Supervisor Agent

```ts
const supervisor = new Agent({
  id: 'supervisor',
  name: 'Supervisor',
  instructions: 'Coordinate specialized agents.',
  model: 'openai/gpt-4o-mini',
  agents: {
    researchAgent,
    writingAgent,
  },
})

await supervisor.generate('Research and write a brief.', {
  maxSteps: 8,
  delegation: {
    messageFilter: ({ messages }) => messages.slice(-8),
  },
})
```

## Processors

```ts
import { TokenLimiter, UnicodeNormalizer } from '@mastra/core/processors'

const agent = new Agent({
  id: 'secure-agent',
  name: 'Secure Agent',
  instructions: '...',
  model: 'openai/gpt-4o-mini',
  inputProcessors: [
    new UnicodeNormalizer({ stripControlChars: true, collapseWhitespace: true }),
    new TokenLimiter(12_000),
  ],
})
```

## MCPClient

```ts
import { MCPClient } from '@mastra/mcp'

export const mcp = new MCPClient({
  id: 'my-mcp-client',
  servers: {
    demo: {
      command: 'npx',
      args: ['-y', 'some-mcp-server'],
    },
  },
})

const tools = await mcp.listTools()
```

## MCPServer

```ts
import { MCPServer } from '@mastra/mcp'

export const server = new MCPServer({
  id: 'my-mcp-server',
  name: 'My MCP Server',
  version: '1.0.0',
  tools: {},
  agents: {},
  workflows: {},
})
```

注册：

```ts
export const mastra = new Mastra({
  mcpServers: { server },
})
```
