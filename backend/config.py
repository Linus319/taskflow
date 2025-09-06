
import os
import pathlib

BASEDIR = pathlib.Path(__file__).resolve().parent

class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"sqlite:///{BASEDIR / 'app.db'}"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SECRET_KEY = os.environ.get("SECRET_KEY", 'dev-secret-key')

    DEBUG = os.environ.get("FLASK_DEBUG", "0") in ("1", "true", "True")

    OLLAMA_API = os.environ.get("OLLAMA_API", "http://ollama:11434")

    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://bigwetstudios.com").split(",")