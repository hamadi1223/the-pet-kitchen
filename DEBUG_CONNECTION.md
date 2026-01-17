# Debugging "Cannot connect to server" Error

## Quick Checks

1. **Backend Status**
   ```bash
   lsof -ti:8000
   # Should show a process ID
   ```

2. **Ngrok Status**
   ```bash
   ps aux | grep ngrok
   # Should show ngrok process
   ```

3. **Get Current Ngrok URL**
   ```bash
   curl -s http://localhost:4040/api/tunnels | python3 -m json.tool | grep public_url
   ```

4. **Test Connection**
   ```bash
   curl -H "ngrok-skip-browser-warning: true" https://YOUR-NGROK-URL.ngrok-free.dev/api/health
   ```

## Common Issues & Solutions

### Issue 1: Ngrok Browser Warning Page
**Symptom**: Browser shows ngrok warning page instead of your API

**Solution**: The code already includes `ngrok-skip-browser-warning: true` header. If you still see the warning:
- Click "Visit Site" on the ngrok warning page
- Or add the header manually in browser dev tools

### Issue 2: CORS Error
**Symptom**: Browser console shows "CORS policy" error

**Solution**: 
- Backend CORS is configured to allow:
  - `file://` protocol (null origin)
  - All ngrok domains
  - localhost
- If still blocked, check browser console for the exact origin being blocked

### Issue 3: Wrong API URL
**Symptom**: Requests going to wrong URL

**Check**: Open browser console and look for:
```
🔗 API Base URL: https://monoprotic-lacresha-suavely.ngrok-free.dev/api
```

If it shows something else, the frontend might be cached.

**Solution**: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Issue 4: Network Error
**Symptom**: "Failed to fetch" or "NetworkError"

**Check**:
1. Is ngrok still running? (`ps aux | grep ngrok`)
2. Has ngrok URL changed? (Check http://localhost:4040)
3. Is backend running? (`lsof -ti:8000`)

### Issue 5: File Protocol Issues
**Symptom**: Opening HTML files directly (file://) causes issues

**Solution**: 
- Use a local server instead:
  ```bash
  # Python 3
  python3 -m http.server 3000
  # Then open: http://localhost:3000/index.html
  ```

## Browser Console Debugging

1. **Open Console** (F12)
2. **Check API Base URL**:
   ```javascript
   console.log(window.API_BASE_URL);
   // Should show: https://monoprotic-lacresha-suavely.ngrok-free.dev/api
   ```

3. **Test Connection Manually**:
   ```javascript
   fetch('https://monoprotic-lacresha-suavely.ngrok-free.dev/api/health', {
     headers: { 'ngrok-skip-browser-warning': 'true' }
   })
   .then(r => r.json())
   .then(console.log)
   .catch(console.error);
   ```

4. **Check Network Tab**:
   - Open Network tab in DevTools
   - Try to use the site
   - Look for API requests
   - Check:
     - Request URL
     - Status code
     - Response headers
     - Error messages

## Quick Fix Commands

```bash
# Restart backend
lsof -ti:8000 | xargs kill
cd backend && npm start

# Restart ngrok
pkill ngrok
ngrok http 8000

# Get new ngrok URL
curl -s http://localhost:4040/api/tunnels | python3 -m json.tool | grep public_url
```

## Still Not Working?

1. **Check browser console** for specific error
2. **Check Network tab** for failed requests
3. **Verify ngrok URL** hasn't changed
4. **Test with curl** to confirm backend works
5. **Try different browser** to rule out browser-specific issues

