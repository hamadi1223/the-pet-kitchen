# Sync Code Across Devices with Cursor

## Option 1: Using Git/GitHub (Recommended)

### On Your Mac (Current Device):

1. **Make sure all changes are committed:**
   ```bash
   cd "/Users/hamadi/Downloads/The Pet Kitchen Website"
   git add .
   git commit -m "Latest changes"
   git push origin main
   ```

2. **Verify push was successful:**
   ```bash
   git log --oneline -1
   ```

### On Your PC:

1. **Install Git** (if not already installed):
   - Windows: Download from https://git-scm.com/download/win
   - Or use: `winget install Git.Git`

2. **Install Cursor** on PC:
   - Download from https://cursor.sh
   - Sign in with the same Cursor account

3. **Clone the repository:**
   ```bash
   cd C:\Users\YourUsername\Documents
   git clone https://github.com/hamadi1223/the-pet-kitchen.git
   ```

4. **Open in Cursor:**
   - Open Cursor
   - File → Open Folder
   - Select the `the-pet-kitchen` folder

### Daily Workflow:

**On Mac:**
```bash
git add .
git commit -m "Your changes"
git push
```

**On PC:**
```bash
git pull  # Get latest changes
# Make your changes
git add .
git commit -m "Your changes"
git push
```

---

## Option 2: Cursor Account Sync

Cursor can sync some settings across devices:

### Sync Settings:
1. **On Mac**: 
   - Cursor → Settings → Sign in to your Cursor account
   - Settings will sync automatically

2. **On PC**:
   - Install Cursor
   - Sign in with the same account
   - Settings will sync

### What Syncs:
- ✅ Cursor settings
- ✅ Extensions (if supported)
- ✅ Some preferences
- ❌ Code files (use Git for this)
- ❌ Project files (use Git for this)

---

## Option 3: Manual Sync (Quick & Simple)

### Using Cloud Storage (Dropbox, OneDrive, Google Drive):

1. **Move project to cloud folder**:
   ```bash
   # On Mac
   mv "/Users/hamadi/Downloads/The Pet Kitchen Website" ~/Dropbox/
   # Or to OneDrive/Google Drive folder
   ```

2. **Install cloud sync on PC**
3. **Open synced folder in Cursor on PC**

**Note**: Be careful with `.env` files - they contain secrets!

---

## Option 4: Using Git with Cursor on Both Devices

### Setup on Mac (Already done):

✅ Repository: `https://github.com/hamadi1223/the-pet-kitchen.git`

### Setup on PC:

1. **Open Terminal/PowerShell on PC**

2. **Clone repository:**
   ```powershell
   cd C:\Users\YourUsername\Documents
   git clone https://github.com/hamadi1223/the-pet-kitchen.git
   cd the-pet-kitchen
   ```

3. **Open in Cursor:**
   - Open Cursor
   - File → Open Folder
   - Select `C:\Users\YourUsername\Documents\the-pet-kitchen`

4. **Setup environment**:
   ```powershell
   # Install backend dependencies
   cd backend
   npm install
   
   # Create .env file (copy from Mac or create new)
   # Don't commit .env files!
   ```

---

## Important: Environment Files (.env)

**NEVER commit `.env` files!** They contain secrets.

### To sync .env between devices:

1. **Manually copy** `.env` from Mac to PC
2. **Or use secure sharing**:
   - Password manager (1Password, LastPass)
   - Encrypted message
   - Secure file transfer

3. **On PC**, create `backend/.env` with the same values

---

## Recommended Setup

### Use Git + Cursor Account:

✅ **Code**: Git/GitHub (free, version controlled)  
✅ **Settings**: Cursor account sync  
✅ **Secrets**: Manual copy (don't commit!)

### Workflow:

**Mac** → `git push` → **PC** → `git pull`

Both devices stay in sync!

---

## Quick Start Commands for PC

```powershell
# 1. Clone repository
git clone https://github.com/hamadi1223/the-pet-kitchen.git
cd the-pet-kitchen

# 2. Install backend dependencies
cd backend
npm install

# 3. Create .env file (copy from Mac)
# Copy backend/.env from Mac

# 4. Install ngrok (if needed)
# Download from https://ngrok.com/download
# Or: winget install ngrok

# 5. Start backend
npm start

# 6. Start ngrok (in another terminal)
ngrok http 8000
```

---

## Troubleshooting

### "Repository not found" error?
- Make sure you're signed in to GitHub
- Check repository is set to Public or you have access

### Settings not syncing?
- Check Cursor → Settings → Account
- Make sure you're signed in on both devices

### Files out of sync?
- Always `git pull` before starting work
- Always `git push` after making changes
- Use `git status` to check for uncommitted changes

---

## Need Help?

- Git documentation: https://git-scm.com/doc
- GitHub help: https://docs.github.com
- Cursor docs: https://cursor.sh/docs

