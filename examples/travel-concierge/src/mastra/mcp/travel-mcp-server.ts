import { MCPServer } from '@mastra/mcp'
import { travelAgent } from '../agents/travel-agent'
import { budgetTool } from '../tools/budget-tool'
import { cityWeatherTool } from '../tools/city-weather-tool'
import { itineraryWorkflow } from '../workflows/itinerary-workflow'

export const travelMcpServer = new MCPServer({
  id: 'travel-mcp-server',
  name: 'Travel MCP Server',
  version: '1.0.0',
  agents: { travelAgent },
  tools: {
    cityWeatherTool,
    budgetTool,
  },
  workflows: { itineraryWorkflow },
})

