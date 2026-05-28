import { Mastra } from '@mastra/core'
import { LibSQLStore } from '@mastra/libsql'
import { travelSupervisorAgent, travelReviewerAgent } from './agents/travel-supervisor-agent'
import { travelAgent } from './agents/travel-agent'
import { travelMcpServer } from './mcp/travel-mcp-server'
import { itineraryWorkflow } from './workflows/itinerary-workflow'

export const mastra = new Mastra({
  agents: { travelAgent, travelReviewerAgent, travelSupervisorAgent },
  workflows: { itineraryWorkflow },
  mcpServers: { travelMcpServer },
  storage: new LibSQLStore({
    id: 'travel-concierge-storage',
    url: 'file:./travel-concierge.db',
  }),
})
