"""Kafka producer and consumer factory — aiokafka."""

from __future__ import annotations

import json
import logging
from typing import Any

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_producer: AIOKafkaProducer | None = None


async def get_kafka_producer() -> AIOKafkaProducer:
    """Return (and lazily start) the shared Kafka producer."""
    global _producer
    if _producer is None:
        _producer = AIOKafkaProducer(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
            acks="all",
            enable_idempotence=True,
            max_batch_size=1_048_576,
            linger_ms=10,
            compression_type="lz4",
        )
        await _producer.start()
        logger.info("Kafka producer started → %s", settings.KAFKA_BOOTSTRAP_SERVERS)
    return _producer


def create_kafka_consumer(
    *topics: str,
    group_id: str | None = None,
) -> AIOKafkaConsumer:
    """Create a new Kafka consumer for the given topics."""
    return AIOKafkaConsumer(
        *topics,
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id=group_id or settings.KAFKA_CONSUMER_GROUP,
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        auto_offset_reset="latest",
        enable_auto_commit=True,
        auto_commit_interval_ms=5000,
        max_poll_records=500,
    )


async def publish_event(topic: str, value: dict[str, Any], key: str | None = None) -> None:
    """Publish a single event to a Kafka topic."""
    producer = await get_kafka_producer()
    await producer.send_and_wait(topic, value=value, key=key)


async def close_kafka_producer() -> None:
    global _producer
    if _producer:
        await _producer.stop()
        _producer = None
        logger.info("Kafka producer stopped.")
