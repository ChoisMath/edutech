# Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: Thumbnail Upload Fails (403 Unauthorized)

**Error**: `Supabase Storage 오류: {'statusCode': 403, 'error': Unauthorized, 'message': signature verification failed}`

**Root Cause**: Missing `SUPABASE_SERVICE_ROLE_KEY` environment variable in local development.

**Solution**:
1. Copy `.env.example` to `.env`
2. Get your Supabase Service Role Key from Supabase Dashboard > Settings > API
3. Add it to your `.env` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
   ```
4. Restart the Flask application

### Issue 2: Request Cards Appear Immediately (view=1 instead of view=0)

**Error**: Cards submitted through "추가요청" modal appear immediately instead of waiting for admin approval.

**Root Cause**: Backend wasn't handling the `view` field from frontend requests.

**Solution**: Fixed in `app.py:212` - now properly handles `view` field from request data.

**Verification**: Cards submitted via "추가요청" should have `view=0` and not appear on the main page until admin approval.

### Issue 3: Admin Functions Don't Work Locally

**Error**: Edit/delete functions work on Railway production but fail locally.

**Root Cause**: Missing environment variables, particularly `SUPABASE_SERVICE_ROLE_KEY`.

**Solution**: Same as Issue 1 - ensure all required environment variables are set locally.

### Issue 4: Database Schema Inconsistencies

**Error**: Application references fields (`view`, `keyword`) that don't exist in database.

**Root Cause**: Database schema is outdated compared to application code.

**Solution**: Run the migration scripts in order:
1. Apply `supabase-schema.sql` (base schema)
2. Apply `add_sort_order_migration.sql` (adds sort_order field)
3. Apply `add_view_and_keyword_migration.sql` (adds view and keyword fields)

## Environment Variables Required

Create a `.env` file in the project root with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Flask Configuration (optional)
FLASK_ENV=development
PORT=5000
```

## Database Schema Update

If you encounter database-related errors, ensure your Supabase database has all required fields by running these SQL commands in the Supabase SQL Editor:

```sql
-- Check if fields exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'edutech_cards' 
AND column_name IN ('view', 'keyword', 'sort_order');
```

If any fields are missing, run the appropriate migration file.

## Development vs Production Differences

- **Production (Railway)**: Environment variables are automatically configured
- **Local Development**: Must manually set environment variables in `.env` file
- **Supabase**: Same database/storage used for both environments, differences are in access credentials

## Debugging Steps

1. **Check Environment Variables**:
   ```bash
   python -c "import os; print('Supabase URL:', bool(os.getenv('NEXT_PUBLIC_SUPABASE_URL'))); print('Service Key:', bool(os.getenv('SUPABASE_SERVICE_ROLE_KEY')))"
   ```

2. **Test Database Connection**:
   Visit `/health` endpoint to check database connectivity

3. **Check Browser Console**:
   Look for JavaScript errors in browser developer tools

4. **Check Server Logs**:
   Flask logs show detailed error messages for backend issues

## Quick Fixes Checklist

- [ ] `.env` file created with all required variables
- [ ] Database schema updated with all migration scripts
- [ ] Flask application restarted after environment changes
- [ ] Browser cache cleared if experiencing stale JavaScript issues