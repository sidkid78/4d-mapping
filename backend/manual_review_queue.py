from typing import Dict, List, Optional
import json
import redis
from redis.exceptions import RedisError

class ManualReviewQueue:
    def __init__(self, config: Dict):
        self.redis = redis.Redis(
            host=config['redis_host'],
            port=config['redis_port'],
            db=config['redis_db'],
            decode_responses=True
        )
        self.queue_key = config['queue_key']

    async def put(self, item: Dict) -> None:
        try:
            await self.redis.rpush(self.queue_key, json.dumps(item))
        except RedisError as e:
            raise Exception(f"Failed to add item to manual review queue: {str(e)}")

    async def get(self) -> Optional[Dict]:
        try:
            item = await self.redis.lpop(self.queue_key)
            return json.loads(item) if item else None
        except RedisError as e:
            raise Exception(f"Failed to get item from manual review queue: {str(e)}")

    async def list(self, start: int = 0, end: int = -1) -> List[Dict]:
        try:
            items = await self.redis.lrange(self.queue_key, start, end)
            return [json.loads(item) for item in items]
        except RedisError as e:
            raise Exception(f"Failed to list items from manual review queue: {str(e)}")

    async def remove(self, item: Dict) -> None:
        try:
            await self.redis.lrem(self.queue_key, 1, json.dumps(item))
        except RedisError as e:
            raise Exception(f"Failed to remove item from manual review queue: {str(e)}")