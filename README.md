# Keyn

A high-performance AI image generation tool featuring prompt enhancement, direct downloads, and modern aesthetics. Powered by Groq (Llama 3) for prompt engineering and Flux for image synthesis.

## Features

- **Prompt Enhancement**: Automatically upgrades simple prompts using Llama 3 via Groq API.
- **High-Quality Images**: Uses the Flux model via Pollinations.ai.
- **History Tracking**: Saves your recent generations locally.
- **Export Options**: Download images, share links, or copy enhanced prompts.

## Tech Stack

- React 18
- Vite
- Tailwind CSS (CDN)
- TypeScript

## Getting Started

1.  Clone the repository:
    ```bash
    git clone https://github.com/KarthikeyanS2006/Keyn.git
    cd Keyn
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

## Deployment on Vercel

1.  Push this code to your GitHub repository.
2.  Log in to [Vercel](https://vercel.com) and click "Add New... > Project".
3.  Import your `Keyn` repository.
4.  Vercel will automatically detect the Vite settings.
5.  Click **Deploy**.

> **Note**: The API Key is currently configured as a fallback in the code for easy deployment. For better security in production, add `VITE_API_KEY` to your Vercel Project Settings > Environment Variables.