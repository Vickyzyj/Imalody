from dotenv import load_dotenv
import json, os
from google.oauth2 import service_account

load_dotenv()

hf_token = os.environ['HF_TOKEN']
project_id = os.environ['project_id']
bucket_name = os.environ['bucket_name']

try:
    credentials = os.environ['GOOGLE_APPLICATION_CREDENTIALS']
except:
    with open('google_service_account.json', 'r') as f:
        creds_json = json.load(f)

    credentials = service_account.Credentials.from_service_account_info(creds_json)