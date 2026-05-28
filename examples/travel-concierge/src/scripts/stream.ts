import { z } from 'zod'
import { mastra } from '../mastra/index'

const summarySchema = z.object({
  destination: z.string(),
  highlights: z.array(z.string()),
  estimatedBudgetCny: z.number(),
})

const prompt =
  process.argv.slice(2).join(' ') || '流式生成一个上海到苏州两天一夜旅行建议，预算 2000 元。'

const agent = mastra.getAgentById('travel-agent')

const stream = await agent.stream(prompt, {
  structuredOutput: {
    schema: summarySchema,
    jsonPromptInjection: true,
  },
  memory: {
    resource: 'demo-user',
    thread: 'cli-stream-output',
  },
})

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk)
}

console.log('\n\n--- structured object ---')
console.dir(await stream.object, { depth: null })

