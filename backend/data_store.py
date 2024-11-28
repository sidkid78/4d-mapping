from typing import Dict, Optional, List
from pymongo import MongoClient
from pymongo.collection import Collection
from bson.objectid import ObjectId

class DataStore:
    def __init__(self, config: Dict):
        self.client = MongoClient(config['mongodb_uri'])
        self.db = self.client[config['database_name']]
        self.collection: Collection = self.db[config['collection_name']]

    async def get(self, id: str) -> Optional[Dict]:
        result = await self.collection.find_one({"_id": ObjectId(id)})
        if result:
            result['id'] = str(result['_id'])
            del result['_id']
        return result

    async def update(self, id: str, data: Dict) -> None:
        await self.collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": data},
            upsert=True
        )

    async def delete(self, id: str) -> None:
        await self.collection.delete_one({"_id": ObjectId(id)})

    async def list(self, query: Dict = None, limit: int = 100, skip: int = 0) -> List[Dict]:
        cursor = self.collection.find(query or {}).skip(skip).limit(limit)
        results = []
        async for document in cursor:
            document['id'] = str(document['_id'])
            del document['_id']
            results.append(document)
        return results