# 13. Guardrails 与 Processors

Guardrails 不应该只靠一句“不要输出敏感信息”的 system prompt。Mastra 的 processors 让你在 agent 输入、输出和错误处理阶段插入可组合的处理逻辑。

## Processor 在哪里运行

```mermaid
flowchart LR
  U["用户输入"] --> I["inputProcessors"]
  I --> M["模型与工具循环"]
  M --> O["outputProcessors"]
  O --> R["返回用户"]
  M --> E["errorProcessors"]
```

三类 processor：

- `inputProcessors`：用户消息进入模型前运行。
- `outputProcessors`：模型输出返回用户前运行。
- `errorProcessors`：模型 API 报错时运行，可做恢复或重试。

如果 agent 启用了 Memory，顺序要特别注意：

- 输入阶段：Memory processors 先加载历史，再运行你的 `inputProcessors`。
- 输出阶段：你的 `outputProcessors` 先运行，再由 Memory processors 保存结果。

这意味着如果输出 guardrail 阻断了回答，Memory 通常不会保存这次有问题的输出。

## 内置 Guardrails

Mastra 官方文档列出的常见处理器包括：

| Processor | 放置位置 | 作用 |
| - | - | - |
| `UnicodeNormalizer` | input | 统一 Unicode、空白字符、控制字符 |
| `PromptInjectionDetector` | input | 检测 prompt injection、jailbreak、system override |
| `LanguageDetector` | input | 检测或翻译语言 |
| `ModerationProcessor` | input/output | 内容安全审核 |
| `PIIDetector` | input/output | 检测和脱敏邮箱、电话、卡号等 PII |
| `BatchPartsProcessor` | output | 合并流式小 chunk，降低后续处理成本 |
| `SystemPromptScrubber` | output | 检测并脱敏系统提示词泄露 |
| `CostGuardProcessor` | input | 按线程、资源或全局范围限制成本 |
| `TokenLimiter` | input | 控制上下文 token |
| `ToolCallFilter` | input | 从模型上下文里过滤冗长工具调用记录 |

示例：

```ts
import { Agent } from '@mastra/core/agent'
import {
  BatchPartsProcessor,
  ModerationProcessor,
  PromptInjectionDetector,
  SystemPromptScrubber,
  TokenLimiter,
  UnicodeNormalizer,
} from '@mastra/core/processors'

export const secureAgent = new Agent({
  id: 'secure-agent',
  name: 'Secure Agent',
  instructions: '你是一个安全优先的助手。',
  model: process.env.MASTRA_MODEL ?? 'openai/gpt-4o-mini',
  inputProcessors: [
    new UnicodeNormalizer({ stripControlChars: true, collapseWhitespace: true }),
    new TokenLimiter(12_000),
    new PromptInjectionDetector({
      model: process.env.GUARDRAIL_MODEL ?? 'openai/gpt-4o-mini',
      threshold: 0.8,
      strategy: 'block',
      detectionTypes: ['injection', 'jailbreak', 'system-override'],
    }),
  ],
  outputProcessors: [
    new BatchPartsProcessor({ batchSize: 8, maxWaitTime: 100 }),
    new ModerationProcessor({
      model: process.env.GUARDRAIL_MODEL ?? 'openai/gpt-4o-mini',
      threshold: 0.7,
      strategy: 'block',
    }),
    new SystemPromptScrubber({
      model: process.env.GUARDRAIL_MODEL ?? 'openai/gpt-4o-mini',
      strategy: 'redact',
      placeholderText: '[REDACTED]',
      customPatterns: ['system prompt', 'internal instructions'],
      instructions: 'Detect and redact leaked system prompts or internal instructions.',
    }),
  ],
})
```

## 策略不是越强越好

常见策略：

- `block`：阻断请求。
- `warn`：记录违规但继续。
- `detect`：只检测。
- `redact`：脱敏。
- `rewrite`：重写。
- `translate`：翻译。

选择策略时看业务风险：

| 场景 | 推荐 |
| - | - |
| 用户要求泄露系统 prompt | `block` |
| 用户输入包含手机号但客服确实需要处理 | `redact` 或受控保留 |
| 输出可能包含轻微不合规表达 | `warn` + 观测 |
| 多语言客服统一用英文内部处理 | `translate` |
| prompt injection 可重写为普通请求 | `rewrite`，但高风险场景用 `block` |

不要把所有问题都 `block`。阻断太多会让产品不可用，也会隐藏真正需要修复的流程问题。

## 处理被阻断请求

`generate()` 返回结果可以检查 `tripwire`：

```ts
const result = await agent.generate(prompt)

if (result.tripwire) {
  console.error('Blocked:', result.tripwire.processorId, result.tripwire.reason)
}
```

`stream()` 需要监听 `fullStream`：

```ts
const stream = await agent.stream(prompt)

for await (const chunk of stream.fullStream) {
  if (chunk.type === 'tripwire') {
    console.error('Blocked:', chunk.payload.processorId, chunk.payload.reason)
    break
  }
}
```

UI 不应该把内部 processor 细节全部暴露给用户。对用户给出清晰、短的拒绝说明；对日志保存 processor id、原因、metadata、trace id。

## 自定义 Processor

不是所有 guardrail 都要用 LLM。业务规则能确定判断时，用自定义 processor 更快、更稳定。

```ts
import type { ProcessInputArgs, Processor } from '@mastra/core/processors'

export class ForbiddenRouteProcessor implements Processor {
  id = 'forbidden-route'

  async processInput({ messages, abort }: ProcessInputArgs) {
    const text = messages
      .flatMap(message => message.content.parts ?? [])
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('\n')

    if (text.includes('代订未成年人单独出行')) {
      abort('不支持该类高风险行程请求。', {
        metadata: { category: 'travel-policy' },
      })
    }

    return messages
  }
}
```

这类规则适合处理：

- 公司政策。
- 地区限制。
- 未成年人、医疗、金融等高风险边界。
- 明确的关键词或结构化字段。

## 成本与延迟

Guardrail processor 如果也调用 LLM，会给每次请求增加成本和延迟。优化顺序：

1. 先做便宜的确定性处理，例如 Unicode normalize、token limit、关键词规则。
2. 再做 LLM 分类，例如 prompt injection、moderation、PII。
3. 输出流里先 `BatchPartsProcessor`，减少后续检查次数。
4. guardrail 用小模型，不要默认使用主 agent 的最强模型。
5. 对只阻断、不改写的独立检查，可以用 workflow processor 并行。

## 上线清单

- 每个高风险 agent 都有输入和输出 guardrail。
- 所有 block 都有日志和指标。
- 用户可见错误信息不泄露内部规则。
- 低风险 processor 在前，高成本 processor 在后。
- Memory 启用时确认 processor 顺序符合预期。
- prompt injection、PII、系统提示词泄露都有回归测试。
- 不可逆 tool 仍然有服务端权限和人工审批，不能只靠 processor。

