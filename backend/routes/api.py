from flask import Blueprint, jsonify, request
from controllers.auth_controller import login, signup
from controllers.data_controller import get_chat, get_recipes, get_grocery_list
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
import google.generativeai as genai
import os
import json
import random
from datetime import datetime, timedelta

api_bp = Blueprint("api", __name__)

# Initialize Google Gemini API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyCoOMwRoFa6Gqmra5OAMmFhkoIm67joXOQ")
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

# Mock database
users_db = {}
recipes_db = []

# Load sample recipes
try:
    with open('data/sample_recipes.json', 'r') as f:
        recipes_db = json.load(f)
except:
    # If file doesn't exist or can't be loaded, use empty array
    recipes_db = []

# Authentication routes
@api_bp.route("/login", methods=["POST"])
def login_route():
    return login(request.json)

@api_bp.route("/signup", methods=["POST"])
def signup_route():
    return signup(request.json)

@api_bp.route("/user/profile", methods=["GET"])
@jwt_required()
def get_profile():
    email = get_jwt_identity()
    
    if email not in users_db:
        return jsonify({"message": "User not found"}), 404
    
    user = users_db[email]
    
    return jsonify({
        "id": user['id'],
        "name": user['name'],
        "email": user['email'],
        "dietaryGoals": user.get('dietaryGoals', {}),
        "dietType": user.get('dietType', 'none'),
        "allergies": user.get('allergies', []),
        "preferences": user.get('preferences', {})
    }), 200

