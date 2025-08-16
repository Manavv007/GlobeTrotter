# GlobeTrotter Login Credentials

## Quick Login Options

### Option 1: Test User (Created automatically)
- **Email**: `test@example.com`
- **Password**: `test123`

### Option 2: Register New Account
1. Go to `/register` page
2. Fill in your details
3. Use the new credentials to login

### Option 3: Existing Users
If you have existing users in the database, try these common passwords:
- `password`
- `123456` 
- `admin`
- `test123`

## Troubleshooting Login Issues

1. **Make sure both servers are running:**
   - Backend: `http://localhost:5001`
   - Frontend: `http://localhost:3000`

2. **Start servers using:**
   ```bash
   # Double-click this file in project root:
   start-servers.bat
   ```

3. **If login still fails:**
   - Check browser console for errors
   - Verify network requests are going to port 5001
   - Try registering a new account first

## Server Status Check
- Backend API: `http://localhost:5001/api/health`
- Frontend: `http://localhost:3000`

---
**Note**: The test user will be created automatically when you run the backend server for the first time.
