import json
import time
import logging
import threading
import pika
from app.core.config import config_map
import os

logger = logging.getLogger(__name__)
env = os.getenv("FLASK_ENV", "development")

QUEUE = "auth_queue"
DLQ = "auth_dlq"
BINDINGS = ["employee.terminated", "employee.rehired"]


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


def _dispatch(routing_key, data):
    from app.events.handlers import handle_employee_terminated, handle_employee_rehired
    handlers = {
        "employee.terminated": handle_employee_terminated,
        "employee.rehired": handle_employee_rehired,
    }
    handler = handlers.get(routing_key)
    if handler:
        handler(data)


def _is_processed(event_id, app):
    with app.app_context():
        from app.database.schema import ProcessedEvent
        from app.extensions import db
        return db.session.execute(
            db.select(ProcessedEvent).where(ProcessedEvent.event_id == event_id)
        ).scalar_one_or_none() is not None


def _mark_processed(event_id, app):
    with app.app_context():
        from app.database.schema import ProcessedEvent
        from app.extensions import db
        db.session.add(ProcessedEvent(event_id=event_id))
        db.session.commit()


def _on_message(channel, method, properties, body, app):
    try:
        payload = json.loads(body)
        event_id = payload.get("event_id")
        routing_key = payload.get("event")
        data = payload.get("data", {})

        if _is_processed(event_id, app):
            channel.basic_ack(delivery_tag=method.delivery_tag)
            return

        with app.app_context():
            _dispatch(routing_key, data)

        _mark_processed(event_id, app)
        channel.basic_ack(delivery_tag=method.delivery_tag)
        logger.info(f"Processed event: {routing_key} | event_id: {event_id}")
    except Exception as e:
        logger.error(f"Failed to process message: {e}")
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def _run(app):
    retries = 0
    while True:
        try:
            connection = pika.BlockingConnection(_get_params())
            channel = connection.channel()
            channel.exchange_declare(exchange="hrms_exchange", exchange_type="topic", durable=True)
            channel.queue_declare(queue=DLQ, durable=True)
            channel.queue_declare(queue=QUEUE, durable=True, arguments={
                "x-dead-letter-exchange": "",
                "x-dead-letter-routing-key": DLQ,
            })
            for key in BINDINGS:
                channel.queue_bind(exchange="hrms_exchange", queue=QUEUE, routing_key=key)
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(
                queue=QUEUE,
                on_message_callback=lambda ch, m, p, b: _on_message(ch, m, p, b, app),
            )
            retries = 0
            logger.info("Auth consumer started")
            channel.start_consuming()
        except Exception as e:
            retries += 1
            wait = min(2 ** retries, 30)
            logger.error(f"Consumer error: {e}. Retrying in {wait}s")
            time.sleep(wait)


def start_consumer(app):
    thread = threading.Thread(target=_run, args=(app,), daemon=True)
    thread.start()
