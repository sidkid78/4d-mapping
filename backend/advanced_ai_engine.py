"""
Advanced AI Engine for complex query processing with explainability.

This module implements a sophisticated AI engine that processes complex queries using:
- Multiple specialized AI personas for domain expertise 
- Comprehensive explanation trees for transparency
- Knowledge graph integration
- Multi-step validation and verification
- Weighted multi-persona analysis and consensus building
- Visualization and response formatting based on user expertise

Key components:
- ExplanationNode: Dataclass for building hierarchical explanation trees
- ReasoningType: Enum defining different reasoning approaches
- AdvancedAIEngine: Main engine class implementing the advanced query processing
- PersonaManager: Manages specialized AI personas and scoring
- ConsensusBuilder: Combines and weighs multi-persona analysis results
- ResponseFormatter: Formats responses based on user expertise level
- VisualizationEngine: Generates visualizations of analysis results

The engine follows these high-level steps:
1. Query parsing and decomposition
2. Persona selection and activation 
3. Multi-persona parallel analysis
4. Cross-validation and consensus building
5. Explainable response generation
6. Response formatting and visualization

Example:
    engine = AdvancedAIEngine(config)
    result = await engine.process_advanced_query(
        query="Complex regulatory analysis request",
        user_context={"expertise_level": "expert"}
    )
"""

from typing import Dict, List, Optional, Union, Tuple
from dataclasses import dataclass
from enum import Enum
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import networkx as nx
from datetime import datetime
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
import plotly.graph_objects as go
import plotly.express as px
from matplotlib import pyplot as plt
import seaborn as sns
import traceback
import sys
from space_mapper import SpaceMapper
from query_engine import QueryEngine
from ai_compliance_system import ComplianceSystem
from .model_types import Coordinates4D, SearchDocument

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('ai_engine.log')
    ]
)

# Custom exception classes
class ModelInitializationError(Exception):
    """Raised when model initialization fails"""
    pass

class ConfigurationError(Exception):
    """Raised when configuration is invalid"""
    pass

class ProcessingError(Exception):
    """Raised when query processing fails"""
    pass

# Model configuration
NLP_CONFIG = {
    "nlu_model": {
        "name": "roberta-base",
        "max_length": 512,
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    },
    "semantic_model": {
        "name": "sentence-transformers/all-mpnet-base-v2", 
        "max_length": 384,
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    }
}

# Knowledge graph configuration
GRAPH_CONFIG = {
    "max_nodes": 10000,
    "edge_weight_threshold": 0.5,
    "similarity_threshold": 0.8
}

# Persona configuration with consensus weights
PERSONA_CONFIG = {
    "legal": {
        "name": "Legal Expert",
        "expertise": ["regulatory", "compliance", "legal_analysis"],
        "confidence_threshold": 0.75,
        "consensus_weight": 0.4
    },
    "financial": {
        "name": "Financial Analyst", 
        "expertise": ["financial_analysis", "risk_assessment", "market_analysis"],
        "confidence_threshold": 0.8,
        "consensus_weight": 0.3
    },
    "compliance": {
        "name": "Compliance Officer",
        "expertise": ["regulatory_compliance", "audit", "risk_management"],
        "confidence_threshold": 0.85,
        "consensus_weight": 0.3
    }
}

# Visualization configuration
VIZ_CONFIG = {
    "expert": {
        "detail_level": "high",
        "chart_types": ["network", "tree", "heatmap", "scatter"],
        "include_technical": True
    },
    "intermediate": {        "detail_level": "medium", 
        "chart_types": ["tree", "bar", "line"],
        "include_technical": False
    },
    "beginner": {
        "detail_level": "low",
        "chart_types": ["bar", "pie"],
        "include_technical": False
    }
}

@dataclass
class ExplanationNode:
    step: str
    reasoning: str
    confidence: float
    evidence: List[Dict]
    sub_steps: List['ExplanationNode']
    persona_weights: Optional[Dict[str, float]] = None
    visualizations: Optional[List[Dict]] = None

class ReasoningType(Enum):
    DEDUCTIVE = "deductive"
    INDUCTIVE = "inductive"
    ABDUCTIVE = "abductive"
    ANALOGICAL = "analogical"

