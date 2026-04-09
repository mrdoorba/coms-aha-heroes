-- Add can_submit_points flag to users
ALTER TABLE users ADD COLUMN can_submit_points BOOLEAN NOT NULL DEFAULT false;

-- Backfill: admin, hr, leader get true; employee stays false
UPDATE users SET can_submit_points = true WHERE role IN ('admin', 'hr', 'leader');

-- Update RLS policy: allow insert when can_submit_points is true
DROP POLICY IF EXISTS ap_insert ON achievement_points;
CREATE POLICY ap_insert ON achievement_points
    FOR INSERT
    WITH CHECK (
        current_setting('app.current_role', true) IN ('admin', 'hr', 'leader')
        OR (current_setting('app.current_role', true) = 'employee'
            AND user_id = current_setting('app.current_user_id', true)::UUID)
        OR (SELECT can_submit_points FROM users WHERE id = current_setting('app.current_user_id', true)::UUID)
    );
