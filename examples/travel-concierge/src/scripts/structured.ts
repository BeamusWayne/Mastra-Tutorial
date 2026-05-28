import { z } from 'zod'
import { mastra } from '../mastra/index'

const itinerarySchema = z.object({
  destination: z.string(),
  days: z.array(
    z.object({
      day: z.number(),
      theme: z.string(),
      activities: z.array(z.string()),
    }),
  ),
  estimatedBudgetCny: z.number(),
  riskNotes: z.array(z.string()),
})

const prompt =
  process.argv.slice(2).join(' ') || '给我一个上海到杭州两天一夜的轻松行程，预算 1800 元。'

const agent = mastra.getAgentById('travel-agent')

const result = await agent.generate(prompt, {
  structuredOutput: {
    schema: itinerarySchema,
    jsonPromptInjection: true,
    errorStrategy: 'fallback',
    fallbackValue: {
      destination: '未知',
      days: [],
      estimatedBudgetCny: 0,
      riskNotes: ['结构化输出失败，请查看原始文本或重试。'],
    },
  },
  memory: {
    resource: 'demo-user',
    thread: 'cli-structured-output',
  },
})

console.dir(result.object, { depth: null })

