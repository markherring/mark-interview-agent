import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function loadIdentity(): string {
  const identityPath = join(process.cwd(), '..', 'core', 'identity.md')
  try {
    return readFileSync(identityPath, 'utf-8')
  } catch (error) {
    console.error('Failed to load identity:', error)
    return '[Identity file not found]'
  }
}

function loadStandardAnswers(): string {
  const standardAnswersDir = join(process.cwd(), '..', 'core', 'standard_answers')

  try {
    const files = readdirSync(standardAnswersDir)
      .filter(f => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md')
      .sort()

    let content = ''
    files.forEach(file => {
      try {
        const filePath = join(standardAnswersDir, file)
        const fileContent = readFileSync(filePath, 'utf-8')
        content += `\n${'='.repeat(60)}\n${fileContent}\n${'='.repeat(60)}\n`
      } catch (error) {
        // File might not exist, skip it
      }
    })

    return content || '[No standard answers found]'
  } catch (error) {
    console.error('Failed to load standard answers:', error)
    return '[No standard answers found]'
  }
}

function loadCompanyContext(company: string): string {
  const companyFile = company.toLowerCase().replace(/[\s.]+/g, '_')
  const contextPath = join(process.cwd(), '..', 'companies', `${companyFile}.md`)

  try {
    return readFileSync(contextPath, 'utf-8')
  } catch (error) {
    console.error('Failed to load company context:', contextPath, error)
    return ''
  }
}

function loadSystemPromptTemplate(): string {
  const systemPromptPath = join(process.cwd(), '..', 'agent', 'system_prompt.md')

  try {
    return readFileSync(systemPromptPath, 'utf-8')
  } catch (error) {
    console.error('Failed to load system prompt:', error)
    return ''
  }
}

function buildSystemPrompt(company: string): string | null {
  const template = loadSystemPromptTemplate()
  if (!template) return null

  const identity = loadIdentity()
  const companyContext = loadCompanyContext(company)
  const standardAnswers = loadStandardAnswers()

  if (!companyContext) return null

  // Format company name: kore_ai -> Kore.Ai
  const companyDisplayName = company.replace(/_/g, '.').replace(/\b\w/g, c => c.toUpperCase())

  // Replace all placeholders — matching the Python engine behavior
  let systemPrompt = template
  systemPrompt = systemPrompt.replace(/{COMPANY_NAME}/g, companyDisplayName)
  systemPrompt = systemPrompt.replace('{IDENTITY}', identity)
  systemPrompt = systemPrompt.replace('{COMPANY_CONTEXT}', companyContext)
  systemPrompt = systemPrompt.replace('{STANDARD_ANSWERS}', standardAnswers)
  systemPrompt = systemPrompt.replace('{TONE_GUIDANCE}',
    "Maintain Mark's direct, candid style while showing genuine interest in the company's mission and technical challenges."
  )

  return systemPrompt
}

export async function POST(request: Request) {
  try {
    const { question, company, history } = await request.json()

    console.log('=== API Request ===')
    console.log('Company:', company)
    console.log('Question:', question)
    console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY)

    const systemPrompt = buildSystemPrompt(company)
    if (!systemPrompt) {
      console.error('Failed to build system prompt for company:', company)
      return NextResponse.json(
        { error: 'Company context not found' },
        { status: 404 }
      )
    }

    console.log('System prompt built successfully')

    const messages = [
      // Add coaching message if this is the first user message (no history yet)
      ...(history.length === 0 ? [
        {
          role: 'user' as const,
          content: "CRITICAL INSTRUCTIONS: 150-250 words max. Each point = bold label + ONE sentence. Max 2-3 points. No closing/summary paragraph - after the last point, stop. Never mention total years of experience."
        },
        {
          role: 'assistant' as const,
          content: "Got it. Bold label + one sentence per point, no summary at the end, stop after the last point."
        }
      ] : []),
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
      max_tokens: 1200,
      system: systemPrompt,
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
