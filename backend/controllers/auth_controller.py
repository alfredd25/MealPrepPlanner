from flask import jsonify
def login(data):
    return jsonify({"message": "Login endpoint", "data": data})
def signup(data):
    return jsonify({"message": "Signup endpoint", "data": data})
