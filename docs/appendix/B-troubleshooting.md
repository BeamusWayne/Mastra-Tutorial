# B. 故障排查

## Studio 里看不到 Agent

检查：

- `src/mastra/index.ts` 是否导出了 `mastra`。
- Agent 是否注册到 `new Mastra({ agents: { ... } })`。
- TypeScript 是否有编译错误。
- `id` 是否重复。

## 模型调用失败

检查：

- `.env` 是否存在。
- API Key 名称是否和供应商要求一致。
- `model: 'provider/model-name'` 是否写对。
- 当前供应商是否支持你使用的 tool calling 或 structured output。

## Tool 没有被调用

常见原因：

- description 太模糊。
- instructions 没告诉 agent 什么时候使用工具。
- 输入 schema 太复杂或字段不清楚。
- 用户问题不需要工具。
- `.generate()` 或 `.stream()` 里限制了 `activeTools`。

排查方式：

- 在 Studio 看 tool call。
- 临时把 instructions 写得更明确。
- 单独测试 Tool 的 `execute`。
- 减少同类工具数量。

## Tool 参数不对

优先改 schema 和 description，而不是在 prompt 里补一堆自然语言。

建议：

- 给字段加 `.describe()`。
- 使用 enum 限定取值。
- 用 `strict: true`，前提是模型供应商支持。
- 在 `execute` 内做业务校验。

## Workflow 没有输出

检查：

- 是否调用了 `.commit()`。
- 每个 step 的 `outputSchema` 是否匹配实际返回。
- 上一步 output 是否满足下一步 input。
- 是否检查了 `result.status`。
- 是否进入 `suspended` 或 `failed` 状态。

## Memory 记不住

检查：

- 是否安装并配置了 storage。
- Agent 是否配置了 `memory: new Memory(...)`。
- 每次调用是否传入同一个 `resource` 和 `thread`。
- 是否把 thread id 给不同 resource 复用了。
- storage 是否在服务重启后丢失。

## MCP 连接失败

检查：

- stdio MCP 的 `command` 和 `args` 是否能在 shell 中单独运行。
- remote MCP 的 URL 是否可访问。
- token 是否通过环境变量传入。
- 多租户场景是否错误复用了全局凭据。
- 用完动态 MCPClient 后是否调用 `disconnect()`。

## 构建时报模块解析错误

检查 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "module": "ES2022",
    "moduleResolution": "bundler"
  }
}
```

不要在新 Mastra 项目里使用 CommonJS 配置。

