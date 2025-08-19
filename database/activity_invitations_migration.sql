-- SQL migration for activity invitations
-- This should be executed in Supabase SQL editor

-- Create activity_invitations table
CREATE TABLE IF NOT EXISTS activity_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    invited_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    responded_at TIMESTAMPTZ,
    
    -- Prevent duplicate invitations
    UNIQUE(activity_id, invited_user_id),
    
    -- Prevent self-invitations
    CHECK (invited_user_id != invited_by)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_invitations_invited_user ON activity_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_invitations_activity ON activity_invitations(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_invitations_invited_by ON activity_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_activity_invitations_status ON activity_invitations(status);

-- Enable RLS
ALTER TABLE activity_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_invitations
-- Users can view invitations they sent or received
CREATE POLICY "Users can view their invitations" ON activity_invitations
    FOR SELECT USING (
        auth.uid() = invited_user_id OR 
        auth.uid() = invited_by
    );

-- Users can create invitations they send
CREATE POLICY "Users can create invitations" ON activity_invitations
    FOR INSERT WITH CHECK (
        auth.uid() = invited_by
    );

-- Users can update invitations they received (responding to them)
CREATE POLICY "Users can respond to their invitations" ON activity_invitations
    FOR UPDATE USING (
        auth.uid() = invited_user_id
    );

-- Users can delete invitations they sent (canceling them)
CREATE POLICY "Users can cancel their invitations" ON activity_invitations
    FOR DELETE USING (
        auth.uid() = invited_by
    );

-- Note: Foreign key constraints are automatically created by the REFERENCES clauses above
-- No need to add them manually
