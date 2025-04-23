import json
import os
import uuid
from flask import jsonify, current_app

def get_recipes():
    """Get all recipes from the sample recipes file"""
    try:
        # Load sample recipes from JSON file
        with open('backend/data/sample_recipes.json', 'r') as f:
            recipes = json.load(f)
        return jsonify(recipes), 200
    except Exception as e:
        current_app.logger.error(f"Error getting recipes: {str(e)}")
        return jsonify({"error": "Failed to retrieve recipes"}), 500

def get_recipe(recipe_id):
    """Get a specific recipe by ID"""
    try:
        # Load sample recipes from JSON file
        with open('backend/data/sample_recipes.json', 'r') as f:
            recipes = json.load(f)
        
        # Find recipe with matching ID
        recipe = next((r for r in recipes if r.get('id') == recipe_id), None)
        
        if recipe:
            return jsonify(recipe), 200
        else:
            return jsonify({"error": "Recipe not found"}), 404
    except Exception as e:
        current_app.logger.error(f"Error getting recipe {recipe_id}: {str(e)}")
        return jsonify({"error": "Failed to retrieve recipe"}), 500

def create_recipe(data):
    """Create a new recipe"""
    try:
        # Load existing recipes
        with open('backend/data/sample_recipes.json', 'r') as f:
            recipes = json.load(f)
        
        # Generate unique ID
        new_id = str(uuid.uuid4())
        
        # Create new recipe with required fields
        new_recipe = {
            "id": new_id,
            "name": data.get("name", ""),
            "description": data.get("description", ""),
            "ingredients": data.get("ingredients", []),
            "instructions": data.get("instructions", []),
            "prepTime": data.get("prepTime", 0),
            "cookTime": data.get("cookTime", 0),
            "servings": data.get("servings", 1),
            "nutritionalInfo": data.get("nutritionalInfo", {}),
            "cuisine": data.get("cuisine", ""),
            "mealType": data.get("mealType", ""),
            "tags": data.get("tags", [])
        }
        
        # Add new recipe to list
        recipes.append(new_recipe)
        
        # Save updated recipe list
        with open('backend/data/sample_recipes.json', 'w') as f:
            json.dump(recipes, f, indent=2)
        
        return jsonify(new_recipe), 201
    except Exception as e:
        current_app.logger.error(f"Error creating recipe: {str(e)}")
        return jsonify({"error": "Failed to create recipe"}), 500

def update_recipe(recipe_id, data):
    """Update an existing recipe"""
    try:
        # Load existing recipes
        with open('backend/data/sample_recipes.json', 'r') as f:
            recipes = json.load(f)
        
        # Find recipe with matching ID
        recipe_index = next((i for i, r in enumerate(recipes) if r.get('id') == recipe_id), None)
        
        if recipe_index is None:
            return jsonify({"error": "Recipe not found"}), 404
        
        # Update recipe fields
        for key, value in data.items():
            if key != 'id':  # Don't allow changing the ID
                recipes[recipe_index][key] = value
        
        # Save updated recipe list
        with open('backend/data/sample_recipes.json', 'w') as f:
            json.dump(recipes, f, indent=2)
        
        return jsonify(recipes[recipe_index]), 200
    except Exception as e:
        current_app.logger.error(f"Error updating recipe {recipe_id}: {str(e)}")
        return jsonify({"error": "Failed to update recipe"}), 500

def delete_recipe(recipe_id):
    """Delete a recipe by ID"""
    try:
        # Load existing recipes
        with open('backend/data/sample_recipes.json', 'r') as f:
            recipes = json.load(f)
        
        # Filter out the recipe with the matching ID
        updated_recipes = [r for r in recipes if r.get('id') != recipe_id]
        
        # If no recipes were removed, the recipe wasn't found
        if len(updated_recipes) == len(recipes):
            return jsonify({"error": "Recipe not found"}), 404
        
        # Save updated recipe list
        with open('backend/data/sample_recipes.json', 'w') as f:
            json.dump(updated_recipes, f, indent=2)
        
        return jsonify({"message": "Recipe deleted successfully"}), 200
    except Exception as e:
        current_app.logger.error(f"Error deleting recipe {recipe_id}: {str(e)}")
        return jsonify({"error": "Failed to delete recipe"}), 500 