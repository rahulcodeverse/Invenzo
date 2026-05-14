# Deployment Guide - Invenzo

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup (Supabase)](#database-setup-supabase)
3. [Backend Deployment (Railway)](#backend-deployment-railway)
4. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
5. [Environment Variables](#environment-variables)
6. [Post-Deployment](#post-deployment)
7. [Alternative Options](#alternative-options)

## Prerequisites

- GitHub account
- Git installed locally
- Node.js 18+ installed
- Database provider account (Supabase/Neon)
- Hosting provider accounts (Railway/Render for backend, Vercel/Netlify for frontend)

## Database Setup (Supabase)

### Option 1: Supabase (Recommended for beginners)

1. **Create Account**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up with GitHub
   - Create new project

2. **Get Database URL**
   ```
   Project Settings → Database → Connection String
   Copy the URI format connection string
   ```

3. **Configure Database**
   - Supabase provides PostgreSQL 15 with 500MB free storage
   - Connection pooling included
   - Automatic backups

4. **Connection String Format**:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### Option 2: Neon (Alternative)

1. **Create Account**
   - Go to [https://neon.tech](https://neon.tech)
   - Sign up with GitHub
   - Create new project

2. **Get Database URL**
   ```
   Dashboard → Connection Details
   Copy the connection string
   ```

3. **Free Tier Benefits**
   - 3GB storage
   - Auto-scaling
   - Serverless

## Backend Deployment (Railway)

### Step 1: Prepare Repository

1. **Push code to GitHub**
   ```bash
   cd C:\Users\Rahul\Documents\Invenzo
   git init
   git add .
   git commit -m "Initial commit - Invenzo Backend"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/invenzo.git
   git push -u origin main
   ```

### Step 2: Deploy to Railway

1. **Create Railway Account**
   - Go to [https://railway.app](https://railway.app)
   - Sign up with GitHub
   - Link your GitHub account

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your Invenzo repository
   - Select `backend` folder as root directory

3. **Configure Build Settings**
   ```
   Root Directory: backend
   Build Command: npm install && npx prisma generate && npm run build
   Start Command: npm run start:prod
   ```

4. **Add Environment Variables**
   - Go to project → Variables
   - Add all required variables (see Environment Variables section)

5. **Deploy**
   - Railway will automatically deploy
   - Wait for build to complete
   - Note the public URL (e.g., https://invenzo-backend.railway.app)

### Step 3: Run Migrations

1. **Connect to Railway Shell**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Link to project
   railway link
   
   # Run migrations
   railway run npx prisma migrate deploy
   
   # Seed database (optional)
   railway run npm run prisma:seed
   ```

### Alternative: Deploy to Render

1. **Create Render Account**
   - Go to [https://render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - New → Web Service
   - Connect GitHub repository
   - Select branch: main
   - Root Directory: backend

3. **Configure**
   ```
   Name: invenzo-backend
   Environment: Node
   Build Command: npm install && npx prisma generate && npm run build
   Start Command: node dist/main.js
   ```

4. **Add Environment Variables** (same as Railway)

## Frontend Deployment (Vercel)

### Step 1: Create Angular App (Future)

The frontend will be created in the next phase. For now, the backend is ready to serve API requests.

### When Frontend is Ready:

1. **Deploy to Vercel**
   - Go to [https://vercel.com](https://vercel.com)
   - Import Git Repository
   - Select frontend folder
   - Auto-detected: Angular
   - Deploy

2. **Environment Variables**
   ```
   API_URL=https://invenzo-backend.railway.app/api/v1
   ```

## Environment Variables

### Backend (.env)

**Required Variables**:
```env
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# Database (from Supabase/Neon)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# JWT Secrets (Generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

# SMTP (Choose one free option)
# Option 1: Gmail (with App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@invenzo.com

# Option 2: Brevo (SendinBlue) - 300 emails/day free
# SMTP_HOST=smtp-relay.brevo.com
# SMTP_PORT=587
# SMTP_USER=your-brevo-email
# SMTP_PASS=your-brevo-smtp-key

# Cloudinary (Free tier: 25 credits/month)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URL (update after frontend deployment)
FRONTEND_URL=https://invenzo.vercel.app

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

### How to Generate Secure Secrets

**Option 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -hex 32
```

**Option 3: Online**
- Use [https://randomkeygen.com/](https://randomkeygen.com/)
- Select "CodeIgniter Encryption Keys"

### Setting Up Free SMTP (Gmail)

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Security → 2-Step Verification

2. **Create App Password**
   - Security → App passwords
   - Select app: Mail
   - Select device: Other (Custom name)
   - Generate
   - Copy the 16-character password

3. **Use in .env**
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop
   ```

### Setting Up Cloudinary

1. **Create Account**
   - Go to [https://cloudinary.com](https://cloudinary.com)
   - Sign up (free tier)

2. **Get Credentials**
   - Dashboard → Account Details
   - Copy Cloud Name, API Key, API Secret

3. **Add to .env**

## Post-Deployment

### 1. Verify Deployment

**Test Health Endpoint**:
```bash
curl https://your-backend-url.railway.app/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-02-03T12:00:00.000Z",
    "uptime": 123.45,
    "environment": "production"
  }
}
```

### 2. Test API Documentation

Visit: `https://your-backend-url.railway.app/api/docs`

You should see Swagger UI with all endpoints.

### 3. Create First User

**Register endpoint**:
```bash
curl -X POST https://your-backend-url.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "SecurePass123",
    "firstName": "Admin",
    "lastName": "User",
    "companyName": "Your Company",
    "phone": "+1234567890"
  }'
```

### 4. Monitor Logs

**Railway**:
- Project → Deployments → View Logs

**Render**:
- Service → Logs tab

### 5. Set Up Custom Domain (Optional)

**Railway**:
- Project → Settings → Domains
- Add custom domain
- Update DNS records

**Render**:
- Service → Settings → Custom Domain
- Add domain
- Update DNS

## Alternative Options

### Database Alternatives

1. **ElephantSQL** (PostgreSQL)
   - Free tier: 20MB
   - Good for testing
   - [https://www.elephantsql.com/](https://www.elephantsql.com/)

2. **PlanetScale** (MySQL)
   - Requires schema conversion from PostgreSQL
   - Free tier: 5GB
   - [https://planetscale.com/](https://planetscale.com/)

### Backend Hosting Alternatives

1. **Fly.io**
   - Free tier: 3 shared-cpu VMs
   - [https://fly.io/](https://fly.io/)

2. **Cyclic**
   - Serverless
   - Free tier available
   - [https://www.cyclic.sh/](https://www.cyclic.sh/)

3. **Koyeb**
   - Free tier: 1 web service
   - [https://www.koyeb.com/](https://www.koyeb.com/)

### Frontend Hosting Alternatives

1. **Netlify**
   - 100GB bandwidth/month
   - Auto-deploy from Git
   - [https://www.netlify.com/](https://www.netlify.com/)

2. **GitHub Pages**
   - Free for public repos
   - Custom domain support

3. **Cloudflare Pages**
   - Unlimited bandwidth
   - Fast CDN
   - [https://pages.cloudflare.com/](https://pages.cloudflare.com/)

## Troubleshooting

### Common Issues

**1. Database Connection Fails**
```
Error: Can't reach database server
```
**Solution**: 
- Check DATABASE_URL format
- Verify database is running
- Check firewall rules (allow Railway IPs)

**2. Migrations Fail**
```
Error: Migration failed
```
**Solution**:
```bash
railway run npx prisma migrate reset
railway run npx prisma migrate deploy
```

**3. Build Fails**
```
Error: Cannot find module
```
**Solution**:
- Clear build cache
- Verify package.json
- Check Node version (18+)

**4. App Crashes on Start**
```
Error: Application crashed
```
**Solution**:
- Check environment variables
- View logs for specific error
- Verify start command

### Get Help

- **Railway**: [https://railway.app/discord](https://railway.app/discord)
- **Render**: [https://render.com/docs](https://render.com/docs)
- **Supabase**: [https://supabase.com/discord](https://supabase.com/discord)

## Cost Monitoring

### Free Tier Limits

**Supabase Free**:
- 500MB database
- 2GB bandwidth
- 50,000 monthly active users

**Railway Free**:
- $5 credit/month
- ~500 hours runtime
- 1GB RAM per service

**Vercel Free**:
- 100GB bandwidth
- Unlimited websites
- Automatic HTTPS

### Staying Within Limits

1. **Database**
   - Clean old audit logs regularly
   - Archive historical data
   - Optimize images before upload

2. **Bandwidth**
   - Use pagination
   - Implement caching
   - Compress responses

3. **API Calls**
   - Rate limiting
   - Batch operations
   - Client-side caching

---

## Production Checklist

- [ ] Database deployed and accessible
- [ ] Backend deployed successfully
- [ ] Environment variables configured
- [ ] Migrations run successfully
- [ ] Health check passing
- [ ] API documentation accessible
- [ ] Test user created
- [ ] SMTP working (send test email)
- [ ] File upload working (Cloudinary)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring set up
- [ ] Backup strategy in place

**Congratulations! Your Invenzo backend is now live! 🚀**