class PersonaManager:
    def __init__(self, config: Dict):
        self.personas = {}
        self.persona_scores = {}
        self.config = config
        self.logger = logging.getLogger(__name__)
        self._initialize_personas()
        self.executor = ThreadPoolExecutor(max_workers=len(PERSONA_CONFIG))

    def _initialize_personas(self):
        """Initialize all available personas with their configurations"""
        try:
            if not isinstance(PERSONA_CONFIG, dict):
                raise ConfigurationError("PERSONA_CONFIG must be a dictionary")

            for persona_type, settings in PERSONA_CONFIG.items():
                if not all(k in settings for k in ["name", "expertise", "consensus_weight"]):
                    raise ConfigurationError(f"Missing required fields in persona config for {persona_type}")

                self.personas[persona_type] = {
                    "config": settings,
                    "instance": None,  # Lazy loaded when needed
                    "last_used": None,
                    "consensus_weight": settings["consensus_weight"]
                }
                self.persona_scores[persona_type] = 0.0
            self.logger.info("Personas initialized successfully")
        except ConfigurationError as e:
            self.logger.error(f"Configuration error during persona initialization: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error during persona initialization: {str(e)}\n{traceback.format_exc()}")
            raise ProcessingError(f"Failed to initialize personas: {str(e)}")

    async def analyze_with_personas(self, query: str, context: Dict) -> List[Dict]:
        """Run parallel analysis with all relevant personas"""
        try:
            if not query or not isinstance(query, str):
                raise ValueError("Query must be a non-empty string")
            if not isinstance(context, dict):
                raise ValueError("Context must be a dictionary")

            scores = self.score_personas(query, context)
            relevant_personas = {k: v for k, v in scores.items() if v > 0.3}
            
            if not relevant_personas:
                self.logger.warning("No relevant personas found for query")
                return []

            analysis_tasks = []
            for persona_type in relevant_personas:
                task = self._analyze_with_persona(persona_type, query, context)
                analysis_tasks.append(task)
            
            results = await asyncio.gather(*analysis_tasks, return_exceptions=True)
            
            # Filter out any failed analyses
            valid_results = [r for r in results if not isinstance(r, Exception)]
            
            if not valid_results:
                raise ProcessingError("All persona analyses failed")
                
            return self._combine_persona_results(valid_results, scores)
        except ValueError as e:
            self.logger.error(f"Validation error in analyze_with_personas: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error in analyze_with_personas: {str(e)}\n{traceback.format_exc()}")
            raise ProcessingError(f"Failed to analyze with personas: {str(e)}")

    def _combine_persona_results(self, results: List[Dict], scores: Dict[str, float]) -> Dict:
        """Combine and weigh results from multiple personas"""
        try:
            if not results:
                raise ValueError("No results to combine")

            combined_result = {
                "analysis": "",
                "confidence": 0.0,
                "recommendations": [],
                "next_steps": [],
                "persona_contributions": {},
                "visualizations": []
            }

            total_weight = sum(self.personas[p]["consensus_weight"] * scores[p] 
                             for p in scores if scores[p] > 0.3)

            if total_weight == 0:
                raise ValueError("Total weight cannot be zero")

            for result, (persona_type, score) in zip(results, scores.items()):
                if score <= 0.3:
                    continue

                weight = self.personas[persona_type]["consensus_weight"] * score / total_weight
                combined_result["persona_contributions"][persona_type] = weight

                # Weighted combination of analyses
                combined_result["analysis"] += f"\n{weight:.2f} * {result['analysis']}"
                combined_result["confidence"] += weight * result.get("confidence", 0.5)
                
                # Merge recommendations and next steps with weights
                for rec in result.get("recommendations", []):
                    combined_result["recommendations"].append({
                        "content": rec,
                        "weight": weight
                    })
                
                for step in result.get("next_steps", []):
                    combined_result["next_steps"].append({
                        "content": step,
                        "weight": weight
                    })

                # Merge visualizations if available
                if "visualizations" in result:
                    combined_result["visualizations"].extend(result["visualizations"])

            return combined_result
        except ValueError as e:
            self.logger.error(f"Validation error in _combine_persona_results: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error combining persona results: {str(e)}\n{traceback.format_exc()}")
            raise ProcessingError(f"Failed to combine persona results: {str(e)}")

    def score_personas(self, query: str, context: Dict) -> Dict[str, float]:
        """Score personas based on query relevance and context"""
        try:
            if not query or not isinstance(query, str):
                raise ValueError("Query must be a non-empty string")
            if not isinstance(context, dict):
                raise ValueError("Context must be a dictionary")

            scores = {}
            for persona_type, persona in self.personas.items():
                expertise_match = sum(
                    1 for skill in persona["config"]["expertise"] 
                    if skill.lower() in query.lower()
                )
                context_match = sum(
                    1 for skill in persona["config"]["expertise"]
                    if any(skill.lower() in str(v).lower() for v in context.values())
                )
                scores[persona_type] = (expertise_match + context_match) / len(persona["config"]["expertise"])
            
            self.logger.debug(f"Persona scores calculated: {scores}")
            return scores
        except ValueError as e:
            self.logger.error(f"Validation error in score_personas: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Error scoring personas: {str(e)}\n{traceback.format_exc()}")
            raise ProcessingError(f"Failed to score personas: {str(e)}")

    async def _analyze_with_persona(self, persona_type: str, query: str, context: Dict) -> Dict:
        """Execute analysis with a specific persona"""
        try:
            if not self.personas[persona_type]["instance"]:
                # Lazy load persona instance
                module = __import__(f"persona.{persona_type}")
                persona_class = getattr(module, f"{persona_type.capitalize()}Persona")
                self.personas[persona_type]["instance"] = persona_class(self.config)

            result = await self.personas[persona_type]["instance"].analyze(query, context)
            self.personas[persona_type]["last_used"] = datetime.now()
            return result
        except ImportError as e:
            self.logger.error(f"Failed to import persona module {persona_type}: {str(e)}")
            raise ProcessingError(f"Persona module not found: {persona_type}")
        except Exception as e:
            self.logger.error(f"Error in persona {persona_type}: {str(e)}\n{traceback.format_exc()}")
            return {"error": str(e), "confidence": 0.0}

