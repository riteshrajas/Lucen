import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Monitor, Clock, Settings, AlertTriangle, 
  CheckCircle, Play, Pause, Ban, Eye, EyeOff,
  Search, Filter, Zap, Brain, BarChart3, Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import supabase from '@/lib/supabaseClient';
import { invoke } from '@tauri-apps/api/core';

interface DetectedApp {
  id: string;
  name: string;
  category: string;
  icon?: string;
  path: string;
  usageTime: number; // in minutes
  allowedTime: number; // in minutes
  isBlocked: boolean;
  isActive: boolean;
  lastUsed: string;
  user_id: string;
}

interface InstalledApp {
  name: string;
  display_name: string;
  path: string | null;
  version: string | null;
  publisher: string | null;
  install_date: string | null;
  icon_path: string | null;
  category: string;
}

interface AppCategory {
  name: string;
  color: string;
  icon: string;
  isBlocked: boolean;
  totalApps: number;
}

const BlockAppsPage = () => {
  const [apps, setApps] = useState<DetectedApp[]>([]);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Categories that match the Rust categorization
  const defaultCategories: AppCategory[] = [
    { name: 'Gaming', color: 'bg-red-500', icon: '🎮', isBlocked: true, totalApps: 0 },
    { name: 'Communication', color: 'bg-blue-500', icon: '💬', isBlocked: false, totalApps: 0 },
    { name: 'Entertainment', color: 'bg-purple-500', icon: '�', isBlocked: true, totalApps: 0 },
    { name: 'Web Browser', color: 'bg-green-500', icon: '🌐', isBlocked: false, totalApps: 0 },
    { name: 'Development', color: 'bg-gray-500', icon: '⚡', isBlocked: false, totalApps: 0 },
    { name: 'Productivity', color: 'bg-orange-500', icon: '💼', isBlocked: false, totalApps: 0 },
    { name: 'Other', color: 'bg-slate-500', icon: '�', isBlocked: false, totalApps: 0 },
  ];

  // Mock detected apps (would come from system detection)
  const mockApps: DetectedApp[] = [
    {
      id: '1',
      name: 'Visual Studio Code',
      category: 'Development',
      path: 'C:\\Program Files\\Microsoft VS Code\\Code.exe',
      usageTime: 245,
      allowedTime: 480,
      isBlocked: false,
      isActive: true,
      lastUsed: new Date().toISOString(),
      user_id: 'mock'
    },
    {
      id: '2',
      name: 'Chrome',
      category: 'Internet',
      path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      usageTime: 120,
      allowedTime: 180,
      isBlocked: false,
      isActive: false,
      lastUsed: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      user_id: 'mock'
    },
    {
      id: '3',
      name: 'Discord',
      category: 'Social Media',
      path: 'C:\\Users\\User\\AppData\\Local\\Discord\\app-1.0.9016\\Discord.exe',
      usageTime: 95,
      allowedTime: 60,
      isBlocked: true,
      isActive: false,
      lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user_id: 'mock'
    },
    {
      id: '4',
      name: 'Spotify',
      category: 'Entertainment',
      path: 'C:\\Users\\User\\AppData\\Roaming\\Spotify\\Spotify.exe',
      usageTime: 180,
      allowedTime: 240,
      isBlocked: false,
      isActive: true,
      lastUsed: new Date().toISOString(),
      user_id: 'mock'
    },
    {
      id: '5',
      name: 'Notion',
      category: 'Productivity',
      path: 'C:\\Users\\User\\AppData\\Local\\Notion\\Notion.exe',
      usageTime: 75,
      allowedTime: 300,
      isBlocked: false,
      isActive: false,
      lastUsed: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      user_id: 'mock'
    },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadApps();
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const loadApps = async () => {
    setScanning(true);
    try {
      console.log('Fetching installed apps from Rust backend...');
      
      // Get installed apps from Rust
      const installedApps: InstalledApp[] = await invoke('get_installed_apps');
      console.log(`Found ${installedApps.length} installed applications`);
      
      // Convert to DetectedApp format
      const detectedApps: DetectedApp[] = installedApps.map((app, index) => ({
        id: `app_${index}`,
        name: app.display_name,
        category: app.category,
        icon: app.icon_path || undefined,
        path: app.path || '',
        usageTime: 0, // Default values - would be tracked over time
        allowedTime: 480, // 8 hours default
        isBlocked: getDefaultBlockStatus(app.category),
        isActive: false, // Would be determined by running process check
        lastUsed: new Date().toISOString(),
        user_id: user?.id || 'unknown'
      }));
      
      setApps(detectedApps);
      
      // Update categories with app counts
      const categoryMap = new Map<string, number>();
      detectedApps.forEach(app => {
        categoryMap.set(app.category, (categoryMap.get(app.category) || 0) + 1);
      });
      
      const updatedCategories = defaultCategories.map(category => ({
        ...category,
        totalApps: categoryMap.get(category.name) || 0
      }));
      
      setCategories(updatedCategories);
      
    } catch (error) {
      console.error('Error loading apps:', error);
      
      // Fallback to mock data if Rust backend fails
      setApps(mockApps);
      const updatedCategories = defaultCategories.map(category => ({
        ...category,
        totalApps: mockApps.filter(app => app.category === category.name).length
      }));
      setCategories(updatedCategories);
    } finally {
      setScanning(false);
    }
  };

  const getDefaultBlockStatus = (category: string): boolean => {
    // Default blocking rules
    const blockedCategories = ['Gaming', 'Entertainment'];
    return blockedCategories.includes(category);
  };

  const scanForRunningApps = async () => {
    try {
      console.log('Scanning for running processes...');
      const runningProcesses: string[] = await invoke('scan_running_processes');
      console.log('Running processes:', runningProcesses);
      
      // Update app states based on running processes
      setApps(prevApps => 
        prevApps.map(app => ({
          ...app,
          isActive: runningProcesses.some(process => 
            app.path.toLowerCase().includes(process.toLowerCase()) ||
            app.name.toLowerCase().includes(process.replace('.exe', '').toLowerCase())
          )
        }))
      );
    } catch (error) {
      console.error('Error scanning running processes:', error);
    }
  };

  const toggleAppBlock = async (appId: string) => {
    setApps(prev => prev.map(app => 
      app.id === appId ? { ...app, isBlocked: !app.isBlocked } : app
    ));
  };

  const updateAppTimeLimit = async (appId: string, allowedTime: number) => {
    setApps(prev => prev.map(app => 
      app.id === appId ? { ...app, allowedTime } : app
    ));
  };

  const toggleCategoryBlock = async (categoryName: string) => {
    // Toggle all apps in this category
    const categoryBlocked = !categories.find(c => c.name === categoryName)?.isBlocked;
    
    setCategories(prev => prev.map(category =>
      category.name === categoryName ? { ...category, isBlocked: categoryBlocked } : category
    ));
    
    setApps(prev => prev.map(app =>
      app.category === categoryName ? { ...app, isBlocked: categoryBlocked } : app
    ));
  };

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getUsagePercentage = (used: number, allowed: number) => {
    return Math.min((used / allowed) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
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
            <h1 className="text-3xl font-bold tracking-tight">Block Apps</h1>
            <p className="text-muted-foreground">
              Control app usage and manage digital wellness with AI-powered categorization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={scanForRunningApps} 
              className="flex items-center gap-2"
            >
              <Monitor className="h-4 w-4" />
              Scan Running
            </Button>
            <Button 
              variant="outline" 
              onClick={loadApps} 
              disabled={scanning}
              className="flex items-center gap-2"
            >
              {scanning ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Rescan Apps
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search apps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.name} value={category.name}>
                  {category.icon} {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="apps" className="space-y-6">
          <TabsList>
            <TabsTrigger value="apps">Apps</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="apps" className="space-y-4">
            <div className="grid gap-4">
              {filteredApps.map((app) => {
                const usagePercentage = getUsagePercentage(app.usageTime, app.allowedTime);
                const isOverLimit = app.usageTime > app.allowedTime;
                
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card className={`${app.isBlocked ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20' : ''}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                              <Monitor className="h-5 w-5 text-primary" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{app.name}</h3>
                                {app.isActive && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                                    Active
                                  </Badge>
                                )}
                                {isOverLimit && (
                                  <Badge variant="destructive">
                                    Over Limit
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {categories.find(c => c.name === app.category)?.icon} {app.category}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  Used: {formatTime(app.usageTime)} / {formatTime(app.allowedTime)}
                                </span>
                              </div>
                              
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                  <span>Usage</span>
                                  <span>{usagePercentage.toFixed(0)}%</span>
                                </div>
                                <Progress 
                                  value={usagePercentage} 
                                  className={`h-2 ${getUsageColor(usagePercentage)}`}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm font-medium mb-2">Time Limit</div>
                              <div className="w-32">
                                <Slider
                                  value={[app.allowedTime]}
                                  onValueChange={([value]) => updateAppTimeLimit(app.id, value)}
                                  max={480}
                                  min={30}
                                  step={30}
                                  className="w-full"
                                />
                                <div className="text-xs text-muted-foreground mt-1 text-center">
                                  {formatTime(app.allowedTime)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2">
                              <Switch
                                checked={!app.isBlocked}
                                onCheckedChange={() => toggleAppBlock(app.id)}
                              />
                              <span className="text-xs text-muted-foreground">
                                {app.isBlocked ? 'Blocked' : 'Allowed'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card key={category.name} className={`${category.isBlocked ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                          {category.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {category.totalApps} apps
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center gap-2">
                        <Switch
                          checked={!category.isBlocked}
                          onCheckedChange={() => toggleCategoryBlock(category.name)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {category.isBlocked ? 'Blocked' : 'Allowed'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Apps</p>
                      <p className="text-2xl font-bold">{apps.length}</p>
                    </div>
                    <Monitor className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Blocked Apps</p>
                      <p className="text-2xl font-bold">{apps.filter(app => app.isBlocked).length}</p>
                    </div>
                    <Ban className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Now</p>
                      <p className="text-2xl font-bold">{apps.filter(app => app.isActive).length}</p>
                    </div>
                    <Play className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Usage Overview</CardTitle>
                <CardDescription>App usage patterns and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apps.slice(0, 5).map((app) => {
                    const usagePercentage = getUsagePercentage(app.usageTime, app.allowedTime);
                    return (
                      <div key={app.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded flex items-center justify-center">
                            <Monitor className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{app.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 text-right">
                            <Progress value={usagePercentage} className="h-2" />
                          </div>
                          <span className="text-sm text-muted-foreground w-16 text-right">
                            {formatTime(app.usageTime)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default BlockAppsPage;
