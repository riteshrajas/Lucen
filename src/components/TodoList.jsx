import React, { useState, useEffect } from 'react'
import { PlusIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const TodoList = () => {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setTodos(data || [])
    } catch (error) {
      // Fallback to localStorage if table doesn't exist
      const savedTodos = localStorage.getItem('todos')
      if (savedTodos) {
        setTodos(JSON.parse(savedTodos))
      }
    }
  }

  const addTodo = async (e) => {
    e.preventDefault()
    if (!newTodo.trim()) return

    setLoading(true)
    const todoItem = {
      id: Date.now(),
      text: newTodo.trim(),
      completed: false,
      created_at: new Date().toISOString()
    }

    try {
      const { error } = await supabase
        .from('todos')
        .insert([todoItem])
      
      if (error) throw error
      
      setTodos(prev => [todoItem, ...prev])
      setNewTodo('')
      toast.success('Todo added!')
    } catch (error) {
      // Fallback to localStorage
      const updatedTodos = [todoItem, ...todos]
      setTodos(updatedTodos)
      localStorage.setItem('todos', JSON.stringify(updatedTodos))
      setNewTodo('')
      toast.success('Todo added!')
    } finally {
      setLoading(false)
    }
  }

  const toggleTodo = async (id) => {
    const todo = todos.find(t => t.id === id)
    const updatedTodo = { ...todo, completed: !todo.completed }

    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: updatedTodo.completed })
        .eq('id', id)
      
      if (error) throw error
      
      setTodos(prev => prev.map(t => t.id === id ? updatedTodo : t))
    } catch (error) {
      // Fallback to localStorage
      const updatedTodos = todos.map(t => t.id === id ? updatedTodo : t)
      setTodos(updatedTodos)
      localStorage.setItem('todos', JSON.stringify(updatedTodos))
    }
  }

  const deleteTodo = async (id) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setTodos(prev => prev.filter(t => t.id !== id))
      toast.success('Todo deleted!')
    } catch (error) {
      // Fallback to localStorage
      const updatedTodos = todos.filter(t => t.id !== id)
      setTodos(updatedTodos)
      localStorage.setItem('todos', JSON.stringify(updatedTodos))
      toast.success('Todo deleted!')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Today's Tasks
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {todos.filter(t => !t.completed).length} remaining
        </span>
      </div>

      {/* Add Todo Form */}
      <form onSubmit={addTodo} className="flex gap-3 mb-6">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add
        </button>
      </form>

      {/* Todo List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {todos.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No tasks yet. Add one above!
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                todo.completed
                  ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600'
              }`}
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-colors duration-200 flex items-center justify-center ${
                  todo.completed
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-gray-300 dark:border-gray-500 hover:border-primary-500'
                }`}
              >
                {todo.completed && <CheckIcon className="h-3 w-3" />}
              </button>
              
              <span
                className={`flex-1 transition-all duration-200 ${
                  todo.completed
                    ? 'text-gray-500 dark:text-gray-400 line-through'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {todo.text}
              </span>
              
              <button
                onClick={() => deleteTodo(todo.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TodoList
