import datetime
from google.cloud import storage
from google.auth import default
from google.auth.transport import requests
from config import project_id, bucket_name, credentials


def upload_to_bucket(bucket_name, source_file_name, destination_blob_name, project_id=None):
    """Uploads an image file to the bucket."""
    storage_client = storage.Client(project=project_id, credentials=credentials)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    blob.upload_from_filename(source_file_name)
    print(f"File {source_file_name} uploaded to {destination_blob_name}.")


def generate_v4_download_signed_url(bucket_name, blob_name, expiration=3600):
    """Generates a v4 signed URL for downloading a blob using IAM signing."""
    
    storage_client = storage.Client(project=project_id, credentials=credentials)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)

    url = blob.generate_signed_url(
        version="v4",
        # Ensure expiration is a timedelta object
        expiration=datetime.timedelta(seconds=expiration) if isinstance(expiration, int) else expiration,
        method="GET"
    )
    
    return url