-- SQL Script to create Agent Groups tables
-- Please run this script in your Supabase SQL Editor

-- 1. Create agent_groups table
CREATE TABLE IF NOT EXISTS public.agent_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    image_url TEXT,
    assign_method VARCHAR(50) NOT NULL DEFAULT 'random', -- random, least_assigned, round_robin
    assign_by_status VARCHAR(50) NOT NULL DEFAULT 'default', -- default, online_first, online_only
    group_chat_enabled BOOLEAN NOT NULL DEFAULT true,
    conversation_visibility VARCHAR(50) NOT NULL DEFAULT 'all', -- all, assigned_to_me
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create agent_group_members table
CREATE TABLE IF NOT EXISTS public.agent_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_group_id UUID NOT NULL REFERENCES public.agent_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    weighting INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(agent_group_id, user_id)
);

-- 3. Enable RLS
ALTER TABLE public.agent_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_group_members ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for agent_groups
CREATE POLICY "Users can view agent groups in their workspaces"
    ON public.agent_groups FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert agent groups in their workspaces"
    ON public.agent_groups FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update agent groups in their workspaces"
    ON public.agent_groups FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete agent groups in their workspaces"
    ON public.agent_groups FOR DELETE
    USING (
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
        )
    );

-- 5. Create Policies for agent_group_members
CREATE POLICY "Users can view members of agent groups in their workspaces"
    ON public.agent_group_members FOR SELECT
    USING (
        agent_group_id IN (
            SELECT id FROM public.agent_groups WHERE workspace_id IN (
                SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage members of agent groups in their workspaces"
    ON public.agent_group_members FOR ALL
    USING (
        agent_group_id IN (
            SELECT id FROM public.agent_groups WHERE workspace_id IN (
                SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        agent_group_id IN (
            SELECT id FROM public.agent_groups WHERE workspace_id IN (
                SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
            )
        )
    );
