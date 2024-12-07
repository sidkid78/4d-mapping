"""
Cloud Native Backend Module

This module provides core functionality for a cloud-native backend system including:
- Cache management with Redis
- Task management with Celery
- System monitoring with Prometheus and Azure Monitor
- Kubernetes deployment management

Components:
- CacheManager: Redis-based caching with metrics
- TaskManager: Celery task queue management
- MonitoringSystem: System monitoring and alerting
- DeploymentManager: Kubernetes service deployment

Key Features:
- Distributed caching with TTL and pattern invalidation
- Priority-based task queues and routing
- Comprehensive metrics collection and anomaly detection
- Multi-channel alerting (Azure Monitor, PagerDuty, Slack)
- Kubernetes service deployment and management

Example:
    # Initialize components
    cache_mgr = CacheManager(config)
    task_mgr = TaskManager(config)
    monitor = MonitoringSystem(config)
    
    # Cache data with TTL
    data, is_cached = await cache_mgr.get_cached_data(
        key="user:123",
        fetch_func=get_user_data
    )
    
    # Submit task to queue
    task_id = await task_mgr.submit_task(
        "process_data",
        args=[data],
        priority="high"
    )

Dependencies:
    - Redis for caching
    - Celery for task queues
    - Prometheus for metrics
    - Azure Monitor for cloud monitoring
    - Kubernetes for container orchestration
"""

from typing import Dict, List, Optional, Union, Tuple, Any
import asyncio
import redis
from fastapi import FastAPI, BackgroundTasks
from celery import Celery
from prometheus_client import Counter, Histogram, start_http_server
import kubernetes
from azure.monitor.ingestion import MetricsClient
from azure.identity import DefaultAzureCredential
from datetime import datetime 
import logging
from dataclasses import dataclass

@dataclass
class PerformanceMetrics:
    latency: float
    throughput: float
    error_rate: float
    resource_usage: Dict[str, float]
    cache_hit_ratio: float

class CacheManager:
    def __init__(self, config: Dict):
        self.redis_client = redis.Redis(**config["redis"])
        self.logger = logging.getLogger(__name__)
        
        # Performance metrics
        self.cache_hits = Counter('cache_hits', 'Cache hit counter')
        self.cache_misses = Counter('cache_misses', 'Cache miss counter')
        self.cache_latency = Histogram('cache_latency', 'Cache operation latency')

    async def get_cached_data(self, key: str, 
                            fetch_func: callable) -> Tuple[Any, bool]:
        """
        Get data from cache or fetch if missing.
        """
        try:
            # Check cache first
            cached_data = await self.redis_client.get(key)
            
            if cached_data:
                self.cache_hits.inc()
                return cached_data, True
            
            # Cache miss - fetch data
            self.cache_misses.inc()
            data = await fetch_func()
            
            # Cache the result with appropriate TTL
            await self.set_cached_data(key, data)
            
            return data, False

        except Exception as e:
            self.logger.error(f"Cache operation failed: {str(e)}")
            return await fetch_func(), False

    async def set_cached_data(self, key: str, data: Any, ttl: int = 3600) -> bool:
        """
        Store data in cache with TTL.
        """
        try:
            with self.cache_latency.time():
                await self.redis_client.setex(key, ttl, data)
            return True

        except Exception as e:
            self.logger.error(f"Cache set failed: {str(e)}")
            return False

    async def invalidate_pattern(self, pattern: str) -> int:
        """
        Invalidate cache entries matching pattern.
        """
        try:
            keys = await self.redis_client.keys(pattern)
            if keys:
                return await self.redis_client.delete(*keys)
            return 0

        except Exception as e:
            self.logger.error(f"Cache invalidation failed: {str(e)}")
            return 0

class TaskManager:
    def __init__(self, config: Dict):
        self.celery = Celery(**config["celery"])
        self.logger = logging.getLogger(__name__)
        
        # Configure task queues
        self.configure_task_queues()
        
        # Monitoring metrics
        self.task_latency = Histogram('task_latency', 'Task processing latency')
        self.task_errors = Counter('task_errors', 'Task error counter')

    def configure_task_queues(self):
        """
        Configure priority queues and routing.
        """
        self.celery.conf.task_queues = {
            'high': {'exchange': 'high', 'routing_key': 'high.#'},
            'default': {'exchange': 'default', 'routing_key': 'default.#'},
            'low': {'exchange': 'low', 'routing_key': 'low.#'}
        }
        
        self.celery.conf.task_routes = {
            'ai.persona.*': {'queue': 'high'},
            'data.ingestion.*': {'queue': 'default'},
            'report.generation.*': {'queue': 'low'}
        }

    async def submit_task(self, task_name: str, 
                         args: List, 
                         priority: str = 'default') -> str:
        """
        Submit task to appropriate queue.
        """
        try:
            task = self.celery.send_task(
                task_name,
                args=args,
                queue=priority,
                retry=True,
                retry_policy={
                    'max_retries': 3,
                    'interval_start': 0,
                    'interval_step': 0.2,
                    'interval_max': 0.5,
                }
            )
            return task.id

        except Exception as e:
            self.logger.error(f"Task submission failed: {str(e)}")
            self.task_errors.inc()
            raise

