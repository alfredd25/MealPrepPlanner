import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'a-very-secret-key-for-development')
    DEBUG = os.getenv('FLASK_ENV', 'development') == 'development'
    
    # JWT settings
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-for-development')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # Google Gemini API settings
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', None)
    
    # CORS settings
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # Application settings
    APP_NAME = "Meal Prep Planner"
    APP_VERSION = "1.0.0"
