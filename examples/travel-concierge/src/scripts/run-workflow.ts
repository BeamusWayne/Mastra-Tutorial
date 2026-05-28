import { mastra } from '../mastra/index'

const workflow = mastra.getWorkflow('itineraryWorkflow')
const run = await workflow.createRun()

const result = await run.start({
  inputData: {
    origin: '上海',
    destination: '杭州',
    days: 2,
    budgetCny: 1800,
    preference: '安静、不要太赶、喜欢自然风景',
  },
})

console.dir(result, { depth: null })

