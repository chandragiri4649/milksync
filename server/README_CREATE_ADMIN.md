# Database Seeding Scripts

This project now uses organized seed scripts for managing admin users in the database.

## 📁 New Structure

All seed scripts are now located in the `seed/` folder with environment variable support.

## 🔧 Available Scripts

### Create Admin User
```bash
npm run seed:admin
```

### Reset Admin Password
```bash
npm run seed:reset-admin
```

## 🌍 Environment Variables

Add these to your `.env` file to customize admin credentials:

```env
# Admin credentials (optional - defaults will be used if not set)
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=durgsaivaraprasadchan@gmail.com
DEFAULT_ADMIN_PASSWORD=admin123

# Database connection
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/your-database
```

## 📋 Default Credentials

If environment variables are not set:
- **Username**: `admin`
- **Email**: `durgsaivaraprasadchan@gmail.com`
- **Password**: `admin123`

## What the Script Does

1. Connects to your MongoDB Atlas database
2. Checks if an admin user already exists (by username or email)
3. If no admin exists, creates a new admin user with hashed password
4. Displays the default credentials
5. Closes the database connection

## Security Note

⚠️ **IMPORTANT**: Change the default password after your first login for security!

## Error Handling

- If an admin already exists, the script will inform you
- If there are connection issues, it will show detailed error messages
- The script handles duplicate key errors gracefully

## Customization

You can modify the default credentials by editing the `DEFAULT_ADMIN` object in the script:

```javascript
const DEFAULT_ADMIN = {
  username: "your-username",
  email: "your-email@example.com",
  password: "your-password"
};
```
