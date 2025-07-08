-- Create meditation_sessions table for tracking meditation sessions on todo items
CREATE TABLE IF NOT EXISTS public.meditation_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  todo_item_id uuid NOT NULL, -- References either tasks.id or habits.id
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  duration integer NOT NULL, -- Duration in seconds
  meditation_type text NOT NULL CHECK (meditation_type IN ('focus', 'mindfulness', 'visualization', 'breathing')),
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_id ON public.meditation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_todo_item_id ON public.meditation_sessions(todo_item_id);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_date ON public.meditation_sessions(start_time);

-- Enable row level security
ALTER TABLE public.meditation_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for meditation_sessions
DROP POLICY IF EXISTS "Users can view their own meditation sessions" ON public.meditation_sessions;
DROP POLICY IF EXISTS "Users can insert their own meditation sessions" ON public.meditation_sessions;
DROP POLICY IF EXISTS "Users can update their own meditation sessions" ON public.meditation_sessions;
DROP POLICY IF EXISTS "Users can delete their own meditation sessions" ON public.meditation_sessions;

CREATE POLICY "Users can view their own meditation sessions" 
ON public.meditation_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meditation sessions" 
ON public.meditation_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meditation sessions" 
ON public.meditation_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meditation sessions" 
ON public.meditation_sessions
FOR DELETE
USING (auth.uid() = user_id);
