from config import project_id, bucket_name, credentials
from imalody.store_image import upload_to_bucket, generate_v4_upload_signed_url, generate_v4_download_signed_url
from imalody.write_lyrics import write_lyrics
from imalody.generate_music import generate_music
import datetime
from pydub import AudioSegment
from pydub.playback import play

source_file_path = "C:/Users/Admin/Pictures/tibet_palace.jpeg"
img_name = "imalody_load.jpeg"
expiration = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=15)

upload_to_bucket(bucket_name, source_file_path, img_name)
download_url = generate_v4_download_signed_url(bucket_name, img_name, expiration)
# print("Download URL:", download_url)

lyrics = write_lyrics(download_url)
# print("Generated Lyrics:\n", lyrics)

song = generate_music(lyrics)
print("Type of song:", type(song))
print("Song string begins with:", song[:50])
print("Length:", len(song))

# Convert song to raw mp3 bytes
with open(song, "rb") as f:
    song_bytes = f.read()

print("Type of song:", type(song_bytes))

# Play the generated song
# audio = AudioSegment.from_file(song)
# play(audio)