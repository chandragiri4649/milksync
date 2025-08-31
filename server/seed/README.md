# Database Seed Scripts

This folder contains scripts for seeding and managing admin users in the database.

## Environment Variables

Add these to your `.env` file to customize admin credentials:

```env
# Admin credentials (optional - defaults will be used if not set)
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=durgsaivaraprasadchan@gmail.com
DEFAULT_ADMIN_PASSWORD=admin123

# Database connection
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/your-database
```

## Available Scripts

### 1. Create Admin User
```bash
npm run seed:admin
```
- Creates a new admin user if one doesn't exist
- Uses environment variables for credentials
- Shows helpful message if admin already exists

### 2. Reset Admin Password
```bash
npm run seed:reset-admin
```
- Updates existing admin user's username, email, and password
- Clears any existing password reset tokens
- Useful for resetting forgotten credentials

## Default Values

If environment variables are not set, these defaults will be used:
- **Username**: `admin`
- **Email**: `durgsaivaraprasadchan@gmail.com`
- **Password**: `admin123`

## Usage Examples

### First-time setup:
```bash
npm run seed:admin
```

### Reset admin credentials:
```bash
npm run seed:reset-admin
```

### Custom credentials (set in .env first):
```env
DEFAULT_ADMIN_USERNAME=superadmin
DEFAULT_ADMIN_EMAIL=myemail@gmail.com
DEFAULT_ADMIN_PASSWORD=securepassword123
```

## Security Notes

⚠️ **IMPORTANT**: 
- Change the default password after first login
- Use strong passwords in production
- Keep your `.env` file secure and never commit it to version control
