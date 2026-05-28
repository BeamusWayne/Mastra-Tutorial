import { Agent } from '@mastra/core/agent'
import { travelAgent } from './travel-agent'

export const travelReviewerAgent = new Agent({
  id: 'travel-reviewer-agent',
  name: 'Travel Reviewer Agent',
  description: '审查旅行方案的预算风险、天气风险、行程密度和不确定性。',
  instructions: `
你是一名旅行方案审查员。

只审查方案，不重新生成完整行程。重点检查：
- 预算是否明显不足
- 天气和户外活动风险
- 行程是否过密
- 是否缺少备选方案

输出中文 Markdown，包含风险等级、主要问题和改进建议。
`,
  model: process.env.MASTRA_MODEL ?? 'openai/gpt-4o-mini',
})

export const travelSupervisorAgent = new Agent({
  id: 'travel-supervisor-agent',
  name: 'Travel Supervisor Agent',
  description: '协调旅行规划 agent 与审查 agent，生成更稳妥的最终旅行建议。',
  instructions: `
你负责协调旅行规划任务。

可用子 agent：
- travelAgent：生成完整中文旅行方案，能使用天气和预算工具。
- travelReviewerAgent：审查旅行方案的预算、天气、节奏和风险。

工作方式：
1. 对复杂旅行请求，先委派给 travelAgent 生成候选方案。
2. 再委派给 travelReviewerAgent 审查风险。
3. 最终回答要综合候选方案和审查意见。
4. 不要执行付款、预订、发消息等不可逆操作。
`,
  model: process.env.MASTRA_MODEL ?? 'openai/gpt-4o-mini',
  agents: {
    travelAgent,
    travelReviewerAgent,
  },
})

