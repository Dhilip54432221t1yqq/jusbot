-- SQL Migration to add business_hours to workspaces table
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{
  "monday": {"type": "open_all_day", "hours": []},
  "tuesday": {"type": "open_all_day", "hours": []},
  "wednesday": {"type": "open_all_day", "hours": []},
  "thursday": {"type": "open_all_day", "hours": []},
  "friday": {"type": "open_all_day", "hours": []},
  "saturday": {"type": "open_all_day", "hours": []},
  "sunday": {"type": "open_all_day", "hours": []}
}'::jsonb;
