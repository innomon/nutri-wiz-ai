# NutriVision AI 🍎📷

NutriVision AI is a mobile-first, voice-enabled web application that helps users estimate calories and macronutrients by simply pointing their camera at food. 

Powered by **Google Gemini 2.5 Flash** (Vision) and **Gemini TTS**, it runs entirely on the client-side for maximum privacy and speed.

## ✨ Features

*   **Instant Analysis**: Identify food, calories, GI, GL, Protein, and Carbs from a photo.
*   **Voice Interaction**: The AI speaks the summary back to you using high-quality TTS.
*   **Contextual Chat**: Ask follow-up questions (e.g., "Is this safe for diabetics?") about the scanned food.
*   **Privacy First**: Your API key is stored locally in your browser (`localStorage`). No backend server required.
*   **Mobile Optimized**: Designed as a Progressive Web App (PWA) experience with gesture controls.

## 🛠️ Prerequisites

1.  **Node.js**: Version 18 or higher.
2.  **Gemini API Key**: You need a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   *Note: You do not need to configure this in a `.env` file. The app handles key entry via a secure UI modal on the first launch.*

## 💻 Local Development

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/nutrivision-ai.git
    cd nutrivision-ai
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Open in Browser**
    Visit `http://localhost:5173`. 
    
    *Note: To test the Camera functionality on a mobile device, you must access the local server via HTTPS or `localhost`. If testing on a phone on the same network, you may need a tunneling service like `ngrok` or Vite's `--host` flag (though camera permissions often require a secure context).*

## 🚀 Deployment

Since NutriVision AI is a client-side Single Page Application (SPA), it can be deployed to any static hosting provider or containerized service.

### Option A: Deploy to Vercel (Recommended)

Vercel is the easiest way to deploy this app.

1.  Push your code to a Git repository (GitHub, GitLab, etc.).
2.  Log in to [Vercel](https://vercel.com) and click **"Add New..."** -> **"Project"**.
3.  Import your repository.
4.  **Build Settings**: Vercel usually detects Vite automatically.
    *   Framework Preset: `Vite`
    *   Build Command: `npm run build`
    *   Output Directory: `dist`
5.  Click **Deploy**.

User Environment Variables are **not** required because the user enters their own API Key in the UI.

### Option B: Deploy to Google Cloud Run

To deploy to Cloud Run, we need to containerize the application using Docker to serve the static files (e.g., using Nginx).

1.  **Create a `Dockerfile`** in the project root:

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
    # Copy a basic nginx config to handle React Router (SPA)
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

2.  **Build and Submit to Container Registry** (assuming you have Google Cloud SDK installed):

    ```bash
    # Replace PROJECT_ID with your GCP Project ID
    gcloud builds submit --tag gcr.io/PROJECT_ID/nutrivision-ai
    ```

3.  **Deploy to Cloud Run**:

    ```bash
    gcloud run deploy nutrivision-ai \
      --image gcr.io/PROJECT_ID/nutrivision-ai \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated
    ```

4.  **Access your App**: Click the URL provided by the Cloud Run output.

## 📱 Mobile Usage

For the best experience on mobile:
1.  Open the deployed URL in Chrome (Android) or Safari (iOS).
2.  Tap "Share" -> "Add to Home Screen".
3.  Launch the app from your home screen for a full-screen experience.
