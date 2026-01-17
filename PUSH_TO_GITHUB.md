# Push Code to GitHub - Quick Guide

## Step-by-Step Commands

Open Terminal and run these commands:

```bash
# 1. Go to project directory
cd "/Users/hamadi/Downloads/The Pet Kitchen Website"

# 2. Check status
git status

# 3. Add all changes
git add .

# 4. Commit changes
git commit -m "Fix API URL for ngrok, update CORS, and add ngrok support"

# 5. Push to GitHub
git push origin main
```

## If Push Requires Authentication

If git asks for username/password:

1. **Use Personal Access Token** (not password):
   - Go to: https://github.com/settings/tokens
   - Generate new token (classic)
   - Select `repo` scope
   - Copy the token
   - Use token as password when git asks

2. **Or use SSH** (if you have SSH keys set up):
   ```bash
   git remote set-url origin git@github.com:hamadi1223/the-pet-kitchen.git
   git push origin main
   ```

## Verify Push Success

```bash
git log --oneline -1
# Should show your latest commit

git status
# Should say "Your branch is up to date with 'origin/main'"
```

## After Pushing

Your code is now on GitHub at:
**https://github.com/hamadi1223/the-pet-kitchen**

You can clone it on your PC with:
```bash
git clone https://github.com/hamadi1223/the-pet-kitchen.git
```

