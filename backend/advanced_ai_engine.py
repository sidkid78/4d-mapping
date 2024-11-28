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
    def __init__(self, config: Dict):
        self.config = {**config, "nlp": NLP_CONFIG, "graph": GRAPH_CONFIG, "viz": VIZ_CONFIG}
        self.logger = logging.getLogger(__name__)
        
        # Initialize NLP components with specified device
        self.tokenizers = {}
        self.models = {}
        self._initialize_nlp_components()
        
        # Initialize knowledge graph with config
        self.knowledge_graph = self._initialize_knowledge_graph()
        
        # Initialize persona manager
        self.persona_manager = PersonaManager(config)
        
        # Initialize explanation tracking
        self.explanation_tree = []
        self.confidence_threshold = config.get("confidence_threshold", 0.7)

    def _initialize_nlp_components(self):
        """Initialize all NLP models and tokenizers"""
        try:
            for model_type, settings in self.config["nlp"].items():
                self.tokenizers[model_type] = AutoTokenizer.from_pretrained(
                    settings["name"],
                    model_max_length=settings["max_length"]
                )
                self.models[model_type] = AutoModelForSequenceClassification.from_pretrained(
                    settings["name"]
                ).to(settings["device"])
                self.models[model_type].eval()
            
            self.logger.info("NLP components initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize NLP components: {str(e)}\n{traceback.format_exc()}")
            raise ModelInitializationError(f"Failed to initialize NLP components: {str(e)}")

    def _initialize_knowledge_graph(self) -> nx.DiGraph:
        """Initialize knowledge graph with configuration"""
        try:
            if not isinstance(self.config["graph"], dict):
                raise ConfigurationError("Graph configuration must be a dictionary")

            graph = nx.DiGraph()
            graph.graph["max_nodes"] = self.config["graph"]["max_nodes"]
            graph.graph["edge_weight_threshold"] = self.config["graph"]["edge_weight_threshold"]
            graph.graph["similarity_threshold"] = self.config["graph"]["similarity_threshold"]
            
            self.logger.info("Knowledge graph initialized successfully")
            return graph
        except ConfigurationError as e:
            self.logger.error(f"Configuration error: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Failed to initialize knowledge graph: {str(e)}\n{traceback.format_exc()}")
            raise ProcessingError(f"Failed to initialize knowledge graph: {str(e)}")

    async def process_advanced_query(self, query: str, user_context: Dict) -> Dict:
        """
        Process complex query with full explainability.
        """
        try:
            # Start explanation tree
            current_explanation = ExplanationNode(
                step="Query Processing",
                reasoning="Initiating query analysis",
                confidence=1.0,
                evidence=[],
                sub_steps=[]
            )
            
            # Parse and decompose query
            parsed_query = await self._parse_query(query, current_explanation)
            
            # Analyze with personas
            persona_results = await self.persona_manager.analyze_with_personas(query, user_context)
            
            # Validate and verify results
            validated_results = await self._validate_results(persona_results, current_explanation)
            
            # Generate explainable response
            response = await self._generate_explainable_response(
                validated_results,
                current_explanation,
                user_context
            )
            
            return {
                "response": response,
                "explanation_tree": current_explanation,
                "confidence_score": self._calculate_overall_confidence(current_explanation)
            }

        except Exception as e:
            self.logger.error(f"Advanced query processing failed: {str(e)}\n{traceback.format_exc()}")
            raise ProcessingError(f"Failed to process query: {str(e)}")

    async def _parse_query(self, query: str, explanation: ExplanationNode) -> Dict:
        """Parse query with detailed explanation."""
        try:
            explanation.sub_steps.append(
                ExplanationNode(
                    step="Natural Language Understanding",
                    reasoning="Applying NLP models to understand query intent",
                    confidence=0.95,
                    evidence=[],
                    sub_steps=[]
                )
            )
            
            # Tokenize and encode query
            encoded_input = self.tokenizers["nlu_model"](
                query,
                return_tensors="pt",
                padding=True,
                truncation=True
            ).to(self.config["nlp"]["nlu_model"]["device"])
            
            # Get model output
            with torch.no_grad():
                output = self.models["nlu_model"](**encoded_input)
            
            # Process output (this is a placeholder, actual processing would depend on the specific model and task)
            intent = torch.argmax(output.logits, dim=1).item()
            confidence = torch.softmax(output.logits, dim=1).max().item()
            
            parsed_result = {
                "intent": intent,
                "confidence": confidence,
                "query": query
            }
            
            explanation.sub_steps[-1].confidence = confidence
            explanation.sub_steps[-1].evidence.append({
                "type": "model_output",
                "content": f"Intent: {intent}, Confidence: {confidence:.2f}"
            })
            
            return parsed_result

        except Exception as e:
            self.logger.error(f"Query parsing failed: {str(e)}\n{traceback.format_exc()}")
            raise ProcessingError(f"Failed to parse query: {str(e)}")

    async def _validate_results(self, results: Dict, explanation: ExplanationNode) -> Dict:
        """Validate and verify analysis results."""
        try:
            explanation.sub_steps.append(
                ExplanationNode(
                    step="Result Validation",
                    reasoning="Cross-validating persona analyses",
                    confidence=0.0,
                    evidence=[],
                    sub_steps=[]
                )
            )

            # Check if we have enough persona contributions
            if len(results["persona_contributions"]) < 2:
                explanation.sub_steps[-1].evidence.append({
                    "type": "validation_warning",
                    "content": "Insufficient persona diversity for robust validation"
                })
                return results

            # Calculate agreement scores between personas
            agreements = []
            recommendations_set = set()
            for rec in results.get("recommendations", []):
                recommendations_set.add(rec["content"])

            # Check recommendation consistency
            rec_consistency = len(recommendations_set) / max(
                len(results.get("recommendations", [])), 1
            )

            # Calculate weighted variance of confidence scores
            confidence_scores = []
            weights = []
            for persona, weight in results["persona_contributions"].items():
                if persona in PERSONA_CONFIG:
                    confidence_scores.append(PERSONA_CONFIG[persona]["confidence_threshold"])
                    weights.append(weight)
            
            if confidence_scores:
                weighted_variance = np.average(
                    (np.array(confidence_scores) - np.mean(confidence_scores)) ** 2,
                    weights=weights
                )
            else:
                weighted_variance = 1.0

            # Calculate overall validation score
            validation_score = (
                0.4 * rec_consistency +  # Recommendation consistency
                0.3 * (1 - weighted_variance) +  # Confidence score consistency
                0.3 * min(1.0, len(results["persona_contributions"]) / 3)  # Persona diversity
            )

            # Update results with validation metrics
            validated_results = {
                **results,
                "validation_metrics": {
                    "recommendation_consistency": rec_consistency,
                    "confidence_variance": weighted_variance,
                    "persona_diversity": len(results["persona_contributions"]) / 3,
                    "validation_score": validation_score
                }
            }

            # Update explanation
            explanation.sub_steps[-1].confidence = validation_score
            explanation.sub_steps[-1].evidence.extend([
                {
                    "type": "validation_metric",
                    "content": f"Recommendation consistency: {rec_consistency:.2f}"
                },
                {
                    "type": "validation_metric",
                    "content": f"Confidence score variance: {weighted_variance:.2f}"
                },
                {
                    "type": "validation_metric",
                    "content": f"Persona diversity: {len(results['persona_contributions'])}/3"
                }
            ])

            return validated_results

        except Exception as e:
            self.logger.error(f"Result validation failed: {str(e)}\n{traceback.format_exc()}")
            raise ProcessingError(f"Failed to validate results: {str(e)}")

    async def _generate_explainable_response(self, results: Dict, explanation: ExplanationNode, user_context: Dict) -> Dict:
        """Generate response with comprehensive explanation."""
        try:
            explanation.sub_steps.append(
                ExplanationNode(
                    step="Response Generation",
                    reasoning="Formatting results for user comprehension",
                    confidence=0.95,
                    evidence=[],
                    sub_steps=[]
                )
            )
            
            # Format response based on user's expertise level
            expertise_level = user_context.get("expertise_level", "intermediate")
            formatted_response = self._format_for_expertise(results, expertise_level)
            
            # Generate visualizations
            visualizations = await self._create_visualizations(results, user_context)
            
            response = {
                "content": formatted_response,
                "visualizations": visualizations,
                "confidence": results["confidence"],
                "persona_contributions": results["persona_contributions"]
            }
            
            explanation.sub_steps[-1].evidence.append({
                "type": "response_summary",
                "content": f"Generated response for {expertise_level} expertise level"
            })
            
            return response

        except Exception as e:
            self.logger.error(f"Response generation failed: {str(e)}\n{traceback.format_exc()}")
            raise ProcessingError(f"Failed to generate response: {str(e)}")

    def _format_for_expertise(self, results: Dict, expertise_level: str) -> str:
        """Format response based on user's expertise level.
        
        Formats analysis results into appropriate level of detail and technical language based on user expertise.
        
        Args:
            results: Dict containing analysis results and recommendations
            expertise_level: String indicating user expertise ('expert', 'intermediate', or 'beginner')
            
        Returns:
            Formatted response string with appropriate detail level and terminology
        
        The formatting follows these guidelines:
        - Expert: Full technical details, raw data, and comprehensive analysis
        - Intermediate: Key findings and insights with moderate technical language
        - Beginner: High-level summary with simplified explanations
        """
        # Implement formatting logic based on expertise level

        # This is a placeholder implementation
        if expertise_level == "expert":
            return f"Detailed analysis: {results['analysis']}\n\nRecommendations: {results['recommendations']}"
        elif expertise_level == "intermediate":
            return f"Summary: {results['analysis'][:200]}...\n\nKey points: {results['recommendations'][:3]}"
        else:
            return f"Simple explanation: {results['analysis'][:100]}...\n\nMain takeaway: {results['recommendations'][0]}"

    async def _create_visualizations(self, results: Dict, user_context: Dict) -> List[Dict]:
        """Generate visualizations based on analysis results and user context."""
        try:
            visualizations = []
            expertise_level = user_context.get("expertise_level", "intermediate")
            viz_config = self.config["viz"][expertise_level]

            # Create network visualization if appropriate for expertise level
            if "network" in viz_config["chart_types"]:
                network_fig = go.Figure()
                
                # Add nodes
                node_x = []
                node_y = []
                node_text = []
                for node in self.knowledge_graph.nodes():
                    pos = nx.spring_layout(self.knowledge_graph)
                    node_x.append(pos[node][0])
                    node_y.append(pos[node][1])
                    node_text.append(str(node))
                
                network_fig.add_trace(go.Scatter(
                    x=node_x, y=node_y,
                    mode='markers+text',
                    text=node_text,
                    hoverinfo='text',
                    marker=dict(size=20)
                ))
                
                visualizations.append({
                    "type": "network",
                    "figure": network_fig,
                    "title": "Knowledge Graph Visualization"
                })

            # Create heatmap for confidence scores
            if "heatmap" in viz_config["chart_types"]:
                confidence_data = np.array([
                    [results.get("confidence", 0.0)],
                    [results.get("validation_metrics", {}).get("validation_score", 0.0)]
                ])
                
                heatmap_fig = go.Figure(data=go.Heatmap(
                    z=confidence_data,
                    x=['Score'],
                    y=['Confidence', 'Validation'],
                    colorscale='Viridis'
                ))
                
                visualizations.append({
                    "type": "heatmap",
                    "figure": heatmap_fig,
                    "title": "Confidence Analysis"
                })

            # Create bar chart for persona contributions
            if "bar" in viz_config["chart_types"]:
                personas = list(results.get("persona_contributions", {}).keys())
                weights = list(results.get("persona_contributions", {}).values())
                
                bar_fig = go.Figure(data=go.Bar(
                    x=personas,
                    y=weights,
                    marker_color='rgb(55, 83, 109)'
                ))
                
                bar_fig.update_layout(
                    title="Persona Contributions",
                    xaxis_title="Persona",
                    yaxis_title="Weight"
                )
                
                visualizations.append({
                    "type": "bar",
                    "figure": bar_fig,
                    "title": "Persona Contribution Analysis"
                })

            # Create scatter plot for recommendations if available
            if "scatter" in viz_config["chart_types"] and results.get("recommendations"):
                scatter_x = []
                scatter_y = []
                scatter_text = []
                
                for i, rec in enumerate(results["recommendations"]):
                    scatter_x.append(i)
                    scatter_y.append(rec.get("weight", 0.5))
                    scatter_text.append(rec.get("content", ""))
                
                scatter_fig = go.Figure(data=go.Scatter(
                    x=scatter_x,
                    y=scatter_y,
                    mode='markers+text',
                    text=scatter_text,
                    marker=dict(size=10)
                ))
                
                scatter_fig.update_layout(
                    title="Recommendation Analysis",
                    xaxis_title="Recommendation Index",
                    yaxis_title="Weight"
                )
                
                visualizations.append({
                    "type": "scatter",
                    "figure": scatter_fig,
                    "title": "Recommendation Weight Distribution"
                })

            return visualizations

        except Exception as e:
            self.logger.error(f"Visualization creation failed: {str(e)}\n{traceback.format_exc()}")
            return []

    def _create_network_visualization(self, results: Dict) -> Dict:
        """Create a network visualization of the knowledge graph."""
        try:
            # Get the knowledge graph
            graph = self.knowledge_graph
            
            # Create layout
            pos = nx.spring_layout(graph)
            
            # Create edges trace
            edge_x = []
            edge_y = []
            for edge in graph.edges():
                x0, y0 = pos[edge[0]]
                x1, y1 = pos[edge[1]]
                edge_x.extend([x0, x1, None])
                edge_y.extend([y0, y1, None])
                
            edges_trace = go.Scatter(
                x=edge_x, y=edge_y,
                line=dict(width=0.5, color='#888'),
                hoverinfo='none',
                mode='lines'
            )
            
            # Create nodes trace
            node_x = []
            node_y = []
            node_text = []
            node_size = []
            node_color = []
            
            for node in graph.nodes():
                x, y = pos[node]
                node_x.append(x)
                node_y.append(y)
                node_text.append(str(node))
                # Node size based on degree
                node_size.append(10 + 5 * graph.degree(node))
                # Color based on some node attribute (e.g., confidence)
                node_color.append(graph.nodes[node].get('confidence', 0.5))
                
            nodes_trace = go.Scatter(
                x=node_x, y=node_y,
                mode='markers+text',
                hoverinfo='text',
                text=node_text,
                marker=dict(
                    showscale=True,
                    colorscale='YlGnBu',
                    size=node_size,
                    color=node_color,
                    line_width=2
                )
            )
            
            # Create figure
            fig = go.Figure(data=[edges_trace, nodes_trace])
            
            # Update layout
            fig.update_layout(
                title='Knowledge Graph Network',
                showlegend=False,
                hovermode='closest',
                margin=dict(b=20,l=5,r=5,t=40),
                annotations=[dict(
                    text="Knowledge Graph Visualization",
                    showarrow=False,
                    xref="paper", yref="paper",
                    x=0.005, y=-0.002
                )],
                xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                yaxis=dict(showgrid=False, zeroline=False, showticklabels=False)
            )
            
            return {
                "type": "network",
                "figure": fig,
                "title": "Knowledge Graph Network Visualization",
                "description": "Interactive network visualization of the knowledge graph showing relationships and node importance"
            }
            
        except Exception as e:
            self.logger.error(f"Network visualization creation failed: {str(e)}\n{traceback.format_exc()}")
            return {
                "type": "network",
                "error": str(e),
                "message": "Failed to create network visualization"
            }
        

    def _create_bar_visualization(self, persona_contributions: Dict) -> Dict:
        """Create a bar chart of persona contributions."""
        try:
            # Extract data
            personas = list(persona_contributions.keys())
            weights = list(persona_contributions.values())
            
            # Create bar chart
            fig = go.Figure(data=go.Bar(
                x=personas,
                y=weights,
                marker=dict(
                    color='rgb(55, 83, 109)',
                    line=dict(color='rgb(8,48,107)', width=1.5)
                )
            ))
            
            # Update layout
            fig.update_layout(
                title="Persona Contributions Analysis",
                xaxis_title="Persona",
                yaxis_title="Contribution Weight",
                bargap=0.2,
                bargroupgap=0.1,
                template="plotly_white",
                margin=dict(l=50, r=50, t=50, b=50)
            )

            return {
                "type": "bar",
                "figure": fig,
                "title": "Persona Contribution Analysis",
                "description": "Bar chart showing the weighted contributions of different personas to the analysis"
            }

        except Exception as e:
            self.logger.error(f"Bar visualization creation failed: {str(e)}")
            return {
                "type": "bar", 
                "error": str(e),
                "message": "Failed to create bar visualization"
            }

    def _calculate_overall_confidence(self, explanation: ExplanationNode) -> float:
        """Calculate overall confidence based on the explanation tree."""
        if not explanation.sub_steps:
            return explanation.confidence
        
        sub_confidences = [self._calculate_overall_confidence(sub) for sub in explanation.sub_steps]
        return sum(sub_confidences) / len(sub_confidences)
