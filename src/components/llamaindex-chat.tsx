'use client'

import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Upload, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function LlamaIndexChat() {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload file')
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `File ${file.name} uploaded successfully. You can now ask questions about it.`
      }])
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload file'
      setError(message)
      console.error('Upload error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get response'
      setError(message)
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex items-center gap-2 mb-4">
        <Input
          type="file"
          className="hidden"
          id="file-upload"
          onChange={handleFileUpload}
          accept=".pdf,.txt,.doc,.docx"
        />
        <Button
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={loading}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4 border rounded-lg mb-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.role === 'assistant' 
                ? 'bg-muted p-3 rounded-lg' 
                : 'pl-3'
            }`}
          >
            <p className="text-sm font-semibold mb-1">
              {message.role === 'assistant' ? 'Assistant' : 'You'}:
            </p>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your documents..."
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          disabled={loading}
        />
        <Button onClick={handleSubmit} disabled={loading || !input.trim()}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  )
} 