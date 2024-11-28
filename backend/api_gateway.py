import jwt
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter 
from slowapi.middleware import RateLimitMiddleware 
from slowapi.util import get_remote_address 
from kafka import KafkaConsumer, KafkaProducer
import aiohttp
import yaml
import uuid
import logging
from pydantic import BaseModel
from advanced_orchestrator_ui import AdvancedOrchestrator

# ... (previous code remains unchanged)

class APIGateway:
    # ... (previous methods remain unchanged)

    async def _validate_token(self, token: str) -> Dict:
        try:
            payload = jwt.decode(token, self.config['jwt_secret'], algorithms=['HS256'])
            if payload['exp'] < datetime.now(datetime.UTC).timestamp():
                raise HTTPException(status_code=401, detail="Token has expired")
            return payload
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

    async def _check_access_permissions(self, user: Dict, resource: str, action: str) -> bool:
        user_role = user.get('role', 'guest')
        permissions = self.config['role_permissions'].get(user_role, {})
        return permissions.get(resource, {}).get(action, False)

    async def _get_knowledge_data(self, coordinates: str, expertise_level: Optional[int], user: Dict) -> Dict:
        try:
            # Parse coordinates into components
            coord_parts = coordinates.split('.')
            if len(coord_parts) != 4:
                raise ValueError("Invalid coordinate format")

            # Validate expertise level
            if expertise_level is None:
                expertise_level = 1  # Default to basic level
            elif expertise_level < 1 or expertise_level > 6:
                raise ValueError("Expertise level must be between 1 and 6")

            # Fetch base knowledge data
            knowledge_data = await self.knowledge_graph.get_data(coordinates)
            if not knowledge_data:
                raise HTTPException(status_code=404, detail="Knowledge data not found")

            # Filter content based on expertise level
            filtered_data = {
                'basic_info': knowledge_data.get('basic_info', {}),
                'details': knowledge_data.get('details', {}),
                'references': knowledge_data.get('references', [])
            }

            # Add expertise-specific content
            if expertise_level >= 3:
                filtered_data['advanced_analysis'] = knowledge_data.get('advanced_analysis', {})
            if expertise_level >= 5:
                filtered_data['expert_insights'] = knowledge_data.get('expert_insights', {})

            # Add metadata
            result = {
                'coordinates': coordinates,
                'expertise_level': expertise_level,
                'user': user['username'],
                'timestamp': datetime.utcnow().isoformat(),
                'data': filtered_data
            }

            return result

        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            self.logger.error(f"Error fetching knowledge data: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def _process_query(self, query: Dict, user: Dict) -> Dict:
        try:
            # Validate query structure
            if not query.get('type') or not query.get('parameters'):
                raise ValueError("Query must contain 'type' and 'parameters' fields")

            # Apply user permissions
            if not await self._check_access_permissions(user, 'queries', query['type']):
                raise HTTPException(status_code=403, detail="Insufficient permissions")
            
            rag_result = await self.rag_agent.process_query(query, user)
            orchestrator = AdvancedOrchestrator()
            final_response = await orchestrator.generate_response(rag_result)

            # Enrich response with metadata 
            processed_result = {
                "query_id": str(uuid.uuid4()),
                "query_type": query['type'],
                "user": user['username'],
                "timestamp": datetime.utcnow().isoformat(),
                "parameters": query['parameters'],
                "result": final_response 
            }

            self.logger.info(f"Query processed: {processed_result['query_id']}")

            return processed_result
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            self.logger.error(f"Error processing query: {str(e)}")
            raise HTTPException(status_code=500, detail="Query processing failed")

            # Process based on query type
            result = None
            if query['type'] == 'knowledge_search':
                result = await self.knowledge_graph.search(
                    query['parameters'],
                    user_expertise=user.get('expertise_level', 1)
                )
            elif query['type'] == 'regulation_lookup':
                result = await self.regulation_store.lookup(
                    query['parameters'],
                    include_metadata=True
                )
            elif query['type'] == 'crosswalk_analysis':
                result = await self.mapping_system.analyze_crosswalks(
                    query['parameters'],
                    depth=query.get('depth', 1)
                )
            else:
                raise ValueError(f"Unsupported query type: {query['type']}")

            # Enrich response with metadata
            processed_result = {
                "query_id": str(uuid.uuid4()),
                "query_type": query['type'],
                "user": user['username'],
                "timestamp": datetime.utcnow().isoformat(),
                "parameters": query['parameters'],
                "result": result
            }

            # Log query for analytics
            self.logger.info(f"Query processed: {processed_result['query_id']}")
            
            return processed_result

        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            self.logger.error(f"Error processing query: {str(e)}")
            raise HTTPException(status_code=500, detail="Query processing failed")

class ExternalDataIntegrator:
    # ... (previous methods remain unchanged)

    async def _validate_updates(self, updates: List[Dict]) -> List[Dict]:
        validated_updates = []
        for update in updates:
            if self._is_valid_update(update):
                validated_updates.append(update)
            else:
                self.logger.warning(f"Invalid update: {update}")
        return validated_updates

    def _is_valid_update(self, update: Dict) -> bool:
        required_fields = ['id', 'source', 'content', 'timestamp']
        return all(field in update for field in required_fields)

    async def _transform_update(self, update: Dict) -> Dict:
        # Implement transformation logic
        # This is a placeholder implementation
        return {
            "internal_id": f"int_{update['id']}",
            "source": update['source'],
            "content": update['content'],
            "timestamp": update['timestamp'],
            "processed_at": datetime.utcnow().isoformat()
        }

    async def _validate_transformed_data(self, data: Dict) -> bool:
        required_fields = ['internal_id', 'source', 'content', 'timestamp', 'processed_at']
        return all(field in data for field in required_fields)

    async def _publish_update(self, data: Dict) -> None:
        self.producer.send(self.config['kafka_topic'], value=data)

class KnowledgeGraphIntegrator:
    # ... (previous methods remain unchanged)

    async def _validate_mapped_data(self, data: Dict) -> bool:
        required_fields = self.config['required_fields']
        return all(field in data for field in required_fields)

    async def _resolve_conflicts(self, data: Dict) -> Dict:
        # Implement conflict resolution logic
        # This is a placeholder implementation
        return data

    async def _integrate_data(self, data: Dict) -> None:
        # Implement data integration logic
        # This is a placeholder implementation
        self.knowledge_graph.add_node(data)

class DataSynchronizer:
    # ... (previous methods remain unchanged)

    async def _validate_update(self, update: Dict) -> bool:
        required_fields = ['id', 'type', 'content', 'timestamp']
        return all(field in update for field in required_fields)

    async def _check_conflicts(self, update: Dict) -> List[Dict]:
        # Implement conflict checking logic
        # This is a placeholder implementation
        conflicts = []
        existing_data = await self.data_store.get(update['id'])
        if existing_data and existing_data['timestamp'] > update['timestamp']:
            conflicts.append({
                "type": "timestamp_conflict",
                "existing": existing_data,
                "update": update
            })
        return conflicts

    async def _apply_update(self, update: Dict) -> bool:
        # Implement update application logic
        # This is a placeholder implementation
        return await self.data_store.update(update['id'], update)

    async def _notify_subscribers(self, update: Dict) -> None:
        # Implement subscriber notification logic
        # This is a placeholder implementation
        message = {
            "type": "data_update",
            "id": update['id'],
            "timestamp": update['timestamp']
        }
        self.producer.send(self.config['notification_topic'], value=message)

    async def _apply_priority_rules(self, conflict: Dict, update: Dict) -> Dict:
        # Implement priority rules logic
        if conflict['type'] == 'timestamp_conflict':
            if update['timestamp'] > conflict['existing']['timestamp']:
                return {"action": "apply_update", "requires_manual_review": False}
            else:
                return {"action": "keep_existing", "requires_manual_review": False}
        else:
            return {"action": "manual_review", "requires_manual_review": True, "reason": "Unknown conflict type"}

    async def _queue_for_manual_review(self, conflict: Dict, update: Dict, reason: str) -> None:
        # Implement manual review queueing logic
        review_item = {
            "conflict": conflict,
            "update": update,
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.manual_review_queue.put(review_item)

    async def _apply_resolution(self, resolution: Dict) -> None:
        if resolution['action'] == 'apply_update':
            await self._apply_update(resolution['update'])
        elif resolution['action'] == 'keep_existing':
            # No action needed, keeping existing data
            pass
        else:
            self.logger.warning(f"Unknown resolution action: {resolution['action']}")