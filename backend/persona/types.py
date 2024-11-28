# Standard library imports
from typing import List, Callable, Union, Optional

# Third-party imports
from openai.types.chat import ChatCompletionMessage
from openai.types.chat.chat_completion_message_tool_call import (
    ChatCompletionMessageToolCall,
    Function,
)
from pydantic import BaseModel

# Type definitions
AgentFunction = Callable[[], Union[str, "Agent", dict]]

class Agent(BaseModel):
    name: str = "Agent"
    model: str = "gpt-4o"  # This will be your Azure deployment ID
    instructions: Union[str, Callable[[], str]] = "You are a helpful agent."
    functions: List[AgentFunction] = []
    tool_choice: Optional[str] = None  # Made explicitly Optional
    parallel_tool_calls: bool = True

class Response(BaseModel):
    messages: List = []
    agent: Optional[Agent] = None
    context_variables: dict = {}

class Result(BaseModel):
    """
    Encapsulates the possible return values for an agent function.
    Attributes:
        value (str): The result value as a string.
        agent (Agent): The agent instance, if applicable.
        context_variables (dict): A dictionary of context variables.
    """
    value: str = ""
    agent: Optional[Agent] = None
    context_variables: dict = {}

# Azure-specific helper functions and constants
AZURE_API_VERSION = "2024-08-01-preview"

def get_azure_deployment_config(deployment_id: str) -> dict:
    """Helper function to generate Azure deployment configuration"""
    return {
        "deployment_id": deployment_id,
        "api_version": AZURE_API_VERSION,
    }

# Example of how to structure Azure-specific model mappings
AZURE_MODEL_DEPLOYMENTS = {
    "gpt-4": "gpt-4-2",
    "gpt-4o": "gpt-4o",
    "gpt-35-turbo": "gpt-35-turbo-deployment",
}

def get_azure_deployment_id(model_name: str) -> str:
    """Convert standard model names to Azure deployment IDs"""
    return AZURE_MODEL_DEPLOYMENTS.get(model_name, model_name)