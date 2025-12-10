# Deployment Guide for NutriVision AI

This document provides detailed instructions for deploying NutriVision AI to four popular platforms: Google Cloud Run, Vercel, GitHub Pages, and Firebase Hosting.

---

## 1. Google Cloud Run

Google Cloud Run allows you to run stateless containers that are invocable via web requests. Since this is a static frontend app, we will use Nginx within a Docker container to serve the built files.

### Prerequisites
*   Google Cloud Platform (GCP) Project.
*   [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed and initialized (`gcloud init`).
*   Docker installed locally (optional, if using Cloud Build).

### Step 1: Create Dockerfile
Ensure you have a `Dockerfile` in the root of your project:

```dockerfile
# Stage 1: Build the React application
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Configure Nginx for SPA (Single Page App)
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

### Step 2: Build & Submit Image
You can build the image directly on Google Cloud without needing Docker running locally.

```bash
# Replace [PROJECT_ID] with your actual GCP Project ID
gcloud builds submit --tag gcr.io/[PROJECT_ID]/nutrivision-ai
```

### Step 3: Deploy to Cloud Run

```bash
gcloud run deploy nutrivision-ai \
  --image gcr.io/[PROJECT_ID]/nutrivision-ai \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

After deployment, the terminal will output a **Service URL** (e.g., `https://nutrivision-ai-xyz-uc.a.run.app`).

---

## 2. Vercel

Vercel is the recommended platform for React/Vite applications due to its zero-configuration setup and global CDN.

### Option A: Via Dashboard (Git Integration)
1.  Push your code to a Git provider (GitHub, GitLab, or Bitbucket).
2.  Log in to [Vercel](https://vercel.com).
3.  Click **Add New...** > **Project**.
4.  Import your `nutrivision-ai` repository.
5.  Vercel will detect `Vite` automatically.
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
6.  Click **Deploy**.

### Option B: Via CLI
1.  Install Vercel CLI:
    ```bash
    npm i -g vercel
    ```
2.  Run deploy command in your project root:
    ```bash
    vercel
    ```
3.  Follow the prompts (accept default settings).

---

## 3. GitHub Pages

GitHub Pages is a free hosting service for static sites. Because this app handles routing via React State (not URL paths), it works perfectly on GitHub Pages without complex 404 hacks.

### Step 1: Update `vite.config.ts`
If you are deploying to a user page (e.g., `username.github.io`), skip this.
If you are deploying to a repository page (e.g., `username.github.io/nutrivision-ai/`), you **must** set the base path.

Create or update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // REPLACE 'nutrivision-ai' with your exact repository name
  base: '/nutrivision-ai/', 
})
```

### Step 2: Deploy using GitHub Actions (Recommended)

1.  Create the directory path: `.github/workflows/`
2.  Create a file named `deploy.yml` inside it:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

3.  Push your code to GitHub.
4.  Go to your Repository **Settings** > **Pages**.
5.  Under "Build and deployment" > "Source", select **GitHub Actions**.
6.  The workflow will run automatically, and your site will be live at `https://<user>.github.io/<repo>/`.

### Step 3: Manual Deploy (Alternative)
If you prefer not to use Actions, you can use the `gh-pages` package.

1.  Install the package:
    ```bash
    npm install gh-pages --save-dev
    ```
2.  Add a script to `package.json`:
    ```json
    "scripts": {
      "predeploy": "npm run build",
      "deploy": "gh-pages -d dist"
    }
    ```
3.  Run the deploy command:
    ```bash
    npm run deploy
    ```

---

## 4. Firebase Hosting

Firebase Hosting provides fast and secure hosting for web apps.

### Step 1: Install Firebase CLI
If you haven't already, install the Firebase tools globally:

```bash
npm install -g firebase-tools
```

### Step 2: Login and Initialize
1.  Log in to your Google account:
    ```bash
    firebase login
    ```
2.  Initialize the project in your root directory:
    ```bash
    firebase init hosting
    ```
3.  Follow the interactive prompts:
    *   **Project:** Select "Use an existing project" (create one in Firebase Console if needed) or "Create a new project".
    *   **Public directory:** Enter `dist` (this is where Vite builds the app).
    *   **Configure as a single-page app (rewrite all urls to /index.html)?**: Enter `Yes`.
    *   **Set up automatic builds and deploys with GitHub?**: Optional (Enter `No` for manual deployment).
    *   **File overwrite warnings:** If it asks to overwrite `dist/index.html`, select `No` (or delete the `dist` folder before building).

### Step 3: Build and Deploy
1.  Build the project:
    ```bash
    npm run build
    ```
2.  Deploy to Firebase:
    ```bash
    firebase deploy
    ```

Your app will be live at `https://[YOUR-PROJECT-ID].web.app`.