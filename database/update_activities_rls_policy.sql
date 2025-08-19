-- Update RLS policy for activities table to allow invited users to read activity details
-- This should be executed in Supabase SQL editor

-- First, drop the existing policy if it exists
DROP POLICY IF EXISTS "Users can view public and friends activities" ON activities;
DROP POLICY IF EXISTS "Users can view public, friends, and invited activities" ON activities;

-- Create updated policy that includes invited users
CREATE POLICY "Users can view public, friends, and invited activities" ON activities
    FOR SELECT USING (
        visibility = 'public' OR 
        (visibility = 'friends' AND creator_id IN (
            SELECT CASE 
                WHEN user_a = auth.uid() THEN user_b 
                WHEN user_b = auth.uid() THEN user_a 
            END as friend_id
            FROM friendships 
            WHERE status = 'accepted' 
            AND (user_a = auth.uid() OR user_b = auth.uid())
        )) OR
        -- Allow access if user has been invited to this activity (any status)
        id IN (
            SELECT activity_id 
            FROM activity_invitations 
            WHERE invited_user_id = auth.uid()
        ) OR
        -- Allow creators to see their own activities
        creator_id = auth.uid()
    );
