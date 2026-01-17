# Ngrok Setup Guide

## Install Ngrok

### Option 1: Using Homebrew (macOS)
```bash
brew install ngrok/ngrok/ngrok
```

### Option 2: Direct Download
1. Go to https://ngrok.com/download
2. Download for macOS
3. Extract and move to `/usr/local/bin/`:
   ```bash
   sudo mv ngrok /usr/local/bin/
   ```

### Option 3: Using npm
```bash
npm install -g ngrok
```

## Authenticate Ngrok (Required)

1. Sign up at https://ngrok.com (free account)
2. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken
3. Run:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

## Start Ngrok

### Step 1: Make sure backend is running
```bash
cd backend
npm start
```
Backend should be running on `http://localhost:8000`

### Step 2: Start ngrok (in a new terminal)
```bash
ngrok http 8000
```

### Step 3: Get your ngrok URL
Ngrok will display something like:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:8000
```

Copy the `https://` URL - this is your public backend URL!

## Use Ngrok URL in Frontend

### Option 1: Update API URL temporarily
In `js/api.js`, you can temporarily set:
```javascript
// For ngrok testing
const API_BASE_URL = 'https://your-ngrok-url.ngrok-free.app/api/v1';
```

### Option 2: Use browser console
Open browser console and run:
```javascript
window.API_BASE_URL = 'https://your-ngrok-url.ngrok-free.app/api/v1';
location.reload();
```

## Ngrok Dashboard

While ngrok is running, you can view:
- **Web Interface**: http://localhost:4040
- **Request Inspector**: See all API requests in real-time
- **Replay Requests**: Test API calls

## Important Notes

1. **Free ngrok URLs change** every time you restart ngrok
2. **For stable testing**, consider ngrok paid plan with fixed domain
3. **CORS is already configured** - ngrok domains are allowed in `backend/server.js`
4. **Backend must be running** before starting ngrok

## Troubleshooting

### "ngrok: command not found"
- Install ngrok first (see above)
- Make sure it's in your PATH

### "ERR_NGROK_108" - Not authenticated
- Run: `ngrok config add-authtoken YOUR_TOKEN`
- Get token from: https://dashboard.ngrok.com/get-started/your-authtoken

### "Port 8000 already in use"
- Backend is already running (good!)
- If you need to stop it: `lsof -ti:8000 | xargs kill`

### CORS errors
- Check that ngrok URL is being used correctly
- Verify `backend/server.js` has ngrok support (already added)

## Quick Start Commands

```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start ngrok
ngrok http 8000

# Copy the https:// URL from ngrok output
# Use it in your frontend or update js/api.js
```

