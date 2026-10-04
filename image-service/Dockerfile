FROM python:3.11-slim
WORKDIR /service
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd -r -u 1001 images && chown -R images:images /service
USER images
CMD ["gunicorn", "--bind", "127.0.0.1:3203", "--workers", "2", "--timeout", "20", "server:app"]
