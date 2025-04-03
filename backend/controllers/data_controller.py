from flask import jsonify
def get_chat():
    return jsonify({"message": "Chat endpoint"})
def get_recipes():
    return jsonify({"message": "Recipes endpoint"})
def get_grocery_list():
    return jsonify({"message": "Grocery list endpoint"})
