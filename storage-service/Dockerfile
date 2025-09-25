FROM python:3.11-slim
WORKDIR /storage-service
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
COPY .env .
RUN mkdir -p /storage-service/data
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
