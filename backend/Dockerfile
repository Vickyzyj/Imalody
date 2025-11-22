# Use an official lightweight Python image.
FROM python:3.11-slim

# Allow statements and log messages to immediately appear in the logs
ENV PYTHONUNBUFFERED True

ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# --- CHANGE IS HERE ---
# Instead of Gunicorn, we will run Python directly.
# This is safer for debugging because it uses the exact logic in your main.py
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app