from flask import Blueprint, jsonify, request
from controllers.auth_controller import login, signup
from controllers.data_controller import get_chat, get_recipes, get_grocery_list
api_bp = Blueprint("api", __name__)
@api_bp.route("/login", methods=["POST"])
def login_route():
    return login(request.json)
@api_bp.route("/signup", methods=["POST"])
def signup_route():
    return signup(request.json)
@api_bp.route("/chat", methods=["GET"])
def chat_route():
    return get_chat()
@api_bp.route("/recipes", methods=["GET"])
def recipes_route():
    return get_recipes()
@api_bp.route("/grocery-list", methods=["GET"])
def grocery_list_route():
    return get_grocery_list()
