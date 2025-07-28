# Sync Status Persistence Test Guide

## Test Steps

1. **Start the development server**:

   ```bash
   npm run dev
   ```

2. **Navigate to the Messages page** (`/messages`)

3. **Test the sync functionality**:

   - Click "Sync Messages" button
   - Verify the button shows "Syncing... (Xs)" with a spinner and duration counter
   - Wait for the sync to complete
   - Verify the button returns to "Sync Messages"

4. **Test persistence across page refresh**:

   - Start a sync operation
   - While it's syncing, refresh the page (F5 or Ctrl+R)
   - Verify the sync status persists and shows "Syncing... (Xs)"
   - **NEW**: The sync should automatically reset after 30 seconds if it's stale
   - Wait for completion or use the debug "Reset" button

5. **Test stale detection**:

   - Start a sync operation
   - Refresh the page while syncing
   - Wait 30+ seconds
   - Verify the sync status automatically resets to "Sync Messages"
   - Check browser console for stale detection logs

6. **Test error handling**:

   - If you have no integrations connected, the sync should fail
   - Verify the sync status resets to "Sync Messages" after error
   - Check browser console for error logs

7. **Test timeout protection**:
   - The sync has a 2-minute timeout
   - If sync hangs, it should automatically reset after 2 minutes

## Expected Behavior

- ✅ Sync status persists across page refreshes
- ✅ Sync status resets when sync completes successfully
- ✅ Sync status resets when sync fails with error
- ✅ **NEW**: Sync status automatically resets after 30 seconds if stale
- ✅ **NEW**: Duration counter shows how long sync has been running
- ✅ Debug logs show sync progress in console
- ✅ Debug "Reset" button clears sync status manually
- ✅ Timeout protection prevents infinite hanging

## Debug Information

Check the browser console for these log messages:

- `🚀 handleSync called` - When sync button is clicked
- `🔄 Starting sync...` - When sync operation starts
- `🔄 Sync status check: running for Xs` - Periodic status checks
- `🔄 Detected stale sync status (running for Xs), resetting...` - Stale detection
- `⏰ Periodic check: Detected stale sync status (running for Xs), resetting...` - Periodic stale detection
- `✅ Sync completed successfully:` - When sync completes
- `📊 Sync result:` - Shows sync result data
- `🔄 Data refreshed after sync` - When data is refreshed
- `❌ Error syncing messages:` - If sync fails
- `💥 Failed to sync messages:` - If sync fails in handleSync

## Troubleshooting

If sync status doesn't reset:

1. Check browser console for error messages
2. Wait 30 seconds for automatic stale detection
3. Use the debug "Reset" button to manually clear status
4. Check if there are any network errors
5. Verify the sync API endpoint is working correctly

## Key Improvements

- **30-second stale detection**: Much faster than the previous 5-minute timeout
- **Periodic checks**: Every 10 seconds, checks if sync is still valid
- **Visual duration counter**: Shows exactly how long sync has been running
- **Better debugging**: More detailed console logs for troubleshooting
