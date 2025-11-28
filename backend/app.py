import os
from flask import Flask, request, jsonify
from flask_cors import CORS

from config import project_id, bucket_name, credentials
from imalody.store_image import upload_to_bucket, generate_v4_download_signed_url
from imalody.write_lyrics import write_lyrics
from imalody.generate_music import generate_music
import datetime
import tempfile
import base64

def process_image(file):
    img_name = "imalody_load.jpeg"
    expiration = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=15)

    # 1. Create a temporary file path to save the uploaded image
    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp:
        file.save(temp.name)
        temp_path = temp.name

    # 2. Upload the image to Google Cloud Storage Bucket
    # upload_to_bucket(bucket_name, temp_path, img_name)

    # 3. Generate a signed URL for the uploaded image
    # download_url = generate_v4_download_signed_url(bucket_name, img_name, expiration)
    # print("Download URL:", download_url)

    # 4. Write lyrics using llama-4-scount-17B
    # lyrics = write_lyrics(download_url)
    lyrics = write_lyrics(temp_path)
    # print("Generated Lyrics:\n", lyrics)

    # 5. Generate song using ACE-STEP model
    song = generate_music(lyrics)

    # 6. Convert song to raw mp3 bytes, and then to base64 string
    with open(song, "rb") as f:
        song_bytes = f.read()

    song_base64 = base64.b64encode(song_bytes).decode('utf-8')

    return lyrics, song_base64

# Initiate Flask endpoint
app = Flask(__name__)

# CRITICAL: Enable CORS.
# This allows your frontend (running on localhost:3000) to talk to this backend (running on localhost:8080).
# Backend Service URL (Google Cloud Run): https://my-python-uploader-147110456749.us-west3.run.app
# CORS(app, resources={r"/*": {"origins": "*"}})
CORS(app, origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost: 5173",
    "http: //127.0.0.1:5173",
    "http://localhost: 8080",
    "http: //127.0.0.1:8080",
    "https://imalody.vercel.app",
    "http://imalody.vercel.app"
])

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
    lyrics, song_base64 = process_image(file)


    return jsonify({
        "lyrics": lyrics,
        "song": song_base64,
        "status": "processed"
    })

if __name__ == "__main__":
    # We use port 8080 to match Google Cloud Run's default.
    # When running locally, access this at http://127.0.0.1:8080
    port = int(os.environ.get("PORT", 8080))
    print(f"🚀 Server running locally at http://127.0.0.1:{port}")
    app.run(debug=True, host="0.0.0.0", port=port)