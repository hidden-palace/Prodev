```sql
-- Check if the leads table exists before attempting to add a constraint
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
        -- Check if the chk_leads_rating constraint already exists
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_name = 'chk_leads_rating'
            AND table_name = 'leads'
        ) THEN
            -- Add the chk_leads_rating constraint
            ALTER TABLE leads
            ADD CONSTRAINT chk_leads_rating CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));
        END IF;
    END IF;
END $$;
```