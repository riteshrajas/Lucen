import React, { useState, useEffect } from 'react'
import { ArrowLeftIcon, TagIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const BlockAppsPage = () => {
  const navigate = useNavigate()
  const [apps, setApps] = useState([])
  const [categories, setCategories] = useState(['All', 'Entertainment', 'Social Media', 'Education', 'Productivity', 'Internet', 'Games', 'Other'])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(true)

  // Mock app data - in real implementation, this would come from system detection
  const mockApps = [
    { id: 1, name: 'YouTube', category: 'Entertainment', timeSpent: 120, timeLimit: 60, blocked: false, icon: '🎥' },
    { id: 2, name: 'Facebook', category: 'Social Media', timeSpent: 45, timeLimit: 30, blocked: true, icon: '📘' },
    { id: 3, name: 'Instagram', category: 'Social Media', timeSpent: 80, timeLimit: 45, blocked: false, icon: '📷' },
    { id: 4, name: 'VS Code', category: 'Productivity', timeSpent: 300, timeLimit: 0, blocked: false, icon: '💻' },
    { id: 5, name: 'Discord', category: 'Social Media', timeSpent: 60, timeLimit: 30, blocked: false, icon: '💬' },
    { id: 6, name: 'Chrome', category: 'Internet', timeSpent: 180, timeLimit: 120, blocked: false, icon: '🌐' },
    { id: 7, name: 'Steam', category: 'Games', timeSpent: 240, timeLimit: 120, blocked: true, icon: '🎮' },
    { id: 8, name: 'Notion', category: 'Productivity', timeSpent: 90, timeLimit: 0, blocked: false, icon: '📝' },
    { id: 9, name: 'Spotify', category: 'Entertainment', timeSpent: 150, timeLimit: 0, blocked: false, icon: '🎵' },
    { id: 10, name: 'Photoshop', category: 'Productivity', timeSpent: 45, timeLimit: 0, blocked: false, icon: '🎨' },
  ]

  useEffect(() => {
    // Simulate app detection
    setTimeout(() => {
      setApps(mockApps)
      setLoading(false)
    }, 1000)
  }, [])

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const toggleAppBlock = (appId) => {
    setApps(prev => prev.map(app => 
      app.id === appId ? { ...app, blocked: !app.blocked } : app
    ))
  }

  const updateTimeLimit = (appId, newLimit) => {
    setApps(prev => prev.map(app => 
      app.id === appId ? { ...app, timeLimit: parseInt(newLimit) || 0 } : app
    ))
  }

  const filteredApps = selectedCategory === 'All' 
    ? apps 
    : apps.filter(app => app.category === selectedCategory)

  const getCategoryStats = (category) => {
    const categoryApps = category === 'All' ? apps : apps.filter(app => app.category === category)
    const blocked = categoryApps.filter(app => app.blocked).length
    const total = categoryApps.length
    return { blocked, total }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Detecting installed applications...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  App Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Control your app usage and stay focused
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <ShieldCheckIcon className="h-5 w-5" />
              <span>{apps.filter(app => app.blocked).length} apps blocked</span>
            </div>
          </div>
        </div>

        <div className="flex h-full">
          {/* Categories Sidebar */}
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => {
                const stats = getCategoryStats(category)
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                      selectedCategory === category
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <TagIcon className="h-4 w-4" />
                      <span className="font-medium">{category}</span>
                    </div>
                    <span className="text-xs">
                      {stats.blocked}/{stats.total}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Apps List */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {selectedCategory} Apps
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {filteredApps.length} apps found
              </p>
            </div>

            <div className="grid gap-4">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">{app.icon}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {app.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <TagIcon className="h-4 w-4" />
                            <span>{app.category}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>Used: {formatTime(app.timeSpent)} today</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Time Limit Input */}
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          Limit (min):
                        </label>
                        <input
                          type="number"
                          value={app.timeLimit}
                          onChange={(e) => updateTimeLimit(app.id, e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          min="0"
                          placeholder="∞"
                        />
                      </div>

                      {/* Usage Progress */}
                      {app.timeLimit > 0 && (
                        <div className="w-32">
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>{formatTime(app.timeSpent)}</span>
                            <span>{formatTime(app.timeLimit)}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                app.timeSpent > app.timeLimit 
                                  ? 'bg-red-500' 
                                  : app.timeSpent > app.timeLimit * 0.8 
                                    ? 'bg-yellow-500' 
                                    : 'bg-green-500'
                              }`}
                              style={{ 
                                width: `${Math.min((app.timeSpent / app.timeLimit) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Block Toggle */}
                      <button
                        onClick={() => toggleAppBlock(app.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                          app.blocked
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
                            : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                        }`}
                      >
                        {app.blocked ? 'Blocked' : 'Allowed'}
                      </button>
                    </div>
                  </div>

                  {/* Time exceeded warning */}
                  {app.timeLimit > 0 && app.timeSpent > app.timeLimit && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-700 dark:text-red-400 text-sm">
                        ⚠️ Time limit exceeded by {formatTime(app.timeSpent - app.timeLimit)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlockAppsPage
