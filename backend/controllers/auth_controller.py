from flask import jsonify
import uuid
import os
from flask_jwt_extended import create_access_token

# Simple in-memory user storage (would use a database in a real app)
users = {}

def login(data):
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400
    
    # In a real app, you would check against database
    user = users.get(email)
    if not user or user['password'] != password:
        # For demo purposes, create a test account if none exists
        if email == "test@example.com" and password == "password":
            user_id = str(uuid.uuid4())
            users[email] = {
                "id": user_id,
                "name": "Test User",
                "email": email,
                "password": password,  # Would be hashed in real app
                "dietaryGoals": {
                    "calories": 2000,
                    "protein": 100,
                    "fat": 70,
                    "carbs": 250
                },
                "dietType": "none",
                "allergies": [],
                "preferences": {
                    "cuisinePreferences": ["Italian", "Mediterranean"],
                    "useFrozenIngredients": True,
                    "seasonalIngredientsOnly": False
                }
            }
            user = users[email]
        else:
            return jsonify({"message": "Invalid credentials"}), 401
    
    # Create access token
    access_token = create_access_token(identity=email)
    
    # Return user data and token
    return jsonify({
        "token": access_token,
        "profile": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "dietaryGoals": user.get('dietaryGoals', {}),
            "dietType": user.get('dietType', 'none'),
            "allergies": user.get('allergies', []),
            "preferences": user.get('preferences', {})
        }
    }), 200

def signup(data):
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not name or not email or not password:
        return jsonify({"message": "Name, email, and password are required"}), 400
    
    # Check if user already exists
    if email in users:
        return jsonify({"message": "User already exists"}), 409
    
    # Create a new user
    user_id = str(uuid.uuid4())
    users[email] = {
        "id": user_id,
        "name": name,
        "email": email,
        "password": password,  # Would be hashed in real app
        "dietaryGoals": {},
        "dietType": "none",
        "allergies": [],
        "preferences": {
            "cuisinePreferences": [],
            "useFrozenIngredients": True,
            "seasonalIngredientsOnly": False
        }
    }
    
    # Create access token
    access_token = create_access_token(identity=email)
    
    # Return user data and token
    return jsonify({
        "token": access_token,
        "profile": {
            "id": user_id,
            "name": name,
            "email": email,
            "dietaryGoals": {},
            "dietType": "none",
            "allergies": [],
            "preferences": {
                "cuisinePreferences": [],
                "useFrozenIngredients": True,
                "seasonalIngredientsOnly": False
            }
        }
    }), 201
