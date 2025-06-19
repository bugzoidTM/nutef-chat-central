
-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'attendant');

-- Create enum for sector types
CREATE TYPE public.sector_type AS ENUM ('support', 'financial', 'sales');

-- Create enum for conversation status
CREATE TYPE public.conversation_status AS ENUM ('new', 'in_progress', 'finished');

-- Create enum for message types
CREATE TYPE public.message_type AS ENUM ('text', 'image', 'audio', 'document');

-- Create enum for message direction
CREATE TYPE public.message_direction AS ENUM ('incoming', 'outgoing');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'attendant',
  sector sector_type,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create instances table for Evolution API instances
CREATE TABLE public.instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  instance_name TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  qr_code TEXT,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.instances(id) ON DELETE CASCADE NOT NULL,
  client_phone TEXT NOT NULL,
  client_name TEXT,
  sector sector_type NOT NULL,
  status conversation_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  from_phone TEXT NOT NULL,
  to_phone TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type message_type NOT NULL DEFAULT 'text',
  direction message_direction NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendant_sectors table for managing which sectors each attendant can handle
CREATE TABLE public.attendant_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sector sector_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(attendant_id, sector)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendant_sectors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for instances
CREATE POLICY "Admins can manage their instances" ON public.instances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin' AND id = admin_id
    )
  );

-- Create RLS policies for conversations
CREATE POLICY "Users can view conversations from their sectors" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
      WHERE p.user_id = auth.uid() 
      AND (p.role = 'admin' OR as_table.sector = conversations.sector)
    )
  );

CREATE POLICY "Users can update conversations from their sectors" ON public.conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
      WHERE p.user_id = auth.uid() 
      AND (p.role = 'admin' OR as_table.sector = conversations.sector)
    )
  );

-- Create RLS policies for messages
CREATE POLICY "Users can view messages from their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
      WHERE c.id = conversation_id 
      AND (p.role = 'admin' OR as_table.sector = c.sector)
    )
  );

CREATE POLICY "Users can insert messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.profiles p ON p.user_id = auth.uid()
      LEFT JOIN public.attendant_sectors as_table ON p.id = as_table.attendant_id
      WHERE c.id = conversation_id 
      AND (p.role = 'admin' OR as_table.sector = c.sector)
    )
  );

-- Create RLS policies for attendant_sectors
CREATE POLICY "Admins can manage attendant sectors" ON public.attendant_sectors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Attendants can view their own sectors" ON public.attendant_sectors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND id = attendant_id
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_conversations_sector ON public.conversations(sector);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON public.messages(timestamp);

-- Enable realtime for real-time updates
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
