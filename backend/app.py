import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# CRITICAL: Enable CORS.
# This allows your frontend (running on localhost:3000) to talk to this backend (running on localhost:8080).
# Service URL: https://my-python-uploader-147110456749.us-west3.run.app
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Log the interaction to your terminal
    print(f"✅ Received file: {file.filename}")

    # This is where you will eventually add your Google Gemini/AI code.
    return jsonify({
        "message": f"Hello from Python! I received '{file.filename}' successfully.",
        "status": "processed"
    })

if __name__ == "__main__":
    # We use port 8080 to match Google Cloud Run's default.
    # When running locally, access this at http://127.0.0.1:8080
    port = int(os.environ.get("PORT", 8080))
    print(f"🚀 Server running locally at http://127.0.0.1:{port}")
    app.run(debug=True, host="0.0.0.0", port=port)