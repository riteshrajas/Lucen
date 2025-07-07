import React, { useState, useEffect } from 'react'
import { PlayIcon, PauseIcon, StopIcon, ClockIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const WorkLog = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [focusDuration, setFocusDuration] = useState('')
  const [targetTime, setTargetTime] = useState(null)
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    let interval = null
    if (isRunning) {
      interval = setInterval(() => {
        setTimeElapsed(prev => {
          const newTime = prev + 1
          // Check if target time is reached
          if (targetTime && newTime >= targetTime) {
            setIsRunning(false)
            completeSession(newTime)
            return newTime
          }
          return newTime
        })
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isRunning, targetTime])

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const startTimer = () => {
    if (focusDuration) {
      // Parse focus duration (e.g., "25" for 25 minutes)
      const minutes = parseInt(focusDuration)
      if (minutes && minutes > 0) {
        setTargetTime(minutes * 60)
      }
    }
    setIsRunning(true)
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const stopTimer = () => {
    setIsRunning(false)
    if (timeElapsed > 0) {
      completeSession(timeElapsed)
    }
    resetTimer()
  }

  const resetTimer = () => {
    setTimeElapsed(0)
    setTargetTime(null)
    setFocusDuration('')
  }

  const completeSession = (duration) => {
    const newSession = {
      id: Date.now(),
      duration,
      startTime: new Date(Date.now() - duration * 1000),
      endTime: new Date(),
      targetDuration: targetTime
    }
    
    setSessions(prev => [newSession, ...prev.slice(0, 4)]) // Keep last 5 sessions
    
    // Save to localStorage
    const savedSessions = JSON.parse(localStorage.getItem('workSessions') || '[]')
    localStorage.setItem('workSessions', JSON.stringify([newSession, ...savedSessions.slice(0, 9)]))
  }

  useEffect(() => {
    // Load sessions from localStorage
    const savedSessions = JSON.parse(localStorage.getItem('workSessions') || '[]')
    setSessions(savedSessions.slice(0, 5))
  }, [])

  const getProgressPercentage = () => {
    if (!targetTime) return 0
    return Math.min((timeElapsed / targetTime) * 100, 100)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Work Log
        </h2>
        <ClockIcon className="h-6 w-6 text-gray-400" />
      </div>

      {/* Timer Display */}
      <div className="text-center mb-8">
        <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white mb-4">
          {formatTime(timeElapsed)}
        </div>
        
        {targetTime && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {formatTime(Math.max(0, targetTime - timeElapsed))} remaining
            </p>
          </div>
        )}
      </div>

      {/* Duration Input */}
      {!isRunning && timeElapsed === 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Focus Duration (minutes)
          </label>
          <input
            type="number"
            value={focusDuration}
            onChange={(e) => setFocusDuration(e.target.value)}
            placeholder="25"
            min="1"
            max="180"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Leave empty for open-ended session
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 justify-center mb-8">
        {!isRunning ? (
          <button
            onClick={startTimer}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <PlayIcon className="h-5 w-5" />
            Start Focus
          </button>
        ) : (
          <>
            <button
              onClick={pauseTimer}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <PauseIcon className="h-5 w-5" />
              Pause
            </button>
            <button
              onClick={stopTimer}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <StopIcon className="h-5 w-5" />
              Stop
            </button>
          </>
        )}
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Recent Sessions
          </h3>
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatTime(session.duration)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(session.startTime), 'MMM dd, HH:mm')}
                  </p>
                </div>
                {session.targetDuration && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Target: {formatTime(session.targetDuration)}
                    </p>
                    <p className={`text-sm font-medium ${
                      session.duration >= session.targetDuration
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {session.duration >= session.targetDuration ? 'Completed' : 'Partial'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkLog
