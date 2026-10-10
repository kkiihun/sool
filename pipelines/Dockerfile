FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1 PIPELINE_DATA_DIR=/data

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 상시 실행 아님: docker compose --profile pipeline run --rm pipeline [run ...]
ENTRYPOINT ["python", "-m", "sool_pipeline"]
CMD ["run"]
