# Deployment Guide for Vercel

This guide will walk you through deploying your Mark Herring Interview Agent to Vercel.

## Prerequisites

1. GitHub account (recommended for automatic deployments)
2. Vercel account (sign up at [vercel.com](https://vercel.com))
3. Your Anthropic API key

## Option 1: Deploy via GitHub (Recommended)

### Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Initialize git in your project:

```bash
cd /path/to/mark-interview-agent
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/mark-interview-agent.git
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Set Environment Variables

In the Vercel project settings, add:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
PASSWORD_KOREAI=your_koreai_password
PASSWORD_DESCRIPT=your_descript_password
```

### Step 4: Deploy

Click "Deploy" - Vercel will build and deploy your site automatically!

## Option 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login

```bash
vercel login
```

### Step 3: Deploy

From the `web` directory:

```bash
cd web
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Select your account
- **Link to existing project?** No
- **Project name?** mark-interview-agent (or your choice)
- **In which directory is your code located?** ./

### Step 4: Set Environment Variables

```bash
vercel env add ANTHROPIC_API_KEY
vercel env add PASSWORD_KOREAI
vercel env add PASSWORD_DESCRIPT
```

Paste your values when prompted.

### Step 5: Deploy to Production

```bash
vercel --prod
```

## Post-Deployment Setup

### 1. Add Your Photo

After deployment, add your professional photo:

1. Upload `mark-herring.jpg` to the `/public` folder
2. In `components/InterviewHeader.tsx`, uncomment the Image component:

```tsx
<Image
  src="/mark-herring.jpg"
  alt="Mark Herring"
  fill
  className="object-cover"
/>
```

3. Commit and push (or redeploy via CLI)

### 2. Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `interview.markherring.com`)
3. Configure DNS according to Vercel's instructions

For subdomain:
- Type: `CNAME`
- Name: `interview`
- Value: `cname.vercel-dns.com`

### 3. Test Your Deployment

Visit your URLs:
- Home: `https://your-project.vercel.app`
- Kore.ai: `https://your-project.vercel.app/kore.ai`
- Descript: `https://your-project.vercel.app/descript`

## Monitoring & Analytics

### View Usage Stats

Visit: `https://your-project.vercel.app/api/track`

This returns JSON with:
- Total questions asked
- Breakdown by company
- Recent activity

### View Logs

In Vercel Dashboard:
1. Go to your project
2. Click "Logs" tab
3. Filter by function (e.g., `/api/chat`)

## Updating Passwords

### Method 1: Vercel Dashboard

1. Go to Settings → Environment Variables
2. Edit the password variable
3. Redeploy (automatic if connected to GitHub)

### Method 2: Vercel CLI

```bash
vercel env rm PASSWORD_KOREAI production
vercel env add PASSWORD_KOREAI production
# Enter new password when prompted
vercel --prod
```

## Adding New Companies

1. Add context file: `contexts/new_company.md`
2. Add password to environment variables
3. Update `app/page.tsx` with new company link
4. Update `app/api/auth/route.ts` with new company password mapping
5. Commit and push (or redeploy)

## Troubleshooting

### Build Fails

**Error**: "Module not found"
- **Solution**: Ensure all dependencies are in `package.json`
- Run `npm install` locally to test

**Error**: "API route not found"
- **Solution**: Check that API files are in `app/api/` directory

### API Errors

**Error**: "Invalid API key"
- **Solution**: Verify `ANTHROPIC_API_KEY` in environment variables
- Ensure no extra spaces in the key

**Error**: "Context not found"
- **Solution**: Check that context files exist in `contexts/` directory
- Verify file naming (lowercase with underscores)

### Authentication Issues

**Error**: "Company not found"
- **Solution**: Add company password to environment variables
- Check spelling matches exactly in `COMPANY_PASSWORDS` object

## Cost Management

### Anthropic API Costs

Monitor your usage:
- Claude API: ~$0.003 per question (varies by length)
- 1000 questions ≈ $3-10 depending on complexity

Set up billing alerts in your Anthropic account.

### Vercel Costs

- **Hobby Plan**: Free for personal use
  - Bandwidth: 100 GB/month
  - Serverless executions: Unlimited (with fair use)

- **Pro Plan**: $20/month
  - More bandwidth and features
  - Team collaboration

## Security Best Practices

1. **Never commit `.env.local` or `.env` files**
2. **Rotate passwords** if you don't get the job offer
3. **Monitor API usage** to prevent abuse
4. **Use strong passwords** for company access
5. **Enable Vercel's security features** (DDoS protection is automatic)

## Support

Questions about deployment?
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Anthropic API Docs: [docs.anthropic.com](https://docs.anthropic.com)
- Email Mark: markrherring@gmail.com
