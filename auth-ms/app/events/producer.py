import json
import uuid
import logging
from datetime import datetime, timezone
import pika
from app.core.config import config_map
import os

logger = logging.getLogger(__name__)
env = os.getenv("FLASK_ENV", "development")


def _get_params():
    config = config_map[env]
    return pika.ConnectionParameters(
        host=getattr(config, "RABBITMQ_HOST", "localhost"),
        port=getattr(config, "RABBITMQ_PORT", 5672),
        credentials=pika.PlainCredentials(
            getattr(config, "RABBITMQ_USER", "guest"),
            getattr(config, "RABBITMQ_PASS", "guest"),
        ),
    )


def publish(routing_key: str, data: dict):
    payload = {
        "event_id": str(uuid.uuid4()),
        "event": routing_key,
        "version": "v1",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data,
    }
    try:
        connection = pika.BlockingConnection(_get_params())
        channel = connection.channel()
        channel.exchange_declare(exchange="hrms_exchange", exchange_type="topic", durable=True)
        channel.basic_publish(
            exchange="hrms_exchange",
            routing_key=routing_key,
            body=json.dumps(payload),
            properties=pika.BasicProperties(delivery_mode=2),
        )
        connection.close()
        logger.info(f"Published event: {routing_key} | event_id: {payload['event_id']}")
    except Exception as e:
        logger.error(f"Failed to publish event {routing_key}: {e}")
