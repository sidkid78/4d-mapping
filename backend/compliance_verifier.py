"""
Compliance Verifier Module

This module provides functionality for verifying entity compliance against regulations
in a spatial context. It checks both direct compliance with nearby regulations and
comprehensive compliance including related regulations.

Components:
- ComplianceVerifier: Main class for compliance verification
- SpaceMapper: Integration for spatial regulation mapping

Key Features:
- Spatial regulation lookup based on entity coordinates
- Direct compliance checking against regulation requirements
- Comprehensive compliance assessment including related regulations
- Configurable compliance radius for spatial searches

Example:
    # Initialize verifier
    verifier = ComplianceVerifier(config)
    
    # Check compliance for entity
    results = await verifier.verify_compliance(
        entity={"coordinates": [1.0, 2.0], "type": "facility"},
        context={"check_depth": 2}
    )

Dependencies:
    - SpaceMapper for spatial regulation lookups
    - Configuration for compliance parameters
"""

from typing import Dict, List
from space_mapper import SpaceMapper

class ComplianceVerifier:
    def __init__(self, config: Dict):
        self.config = config
        self.space_mapper = SpaceMapper(config['space_mapper'])

    async def verify_compliance(self, entity: Dict, context: Dict) -> Dict:
        applicable_regulations = self.space_mapper.get_nearby_regulations(
            entity['coordinates'],
            radius=self.config['compliance_radius']
        )

        compliance_results = self._check_compliance(entity, applicable_regulations)

        related_regulations = [
            related
            for regulation in applicable_regulations
            for related in self.space_mapper.get_related_regulations(regulation['id'])
        ]

        comprehensive_results = self._assess_comprehensive_compliance(compliance_results, related_regulations)

        return comprehensive_results

    def _check_compliance(self, entity: Dict, regulations: List[Dict]) -> Dict:
        compliance_results = {}
        for regulation in regulations:
            is_compliant = all(
                entity.get(key) == value
                for key, value in regulation.get('requirements', {}).items()
            )
            compliance_results[regulation['id']] = is_compliant
        return compliance_results

    def _assess_comprehensive_compliance(self, initial_results: Dict, related_regulations: List[Dict]) -> Dict:
        comprehensive_results = initial_results.copy()
        for regulation in related_regulations:
            if regulation['id'] not in comprehensive_results:
                is_compliant = all(
                    initial_results.get(related_id, False)
                    for related_id in regulation.get('related_ids', [])
                )
                comprehensive_results[regulation['id']] = is_compliant
        return comprehensive_results