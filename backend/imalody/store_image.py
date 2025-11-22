from google.cloud import storage
from config import project_id, bucket_name, credentials

def generate_v4_upload_signed_url(bucket_name, blob_name, expiration_time):
    """Generates a v4 signed URL for uploading a blob."""
    storage_client = storage.Client(project=project_id, credentials=credentials)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)

    # Generate the signed URL for upload
    upload_url = blob.generate_signed_url(
        version="v4",
        method="PUT", # Use PUT for uploading
        expiration=expiration_time,
        content_type="application/octet-stream" # Or the actual content type of your image
    )
    return upload_url

def generate_v4_download_signed_url(bucket_name, blob_name, expiration_time):
    """Generates a v4 signed URL for downloading a blob."""
    storage_client = storage.Client(project=project_id, credentials=credentials)
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)

    # Generate the signed URL for download
    download_url = blob.generate_signed_url(
        version="v4",
        method="GET", # Use GET for downloading
        expiration=expiration_time,
    )
    return download_url

def upload_to_bucket(bucket_name, source_file_path, destination_blob_name):
    """
    Uploads a file to the specified Google Cloud Storage bucket.
    Args:
        bucket_name (str): Your bucket name (e.g., "my-awesome-bucket")
        source_file_path (str): The local path to your file (e.g., "/path/to/file.jpg")
        destination_blob_name (str): The desired name for the file in the bucket
                                     (e.g., "my-image.jpg" or "folder/my-image.jpg")
    """

    # 1. Instantiates a client
    storage_client = storage.Client(project=project_id, credentials=credentials)

    # 2. Get the bucket you want to upload to
    bucket = storage_client.get_bucket(bucket_name)

    # 3. Create a new blob (file) in the bucket
    blob = bucket.blob(destination_blob_name)

    # 4. Upload the local file to the blob
    blob.upload_from_filename(source_file_path)

    print(f"File {source_file_path} uploaded to {destination_blob_name} in bucket {bucket_name}.")