class MonitoringSystem:
    def __init__(self, config: Dict):
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.azure_monitor = MetricsClient(
            credential=DefaultAzureCredential()
        )
        
        # Initialize Kubernetes client if running in AKS
        if config.get("kubernetes_enabled"):
            kubernetes.config.load_incluster_config()
            self.k8s_client = kubernetes.client.CoreV1Api()
        
        # Start Prometheus metrics server
        start_http_server(config["prometheus_port"])
        
        # Performance metrics
        self.api_latency = Histogram('api_latency', 'API request latency')
        self.error_rate = Counter('error_rate', 'Error rate counter')

    async def collect_metrics(self) -> PerformanceMetrics:
        """
        Collect comprehensive performance metrics.
        """
        try:
            metrics = PerformanceMetrics(
                latency=await self._get_average_latency(),
                throughput=await self._get_throughput(),
                error_rate=await self._get_error_rate(),
                resource_usage=await self._get_resource_usage(),
                cache_hit_ratio=await self._get_cache_hit_ratio()
            )
            
            # Store metrics in Azure Monitor
            await self._store_metrics(metrics)
            
            return metrics

        except Exception as e:
            self.logger.error(f"Metrics collection failed: {str(e)}")
            raise

    async def check_anomalies(self, metrics: PerformanceMetrics) -> List[Dict]:
        """
        Detect anomalies in performance metrics.
        """
        try:
            anomalies = []
            
            # Check latency anomalies
            if metrics.latency > self.config["latency_threshold"]:
                anomalies.append({
                    "type": "latency",
                    "value": metrics.latency,
                    "threshold": self.config["latency_threshold"]
                })
            
            # Check error rate anomalies
            if metrics.error_rate > self.config["error_rate_threshold"]:
                anomalies.append({
                    "type": "error_rate",
                    "value": metrics.error_rate,
                    "threshold": self.config["error_rate_threshold"]
                })
            
            # Check resource usage anomalies
            for resource, usage in metrics.resource_usage.items():
                if usage > self.config[f"{resource}_threshold"]:
                    anomalies.append({
                        "type": f"{resource}_usage",
                        "value": usage,
                        "threshold": self.config[f"{resource}_threshold"]
                    })
            
            return anomalies

        except Exception as e:
            self.logger.error(f"Anomaly detection failed: {str(e)}")
            return []

    async def trigger_alerts(self, anomalies: List[Dict]) -> None:
        """
        Trigger alerts based on detected anomalies.
        """
        try:
            for anomaly in anomalies:
                alert = {
                    "severity": self._determine_severity(anomaly),
                    "message": self._format_alert_message(anomaly),
                    "timestamp": datetime.utcnow().isoformat(),
                    "metrics": anomaly
                }
                
                # Send alert through configured channels
                await self._send_alert(alert)

        except Exception as e:
            self.logger.error(f"Alert triggering failed: {str(e)}")

    async def _send_alert(self, alert: Dict) -> None:
        """
        Send alert through configured channels.
        """
        # Send to Azure Monitor
        await self.azure_monitor.send_alert(alert)
        
        # Send to PagerDuty if critical
        if alert["severity"] == "critical":
            await self._send_pagerduty_alert(alert)
        
        # Send to Slack
        await self._send_slack_alert(alert)

class DeploymentManager:
    def __init__(self, config: Dict):
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.k8s_client = kubernetes.client.AppsV1Api()

    async def deploy_service(self, 
                           service_name: str, 
                           image: str, 
                           replicas: int) -> bool:
        """
        Deploy service to Kubernetes.
        """
        try:
            deployment = self._create_deployment_object(
                service_name, 
                image, 
                replicas
            )
            
            # Create deployment
            await self.k8s_client.create_namespaced_deployment(
                body=deployment,
                namespace="default"
            )
            
            # Create service
            service = self._create_service_object(service_name)
            await self.k8s_client.create_namespaced_service(
                body=service,
                namespace="default"
            )
            
            return True

        except Exception as e:
            self.logger.error(f"Service deployment failed: {str(e)}")
            return False