# ✨ Glow-AI

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036?style=for-the-badge)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Face_Analysis-FF6F00?style=for-the-badge)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)

---

## 🌸 Overview

**Glow-AI** is an AI-powered beauty, grooming, and salon marketplace that delivers personalized beauty analysis, style recommendations, and salon discovery through an intelligent AI experience.

The platform combines **computer vision**, **AI analysis**, **personalized recommendations**, and **location-based salon discovery** into one seamless application.

Glow-AI aims to simplify beauty and grooming decisions by providing users with personalized recommendations based on facial analysis, skin tone, preferences, budget, and nearby salons.

---
# ✨ Glow-AI

### 🌐 Live Demo

**Frontend:** https://glow-ai-frontend.onrender.com

**Backend API:** https://glow-ai-backend-iqpd.onrender.com

# ✨ Key Features

## 🤖 AI Beauty Scan

- Live webcam face scan
- Guided selfie capture
- Smile detection before capture
- AI face validation
- Face centering guidance
- Lighting validation
- Blur detection
- Automatic selfie capture
- Upload photo alternative

---

## 🧠 AI Face Analysis

Glow-AI performs intelligent analysis including:

- Face Shape Detection
- Skin Tone Detection
- Skin Undertone Detection
- Facial Symmetry
- AI Confidence Scores
- Personalized Style Suggestions

---

## 💄 Personalized Style Profile

Generate a complete beauty profile based on:

- Face Analysis
- Skin Tone
- Style Preference
- Budget
- Occasion
- Hair Preferences
- Beauty Goals

Users can either:

- Upload their own image
- OR automatically use the AI Scan selfie

---

## 💬 Glow AI Concierge

AI Beauty Assistant capable of:

- Personalized beauty advice
- Salon recommendations
- Service suggestions
- Bridal planning
- Budget optimization
- Styling recommendations
- Mumbai salon discovery

Powered by:

- Groq API
- Llama 3.3 70B Versatile
- Express Backend
- Streaming responses (Server-Sent Events)
---

## 💇 Salon Marketplace

Discover salons by:

- Current Location
- Mumbai Area
- Rating
- Price
- Services
- Distance
- Beauty Category

Supports:

- Manual location selection
- Nearby salon discovery
- Smart recommendations

---

## 👰 Bridal Planner

Includes:

- Wedding Timeline
- Bridal Checklist
- Personalized Style
- Salon Recommendations
- Budget Planning
- Service Timeline

---

## 📍 Mumbai Beauty Marketplace

Glow-AI is focused on Mumbai and supports:

- South Mumbai
- Western Suburbs
- Central Mumbai
- Eastern Suburbs
- Navi Mumbai
- Thane Region

---

## 📱 Responsive Design

Optimized for:

- Desktop
- Tablet
- Mobile

---

# 🛠 Tech Stack

## Frontend

- React 18
- Vite
- React Router
- Tailwind CSS
- Framer Motion
- Lucide Icons

---

## Backend

- Node.js
- Express.js
- REST APIs
- Helmet
- CORS
- Morgan
- Rate Limiting

---

## AI & Machine Learning

- Groq API (Llama 3.3 70B)
- MediaPipe Face Detection
- MediaPipe Face Landmarker
- AI Face Shape Classification
- Skin Tone Analysis
- Smile Detection

---

## APIs

- Groq API
- Google Places API
- Google Maps API

---

## Deployment

Frontend

- Render

Backend

- Render
---

# 📂 Project Structure

```
Glow-AI
│
├── backend
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── routes
│   ├── services
│   ├── utils
│   ├── app.js
│   └── server.js
│
├── src
│   ├── assets
│   ├── components
│   ├── context
│   ├── data
│   ├── layouts
│   ├── pages
│   ├── services
│   └── App.jsx
│
├── public
├── package.json
├── vite.config.js
├── vercel.json
└── README.md
```

---

# 🚀 Installation

Clone the repository

