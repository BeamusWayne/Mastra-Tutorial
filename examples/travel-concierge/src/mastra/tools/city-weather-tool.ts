import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

const demoWeather: Record<string, { summary: string; temperatureCelsius: number; travelAdvice: string }> = {
  杭州: {
    summary: '多云，午后可能有短时小雨',
    temperatureCelsius: 23,
    travelAdvice: '适合西湖和茶园路线，建议准备折叠伞。',
  },
  苏州: {
    summary: '晴到多云，风力较小',
    temperatureCelsius: 25,
    travelAdvice: '适合园林和古城步行，注意防晒。',
  },
  南京: {
    summary: '晴，早晚温差明显',
    temperatureCelsius: 22,
    travelAdvice: '适合博物馆和历史街区，建议带薄外套。',
  },
}

export const cityWeatherTool = createTool({
  id: 'get-city-weather',
  description: '查询目的地示例天气信息，用于旅行规划时判断户外活动和装备建议。',
  inputSchema: z.object({
    city: z.string().describe('目的地城市名，例如杭州、苏州、南京'),
  }),
  outputSchema: z.object({
    city: z.string(),
    summary: z.string(),
    temperatureCelsius: z.number(),
    travelAdvice: z.string(),
  }),
  execute: async ({ city }) => {
    const weather = demoWeather[city] ?? {
      summary: '天气信息未知',
      temperatureCelsius: 24,
      travelAdvice: '请在出发前查询实时天气，并保留室内备选方案。',
    }

    return {
      city,
      ...weather,
    }
  },
})

