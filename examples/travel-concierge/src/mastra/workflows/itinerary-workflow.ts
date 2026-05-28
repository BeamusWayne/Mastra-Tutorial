import { createStep, createWorkflow } from '@mastra/core/workflows'
import { z } from 'zod'

const tripInputSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  days: z.number().int().min(1).max(14),
  budgetCny: z.number().positive(),
  preference: z.string().optional(),
})

const normalizeRequest = createStep({
  id: 'normalize-request',
  description: '标准化旅行需求',
  inputSchema: tripInputSchema,
  outputSchema: z.object({
    route: z.string(),
    destination: z.string(),
    days: z.number(),
    budgetCny: z.number(),
    preference: z.string(),
  }),
  execute: async ({ inputData }) => {
    return {
      route: `${inputData.origin} -> ${inputData.destination}`,
      destination: inputData.destination,
      days: inputData.days,
      budgetCny: inputData.budgetCny,
      preference: inputData.preference ?? '轻松、低风险、不要太赶',
    }
  },
})

const buildPlan = createStep({
  id: 'build-plan',
  description: '调用旅行助手生成候选行程',
  inputSchema: normalizeRequest.outputSchema,
  outputSchema: z.object({
    route: z.string(),
    destination: z.string(),
    budgetCny: z.number(),
    estimatedCostCny: z.number(),
    summary: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgentById('travel-agent')
    const response = await agent.generate(
      `请为 ${inputData.route} 生成 ${inputData.days} 天旅行方案。预算 ${inputData.budgetCny} 元。偏好：${inputData.preference}`,
      {
        memory: {
          resource: 'demo-user',
          thread: 'workflow-itinerary',
        },
      },
    )

    const estimatedCostCny = Math.round(inputData.budgetCny * 0.88)

    return {
      route: inputData.route,
      destination: inputData.destination,
      budgetCny: inputData.budgetCny,
      estimatedCostCny,
      summary: response.text,
    }
  },
})

const checkBudget = createStep({
  id: 'check-budget',
  description: '校验预算是否满足行程',
  inputSchema: buildPlan.outputSchema,
  outputSchema: z.object({
    route: z.string(),
    summary: z.string(),
    estimatedCostCny: z.number(),
    withinBudget: z.boolean(),
    warning: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    const withinBudget = inputData.estimatedCostCny <= inputData.budgetCny

    return {
      route: inputData.route,
      summary: inputData.summary,
      estimatedCostCny: inputData.estimatedCostCny,
      withinBudget,
      warning: withinBudget ? undefined : '估算费用超过预算，请减少高价活动或住宿标准。',
    }
  },
})

export const itineraryWorkflow = createWorkflow({
  id: 'build-itinerary',
  description: '生成并校验短途旅行行程',
  inputSchema: tripInputSchema,
  outputSchema: checkBudget.outputSchema,
})
  .then(normalizeRequest)
  .then(buildPlan)
  .then(checkBudget)
  .commit()