```bash
git clone https://github.com/Shrezzzzz/GLOW-AI.git

cd Glow-AI
```

Install frontend

```bash
npm install
```

Install backend

```bash
cd backend
npm install
```

Run frontend

```bash
npm run dev
```

Run backend

```bash
cd backend
npm run dev
```

Frontend

```
http://localhost:5173
```

Backend

```
http://localhost:5001
```

---

# 🔑 Environment Variables

Frontend

```env
VITE_API_BASE_URL=http://localhost:5001

VITE_STORAGE_PROVIDER=api

VITE_DEBUG=false
```

Backend

```env
NODE_ENV=development

PORT=5001

PORT=5001
GROQ_API_KEY=gsk********
GROQ_MODEL=llama-3.3-70b-versatile
GOOGLE_PLACES_API_KEY=
GOOGLE_MAPS_API_KEY=
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
NODE_ENV=development

```

---

# 🎯 Usage

## 1. Start the AI Beauty Scan

- Open the landing page.
- Click **Start AI Beauty Scan**.
- Allow camera permissions.
- Position your face inside the circular frame.

Glow-AI automatically checks:

- ✅ Face detected
- ✅ Single face
- ✅ Face centered
- ✅ Face size
- ✅ Good lighting
- ✅ Image sharpness

After passing all validations, users are prompted to smile before capture is enabled.

---

## 2. AI Face Analysis

After capturing the selfie, Glow-AI performs AI-powered analysis to determine:

- Face Shape
- Skin Tone
- Skin Undertone
- Facial Symmetry
- AI Confidence Score

The captured selfie is automatically stored and can be reused during profile setup.

---

## 3. Complete Beauty Profile

Users complete a personalized beauty profile including:

- Name
- Gender
- Beauty Goals
- Style Preference
- Budget
- Occasion
- Hair Preferences
- Skin Concerns

Glow-AI combines profile information with AI analysis to generate highly personalized recommendations.

---

## 4. Discover Salons

Browse salons by:

- Current Location
- Mumbai Area
- Price
- Rating
- Service
- Category

Each salon page includes:

- Services
- Ratings
- Reviews
- Pricing
- Available Experiences
- Personalized Match Score

---

## 5. Talk to Glow AI

The built-in AI concierge can answer questions such as:

- Recommend salons near Bandra
- Suggest a bridal skincare routine
- Best haircut for oval face
- Affordable salons under ₹2000
- Hair colour recommendations
- Makeup advice
- Grooming tips

---

# 🧠 AI Pipeline

```
Camera Access
      │
      ▼
Face Detection
      │
      ▼
Live Validation
      │
      ▼
Smile Detection
      │
      ▼
Capture Selfie
      │
      ▼
MediaPipe Face Landmarks
      │
      ▼
Face Shape Analysis
      │
      ▼
Skin Tone Detection
      │
      ▼
Beauty Profile
      │
      ▼
AI Recommendations
      │
      ▼
Salon Matching
```

---

# 🏗️ System Architecture

```
                    React Frontend
                           │
                           ▼
                 Beauty Profile Context
                           │
        ┌──────────────────┴───────────────────┐
        ▼                                      ▼
 AI Beauty Scan                      Glow AI Chat
        │                                      │
        ▼                                      ▼
 MediaPipe Analysis                  Express Backend
        │                                      │
        ▼                                      ▼
 Face + Skin Results                 Groq API (Llama 3.3 70B)
        │                                      │
        └──────────────┬───────────────────────┘
                       ▼
             Recommendation Engine
                       │
                       ▼
              Salon Marketplace
```

---

# 📸 AI Beauty Scan Workflow

### Camera Access

The application requests webcam access only when the user starts an AI scan.

---

### Face Validation

Glow-AI validates:

- Face Presence
- Single Face
- Face Size
- Face Position
- Brightness
- Blur

---

### Smile Detection

Once validation passes, the system enters smile detection mode.

Users must smile before the capture button becomes available.

---

### Capture

The captured image is stored for:

