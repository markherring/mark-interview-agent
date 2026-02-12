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

  try {
    const contextContent = readFileSync(contextPath, 'utf-8')
    const systemPrompt = readFileSync(systemPromptPath, 'utf-8')

    return {
      systemPrompt: systemPrompt.replace('{COMPANY_NAME}', company),
      context: contextContent
    }
  } catch (error) {
    console.error('Error loading context:', error)
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
      // Skip
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

    const contextData = loadContext(company)
    if (!contextData) {
      return NextResponse.json(
        { error: 'Company context not found' },
        { status: 404 }
      )
    }

    const standardAnswers = loadStandardAnswers()
    const reference = loadReference()

    const messages = [
      {
        role: 'user' as const,
        content: contextData.context + standardAnswers + reference
      },
      // Add coaching message if this is the first user message (no history yet)
      ...(history.length === 0 ? [
        {
          role: 'user' as const,
          content: "CRITICAL INSTRUCTIONS: Keep ALL responses 250-400 words max. Each bullet point = 2-3 sentences only (not paragraphs). NEVER add 'What Excites Me About [Company]' or 'For [Company] specifically' sections at the end - just answer the question and stop. Never mention '30+ years'. Follow these rules strictly."
        },
        {
          role: 'assistant' as const,
          content: "Got it. Tight answers with 2-3 sentence bullets. I'll answer the question directly without adding company-specific sections at the end."
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

    console.log('Calling Anthropic API...')
    console.log('Model:', 'claude-sonnet-4-20250514')
    console.log('Message count:', messages.length)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: contextData.systemPrompt,
      messages: messages
    })

    console.log('✓ Anthropic API response received')

    const responseText = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Unable to generate response'

    return NextResponse.json({ response: responseText })
  } catch (error: any) {
    console.error('✗ Error in chat API:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}
