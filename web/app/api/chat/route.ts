import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function loadContext(company: string) {
  const contextPath = join(process.cwd(), '..', 'companies', `${company.toLowerCase().replace(/[\s.]+/g, '_')}.md`)
  const systemPromptPath = join(process.cwd(), '..', 'agent', 'system_prompt.md')

  console.log('Attempting to load:')
  console.log('  Context path:', contextPath)
  console.log('  System prompt path:', systemPromptPath)

  try {
    const contextContent = readFileSync(contextPath, 'utf-8')
    const systemPrompt = readFileSync(systemPromptPath, 'utf-8')

    console.log('✓ Files loaded successfully')

    return {
      systemPrompt: systemPrompt.replace('{COMPANY_NAME}', company),
      context: contextContent
    }
  } catch (error) {
    console.error('✗ Error loading context:', error)
    return null
  }
}

function loadStandardAnswers() {
  const standardAnswersDir = join(process.cwd(), '..', 'core', 'standard_answers')
  const files = [
    '90-day-plan.md',
    'career-background.md',
    'diagnostic-methodology.md',
    'marketing-org-hiring.md'
  ]

  let content = '\n\n## STANDARD ANSWERS\n\n'

  files.forEach(file => {
    try {
      const filePath = join(standardAnswersDir, file)
      const fileContent = readFileSync(filePath, 'utf-8')
      content += `\n### ${file}\n${fileContent}\n`
    } catch (error) {
      // File might not exist, skip it
    }
  })

  return content
}

function loadReference() {
  const referencePath = join(process.cwd(), '..', 'core', 'reference', 'expanded-work-history.md')

  try {
    const content = readFileSync(referencePath, 'utf-8')
    return `\n\n## EXPANDED WORK HISTORY\n\n${content}\n`
  } catch (error) {
    return ''
  }
}

export async function POST(request: Request) {
  try {
    const { question, company, history } = await request.json()

    console.log('=== API Request ===')
    console.log('Company:', company)
    console.log('Question:', question)
    console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY)
    console.log('Working directory:', process.cwd())

    const contextData = loadContext(company)
    if (!contextData) {
      console.error('Failed to load context for company:', company)
      return NextResponse.json(
        { error: 'Company context not found' },
        { status: 404 }
      )
    }

    console.log('Context loaded successfully')

    const standardAnswers = loadStandardAnswers()
    const reference = loadReference()

    const messages = [
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: contextData.context + standardAnswers + reference,
            cache_control: { type: 'ephemeral' as const }
          }
        ]
      },
      ...history.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: question
      }
    ]

    // Create streaming response
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: contextData.systemPrompt,
          cache_control: { type: 'ephemeral' }
        }
      ] as any, // Type assertion for prompt caching support
      messages: messages
    })

    // Convert to ReadableStream for Next.js
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
