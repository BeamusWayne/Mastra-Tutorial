import { Agent } from '@mastra/core/agent'
import { Memory } from '@mastra/memory'
import { z } from 'zod'
import { budgetTool } from '../tools/budget-tool'
import { cityWeatherTool } from '../tools/city-weather-tool'

const requestContextSchema = z.object({
  userId: z.string().optional(),
  locale: z.enum(['zh-CN', 'en-US']).optional(),
  tier: z.enum(['free', 'pro']).optional(),
})

export const travelAgent = new Agent<
  'travel-agent',
  {
    cityWeatherTool: typeof cityWeatherTool
    budgetTool: typeof budgetTool
  },
  undefined,
  unknown
>({
  id: 'travel-agent',
  name: 'Travel Agent',
  description: '中文旅行规划助手，能结合天气、预算和偏好生成短途旅行建议。',
  requestContextSchema: requestContextSchema as never,
  instructions: ({ requestContext }) => {
    const locale = requestContext?.get('locale') === 'en-US' ? 'en-US' : 'zh-CN'
    const tier = requestContext?.get('tier') === 'pro' ? 'pro' : 'free'

    if (locale === 'en-US') {
      return `
You are a careful travel planning assistant.

Rules:
- Ask a short clarification question when origin, destination, days, budget, or preferences are missing.
- Use cityWeatherTool when weather may affect outdoor plans.
- Use budgetTool when budget feasibility matters.
- The current user tier is ${tier}; mention limitations only when they affect the answer.
- Do not perform payments, bookings, messaging, or irreversible actions.
`
    }

    return `
你是一名严谨的中文旅行规划助手。

工作规则：
- 如果用户缺少出发地、目的地、天数、预算或偏好，先提出简短澄清问题。
- 当需要判断目的地天气或户外安排时，使用 cityWeatherTool。
- 当需要估算预算时，使用 budgetTool。
- 当前用户套餐是 ${tier}；只有当套餐限制影响任务时才说明。
- 不要编造实时价格；工具返回的是估算值时要说明是估算。
- 不要执行付款、预订、发消息等不可逆操作。

最终回答使用 Markdown，包含：
1. 概览
2. 每日安排
3. 预算拆分
4. 风险和备选方案
`
  },
  model: process.env.MASTRA_MODEL ?? 'openai/gpt-4o-mini',
  tools: {
    cityWeatherTool,
    budgetTool,
  },
  memory: new Memory({
    options: {
      lastMessages: 20,
      workingMemory: {
        enabled: true,
        template: `
# 用户旅行偏好
- 常用出发地：
- 偏好节奏：
- 酒店偏好：
- 饮食禁忌：
- 预算习惯：
`,
      },
    },
  }),
})
