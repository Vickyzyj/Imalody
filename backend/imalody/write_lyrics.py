import os
from openai import OpenAI
from config import hf_token


def write_lyrics(image_url):
  client = OpenAI(
      base_url="https://router.huggingface.co/v1",
      api_key=hf_token,
  )

  try:
    completion = client.chat.completions.create(
        model="meta-llama/Llama-4-Scout-17B-16E-Instruct:groq",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Create a song lyrics using the image. The song is about 30 seconds long. Output only the lyrics and nothing else."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url
                        }
                    }
                ]
            }
        ],
    )

    lyrics = completion.choices[0].message.content
    return lyrics

  except Exception as e:
    return f"Error: {e}"
