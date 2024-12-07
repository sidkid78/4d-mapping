from backend.plugin.base import RegulatoryPlugin 
from dataclasses import dataclass 
import yaml 

class AlgorithmOfThoughtPlugin(RegulatoryPlugin):
    def initialize(self, config: dict) -> None:
        self.config = config 


    async def process(self, data: dict) -> dict:

        return result