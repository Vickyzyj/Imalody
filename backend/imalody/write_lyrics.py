import os
from openai import OpenAI
import google.generativeai as genai
import PIL.Image
from config import hf_token, google_api


def write_lyrics(image_path):
  
    genai.configure(api_key=google_api)
    MODEL_ID = "gemini-2.5-pro"

    try:
        model = genai.GenerativeModel(MODEL_ID)
        img = PIL.Image.open(image_path)

        prompt = """
        You are an award-winning songwriter known for deep, evocative lyrics.
        
        Task:
        1. Analyze this image deeply. Look at the lighting, colors, subjects, and hidden details.
        2. Determine the emotional mood of the scene (e.g., melancholic, hopeful, chaotic, serene).
        3. Write a song lyrics inspired by this image. The song is about 30 seconds long.
           Do not just describe the visual elements literally. Use them as metaphors for human emotion.

        Please output only the lyrics, without any additional commentary.
        """
        response = model.generate_content([prompt, img])
        lyrics = response.text.strip()
        return lyrics

    except Exception as e:
        return f"Error generating lyrics: {str(e)}"
