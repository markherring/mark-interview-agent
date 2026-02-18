import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  messages: Message[]
  onAskQuestion: (question: string) => void
  onStopGenerating?: () => void
  isLoading: boolean
  disabled: boolean
  streamingIndex?: number // index of the message currently being streamed
}

export function ChatInterface({ messages, onAskQuestion, onStopGenerating, isLoading, disabled, streamingIndex }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const lastScrollRef = useRef(0)

  const scrollToBottom = () => {
    // Throttle scrolling during streaming to avoid overwhelming mobile Safari
    const now = Date.now()
    if (now - lastScrollRef.current < 300) return
    lastScrollRef.current = now
    // Use scrollTop on the container instead of scrollIntoView to prevent
    // mobile Safari from scrolling the entire page down to suggested questions
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled && !isLoading) {
      onAskQuestion(input.trim())
      setInput('')
    }
  }

  return (
    <div className="flex flex-col h-[480px]">
      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto mb-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-base font-medium mb-2">Welcome to Mark's Interactive Interview</p>
            <p className="text-sm">Ask any question about Mark's background, experience, or how he approaches marketing challenges.</p>
            <p className="text-sm mt-2">Or select a suggested question from the sidebar to get started.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg px-3 py-2 ${
                  message.role === 'user'
                    ? 'bg-mark-blue text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-sm">{message.content}</p>
                ) : streamingIndex === index ? (
                  // Plain text during streaming — ReactMarkdown on every frame crashes mobile Safari
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {message.content}
                  </div>
                ) : (
                  <div className="markdown-body prose prose-sm max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
                <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        {isLoading && streamingIndex === undefined && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t pt-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={disabled ? "Question limit reached" : "Ask Mark a question..."}
            disabled={disabled || isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mark-blue focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={onStopGenerating}
              className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <rect x="6" y="6" width="8" height="8" />
              </svg>
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || disabled}
              className="px-5 py-2 bg-mark-blue text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Ask
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
