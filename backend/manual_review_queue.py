from typing import Dict, List, Optional
import json
import redis
from redis.exceptions import RedisError

class ManualReviewQueue:
    """
    A class to manage a manual review queue using Redis as the backend.

    Attributes:
        redis (redis.Redis): Redis client for interacting with the Redis server.
        queue_key (str): The key used to identify the queue in Redis.
    """

    def __init__(self, config: Dict):
        """
        Initialize the ManualReviewQueue with Redis configuration.

        Args:
            config (Dict): Configuration dictionary containing Redis connection details.
        """
        self.redis = redis.Redis(
            host=config['redis_host'],
            port=config['redis_port'],
            db=config['redis_db'],
            decode_responses=True
        )
        self.queue_key = config['queue_key']

    async def put(self, item: Dict) -> None:
        """
        Add an item to the manual review queue.

        Args:
            item (Dict): The item to be added to the queue.

        Raises:
            Exception: If the item cannot be added to the queue.
        """
        try:
            await self.redis.rpush(self.queue_key, json.dumps(item))
        except RedisError as e:
            raise Exception(f"Failed to add item to manual review queue: {str(e)}")

    async def get(self) -> Optional[Dict]:
        """
        Retrieve and remove the first item from the manual review queue.

        Returns:
            Optional[Dict]: The first item in the queue, or None if the queue is empty.

        Raises:
            Exception: If the item cannot be retrieved from the queue.
        """
        try:
            item = await self.redis.lpop(self.queue_key)
            return json.loads(item) if item else None
        except RedisError as e:
            raise Exception(f"Failed to get item from manual review queue: {str(e)}")

    async def list(self, start: int = 0, end: int = -1) -> List[Dict]:
        """
        List items in the manual review queue within a specified range.

        Args:
            start (int): The starting index of the range.
            end (int): The ending index of the range.

        Returns:
            List[Dict]: A list of items in the specified range.

        Raises:
            Exception: If the items cannot be listed from the queue.
        """
        try:
            items = await self.redis.lrange(self.queue_key, start, end)
            return [json.loads(item) for item in items]
        except RedisError as e:
            raise Exception(f"Failed to list items from manual review queue: {str(e)}")

    async def remove(self, item: Dict) -> None:
        """
        Remove a specific item from the manual review queue.

        Args:
            item (Dict): The item to be removed from the queue.

        Raises:
            Exception: If the item cannot be removed from the queue.
        """
        try:
            await self.redis.lrem(self.queue_key, 1, json.dumps(item))
        except RedisError as e:
            raise Exception(f"Failed to remove item from manual review queue: {str(e)}")