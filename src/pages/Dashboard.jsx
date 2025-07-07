import React from 'react'
import Sidebar from '../components/Sidebar'
import TodoList from '../components/TodoList'
import WorkLog from '../components/WorkLog'
import AtheraAdvisor from '../components/AtheraAdvisor'

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Center Panel */}
        <div className="flex-1 flex flex-col p-6 space-y-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Good morning! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Let's make today productive
            </p>
          </div>
          
          {/* Todo List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <TodoList />
          </div>
          
          {/* Work Log */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <WorkLog />
          </div>
        </div>
        
        {/* Right Panel - Athera Advisor */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-700">
          <AtheraAdvisor />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
