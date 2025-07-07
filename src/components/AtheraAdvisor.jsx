import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PaperAirplaneIcon as Send, 
  MinusIcon as Minimize2, 
  PlusIcon as Maximize2, 
  XMarkIcon as X, 
  SparklesIcon as Bot, 
  CheckCircleIcon as CheckCircle2, 
  ExclamationTriangleIcon as AlertCircle, 
  AcademicCapIcon as Brain, 
  ShieldCheckIcon as Shield, 
  ChartBarIcon as BarChart, 
  UserCircleIcon as UserCircle, 
  CogIcon as Settings, 
  BoltIcon as Zap, 
  LightBulbIcon as Lightbulb, 
  ArrowPathIcon as RotateCcw, 
  TrashIcon as Trash2 
} from '@heroicons/react/24/outline'
import { cn } from '../lib/utils.js'
import { useTheme } from '../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import Switch from './ui/Switch'

const LIFE_RULES = `
You are Athera, a productivity and life advisor for the Lucen app. Your role is to help users:

1. **Productivity Enhancement**: Help with focus, time management, and productivity strategies
2. **App Management**: Assist with blocking distracting apps and setting healthy usage limits  
3. **Life Guidance**: Provide thoughtful advice on decision-making and life choices
4. **Technical Assistance**: Help with theme changes and app features

When users ask for advice, provide thoughtful, actionable guidance. When they request actions like "change theme" or "block apps", respond helpfully and guide them appropriately.

Always be encouraging, supportive, and focused on helping users achieve their goals.
`

const AtheraAdvisor = () => {
  const [isOpen, setIsOpen] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [agenticMode, setAgenticMode] = useState(false)
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()

  // Initialize messages
  useEffect(() => {
    const storedMessages = localStorage.getItem('athera-advisor-messages')
    const storedAgenticMode = localStorage.getItem('athera-agentic-mode') === 'true'
    
    setAgenticMode(storedAgenticMode)
    
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages))
    } else {
      const welcomeMessage = storedAgenticMode
        ? 'Hello! I\'m your Agentic Athera Advisor. I can provide productivity guidance AND take actions for you! Try: "Change theme", "Help me focus", or ask for advice like "Should I take a break?". How can I help you today?'
        : 'Hello! I\'m Athera, your productivity advisor. Ask for guidance on focus, productivity, and life decisions. I\'m here to help you stay on track with your goals!'
      
      setMessages([
        { 
          role: 'assistant', 
          content: welcomeMessage,
          timestamp: new Date()
        }
      ])
    }
  }, [])

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('athera-advisor-messages', JSON.stringify(messages))
    }
  }, [messages])

  useEffect(() => {
    localStorage.setItem('athera-agentic-mode', agenticMode.toString())
  }, [agenticMode])

  // Toggle agentic mode
  const handleAgenticModeToggle = (enabled) => {
    setAgenticMode(enabled)
    
    const modeMessage = enabled 
      ? 'Agentic mode enabled! I can now take actions for you. Try commands like "Change theme", "Block distracting apps", or "Navigate to dashboard"'
      : 'Agentic mode disabled. I\'ll focus on providing productivity guidance and advice.'
    
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: modeMessage,
      timestamp: new Date()
    }])
  }

  // Clear conversation history
  const handleClearHistory = () => {
    setMessages([])
    
    const welcomeMessage = agenticMode
      ? 'Hello! I\'m your Agentic Athera Advisor. I can provide productivity guidance AND take actions for you! Try: "Change theme", "Help me focus", or ask for advice like "Should I take a break?". How can I help you today?'
      : 'Hello! I\'m Athera, your productivity advisor. Ask for guidance on focus, productivity, and life decisions. I\'m here to help you stay on track with your goals!'
    
    setMessages([{ 
      role: 'assistant', 
      content: welcomeMessage,
      timestamp: new Date()
    }])
    
    localStorage.removeItem('athera-advisor-messages')
  }

  // Generate AI response
  const generateResponse = async (userMessage) => {
    const lowerMessage = userMessage.toLowerCase()
    
    // Handle agentic actions
    if (agenticMode) {
      if (lowerMessage.includes('change theme') || lowerMessage.includes('toggle theme') || lowerMessage.includes('switch theme')) {
        toggleTheme()
        return `✅ Theme changed to ${isDark ? 'light' : 'dark'} mode! Your interface should now reflect the new theme. Is there anything else I can help you with?`
      }
      
      if (lowerMessage.includes('block apps') || lowerMessage.includes('app management') || lowerMessage.includes('navigate to block')) {
        navigate('/block-apps')
        return `✅ Navigating to the Block Apps page where you can manage your app usage and set time limits. You'll be able to categorize apps and control your digital wellbeing.`
      }
      
      if (lowerMessage.includes('dashboard') || lowerMessage.includes('home') || lowerMessage.includes('navigate home')) {
        navigate('/')
        return `✅ Taking you back to the dashboard where you can see your todos and work log. Stay productive!`
      }
    }
    
    // Productivity advice responses
    if (lowerMessage.includes('focus') || lowerMessage.includes('concentration')) {
      return `🎯 **Focus Strategies:**

**Immediate Actions:**
• Try the Pomodoro Technique: 25min focus + 5min break
• Block distracting apps during work sessions
• Set a clear intention for this work period

**Environment Setup:**
• Close unnecessary browser tabs
• Put your phone in another room
• Use noise-canceling headphones or focus music

**Mindset:**
• Start with the most challenging task while your energy is high
• Break large tasks into smaller, manageable chunks
• Celebrate small wins to maintain motivation

What specific area would you like to focus on right now?`
    }
    
    if (lowerMessage.includes('productive') || lowerMessage.includes('productivity')) {
      return `📈 **Productivity Boost:**

**Daily Habits:**
• Plan your top 3 priorities each morning
• Use time-blocking for deep work
• Review and adjust your schedule regularly

**Energy Management:**
• Work on important tasks during your peak energy hours
• Take regular breaks to avoid burnout
• Stay hydrated and maintain good posture

**Digital Wellness:**
• Set specific times for checking emails/messages
• Use app blocking during focused work periods
• Create device-free zones for better sleep

Which productivity area needs the most attention in your routine?`
    }
    
    if (lowerMessage.includes('break') || lowerMessage.includes('rest') || lowerMessage.includes('tired')) {
      return `🌿 **Taking Breaks Mindfully:**

**Yes, you should take a break if:**
• You've been working for more than 90 minutes straight
• Your concentration is wavering
• You're feeling mentally fatigued

**Effective Break Activities:**
• 5-10 minute walk (preferably outside)
• Deep breathing exercises
• Light stretching
• Hydrate and have a healthy snack

**Avoid:**
• Scrolling social media (can be more draining)
• Heavy meals that cause energy crashes
• Activities that overstimulate your mind

Remember: Breaks aren't laziness—they're strategic energy investment! How long have you been working today?`
    }
    
    if (lowerMessage.includes('goal') || lowerMessage.includes('plan') || lowerMessage.includes('should i')) {
      return `🎯 **Decision-Making Framework:**

**For any decision, consider:**
• Does this align with your core values and long-term goals?
• What would you regret more: trying and failing, or not trying at all?
• Can you test this decision on a small scale first?

**Goal Setting Tips:**
• Make goals specific and measurable
• Set both outcome goals and process goals
• Break big goals into weekly milestones

**Common Decision Traps:**
• Analysis paralysis (overthinking)
• Perfectionism (waiting for the "perfect" moment)
• Comparison to others instead of your own path

What specific decision or goal would you like to explore together?`
    }
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return `👋 Hello! I'm excited to help you today. 

**I can assist with:**
• **Productivity strategies** and focus techniques
• **Life decisions** and goal-setting guidance  
• **App management** and digital wellness
• **Theme changes** and interface customization

**Quick actions you can try:**
${agenticMode ? '• "Change theme to dark/light mode"\n• "Take me to block apps"\n• "Navigate to dashboard"' : '• Ask for productivity advice\n• Request focus strategies\n• Seek guidance on decisions'}

What's on your mind today? How can I help you be more productive and intentional?`
    }
    
    // Default response
    return `I understand you're asking about: "${userMessage}". 

As your productivity advisor, I can help with:
• **Focus & Concentration** - strategies to maintain deep work
• **Goal Setting** - breaking down big objectives into actionable steps  
• **Digital Wellness** - managing screen time and app usage
• **Decision Making** - frameworks for life and work choices
• **Energy Management** - optimizing your daily rhythms

${agenticMode ? 'I can also take actions like changing themes or navigating to different sections of the app.' : ''}

What specific area would you like guidance on? I'm here to help you achieve your goals! 🎯`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    
    const userMessage = input
    setInput('')
    
    // Add user message to chat
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date()
    }])
    
    setIsLoading(true)
    
    // Simulate AI thinking time
    setTimeout(async () => {
      try {
        const response = await generateResponse(userMessage)
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response,
          timestamp: new Date()
        }])
      } catch (error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date()
        }])
      } finally {
        setIsLoading(false)
      }
    }, 500 + Math.random() * 1000)
  }

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Width responsiveness
  let panelWidth = "w-80"
  if (typeof window !== 'undefined') {
    if (window.innerWidth < 1024) {
      panelWidth = "w-1/2"
    }
    if (window.innerWidth < 768) {
      panelWidth = "w-full"
    }
  }

  if (!isOpen) {
    return (
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <button 
          onClick={() => setIsOpen(true)} 
          className="rounded-full h-14 w-14 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/20 text-white hover:shadow-xl transition-all duration-300"
          aria-label="Open Athera Advisor"
        >
          <Bot className="h-7 w-7 mx-auto" />
        </button>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ 
            x: 0, 
            opacity: 1,
            height: isMinimized ? '64px' : 'auto'
          }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className={cn(
            "border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col z-40 shadow-xl", 
            isMinimized ? "h-16" : "h-screen",
            panelWidth
          )}
        >
          {/* Enhanced Header */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-1.5 rounded-md transition-colors",
                  agenticMode ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20" : "bg-purple-500/10"
                )}>
                  {agenticMode ? (
                    <Zap className="h-5 w-5 text-purple-600" />
                  ) : (
                    <Bot className="h-5 w-5 text-purple-600" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                    Athera Advisor
                    {agenticMode && (
                      <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
                        AGENTIC
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {agenticMode ? 'AI assistant with actions' : 'Personal productivity advisor'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors" 
                  onClick={handleClearHistory}
                  title="Clear History"
                >
                  <Trash2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button 
                  className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors" 
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? 
                    <Maximize2 className="h-4 w-4 text-gray-600 dark:text-gray-400" /> : 
                    <Minimize2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  }
                </button>
                <button 
                  className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors" 
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            
            {/* Agentic Mode Toggle - only show when not minimized */}
            {!isMinimized && (
              <div className="mt-3 flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Agentic Mode</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {agenticMode ? 'Can take actions' : 'Advice only'}
                  </span>
                </div>
                <Switch
                  checked={agenticMode}
                  onCheckedChange={handleAgenticModeToggle}
                />
              </div>
            )}
          </div>
          
          {/* Message area - hidden when minimized */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/90">
                {messages.map((msg, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={cn(
                      "rounded-lg",
                      msg.role === 'user' 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white ml-auto max-w-[85%] p-3 shadow-md" 
                        : "bg-gray-100 dark:bg-gray-700 max-w-[85%] p-3 shadow-sm text-gray-900 dark:text-white"
                    )}
                  >
                    {/* Role indicator */}
                    {msg.role === 'user' && (
                      <div className="flex items-center gap-2 mb-1 opacity-80">
                        <UserCircle className="h-4 w-4" />
                        <span className="text-xs">You</span>
                      </div>
                    )}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1 opacity-80">
                        <Bot className="h-4 w-4" />
                        <span className="text-xs">Athera</span>
                      </div>
                    )}
                    
                    {/* Message content */}
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {msg.content.split('\n\n').map((paragraph, i) => {
                        // Handle bold text with **
                        const formattedText = paragraph.replace(
                          /\*\*(.*?)\*\*/g, 
                          '<strong>$1</strong>'
                        )
                        
                        return (
                          <p 
                            key={i} 
                            dangerouslySetInnerHTML={{ __html: formattedText }}
                            className="mb-2 leading-relaxed last:mb-0"
                          />
                        )
                      })}
                    </div>
                    
                    {/* Timestamp */}
                    <p className={cn(
                      "text-xs mt-2 opacity-70",
                      msg.role === 'user' ? "text-purple-100" : "text-gray-500 dark:text-gray-400"
                    )}>
                      {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 mb-1 opacity-80">
                        <Bot className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Athera</span>
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {/* Enhanced Input area */}
              <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 bg-white dark:bg-gray-800">
                <div className="relative flex-1">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={agenticMode 
                      ? "Ask for advice or request actions: 'Change theme', 'Help me focus'..."
                      : "Ask for productivity advice..."
                    }
                    className="w-full bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm pr-8"
                    disabled={isLoading}
                  />
                  {isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-opacity-50 border-t-purple-500 rounded-full"></div>
                    </div>
                  )}
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading || !input.trim()}
                  className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center shadow-sm transition-all duration-200"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              
              {/* Quick Action Buttons */}
              <div className="px-3 pb-3">
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setInput('Help me focus')}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Help me focus
                  </button>
                  <button
                    onClick={() => setInput('Should I take a break?')}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Take a break?
                  </button>
                  {agenticMode && (
                    <button
                      onClick={() => setInput('Change theme')}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Change theme
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AtheraAdvisor
