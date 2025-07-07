import React from 'react'

const Switch = ({ checked, onCheckedChange, className = '', ...props }) => {
  const baseClasses = "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
  const checkedClasses = checked ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"
  const toggleClasses = checked ? "translate-x-5" : "translate-x-0"
  
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`${baseClasses} ${checkedClasses} ${className}`}
      {...props}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0 transition duration-200 ease-in-out ${toggleClasses}`}
      />
    </button>
  )
}

export default Switch
