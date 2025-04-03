from flask import Flask
from flask_cors import CORS
from config.config import Config
from routes.api import api_bp
app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
app.register_blueprint(api_bp, url_prefix="/api")
if __name__ == "__main__":
    app.run()
