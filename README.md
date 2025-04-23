# Meal Prep Planner

A full-stack web application for meal planning, recipe management, and grocery list creation powered by AI.

## 🌟 Features

- **AI-Powered Chat Assistant**: Get recipe suggestions, nutrition advice, and meal planning tips powered by Google Gemini
- **Weekly Meal Plan Generator**: Create personalized meal plans based on your preferences, dietary needs, and goals
- **Smart Grocery List**: Automatically compile shopping lists from your meal plans with ability to check off purchased items
- **Recipe Management**: Save favorite recipes and get nutritional insights
- **User Profiles**: Store your dietary preferences, goals, and restrictions

## 🏗️ Tech Stack

### Frontend
- **Next.js**: React framework for server-rendered applications
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Zustand**: State management library for client-side state
- **TypeScript**: Type-safe JavaScript

### Backend
- **Flask**: Python web framework for the backend API
- **Google Gemini**: AI model for the chatbot assistant
- **JWT**: Authentication mechanism

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- Google Gemini API key

### Installation

#### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Copy `.env.example` to `.env` and add your Google Gemini API key:
   ```bash
   cp .env.example .env
   ```

6. Start the backend server:
   ```bash
   flask run
   ```

#### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🧠 Architecture

### Client-Side State Management
The application uses Zustand for client-side state management instead of a traditional database. This allows for a more responsive user experience and offline capabilities.

### Frontend-Backend Integration
The frontend communicates with the backend through RESTful API endpoints for:
- User authentication
- Meal plan generation
- Chat functionality with Google Gemini integration
- Nutritional insights

## 📱 Core Functionality

### User Authentication
- Sign up/login workflow
- Profile management with dietary preferences

### Meal Planning
- Generate weekly meal plans based on preferences
- Swap out meals for alternatives
- View nutritional breakdown of plans

### Grocery List
- Auto-generate grocery lists from meal plans
- Mark items as purchased
- Organize by category

### Chat Assistant
- Ask about nutrition
- Get recipe suggestions
- Get cooking tips
- One-click add recipes to your meal plan

## 📃 License

This project is licensed under the MIT License - see the LICENSE file for details. 
