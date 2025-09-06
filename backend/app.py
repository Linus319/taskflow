from flask import Flask, request, send_from_directory
from flask_cors import CORS
import os
from models import db
from flask_migrate import Migrate
import logging

from config import Config
from routes.ai import bp as ai_bp
from routes.auth import bp as auth_bp
from routes.goals import bp as goals_bp
from routes.tasks import bp as tasks_bp
from utils.decorators import login_required

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder="../frontend/build", static_url_path='/')
app.config.from_object(Config)
app.register_blueprint(ai_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(goals_bp)
app.register_blueprint(tasks_bp)

CORS(app, supports_credentials=True, origins=app.config['CORS_ORIGINS'])

db.init_app(app)
migrate = Migrate(app, db)

@app.before_request
def log_request_info():
    logger.debug("REQUEST: %s %s", request.method, request.path)

@app.route("/")
def serve():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/<path:path>")
def serve_static_file(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    app.run(debug=app.config.get("DEBUG", False), host="0.0.0.0", port=5000)