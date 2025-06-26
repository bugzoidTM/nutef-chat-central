
-- Create internal_comments table for private comments between attendants
CREATE TABLE public.internal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  mentioned_user_ids UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE
);

-- Create internal_tasks table for task management between sectors
CREATE TABLE public.internal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_to_sector UUID REFERENCES public.sectors(id) ON DELETE CASCADE,
  assigned_to_user UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create internal_task_comments table for task-specific comments
CREATE TABLE public.internal_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.internal_tasks(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.internal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_task_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for internal_comments
CREATE POLICY "Staff can view internal comments for accessible conversations"
  ON public.internal_comments
  FOR SELECT
  USING (
    public.is_admin() OR
    public.can_access_conversation(conversation_id)
  );

CREATE POLICY "Staff can create internal comments for accessible conversations"
  ON public.internal_comments
  FOR INSERT
  WITH CHECK (
    (public.is_admin() OR public.can_access_conversation(conversation_id)) AND
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = author_id)
  );

CREATE POLICY "Authors can update their own comments"
  ON public.internal_comments
  FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = author_id)
  );

-- RLS policies for internal_tasks
CREATE POLICY "Staff can view internal tasks for accessible conversations"
  ON public.internal_tasks
  FOR SELECT
  USING (
    public.is_admin() OR
    public.can_access_conversation(conversation_id) OR
    assigned_to_user IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    assigned_to_sector IN (SELECT sector_id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Staff can create internal tasks for accessible conversations"
  ON public.internal_tasks
  FOR INSERT
  WITH CHECK (
    (public.is_admin() OR public.can_access_conversation(conversation_id)) AND
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = created_by)
  );

CREATE POLICY "Task creators and assignees can update tasks"
  ON public.internal_tasks
  FOR UPDATE
  USING (
    public.is_admin() OR
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = created_by) OR
    assigned_to_user IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    assigned_to_sector IN (SELECT sector_id FROM public.profiles WHERE user_id = auth.uid())
  );

-- RLS policies for internal_task_comments
CREATE POLICY "Staff can view task comments for accessible tasks"
  ON public.internal_task_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.internal_tasks t
      WHERE t.id = task_id
      AND (
        public.is_admin() OR
        public.can_access_conversation(t.conversation_id) OR
        t.assigned_to_user IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
        t.assigned_to_sector IN (SELECT sector_id FROM public.profiles WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Staff can create task comments for accessible tasks"
  ON public.internal_task_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.internal_tasks t
      WHERE t.id = task_id
      AND (
        public.is_admin() OR
        public.can_access_conversation(t.conversation_id) OR
        t.assigned_to_user IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
        t.assigned_to_sector IN (SELECT sector_id FROM public.profiles WHERE user_id = auth.uid())
      )
    ) AND
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = author_id)
  );

-- Create indexes for better performance
CREATE INDEX idx_internal_comments_conversation_id ON public.internal_comments(conversation_id);
CREATE INDEX idx_internal_comments_author_id ON public.internal_comments(author_id);
CREATE INDEX idx_internal_comments_mentioned_users ON public.internal_comments USING GIN(mentioned_user_ids);
CREATE INDEX idx_internal_tasks_conversation_id ON public.internal_tasks(conversation_id);
CREATE INDEX idx_internal_tasks_assigned_to_sector ON public.internal_tasks(assigned_to_sector);
CREATE INDEX idx_internal_tasks_assigned_to_user ON public.internal_tasks(assigned_to_user);
CREATE INDEX idx_internal_tasks_status ON public.internal_tasks(status);
CREATE INDEX idx_internal_task_comments_task_id ON public.internal_task_comments(task_id);

-- Add triggers to update updated_at timestamp
CREATE TRIGGER update_internal_comments_updated_at
    BEFORE UPDATE ON public.internal_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_internal_tasks_updated_at
    BEFORE UPDATE ON public.internal_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