- Beauty Profile
- AI Analysis
- Report Generation

---

### AI Analysis

Glow-AI performs:

- Face Landmark Detection
- Face Shape Classification
- Skin Tone Detection
- Undertone Detection

---

### Recommendations

The AI combines:

- Analysis
- User Preferences
- Budget
- Occasion
- Beauty Goals

to generate personalized beauty recommendations.

---

# 🌟 Major Features

## AI Beauty Scanner

✔ Guided Camera Experience

✔ Smile Detection

✔ MediaPipe Integration

✔ Upload Fallback

✔ Confidence Scores

✔ Intelligent Error Recovery

---

## Beauty Profile

✔ Multi-Step Wizard

✔ AI Scan Integration

✔ Manual Upload Support

✔ Style Preferences

✔ Budget Preferences

✔ Occasion Selection

---

## AI Concierge

✔ Groq LLM Integration

✔ Real-time Streaming Responses

✔ Streaming Responses

✔ Beauty Advice

✔ Salon Suggestions

✔ Product Guidance

✔ Bridal Planning

---

## Marketplace

✔ Smart Salon Matching

✔ Filters

✔ Nearby Search

✔ Current Location

✔ Personalized Ranking

---

## Reports

✔ AI Analysis Summary

✔ Face Shape

✔ Skin Tone

✔ Beauty Suggestions

✔ Salon Recommendations

---

# ⚙️ Deployment

## Frontend

Glow-AI is optimized for deployment on **Vercel**.

Build Command

```bash
npm run build
```

Output Directory

```
dist
```

Environment Variables

```env
VITE_API_BASE_URL=https://glow-ai-backend-iqpd.onrender.com

VITE_STORAGE_PROVIDER=api
```

---

## Backend

Deploy the backend separately using:

- Render
- Railway
- Fly.io
- VPS
- DigitalOcean

Start Command

```bash
npm start
```
---

## Automatic Deployment

Every push to the GitHub repository automatically triggers a new deployment on Vercel (if connected).

```
GitHub
   │
   ▼
Vercel
   │
   ▼
Automatic Build
   │
   ▼
Production Website
```

---

# 🔮 Future Improvements

Planned features include:

- Hairstyle Preview
- Makeup Recommendation Engine
- Celebrity Look Matching
- Virtual Hair Color
- Virtual Makeup Try-On
- Appointment Booking
- Payment Gateway
- Push Notifications
- AI Fashion Recommendations
- Salon Owner Dashboard
- Admin Dashboard
- Analytics Dashboard
- Loyalty Program
- Membership System

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository.

2. Create a feature branch.

```bash
git checkout -b feature/my-feature
```

3. Commit your changes.

```bash
git commit -m "Added awesome feature"
```

4. Push the branch.

```bash
git push origin feature/my-feature
```

5. Open a Pull Request.

---

# 👥 Team

Glow-AI was developed as a collaborative project by:

### **Shreya Chowdhury**

**Role**

- Backend Development
- Frontend AI Integration
- Product Strategy
- Testing & Validation

---

### **Prakriti Sarkar**

**Role**

- Backend Development
- API Integration

---

### **Srijita Biswas**

**Role**

- UI/UX Design
- Frontend Development

---

# 📂 Repository

GitHub Repository

https://github.com/Shrezzzzz/Glow-AI

---

# 📜 License

This project is intended for educational and portfolio purposes.

You are free to fork and learn from the project. Please provide attribution if substantial portions are reused.

---

# 🙏 Acknowledgements

Special thanks to the following technologies and communities that made this project possible:

- React
- Vite
- Express.js
- Node.js
- Tailwind CSS
- Framer Motion
- MediaPipe
- GroqAI
- Google Maps Platform
- Lucide Icons

---

# ⭐ Support

If you found this project useful, please consider giving it a ⭐ on GitHub.

It helps others discover the project and supports future development.

---

**Built with ❤️ using AI, Computer Vision, and Modern Web Technologies.**
