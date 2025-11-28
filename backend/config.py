from dotenv import load_dotenv
import os, json
from google.auth import default
from google.oauth2 import service_account

load_dotenv()

# 1. Hugging Face Token and Google API Key
hf_token = os.environ.get("HF_TOKEN")
google_api = os.environ.get("GOOGLE_API_KEY")

# 2. Project ID
project_id = os.environ.get("project_id")

if not project_id:
    # If it's missing (e.g. local), try to find it automatically
    _, project_id = default()

# 3. Bucket Name
bucket_name = os.environ.get("bucket_name")

# 4. Credentials
try:
    # Use the volumne mount (secret manager) when deployed to Cloud Run
    with open('/secrets/developer-service-account', 'r') as f:
        creds_json = json.load(f)
    credentials = service_account.Credentials.from_service_account_info(creds_json)
except:
    # Use the local file when running locally
    with open('google_service_account.json', 'r') as f:
        creds_json = json.load(f)
    credentials = service_account.Credentials.from_service_account_info(creds_json)
