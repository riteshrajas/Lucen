import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, RefreshCw, 
  Clock, Calendar as CalendarIcon, CheckCircle, AlertTriangle, 
  BarChart2, Zap, Brain, BookOpen, Plus, Sparkles, MapPin,
  Play, Pause, Square, Timer, Target, Repeat, Star, Flame,
  TreePine, Wind, Heart, Waves
} from 'lucide-react';
import  supabase from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { getTasks, updateTask, createTask, createHabitTask, toggleHabitCompletion, getHabitTasks } from '@/lib/taskService';
import { getHabitsWithEntries, toggleHabitCompletion as toggleHabitService } from '@/lib/habitService';
import { HabitTracker } from '@/components/HabitTracker';
import { TaskCreationModal } from '@/components/TaskManager/TaskCreationModal';
import { agenticService } from '@/lib/agenticService';

interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  user_id: string;
  type: 'task' | 'habit';
  due_date?: string;
  due_time?: string;
  streak_count?: number;
  habit_color?: string;
  habit_frequency?: string;
  rule_id?: number;
  is_habit?: boolean;
}

interface MeditationSession {
  id: string;
  todo_item_id: string;
  start_time: string;
  duration: number;
  meditation_type: 'focus' | 'mindfulness' | 'visualization' | 'breathing';
  notes?: string;
}

interface WorkSession {
  id: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  task_description?: string;
  is_active: boolean;
  user_id: string;
}

