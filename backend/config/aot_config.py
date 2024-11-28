AoT_CONFIG = {
    "bert_model": "bert-base-uncased",
    "consensus_threshold": 0.8,
    "personas": [
        {
            "role": "legal_expert",
            "domain": "regulatory_compliance",
            "expertise_level": 5,
            "certifications": ["JD", "LLM in Regulatory Law"],
            "training_modules": ["advanced_legal_analysis", "regulatory_interpretation"],
            "decision_rules": {
                "high_risk": "Consult with senior legal counsel",
                "medium_risk": "Apply standard legal framework",
                "low_risk": "Provide general legal guidance"
            },
            "version": "1.0"
        },
        {
            "role": "financial_analyst",
            "domain": "financial_regulations",
            "expertise_level": 4,
            "certifications": ["CFA", "FRM"],
            "training_modules": ["financial_risk_assessment", "regulatory_reporting"],
            "decision_rules": {
                "high_impact": "Conduct detailed financial analysis",
                "medium_impact": "Review financial statements and regulatory filings",
                "low_impact": "Provide general financial advice"
            },
            "version": "1.0"
        },
        {
            "role": "compliance_officer",
            "domain": "corporate_compliance",
            "expertise_level": 4,
            "certifications": ["CCEP", "CAMS"],
            "training_modules": ["compliance_program_management", "risk_assessment"],
            "decision_rules": {
                "critical": "Escalate to board level",
                "significant": "Implement immediate corrective actions",
                "minor": "Document and monitor for trends"
            },
            "version": "1.0"
        }
    ],
    "state_transition_rules": {
        "query_parsing": {
            "success": "contextualization",
            "failure": "response_generation"
        },
        "contextualization": {
            "success": "data_retrieval",
            "failure": "query_parsing"
        },
        "data_retrieval": {
            "success": "gap_analysis",
            "failure": "contextualization"
        },
        "gap_analysis": {
            "success": "expert_reasoning",
            "failure": "data_retrieval"
        },
        "expert_reasoning": {
            "success": "compliance_check",
            "failure": "gap_analysis"
        },
        "compliance_check": {
            "success": "response_generation",
            "failure": "expert_reasoning"
        },
        "response_generation": {
            "success": "complete",
            "failure": "expert_reasoning"
        }
    },
    "max_retries": 3,
    "timeout": 30,  # seconds
    "logging": {
        "level": "INFO",
        "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    }
}