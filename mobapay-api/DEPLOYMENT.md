# Deploying to Vercel

## Prerequisites

1. Install Vercel CLI:
\`\`\`bash
npm i -g vercel
\`\`\`

2. Login to Vercel:
\`\`\`bash
vercel login
\`\`\`

## Deployment Steps

### Method 1: Using Vercel CLI

1. **Initialize your project:**
\`\`\`bash
vercel
\`\`\`

2. **Follow the prompts:**
   - Set up and deploy? **Y**
   - Which scope? Choose your account
   - Link to existing project? **N**
   - Project name? **mobapay-mlbb-scanner**
   - Directory? **./** (current directory)

3. **Deploy:**
\`\`\`bash
vercel --prod
\`\`\`

### Method 2: Using GitHub Integration

1. **Push your code to GitHub**
2. **Go to [vercel.com](https://vercel.com)**
3. **Click "New Project"**
4. **Import your GitHub repository**
5. **Configure build settings:**
   - Framework Preset: **Other**
   - Build Command: Leave empty
   - Output Directory: Leave empty
   - Install Command: **npm install**

### Method 3: Using Vercel Dashboard

1. **Zip your project files**
2. **Go to [vercel.com](https://vercel.com)**
3. **Drag and drop your zip file**

## Environment Variables

Set these in your Vercel dashboard:

- \`PUPPETEER_SKIP_CHROMIUM_DOWNLOAD\`: \`true\`
- \`PUPPETEER_EXECUTABLE_PATH\`: \`/usr/bin/google-chrome-stable\`

## Testing Your Deployment

After deployment, test your API:

\`\`\`bash
# Health check
curl https://your-project.vercel.app/api/health

# Scan player
curl -X POST https://your-project.vercel.app/api/scandb \\
  -H "Content-Type: application/json" \\
  -d '{"gameid":"123456789","serverid":"1234"}'
\`\`\`

## Important Notes

1. **Function Timeout**: Vercel has a 30-second timeout for serverless functions
2. **Cold Starts**: First request might be slower due to cold start
3. **Memory Limits**: Puppeteer uses significant memory, monitor usage
4. **Rate Limits**: Consider implementing rate limiting for production use

## Troubleshooting

### Common Issues:

1. **Puppeteer fails to launch:**
   - Ensure chrome-aws-lambda is installed
   - Check environment variables are set

2. **Timeout errors:**
   - Reduce page load timeouts
   - Optimize selectors and waits

3. **Memory issues:**
   - Ensure browser.close() is always called
   - Consider upgrading Vercel plan for more memory

### Monitoring

- Check function logs in Vercel dashboard
- Monitor function duration and memory usage
- Set up error tracking (Sentry, etc.)
