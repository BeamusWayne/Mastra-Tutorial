import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { TravelRequestContext } from '../types/request-context'

const requestContextSchema = z.object({
  userId: z.string().optional(),
  locale: z.enum(['zh-CN', 'en-US']).optional(),
  tier: z.enum(['free', 'pro']).optional(),
})

export const budgetTool = createTool({
  id: 'estimate-trip-budget',
  description: '按城市、天数和旅行风格估算人民币预算。用于判断行程是否可能超预算。',
  requestContextSchema,
  inputSchema: z.object({
    destination: z.string().describe('目的地城市'),
    days: z.number().int().min(1).max(14).describe('旅行天数'),
    style: z.enum(['budget', 'balanced', 'comfort']).describe('预算风格'),
  }),
  outputSchema: z.object({
    destination: z.string(),
    days: z.number(),
    estimatedCostCny: z.number(),
    breakdown: z.object({
      transport: z.number(),
      hotel: z.number(),
      food: z.number(),
      activities: z.number(),
    }),
  }),
  execute: async ({ destination, days, style }, context) => {
    const contextTier = context?.requestContext?.get('tier') as TravelRequestContext['tier'] | undefined
    const tier = contextTier === 'pro' ? 'pro' : 'free'
    const maxDays = tier === 'pro' ? 14 : 5

    if (days > maxDays) {
      throw new Error(`当前 ${tier} 套餐最多只能估算 ${maxDays} 天行程。`)
    }

    const multiplier = style === 'budget' ? 0.8 : style === 'comfort' ? 1.35 : 1
    const hotelNights = Math.max(days - 1, 0)
    const transport = Math.round(320 * multiplier)
    const hotel = Math.round(hotelNights * 420 * multiplier)
    const food = Math.round(days * 180 * multiplier)
    const activities = Math.round(days * 160 * multiplier)

    return {
      destination,
      days,
      estimatedCostCny: transport + hotel + food + activities,
      breakdown: {
        transport,
        hotel,
        food,
        activities,
      },
    }
  },
})
