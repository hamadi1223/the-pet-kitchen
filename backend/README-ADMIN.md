# Creating Admin Account

## Quick Method (Recommended)

### Option 1: Using Node.js Script (Best)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Make sure your `.env` file is configured with database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=petkitchen
   ```

4. Run the script:
   ```bash
   node scripts/create-admin.js
   ```

This will create an admin account with:
- **Email:** admin@admin.com
- **Password:** admin123
- **Role:** admin

### Option 2: Using SQL Script

1. Open phpMyAdmin or MySQL command line
2. Select your database
3. Run the SQL script:
   ```sql
   -- From: backend/database/create-admin.sql
   INSERT INTO users (email, password_hash, name, role) 
   VALUES (
     'admin',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     'Admin',
     'admin'
   )
   ON DUPLICATE KEY UPDATE 
     password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
     name = 'Admin',
     role = 'admin';
   ```

## Verify Admin Account

After creating the account, you can verify it by:

1. Logging in at `/login.html` with:
   - Email: `admin@admin.com`
   - Password: `admin123`

2. Accessing the admin dashboard at `/admin.html`

## Security Note

⚠️ **Important:** Change the default password immediately after first login in production!

The default password "admin" is only for initial setup. For production, you should:

1. Log in with the admin account
2. Change the password through your account settings, OR
3. Update it directly in the database using a new bcrypt hash

