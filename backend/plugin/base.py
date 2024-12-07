from abc import ABC, abstractmethod 

class RegulatoryPlugin(ABC):
    """Base class for all regulatory plugins"""

    @abstractmethod 
    def initialize(self, config: dict) -> None:
        """Initialize the plugin with config"""
        pass

    @abstractmethod 
    async def process(self, data: dict) -> dict:
        """Process data using the plugin"""
        pass 

    