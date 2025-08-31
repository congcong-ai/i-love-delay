'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTaskStore } from '@/lib/stores/task-store'

interface TaskFormProps {
  onTaskAdded?: () => void
}

export function TaskForm({ onTaskAdded }: TaskFormProps) {
  const [taskName, setTaskName] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { addTask, getTaskHistory } = useTaskStore()

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const history = await getTaskHistory()
        setSuggestions(history.slice(0, 5))
      } catch (error) {
        console.error('Failed to load task history:', error)
      }
    }
    
    loadSuggestions()
  }, [getTaskHistory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskName.trim()) return

    await addTask(taskName)
    setTaskName('')
    setShowSuggestions(false)
    onTaskAdded?.()
  }

  const handleSuggestionClick = (suggestion: string) => {
    setTaskName(suggestion)
    setShowSuggestions(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTaskName(value)
    setShowSuggestions(value.length > 0 && suggestions.length > 0)
  }

  const t = useTranslations('tasks')
  
  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder={t('whatToProcrastinate')}
            value={taskName}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(taskName.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full"
          />
          
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <Button 
          type="submit" 
          size="icon"
          disabled={!taskName.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={20} />
        </Button>
      </form>
    </div>
  )
}