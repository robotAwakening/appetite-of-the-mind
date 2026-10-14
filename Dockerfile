# Runs anywhere Docker runs (Fly.io, Railway, a VPS, your own machine).
#   docker build -t aotm .
#   docker run -p 8000:8000 --env-file .env -v aotm-data:/data aotm
FROM python:3.12-slim
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY site ./site
ENV DB_PATH=/data/campaign.db PORT=8000
VOLUME /data
EXPOSE 8000
CMD gunicorn -w 2 -b 0.0.0.0:$PORT app.server:app