@api_bp.route("/user/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    email = get_jwt_identity()
    
    if email not in users_db:
        return jsonify({"message": "User not found"}), 404
    
    data = request.json
    user = users_db[email]
    
    # Update fields (ensure we don't overwrite critical fields)
    if 'name' in data:
        user['name'] = data['name']
    
    if 'dietaryGoals' in data:
        user['dietaryGoals'] = data['dietaryGoals']
    
    if 'dietType' in data:
        user['dietType'] = data['dietType']
    
    if 'allergies' in data:
        user['allergies'] = data['allergies']
    
    if 'preferences' in data:
        user['preferences'] = data['preferences']
    
    return jsonify({
        "id": user['id'],
        "name": user['name'],
        "email": user['email'],
        "dietaryGoals": user.get('dietaryGoals', {}),
        "dietType": user.get('dietType', 'none'),
        "allergies": user.get('allergies', []),
        "preferences": user.get('preferences', {})
    }), 200

# Chat routes
@api_bp.route("/chat", methods=["GET"])
def chat_route():
    return get_chat()

@api_bp.route("/chat", methods=["POST"])
def chat():
    data = request.json
    message = data.get('message')
    chat_id = data.get('chatId')
    history = data.get('history', [])
    
    if not message:
        return jsonify({"message": "Message is required"}), 400
    
    try:
        # Set up the system prompt
        system_prompt = """
        You are a helpful meal planning assistant that specializes in nutrition, recipes, and meal preparation.
        You can answer questions about nutrition, suggest recipes, provide meal plans, and offer cooking tips.
        When appropriate, suggest specific recipes that might help the user.
        
        Respond in a friendly, helpful manner.
        """
        
        # For testing, return a static response if the API key is not working properly
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key or api_key == "AIzaSyCoOMwRoFa6Gqmra5OAMmFhkoIm67joXOQ":
            return jsonify({
                "message": "I'm a meal prep assistant. I can help you plan meals, suggest recipes, and provide nutritional information. What would you like to know?",
                "suggestedRecipes": random.sample(recipes_db, min(2, len(recipes_db))) if recipes_db else []
            }), 200
            
        # Simplify the request to avoid history-related errors
        chat = model.start_chat()
        response = chat.send_message(message)  # Send just the message
        
        response_text = response.text
        
        # Check if we should suggest recipes
        suggested_recipes = []
        
        # Check if the message is about recipes, meal plans, or ingredients
        recipe_keywords = ['recipe', 'meal', 'cook', 'prepare', 'breakfast', 'lunch', 'dinner', 'ingredients']
        is_recipe_related = any(keyword in message.lower() for keyword in recipe_keywords)
        
        if is_recipe_related and recipes_db:
            # For demo purposes, just return a few random recipes
            suggested_recipes = random.sample(recipes_db, min(2, len(recipes_db)))
        
        return jsonify({
            "message": response_text,
            "suggestedRecipes": suggested_recipes
        }), 200
    
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return jsonify({
            "message": "I'm sorry, I encountered an error while processing your request. Please try again later."
        }), 500

# Meal planning routes
@api_bp.route("/recipes", methods=["GET"])
def recipes_route():
    return get_recipes()

@api_bp.route("/grocery-list", methods=["GET"])
def grocery_list_route():
    return get_grocery_list()

@api_bp.route("/meal-plan/generate", methods=["POST"])
def generate_meal_plan():
    data = request.json
    start_date = data.get('startDate')
    cuisine_preferences = data.get('cuisinePreferences', [])
    max_prep_time = data.get('maxPrepTime')
    seasonal_only = data.get('seasonalOnly', False)
    
    if not start_date:
        return jsonify({"message": "Start date is required"}), 400
    
    try:
        # For demo purposes, generate a mock meal plan
        meal_plan = []
        date_obj = datetime.strptime(start_date, '%Y-%m-%d')
        
        # Filter recipes based on preferences
        filtered_recipes = recipes_db
        
        if cuisine_preferences:
            filtered_recipes = [r for r in filtered_recipes if r.get('cuisine') in cuisine_preferences]
        
        if max_prep_time:
            filtered_recipes = [r for r in filtered_recipes if r.get('prepTime', 0) + r.get('cookTime', 0) <= max_prep_time]
        
        # If no recipes match the criteria, use the full recipe list
        if not filtered_recipes:
            filtered_recipes = recipes_db
        
        # Create a 7-day meal plan
        for i in range(7):
            current_date = date_obj + timedelta(days=i)
            
            # Randomly select recipes for each meal type
            breakfast_recipes = [r for r in filtered_recipes if r.get('mealType') == 'breakfast']
            lunch_recipes = [r for r in filtered_recipes if r.get('mealType') == 'lunch']
            dinner_recipes = [r for r in filtered_recipes if r.get('mealType') == 'dinner']
            snack_recipes = [r for r in filtered_recipes if r.get('mealType') == 'snack']
            
            day_plan = {
                "date": current_date.strftime('%Y-%m-%d'),
                "breakfast": random.choice(breakfast_recipes) if breakfast_recipes else None,
                "lunch": random.choice(lunch_recipes) if lunch_recipes else None,
                "dinner": random.choice(dinner_recipes) if dinner_recipes else None,
                "snacks": random.sample(snack_recipes, min(2, len(snack_recipes))) if snack_recipes else []
            }
            
            meal_plan.append(day_plan)
        
        return jsonify(meal_plan), 200
    
    except Exception as e:
        print(f"Error generating meal plan: {str(e)}")
        return jsonify({"message": "Failed to generate meal plan"}), 500

@api_bp.route("/meal-plan/swap", methods=["POST"])
def swap_meal():
    data = request.json
    day_index = data.get('dayIndex')
    meal_type = data.get('mealType')
    current_plan = data.get('currentPlan')
    recipe_id = data.get('recipeId')
    
    if day_index is None or not meal_type or not current_plan:
        return jsonify({"message": "Day index, meal type, and current plan are required"}), 400
    
    try:
        # If a specific recipe ID is provided, find that recipe
        if recipe_id:
            new_recipe = next((r for r in recipes_db if r['id'] == recipe_id), None)
            if not new_recipe:
                return jsonify({"message": "Recipe not found"}), 404
        else:
            # Otherwise, find a different recipe of the same meal type
            current_recipe_id = None
            if meal_type in ['breakfast', 'lunch', 'dinner'] and current_plan[day_index][meal_type]:
                current_recipe_id = current_plan[day_index][meal_type]['id']
            
            suitable_recipes = [r for r in recipes_db if r['mealType'] == meal_type]
            
            if current_recipe_id:
                suitable_recipes = [r for r in suitable_recipes if r['id'] != current_recipe_id]
            
            if not suitable_recipes:
                return jsonify({"message": f"No alternative {meal_type} recipes available"}), 404
            
            new_recipe = random.choice(suitable_recipes)
        
        return jsonify(new_recipe), 200
    
    except Exception as e:
        print(f"Error swapping meal: {str(e)}")
        return jsonify({"message": "Failed to swap meal"}), 500

@api_bp.route("/meal-plan/add-recipe", methods=["POST"])
def add_recipe_to_meal_plan():
    data = request.json
    recipe = data.get('recipe')
    day_index = data.get('dayIndex')
    meal_type = data.get('mealType')
    
    if not recipe or day_index is None or not meal_type:
        return jsonify({"message": "Recipe, day index, and meal type are required"}), 400
    
    # In a real app, you'd update the meal plan in the database
    # For this demo, we'll just return success
    
    return jsonify({"success": True}), 200
