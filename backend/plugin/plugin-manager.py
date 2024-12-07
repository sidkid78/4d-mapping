import importlib
import yaml
from pathlib import Path

class PluginManager:
    def __init__(self):
        self.plugins = {}
        
    def load_plugin(self, plugin_name: str) -> None:
        """Load a plugin by name"""
        try:
            # Import plugin module
            module = importlib.import_module(f"regulatory_plugins.plugins.{plugin_name}.plugin")
            
            # Load plugin config
            config_path = Path(__file__).parent / "plugins" / plugin_name / "config.yaml"
            with open(config_path) as f:
                config = yaml.safe_load(f)
                
            # Initialize plugin
            plugin_class = getattr(module, f"{plugin_name.title().replace('_', '')}Plugin")
            plugin = plugin_class()
            plugin.initialize(config)
            
            self.plugins[plugin_name] = plugin
            
        except Exception as e:
            raise Exception(f"Failed to load plugin {plugin_name}: {str(e)}")