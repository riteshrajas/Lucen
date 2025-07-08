-- Create todos table for the To-Do List feature ----------------------------------------
CREATE TABLE IF NOT EXISTS todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create work_sessions table for the Work Log feature
CREATE TABLE IF NOT EXISTS work_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in seconds
    task_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create blocked_apps table for the Block Apps feature
CREATE TABLE IF NOT EXISTS blocked_apps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    path TEXT NOT NULL,
    usage_time INTEGER DEFAULT 0, -- in minutes
    allowed_time INTEGER DEFAULT 240, -- in minutes (4 hours default)
    is_blocked BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT FALSE,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create app_categories table for managing app categories
CREATE TABLE IF NOT EXISTS app_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default app categories
INSERT INTO app_categories (name, color, icon, is_blocked) VALUES
    ('Education', 'bg-blue-500', '📚', FALSE),
    ('Internet', 'bg-green-500', '🌐', FALSE),
    ('Entertainment', 'bg-purple-500', '🎮', TRUE),
    ('Social Media', 'bg-pink-500', '📱', TRUE),
    ('Productivity', 'bg-orange-500', '💼', FALSE),
    ('Development', 'bg-gray-500', '⚡', FALSE),
    ('Creative', 'bg-red-500', '🎨', FALSE),
    ('Communication', 'bg-yellow-500', '💬', FALSE)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS (Row Level Security) for all tables
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for todos
CREATE POLICY "Users can view their own todos" ON todos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todos" ON todos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos" ON todos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos" ON todos
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for work_sessions
CREATE POLICY "Users can view their own work sessions" ON work_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own work sessions" ON work_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work sessions" ON work_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work sessions" ON work_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for blocked_apps
CREATE POLICY "Users can view their own blocked apps" ON blocked_apps
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blocked apps" ON blocked_apps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blocked apps" ON blocked_apps
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blocked apps" ON blocked_apps
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for app_categories (read-only for all users)
CREATE POLICY "Anyone can view app categories" ON app_categories
    FOR SELECT USING (TRUE);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);

CREATE INDEX IF NOT EXISTS idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_is_active ON work_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_work_sessions_start_time ON work_sessions(start_time);

CREATE INDEX IF NOT EXISTS idx_blocked_apps_user_id ON blocked_apps(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_apps_category ON blocked_apps(category);
CREATE INDEX IF NOT EXISTS idx_blocked_apps_is_blocked ON blocked_apps(is_blocked);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_sessions_updated_at BEFORE UPDATE ON work_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocked_apps_updated_at BEFORE UPDATE ON blocked_apps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
