'use client'

import { useState, useEffect, useRef } from 'react'
import { InterviewHeader } from '@/components/InterviewHeader'
import { ChatInterface } from '@/components/ChatInterface'
import { SuggestedQuestions } from '@/components/SuggestedQuestions'
import { PasswordGate } from '@/components/PasswordGate'
import { ExportButton } from '@/components/ExportButton'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function InterviewPage({ params }: { params: { company: string } }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<Record<string, string[]>>({})
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const maxQuestions = 50

  const companyName = decodeURIComponent(params.company)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Load company-specific questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`/api/questions?company=${encodeURIComponent(companyName)}`)
        const data = await response.json()
        setSuggestedQuestions(data)
      } catch (error) {
        console.error('Failed to load questions:', error)
      }
    }

    if (isAuthenticated) {
      fetchQuestions()
    }
  }, [companyName, isAuthenticated])

  const handleAskQuestion = async (question: string) => {
    if (questionCount >= maxQuestions) {
      alert(`You've reached the maximum of ${maxQuestions} questions for this session.`)
      return
    }

    const userMessage: Message = {
      role: 'user',
      content: question,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setQuestionCount(prev => prev + 1)
    setIsLoading(true)

    // Create abort controller for this request
    const controller = new AbortController()
    setAbortController(controller)

    // Detect mobile for fallback to non-streaming
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const apiEndpoint = isMobile ? '/api/chat-simple' : '/api/chat'

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          company: companyName,
          history: messages
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      if (isMobile) {
        // Handle simple JSON response for mobile
        const data = await response.json()
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        // Handle streaming response for desktop
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let accumulatedText = ''

        // Create placeholder message
        const assistantMessage: Message = {
          role: 'assistant',
          content: '',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') break

                try {
                  const parsed = JSON.parse(data)
                  if (parsed.text) {
                    accumulatedText += parsed.text
                    // Update the last message with accumulated text
                    setMessages(prev => {
                      const updated = [...prev]
                      updated[updated.length - 1].content = accumulatedText
                      return updated
                    })
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        }
      }

      // Track usage
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: companyName,
          question
        })
      })
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted by user')
      } else {
        console.error('Error:', error)
        alert('Failed to get response. Please try again.')
      }
    } finally {
      setIsLoading(false)
      setAbortController(null)
    }
  }

  const handleStopGenerating = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <PasswordGate
        company={companyName}
        onAuthenticated={() => setIsAuthenticated(true)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto p-4">
        <InterviewHeader company={companyName} />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Interview Conversation
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    {questionCount} / {maxQuestions} questions
                  </span>
                  <ExportButton messages={messages} company={companyName} />
                </div>
              </div>

              <ChatInterface
                messages={messages}
                onAskQuestion={handleAskQuestion}
                onStopGenerating={handleStopGenerating}
                isLoading={isLoading}
                disabled={questionCount >= maxQuestions}
              />

              {/* Disclaimer */}
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500 italic">
                  ⚠️ This chatbot is experimental and can make mistakes. Please verify important information.
                </p>
              </div>
            </div>
          </div>

          {/* Suggested Questions Sidebar */}
          <div className="lg:col-span-1">
            <SuggestedQuestions
              onSelectQuestion={handleAskQuestion}
              questions={suggestedQuestions}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
