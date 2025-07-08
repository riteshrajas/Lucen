import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, RefreshCw, 
  Clock, Calendar as CalendarIcon, CheckCircle, AlertTriangle, 
  BarChart2, Zap, Brain, BookOpen, Plus, Sparkles, MapPin,
  Play, Pause, Square, Timer, Target
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

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  user_id: string;
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

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await fetchTodos();
        await fetchActiveSession();
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTodos(data || []);
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
      const { data, error } = await supabase
        .from('todos')
        .insert([
          {
            title: newTodo.trim(),
            priority: newTodoPriority,
            completed: false,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;
      setTodos(prev => [data, ...prev]);
      setNewTodo('');
      setNewTodoPriority('medium');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed })
        .eq('id', id);

      if (error) throw error;
      setTodos(prev => prev.map(todo => 
        todo.id === id ? { ...todo, completed } : todo
      ));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
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
            <Button variant="outline" onClick={fetchTodos}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* To-Do List Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              To-Do List
            </CardTitle>
            <CardDescription>
              Manage your tasks and priorities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new todo */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a new task..."
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
            </div>

            {/* Todo list */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {todos.map((todo) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={(checked) => toggleTodo(todo.id, checked as boolean)}
                  />
                  <div className={`flex-1 ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {todo.title}
                  </div>
                  <Badge variant="secondary" className={`${getPriorityColor(todo.priority)} text-white`}>
                    {getPriorityLabel(todo.priority)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTodo(todo.id)}
                    className="h-8 w-8 p-0"
                  >
                    ×
                  </Button>
                </motion.div>
              ))}
              {todos.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks yet. Add one above to get started!
                </div>
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

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold">
                    {todos.filter(todo => todo.completed && 
                      new Date(todo.created_at).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{todos.length}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Session</p>
                  <p className="text-2xl font-bold">{currentSession ? 'Running' : 'None'}</p>
                </div>
                <Timer className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
