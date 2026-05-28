import { mastra } from '../mastra/index'

const prompt = process.argv.slice(2).join(' ') || '我周末想从上海去杭州，两天一夜，预算 1800 元，喜欢安静一点的路线'

const agent = mastra.getAgentById('travel-agent')
const response = await agent.generate(prompt, {
  memory: {
    resource: 'demo-user',
    thread: 'cli-travel-chat',
  },
})

console.log(response.text)

