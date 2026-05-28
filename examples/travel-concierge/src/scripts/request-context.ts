import { RequestContext } from '@mastra/core/request-context'
import { mastra } from '../mastra/index'
import type { TravelRequestContext } from '../mastra/types/request-context'

const prompt =
  process.argv.slice(2).join(' ') ||
  '我想从上海去南京玩 6 天，预算 3500 元，帮我判断是否合理。'

const requestContext = new RequestContext<TravelRequestContext>()
requestContext.set('userId', 'demo-user')
requestContext.set('locale', 'zh-CN')
requestContext.set('tier', 'free')

const agent = mastra.getAgentById('travel-agent')
const response = await agent.generate(prompt, {
  requestContext,
  memory: {
    resource: requestContext.get('userId') ?? 'demo-user',
    thread: 'cli-request-context',
  },
})

console.log(response.text)