const DashboardPage = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number | null>(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Meditation states
  const [isMeditating, setIsMeditating] = useState(false);
  const [meditatingItem, setMeditatingItem] = useState<TodoItem | null>(null);
  const [meditationTime, setMeditationTime] = useState(0);
  const [meditationType, setMeditationType] = useState<'focus' | 'mindfulness' | 'visualization' | 'breathing'>('focus');
  
  // Filter states
  const [filterType, setFilterType] = useState<'all' | 'tasks' | 'habits'>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  
  // Expansion states
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchAllTodos();
        await fetchActiveSession();
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const fetchAllTodos = async () => {
    try {
      // Fetch both tasks and habits
      const [tasksData, habitsData] = await Promise.all([
        getTasks(),
        getHabitsWithEntries()
      ]);
      
      const allTodos: TodoItem[] = [];
      
      // Add regular tasks
      if (tasksData) {
        tasksData.forEach(task => {
          if (task.id && task.created_at && task.user_id) {
            allTodos.push({
              id: task.id,
              title: task.title,
              description: task.description,
              completed: task.status === 'completed',
              priority: task.priority,
              created_at: task.created_at,
              user_id: task.user_id,
              type: task.is_habit ? 'habit' : 'task',
              due_date: task.due_date || undefined,
              due_time: task.due_time || undefined,
              rule_id: task.rule_id,
              is_habit: task.is_habit,
              streak_count: task.habit_streak_count,
              habit_color: task.habit_color || undefined,
              habit_frequency: task.habit_frequency || undefined
            });
          }
        });
      }
      
      // Add habit items (if not already included from tasks)
      if (habitsData) {
        habitsData.forEach(habit => {
          // Only add if not already in tasks (some habits might be stored as both)
          const existingHabit = allTodos.find(todo => 
            todo.title === habit.name && todo.type === 'habit'
          );
          
          if (!existingHabit) {
            allTodos.push({
              id: habit.id,
              title: habit.name,
              description: habit.description || '',
              completed: habit.completedToday,
              priority: 'medium', // Default for habits
              created_at: habit.created_at,
              user_id: habit.user_id,
              type: 'habit',
              streak_count: habit.streak_count,
              habit_color: habit.color,
              habit_frequency: habit.frequency,
              rule_id: habit.rule_id || undefined
            });
          }
        });
      }
      
      // Sort by created_at desc
      allTodos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTodos(allTodos);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const fetchActiveSession = async () => {
    try {
      const { data, error } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      setCurrentSession(data);
    } catch (error) {
      console.error('Error fetching active session:', error);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim() || !user) return;

    try {
      // Use the agentic service to create a task with AI analysis
      const result = await agenticService.executeAction({
        type: 'action',
        content: `Creating task: ${newTodo}`,
        action: {
          actionType: 'CREATE_TASK',
          parameters: {
            title: newTodo.trim(),
            priority: newTodoPriority,
            description: '',
            mainTopic: 'General',
            subTopic: 'Task'
          }
        }
      });

      if (result.success && result.data) {
        await fetchAllTodos(); // Refresh the list
        setNewTodo('');
        setNewTodoPriority('medium');
      }
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      if (todo.type === 'habit') {
        // For habits, use habit completion toggle
        if (todo.is_habit) {
          // If it's a habit stored as a task
          await toggleHabitCompletion(id);
        } else {
          // If it's a habit stored in habits table
          await toggleHabitService(id);
        }
      } else {
        // For regular tasks
        await updateTask(id, { 
          status: completed ? 'completed' : 'pending',
          completed_at: completed ? new Date().toISOString() : null
        });
      }

      // Update local state immediately for better UX
      setTodos(prev => prev.map(todo => 
        todo.id === id ? { ...todo, completed } : todo
      ));
      
      // Refresh data to get updated streaks etc.
      await fetchAllTodos();
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      if (todo.type === 'habit') {
        // For habits, mark as inactive rather than delete
        if (todo.is_habit) {
          await updateTask(id, { status: 'cancelled' });
        } else {
          // If it's in habits table, we'd need to call deleteHabit
          // For now, just remove from local state
        }
      } else {
        // For regular tasks, delete
        await updateTask(id, { status: 'cancelled' });
      }

      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  // Meditation functions
  const startMeditation = (todo: TodoItem) => {
    setMeditatingItem(todo);
    setIsMeditating(true);
    setMeditationTime(0);
    
    // Start the meditation timer
    const interval = setInterval(() => {
      setMeditationTime(prev => prev + 1);
    }, 1000);

    // Store interval ID for cleanup
    (window as any).meditationInterval = interval;
  };

  const stopMeditation = async () => {
    if (!meditatingItem) return;

    try {
      // Clear the timer
      if ((window as any).meditationInterval) {
        clearInterval((window as any).meditationInterval);
      }

      // Save meditation session to database
      const { error } = await supabase
        .from('meditation_sessions')
        .insert({
          user_id: user.id,
          todo_item_id: meditatingItem.id,
          duration: meditationTime,
          meditation_type: meditationType,
          start_time: new Date(Date.now() - meditationTime * 1000).toISOString(),
          end_time: new Date().toISOString()
        });

      if (error) console.error('Error saving meditation session:', error);

      // Reset meditation state
      setIsMeditating(false);
      setMeditatingItem(null);
      setMeditationTime(0);
    } catch (error) {
      console.error('Error stopping meditation:', error);
    }
  };

  const formatMeditationTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMeditationIcon = (type: string) => {
    switch (type) {
      case 'focus': return <Target className="h-4 w-4" />;
      case 'mindfulness': return <Heart className="h-4 w-4" />;
      case 'visualization': return <TreePine className="h-4 w-4" />;
      case 'breathing': return <Wind className="h-4 w-4" />;
      default: return <Waves className="h-4 w-4" />;
    }
  };

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString();
  };

  const getTaskDetails = (todo: TodoItem) => {
    const details = [];
    
    if (todo.description) {
      details.push({ label: 'Description', value: todo.description });
    }
    
    if (todo.due_date) {
      details.push({ 
        label: 'Due Date', 
        value: `${new Date(todo.due_date).toLocaleDateString()}${todo.due_time ? ` at ${todo.due_time}` : ''}` 
      });
    }
    
    if (todo.type === 'habit') {
      if (todo.habit_frequency) {
        details.push({ label: 'Frequency', value: todo.habit_frequency });
      }
      if (todo.streak_count !== undefined) {
        details.push({ label: 'Current Streak', value: `${todo.streak_count} days` });
      }
      if (todo.habit_color) {
        details.push({ label: 'Color', value: todo.habit_color });
      }
    }
    
    if (todo.rule_id) {
      const ruleNames = {
        1: 'Seek Truth with Relentless Curiosity',
        2: 'Live with Uncompromising Integrity', 
        3: 'Grow Through Challenges as an Antifragile System'
      };
      details.push({ 
        label: 'Life Rule Alignment', 
        value: `Rule ${todo.rule_id}: ${ruleNames[todo.rule_id as keyof typeof ruleNames] || 'Unknown'}` 
      });
    }
    
    details.push({ label: 'Created', value: formatDateTime(todo.created_at) });
    details.push({ label: 'Priority', value: getPriorityLabel(todo.priority) });
    details.push({ label: 'Type', value: todo.type === 'habit' ? 'Habit' : 'Task' });
    details.push({ label: 'Status', value: todo.completed ? 'Completed' : 'Active' });
    
    return details;
  };

  const startWorkSession = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('work_sessions')
        .insert([
          {
            start_time: new Date().toISOString(),
            task_description: taskDescription || null,
            is_active: true,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;
      setCurrentSession(data);
      setTaskDescription('');
    } catch (error) {
      console.error('Error starting work session:', error);
    }
  };

  const endWorkSession = async () => {
    if (!currentSession) return;

    try {
      const endTime = new Date().toISOString();
      const duration = Math.floor((new Date(endTime).getTime() - new Date(currentSession.start_time).getTime()) / 1000);

      const { error } = await supabase
        .from('work_sessions')
        .update({
          end_time: endTime,
          duration,
          is_active: false
        })
        .eq('id', currentSession.id);

      if (error) throw error;
      setCurrentSession(null);
    } catch (error) {
      console.error('Error ending work session:', error);
    }
  };

  const getFilteredTodos = () => {
    let filtered = todos;

    // Filter by type
    if (filterType === 'tasks') {
      filtered = filtered.filter(todo => todo.type === 'task');
    } else if (filterType === 'habits') {
      filtered = filtered.filter(todo => todo.type === 'habit');
    }

    // Filter by completion status
    if (!showCompleted) {
      filtered = filtered.filter(todo => !todo.completed);
    }

    return filtered;
  };

  const getStats = () => {
    const allTodos = todos;
    const tasks = allTodos.filter(t => t.type === 'task');
    const habits = allTodos.filter(t => t.type === 'habit');
    
    return {
      total: allTodos.length,
      completed: allTodos.filter(t => t.completed).length,
      tasks: tasks.length,
      habits: habits.length,
      activeStreaks: habits.filter(h => (h.streak_count || 0) > 0).length,
      todayCompleted: allTodos.filter(t => t.completed && 
        new Date(t.created_at).toDateString() === new Date().toDateString()
      ).length
    };
  };

  const getRuleColor = (ruleId?: number) => {
    switch (ruleId) {
      case 1: return 'text-blue-500';
      case 2: return 'text-emerald-500';
      case 3: return 'text-violet-500';
      default: return 'text-gray-500';
    }
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      if (taskData.is_habit) {
        await createHabitTask(taskData);
      } else {
        await createTask(taskData);
      }
      await fetchAllTodos();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentSessionDuration = () => {
    if (!currentSession) return 0;
    return Math.floor((Date.now() - new Date(currentSession.start_time).getTime()) / 1000);
  };

  const [currentTime, setCurrentTime] = useState(getCurrentSessionDuration());

  useEffect(() => {
    if (currentSession) {
      const interval = setInterval(() => {
        setCurrentTime(getCurrentSessionDuration());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentSession]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Unknown';
    }
  };

  const filteredTodos = getFilteredTodos();
  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Productivity Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your tasks and track your work sessions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchAllTodos}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Unified Todo List Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Smart Todo List
              <Sparkles className="h-4 w-4 text-purple-500" />
            </CardTitle>
            <CardDescription>
              AI-powered tasks and habits with meditation support
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col gap-4">
              {/* Quick Add */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add task or habit (use '#habit' for habits)..."
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                  className="flex-1"
                />
                <Select value={newTodoPriority} onValueChange={(value: any) => setNewTodoPriority(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addTodo} disabled={!newTodo.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateModal(true)}
                  className="whitespace-nowrap"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Create
                </Button>
              </div>

              {/* Filters */}
              <div className="flex gap-2 items-center">
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="tasks">Tasks Only</SelectItem>
                    <SelectItem value="habits">Habits Only</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant={showCompleted ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCompleted(!showCompleted)}
                >
                  {showCompleted ? 'Hide' : 'Show'} Completed
                </Button>
              </div>
            </div>

            {/* Meditation Modal */}
            {isMeditating && meditatingItem && (
              <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                <CardContent className="p-6 text-center">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      {getMeditationIcon(meditationType)}
                      <h3 className="text-lg font-semibold">Meditating on</h3>
                    </div>
                    <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                      {meditatingItem.title}
                    </p>
                    <div className="text-4xl font-mono font-bold text-purple-600">
                      {formatMeditationTime(meditationTime)}
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Select value={meditationType} onValueChange={(value: any) => setMeditationType(value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="focus">Focus</SelectItem>
                          <SelectItem value="mindfulness">Mindfulness</SelectItem>
                          <SelectItem value="visualization">Visualization</SelectItem>
                          <SelectItem value="breathing">Breathing</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={stopMeditation} variant="destructive">
                        <Square className="h-4 w-4 mr-2" />
                        End Session
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Todo list */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTodos.map((todo) => {
                const isExpanded = expandedItems.has(todo.id);
                const taskDetails = getTaskDetails(todo);
                
                return (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="group relative"
                  >
                    <Card className={`transition-all hover:shadow-md cursor-pointer ${
                      todo.type === 'habit' ? 'border-l-4' : ''
                    } ${isExpanded ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}
                    style={todo.type === 'habit' ? { borderLeftColor: todo.habit_color } : {}}
                    >
                      <CardContent className="p-4">
                        <div 
                          className="flex items-center gap-3"
                          onClick={() => toggleItemExpansion(todo.id)}
                        >
                          <Checkbox
                            checked={todo.completed}
                            onCheckedChange={(checked) => {
                              // Prevent event bubbling to the card click
                              event?.stopPropagation();
                              toggleTodo(todo.id, checked as boolean);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-medium truncate ${
                                todo.completed ? 'line-through text-muted-foreground' : ''
                              }`}>
                                {todo.title}
                              </h4>
                              
                              {/* Expand/Collapse Icon */}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 ml-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleItemExpansion(todo.id);
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                              
                              {/* Type Badge */}
                              <Badge 
                                variant={todo.type === 'habit' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {todo.type === 'habit' ? (
                                  <><Repeat className="h-3 w-3 mr-1" /> Habit</>
                                ) : (
                                  <><Target className="h-3 w-3 mr-1" /> Task</>
                                )}
                              </Badge>

                              {/* Streak Badge for Habits */}
                              {todo.type === 'habit' && todo.streak_count && todo.streak_count > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <Flame className="h-3 w-3 mr-1 text-orange-500" />
                                  {todo.streak_count} days
                                </Badge>
                              )}

                              {/* Rule Badge */}
                              {todo.rule_id && (
                                <Badge variant="outline" className={`text-xs ${getRuleColor(todo.rule_id)}`}>
                                  Rule {todo.rule_id}
                                </Badge>
                              )}
                            </div>
                            
                            {!isExpanded && todo.description && (
                              <p className={`text-sm text-muted-foreground truncate ${
                                todo.completed ? 'line-through' : ''
                              }`}>
                                {todo.description}
                              </p>
                            )}
                            
                            {!isExpanded && (
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                {todo.due_date && (
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    {new Date(todo.due_date).toLocaleDateString()}
                                  </span>
                                )}
                                {todo.habit_frequency && (
                                  <span className="capitalize">
                                    {todo.habit_frequency}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Priority Badge */}
                            <Badge 
                              variant="secondary" 
                              className={`${getPriorityColor(todo.priority)} text-white text-xs`}
                            >
                              {getPriorityLabel(todo.priority)}
                            </Badge>

                            {/* Meditation Button */}
                            {!todo.completed && !isMeditating && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startMeditation(todo);
                                }}
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Meditate on this task"
                              >
                                <Brain className="h-4 w-4 text-purple-500" />
                              </Button>
                            )}

                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTodo(todo.id);
                              }}
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                            >
                              ×
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-4 pt-4 border-t"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {taskDetails.map((detail, index) => (
                                  <div key={index} className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                      {detail.label}
                                    </div>
                                    <div className="text-sm break-words">
                                      {detail.label === 'Color' && detail.value ? (
                                        <div className="flex items-center gap-2">
                                          <div 
                                            className="w-4 h-4 rounded-full border"
                                            style={{ backgroundColor: detail.value }}
                                          />
                                          <span>{detail.value}</span>
                                        </div>
                                      ) : (
                                        <span>{detail.value || 'Not set'}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Action Buttons in Expanded View */}
                              <div className="flex gap-2 mt-4 pt-4 border-t">
                                {!todo.completed && !isMeditating && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startMeditation(todo);
                                    }}
                                    className="flex items-center gap-2"
                                  >
                                    <Brain className="h-4 w-4 text-purple-500" />
                                    Start Meditation
                                  </Button>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTodo(todo.id, !todo.completed);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  {todo.completed ? (
                                    <>
                                      <Checkbox className="h-4 w-4" />
                                      Mark Incomplete
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      Mark Complete
                                    </>
                                  )}
                                </Button>

                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTodo(todo.id);
                                  }}
                                  className="flex items-center gap-2 ml-auto"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
              
              {filteredTodos.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No items found</h3>
                    <p className="text-muted-foreground mb-4">
                      {todos.length === 0 
                        ? "Create your first AI-powered task or habit"
                        : "No items match your current filters"
                      }
                    </p>
                    {todos.length === 0 && (
                      <Button onClick={() => setShowCreateModal(true)}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create with AI
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Work Log Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Work Log
            </CardTitle>
            <CardDescription>
              Track your focus sessions and productivity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentSession ? (
              // Active session display
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold text-primary">
                    {formatDuration(currentTime)}
                  </div>
                  <p className="text-muted-foreground mt-2">
                    {currentSession.task_description || 'Working on general tasks'}
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <Button onClick={endWorkSession} variant="destructive" className="flex items-center gap-2">
                    <Square className="h-4 w-4" />
                    Stop Session
                  </Button>
                </div>
              </div>
            ) : (
              // Start new session
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Task Description (Optional)</label>
                  <Input
                    placeholder="What are you working on?"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Focus Duration</label>
                  <Select value={sessionDuration?.toString() || 'none'} onValueChange={(value) => setSessionDuration(value === 'none' ? null : parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration or use free timer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Free Timer</SelectItem>
                      <SelectItem value="1500">25 minutes (Pomodoro)</SelectItem>
                      <SelectItem value="3000">50 minutes</SelectItem>
                      <SelectItem value="5400">90 minutes</SelectItem>
                      <SelectItem value="7200">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center">
                  <Button onClick={startWorkSession} className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                    <Play className="h-4 w-4" />
                    Start Focus Session
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold">{stats.todayCompleted}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tasks & Habits</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.tasks} tasks • {stats.habits} habits
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Streaks</p>
                  <p className="text-2xl font-bold">{stats.activeStreaks}</p>
                </div>
                <Flame className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Work Session</p>
                  <p className="text-2xl font-bold">{currentSession ? 'Active' : 'None'}</p>
                </div>
                <Timer className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Creation Modal */}
        <TaskCreationModal 
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onTaskCreate={handleCreateTask}
        />
      </motion.div>
    </div>
  );
};

export default DashboardPage;
