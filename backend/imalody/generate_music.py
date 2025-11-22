from gradio_client import Client, handle_file

def generate_music(lyrics):
  client = Client("ACE-Step/ACE-Step")
  song = client.predict(
      audio_duration=90,
      prompt="funk, pop, soul, rock, melodic, guitar, drums, bass, keyboard, percussion, 105 BPM, energetic, upbeat, groovy, vibrant, dynamic",
		  lyrics=lyrics,
      infer_step=60,
      guidance_scale=15,
      scheduler_type="euler",
      cfg_type="apg",
      omega_scale=10,
      manual_seeds=None,
      guidance_interval=0.5,
      guidance_interval_decay=0,
      min_guidance_scale=3,
      use_erg_tag=True,
      use_erg_lyric=False,
      use_erg_diffusion=True,
      oss_steps=None,
      guidance_scale_text=0,
      guidance_scale_lyric=0,
      audio2audio_enable=False,
      ref_audio_strength=0.5,
      ref_audio_input=None,
      lora_name_or_path="none",
      api_name="/__call__"
  )

  return song[0]