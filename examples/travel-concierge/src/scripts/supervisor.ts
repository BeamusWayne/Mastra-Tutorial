import { mastra } from '../mastra/index'

const prompt =
  process.argv.slice(2).join(' ') ||
  '我想带父母从上海去苏州两天一夜，预算 2500 元，想轻松一点，请给出稳妥方案。'

const supervisor = mastra.getAgentById('travel-supervisor-agent')

const result = await supervisor.generate(prompt, {
  maxSteps: 8,
  delegation: {
    onDelegationStart: ({ primitiveId, prompt, iteration }) => {
      console.log(`[delegation:start] #${iteration} -> ${primitiveId}`)

      if (iteration > 6) {
        return {
          proceed: false,
          rejectionReason: '请基于已有信息收敛，不要继续委派。',
        }
      }

      if (primitiveId === 'travel-reviewer-agent') {
        return {
          proceed: true,
          modifiedPrompt: `${prompt}\n\n请特别检查预算、天气、交通时间和老人小孩是否适合。`,
          modifiedMaxSteps: 3,
        }
      }

      return { proceed: true }
    },
    onDelegationComplete: ({ primitiveId, success, duration }) => {
      console.log(`[delegation:done] ${primitiveId} success=${success} durationMs=${duration}`)
    },
    messageFilter: ({ messages }) => messages.slice(-8),
  },
})

console.log('\n--- final answer ---\n')
console.log(result.text)

