from flask import jsonify
from flask_wtf.csrf import generate_csrf
from app.dev import dev_bp

@dev_bp.route("/get-csrf-token", methods=["GET"])
def get_csrf_token():
    token = generate_csrf()
    response = jsonify({"csrf_token": token})
    response.set_cookie("csrf_token", token)
    return response