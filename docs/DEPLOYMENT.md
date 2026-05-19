# Invenzo Deployment Guide

This guide deploys Invenzo with:

- Backend: Render Web Service
- Database: Render PostgreSQL
- Frontend: Vercel static Angular app

## Deployment Shape

```text
Browser
  -> Vercel Angular Frontend
  -> Render NestJS API
  -> Render PostgreSQL
```

## 1. Deploy Backend and Database on Render

1. Push the repository to GitHub.
2. Open Render.
3. Choose **New -> Blueprint**.
4. Connect the Invenzo GitHub repository.
5. Render will detect `render.yaml`.
6. Create the services.

Render will create:

- `invenzo-backend`
- `invenzo-db`

The backend build command is:

```bash
npm install && npm run prisma:generate && npm run build
```

The backend start command is:

```bash
npm run prisma:migrate:prod && npm run start:prod
```

## 2. Set Backend Environment Variables

Render auto-generates or links most values from `render.yaml`.

After the frontend is deployed, set this value in Render:

```text
FRONTEND_URL=https://your-vercel-app.vercel.app
```

Optional production values:

```text
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## 3. Seed Production Demo Data

Only seed demo data if this deployment is for demo or QA.

In Render shell for `invenzo-backend`, run:

```bash
npm run prisma:seed
```

Do not run seed data on a real client production database unless they explicitly want demo records.

## 4. Deploy Frontend on Vercel

1. Open Vercel.
2. Import the same GitHub repository.
3. Set **Root Directory** to:

```text
frontend
```

4. Set **Framework Preset** to Angular.
5. Use:

```text
Build Command: npm run build
Output Directory: dist/frontend/browser
Install Command: npm install
```

If Vercel shows `dist/frontend` instead of `dist/frontend/browser` after build, use the directory that contains `index.html`.

## 5. Point Frontend to Backend

Before deploying the frontend, update:

```text
frontend/src/environments/environment.prod.ts
```

Set:

```ts
apiUrl: 'https://your-render-backend.onrender.com/api/v1'
```

Example:

```ts
export const environment = {
  production: true,
  apiUrl: 'https://invenzo-backend.onrender.com/api/v1',
  appName: 'Invenzo',
  appVersion: '1.0.0'
};
```

Commit and push that change, then redeploy Vercel.

## 6. Verify Deployment

Open the backend health URL:

```text
https://your-render-backend.onrender.com/api/v1/health
```

Expected result:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

Open the frontend:

```text
https://your-vercel-app.vercel.app
```

Login with seeded demo account if seed was run:

```text
owner@invenzo.com
password123
```

## 7. Smoke Test Checklist

After deployment, test:

- Login works.
- Dashboard loads without unauthorized loops.
- Products list loads.
- Customers and vendors load.
- Purchase order can be created.
- GRN can receive stock.
- Stock overview updates.
- Quotation can be created.
- Quotation can convert to sales order.
- Delivery can reduce stock.
- Invoice and payment screens load.
- Manufacturing summary, BOMs, work orders, MRP, and indents load.
- Reports load.

## 8. Common Issues

### CORS Error

Set Render backend environment variable:

```text
FRONTEND_URL=https://your-vercel-app.vercel.app
```

Then restart the backend service.

### Database Tables Missing

Check Render logs and confirm this command ran:

```bash
npm run prisma:migrate:prod
```

You can also run it manually from Render shell.

### Login Has No Demo User

Run seed from Render shell:

```bash
npm run prisma:seed
```

### Frontend Calls Wrong API

Check:

```text
frontend/src/environments/environment.prod.ts
```

It must point to the Render backend URL ending with:

```text
/api/v1
```

## Recommended Production Setup

For a real client deployment:

- Use a custom domain for frontend.
- Use a custom API domain for backend.
- Use strong JWT secrets.
- Do not seed demo data.
- Configure SMTP for password reset email.
- Configure Cloudinary or another upload provider.
- Use paid database backups.
- Add monitoring and uptime checks.