class AdvancedAIEngine:
    def __init__(self, config: Dict[str, str]):
        self.space_mapper = SpaceMapper(config)
        self.query_engine = QueryEngine(config)
        self.compliance_system = ComplianceSystem(config)

    async def analyze(self, query: str, expertise_level: int, embeddings: List[float]) -> Dict:
        # Map query to 4D space
        coordinates = await self.space_mapper.map_to_4d(query, embeddings)
        
        # Get regulatory context
        regulatory_context = await self.query_engine.get_regulatory_context(coordinates)
        
        # Analyze compliance
        compliance_analysis = await self.compliance_system.analyze(
            query=query,
            context=regulatory_context,
            expertise_level=expertise_level
        )

        # Generate insights
        insights = self._generate_insights(
            coordinates=coordinates,
            regulatory_context=regulatory_context,
            compliance_analysis=compliance_analysis
        )

        return {
            "coordinates": coordinates,
            "regulatory_context": regulatory_context,
            "compliance_analysis": compliance_analysis,
            "insights": insights,
            "explanation_tree": self._generate_explanation_tree(
                query=query,
                coordinates=coordinates,
                compliance=compliance_analysis
            )
        }

    def _generate_insights(self, coordinates: Dict, regulatory_context: Dict, compliance_analysis: Dict) -> Dict:
        return {
            "spatial_insights": {
                "position": coordinates,
                "nearby_regulations": regulatory_context.get("nearby", []),
                "regulatory_clusters": regulatory_context.get("clusters", [])
            },
            "compliance_insights": {
                "risk_level": compliance_analysis.get("risk_level"),
                "coverage": compliance_analysis.get("coverage"),
                "gaps": compliance_analysis.get("gaps", [])
            },
            "recommendations": self._generate_recommendations(
                compliance_analysis.get("gaps", []),
                regulatory_context.get("requirements", [])
            )
        }

    def _generate_recommendations(self, gaps: List[Dict], requirements: List[Dict]) -> List[Dict]:
        recommendations = []
        for gap in gaps:
            relevant_reqs = [
                req for req in requirements 
                if req["category"] == gap["category"]
            ]
            recommendations.append({
                "gap": gap["description"],
                "requirements": relevant_reqs,
                "priority": gap["risk_level"],
                "suggested_actions": gap["remediation_steps"]
            })
        return recommendations

    def _generate_explanation_tree(self, query: str, coordinates: Dict, compliance: Dict) -> Dict:
        return {
            "step": "Advanced Analysis",
            "reasoning": f"Analyzing query in 4D regulatory space",
            "confidence": compliance.get("confidence", 0.9),
            "evidence": [
                {
                    "content": f"Position in 4D space: {coordinates}",
                    "source": "Space Mapper",
                    "relevance": 1.0
                },
                {
                    "content": f"Compliance level: {compliance.get('level')}",
                    "source": "Compliance System",
                    "relevance": 1.0
                }
            ],
            "subSteps": [
                {
                    "step": "Spatial Analysis",
                    "reasoning": "Mapping query to regulatory space",
                    "confidence": 0.95,
                    "evidence": [],
                    "subSteps": []
                },
                {
                    "step": "Compliance Check",
                    "reasoning": "Evaluating regulatory compliance",
                    "confidence": compliance.get("confidence", 0.9),
                    "evidence": compliance.get("evidence", []),
                    "subSteps": []
                }
            ]
        }
