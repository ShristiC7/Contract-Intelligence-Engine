"""
Legal Document Analysis ReAct Agent with RAGAS Evaluation
Requires: langchain, langchain-openai, pgvector, psycopg2, ragas, datasets
"""

import os
import json
import sys
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

import openai
from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import Tool
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.prompts import PromptTemplate
from langchain.schema import Document
import psycopg2
from psycopg2.extras import execute_values
import numpy as np
from dotenv import load_dotenv

# RAGAS evaluation imports
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy

# Load environment variables
load_dotenv()

# Import telemetry
from telemetry import (
    trace_legal_agent_call, trace_clause_extraction, trace_risk_scoring, 
    trace_vector_search, trace_ragas_evaluation, record_ragas_score
)


# ============================================================================
# CONFIGURATION
# ============================================================================

@dataclass
class Config:
    """System configuration"""
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    pg_host: str = os.getenv("PG_HOST", "localhost")
    pg_port: int = int(os.getenv("PG_PORT", "5432"))
    pg_database: str = os.getenv("PG_DATABASE", "legal_db")
    pg_user: str = os.getenv("PG_USER", "postgres")
    pg_password: str = os.getenv("PG_PASSWORD", "")
    embedding_model: str = "text-embedding-3-small"
    llm_model: str = "gpt-4"
    faithfulness_threshold: float = float(os.getenv("FAITHFULNESS_THRESHOLD", "0.85"))


# ============================================================================
# PGVECTOR STORAGE
# ============================================================================

class PgVectorStore:
    """PostgreSQL with pgvector for clause embeddings"""
    
    def __init__(self, config: Config):
        self.config = config
        self.embeddings = OpenAIEmbeddings(
            model=config.embedding_model,
            openai_api_key=config.openai_api_key
        )
        self.conn = None
        self._connect()
        self._init_schema()
    
    def _connect(self):
        """Establish database connection"""
        self.conn = psycopg2.connect(
            host=self.config.pg_host,
            port=self.config.pg_port,
            database=self.config.pg_database,
            user=self.config.pg_user,
            password=self.config.pg_password
        )
    
    def _init_schema(self):
        """Initialize pgvector schema"""
        with self.conn.cursor() as cur:
            # Enable pgvector extension
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            
            # Create clauses table with vector column
            cur.execute("""
                CREATE TABLE IF NOT EXISTS legal_clauses (
                    id SERIAL PRIMARY KEY,
                    clause_text TEXT NOT NULL,
                    document_id VARCHAR(255),
                    clause_type VARCHAR(100),
                    metadata JSONB,
                    embedding vector(1536),
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)
            
            # Create vector index for similarity search
            cur.execute("""
                CREATE INDEX IF NOT EXISTS legal_clauses_embedding_idx 
                ON legal_clauses USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 100);
            """)
            
            self.conn.commit()
    
    def add_clauses(self, clauses: List[Dict[str, Any]]):
        """Add clauses with embeddings to database"""
        texts = [c['clause_text'] for c in clauses]
        embeddings = self.embeddings.embed_documents(texts)
        
        with self.conn.cursor() as cur:
            data = [
                (
                    c['clause_text'],
                    c.get('document_id'),
                    c.get('clause_type'),
                    json.dumps(c.get('metadata', {})),
                    emb
                )
                for c, emb in zip(clauses, embeddings)
            ]
            
            execute_values(
                cur,
                """
                INSERT INTO legal_clauses 
                (clause_text, document_id, clause_type, metadata, embedding)
                VALUES %s
                """,
                data
            )
            self.conn.commit()
    
    def similarity_search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar clauses using cosine similarity"""
        query_embedding = self.embeddings.embed_query(query)
        
        with self.conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    id, clause_text, document_id, clause_type, metadata,
                    1 - (embedding <=> %s::vector) as similarity
                FROM legal_clauses
                ORDER BY embedding <=> %s::vector
                LIMIT %s;
            """, (query_embedding, query_embedding, k))
            
            results = []
            for row in cur.fetchall():
                results.append({
                    'id': row[0],
                    'clause_text': row[1],
                    'document_id': row[2],
                    'clause_type': row[3],
                    'metadata': row[4],
                    'similarity': row[5]
                })
            
            return results
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()


# ============================================================================
# AGENT TOOLS
# ============================================================================

class LegalTools:
    """Tools for the ReAct agent"""
    
    def __init__(self, vector_store: PgVectorStore):
        self.vector_store = vector_store
        self.risk_keywords = {
            'high': ['unlimited liability', 'no warranty', 'perpetual', 
                    'irrevocable', 'indemnify', 'waive all rights', 'penalty',
                    'liquidated damages', 'exclusive', 'non-compete'],
            'medium': ['may terminate', 'at our discretion', 'subject to change',
                      'without notice', 'as-is', 'reasonable efforts'],
            'low': ['mutual agreement', 'good faith', 'standard terms',
                   'best efforts', 'cooperate']
        }
    
    @trace_clause_extraction
    def extract_clauses(self, document: str) -> str:
        """
        Extract legal clauses from a document.
        Input: document text
        Output: JSON string with extracted clauses
        """
        # Enhanced clause extraction with better pattern matching
        clauses = []
        lines = document.split('\n')
        current_clause = []
        
        # Common clause patterns
        clause_indicators = [
            'clause', 'section', 'article', 'term', 'condition',
            'liability', 'payment', 'termination', 'confidentiality',
            'indemnification', 'warranty', 'limitation'
        ]
        
        for line in lines:
            line = line.strip()
            if not line:
                if current_clause:
                    clause_text = ' '.join(current_clause)
                    if len(clause_text) > 20:  # Filter short fragments
                        clauses.append({
                            'text': clause_text,
                            'type': self._classify_clause(clause_text),
                            'length': len(clause_text)
                        })
                    current_clause = []
            else:
                # Check if line starts a new clause
                line_lower = line.lower()
                if any(indicator in line_lower for indicator in clause_indicators):
                    if current_clause:
                        clause_text = ' '.join(current_clause)
                        if len(clause_text) > 20:
                            clauses.append({
                                'text': clause_text,
                                'type': self._classify_clause(clause_text),
                                'length': len(clause_text)
                            })
                    current_clause = [line]
                else:
                    current_clause.append(line)
        
        # Add final clause
        if current_clause:
            clause_text = ' '.join(current_clause)
            if len(clause_text) > 20:
                clauses.append({
                    'text': clause_text,
                    'type': self._classify_clause(clause_text),
                    'length': len(clause_text)
                })
        
        return json.dumps({
            'num_clauses': len(clauses),
            'clauses': clauses[:15],  # Limit output
            'total_length': sum(c['length'] for c in clauses)
        }, indent=2)
    
    def _classify_clause(self, text: str) -> str:
        """Classify clause type based on keywords"""
        text_lower = text.lower()
        if any(kw in text_lower for kw in ['liability', 'indemnif', 'warrant', 'damage']):
            return 'liability'
        elif any(kw in text_lower for kw in ['payment', 'fee', 'price', 'cost', 'charge']):
            return 'financial'
        elif any(kw in text_lower for kw in ['terminate', 'cancel', 'expir', 'end']):
            return 'termination'
        elif any(kw in text_lower for kw in ['confidential', 'proprietary', 'secret', 'private']):
            return 'confidentiality'
        elif any(kw in text_lower for kw in ['intellectual', 'copyright', 'patent', 'trademark']):
            return 'intellectual_property'
        elif any(kw in text_lower for kw in ['force majeure', 'act of god', 'unforeseen']):
            return 'force_majeure'
        return 'general'
    
    @trace_vector_search
    def search_legal_db(self, query: str) -> str:
        """
        Search legal clause database for similar clauses.
        Input: search query
        Output: JSON string with relevant clauses
        """
        results = self.vector_store.similarity_search(query, k=5)
        
        return json.dumps({
            'query': query,
            'num_results': len(results),
            'results': [
                {
                    'clause': r['clause_text'][:200] + '...' if len(r['clause_text']) > 200 else r['clause_text'],
                    'type': r['clause_type'],
                    'similarity': round(r['similarity'], 3),
                    'document_id': r['document_id']
                }
                for r in results
            ]
        }, indent=2)
    
    @trace_risk_scoring
    def score_risk(self, clause: str) -> str:
        """
        Score risk level of a legal clause.
        Input: clause text
        Output: JSON string with risk assessment
        """
        clause_lower = clause.lower()
        
        # Calculate risk score
        high_count = sum(1 for kw in self.risk_keywords['high'] if kw in clause_lower)
        medium_count = sum(1 for kw in self.risk_keywords['medium'] if kw in clause_lower)
        low_count = sum(1 for kw in self.risk_keywords['low'] if kw in clause_lower)
        
        # Additional risk factors
        risk_factors = {
            'unlimited': 2.0,
            'perpetual': 1.5,
            'irrevocable': 1.5,
            'penalty': 2.0,
            'liquidated damages': 2.5,
            'exclusive': 1.5,
            'non-compete': 1.5,
            'indemnify': 1.5,
            'waive': 1.0,
            'no warranty': 1.0
        }
        
        additional_score = sum(score for keyword, score in risk_factors.items() 
                             if keyword in clause_lower)
        
        # Determine risk level
        if high_count >= 2 or additional_score >= 3:
            risk_level = 'HIGH'
            score = 8 + min(high_count, 2) + additional_score * 0.5
        elif high_count >= 1 or medium_count >= 2 or additional_score >= 1.5:
            risk_level = 'MEDIUM'
            score = 5 + high_count + (medium_count * 0.5) + additional_score * 0.3
        else:
            risk_level = 'LOW'
            score = 2 + (medium_count * 0.5) - (low_count * 0.3) + additional_score * 0.1
        
        score = max(0, min(10, score))  # Clamp to 0-10
        
        return json.dumps({
            'risk_level': risk_level,
            'risk_score': round(score, 1),
            'high_risk_indicators': high_count,
            'medium_risk_indicators': medium_count,
            'low_risk_indicators': low_count,
            'additional_risk_score': round(additional_score, 1),
            'clause_preview': clause[:150] + '...' if len(clause) > 150 else clause,
            'recommendation': self._get_risk_recommendation(risk_level, score)
        }, indent=2)
    
    def _get_risk_recommendation(self, risk_level: str, score: float) -> str:
        """Get recommendation based on risk level"""
        if risk_level == 'HIGH' or score >= 8:
            return 'Immediate legal review required - high risk terms identified'
        elif risk_level == 'MEDIUM' or score >= 5:
            return 'Legal review recommended - moderate risk terms present'
        else:
            return 'Standard review - low risk terms'


# ============================================================================
# REACT AGENT
# ============================================================================

class LegalReActAgent:
    """ReAct agent for legal document analysis"""
    
    def __init__(self, config: Config, vector_store: PgVectorStore):
        self.config = config
        self.vector_store = vector_store
        self.tools_handler = LegalTools(vector_store)
        
        # Initialize LLM
        self.llm = ChatOpenAI(
            model=config.llm_model,
            temperature=0,
            openai_api_key=config.openai_api_key
        )
        
        # Define tools
        self.tools = [
            Tool(
                name="extract_clauses",
                func=self.tools_handler.extract_clauses,
                description="Extract legal clauses from a document. Input: document text. Returns JSON with extracted clauses and their types."
            ),
            Tool(
                name="search_legal_db",
                func=self.tools_handler.search_legal_db,
                description="Search the legal clause database for similar clauses. Input: search query. Returns relevant clauses with similarity scores."
            ),
            Tool(
                name="score_risk",
                func=self.tools_handler.score_risk,
                description="Score the risk level of a legal clause. Input: clause text. Returns risk level (LOW/MEDIUM/HIGH) and score (0-10) with recommendations."
            )
        ]
        
        # ReAct prompt template
        self.prompt = PromptTemplate.from_template("""
You are a legal document analysis expert. Answer the following questions as best you can using the available tools.

Available tools:
{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought: {agent_scratchpad}
""")
        
        # Create agent
        self.agent = create_react_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=self.prompt
        )
        
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=True,
            max_iterations=5,
            handle_parsing_errors=True
        )
    
    @trace_legal_agent_call("run")
    def run(self, query: str) -> Dict[str, Any]:
        """Execute agent on query"""
        result = self.agent_executor.invoke({"input": query})
        return result


# ============================================================================
# RAGAS EVALUATION HARNESS
# ============================================================================

class RAGASEvaluator:
    """RAGAS evaluation harness for the agent"""
    
    def __init__(self, config: Config, agent: LegalReActAgent):
        self.config = config
        self.agent = agent
    
    def load_golden_set(self, filepath: str) -> List[Dict[str, Any]]:
        """Load golden dataset from JSON file"""
        with open(filepath, 'r') as f:
            return json.load(f)
    
    @trace_ragas_evaluation
    def evaluate(self, golden_set_path: str) -> Dict[str, float]:
        """
        Run RAGAS evaluation on golden set.
        Expected JSON format:
        [
            {
                "question": "What is the liability clause?",
                "context": ["The company limits liability to $1000..."],
                "ground_truth": "Liability is limited to $1000"
            },
            ...
        ]
        """
        # Load golden set
        golden_data = self.load_golden_set(golden_set_path)
        
        print(f"Loaded {len(golden_data)} items from golden set")
        
        # Generate answers using agent
        questions = []
        contexts = []
        answers = []
        ground_truths = []
        
        for idx, item in enumerate(golden_data):
            print(f"Processing item {idx + 1}/{len(golden_data)}...")
            
            try:
                result = self.agent.run(item['question'])
                answer = result.get('output', '')
                
                questions.append(item['question'])
                contexts.append(item['context'])
                answers.append(answer)
                ground_truths.append(item['ground_truth'])
                
            except Exception as e:
                print(f"Error processing item {idx}: {e}")
                continue
        
        # Create RAGAS dataset
        dataset = Dataset.from_dict({
            'question': questions,
            'contexts': contexts,
            'answer': answers,
            'ground_truth': ground_truths
        })
        
        # Run RAGAS evaluation
        print("\nRunning RAGAS evaluation...")
        results = evaluate(
            dataset,
            metrics=[faithfulness, answer_relevancy]
        )
        
        return {
            'faithfulness': results['faithfulness'],
            'answer_relevancy': results['answer_relevancy'],
            'num_samples': len(questions)
        }
    
    def assert_metrics(self, metrics: Dict[str, float]) -> bool:
        """Assert metrics meet thresholds for CI"""
        faithfulness_score = metrics['faithfulness']
        
        print(f"\n{'='*60}")
        print("EVALUATION RESULTS")
        print(f"{'='*60}")
        print(f"Faithfulness:     {faithfulness_score:.4f} (threshold: {self.config.faithfulness_threshold})")
        print(f"Answer Relevancy: {metrics['answer_relevancy']:.4f}")
        print(f"Samples:          {metrics['num_samples']}")
        print(f"{'='*60}\n")
        
        if faithfulness_score < self.config.faithfulness_threshold:
            print(f"❌ FAIL: Faithfulness {faithfulness_score:.4f} < {self.config.faithfulness_threshold}")
            return False
        
        print(f"✅ PASS: Faithfulness {faithfulness_score:.4f} >= {self.config.faithfulness_threshold}")
        return True


# ============================================================================
# EXAMPLE USAGE & CI SCRIPT
# ============================================================================

def seed_sample_data(vector_store: PgVectorStore):
    """Seed database with sample legal clauses"""
    sample_clauses = [
        {
            'clause_text': 'The Company shall have unlimited liability for any damages arising from gross negligence or willful misconduct.',
            'document_id': 'DOC001',
            'clause_type': 'liability',
            'metadata': {'section': '8.1', 'risk_level': 'high'}
        },
        {
            'clause_text': 'Either party may terminate this agreement with 30 days written notice.',
            'document_id': 'DOC001',
            'clause_type': 'termination',
            'metadata': {'section': '12.1', 'risk_level': 'low'}
        },
        {
            'clause_text': 'All confidential information shall be kept secret for a period of 5 years.',
            'document_id': 'DOC002',
            'clause_type': 'confidentiality',
            'metadata': {'section': '6.2', 'risk_level': 'medium'}
        },
        {
            'clause_text': 'Payment terms are Net 30 days from invoice date.',
            'document_id': 'DOC002',
            'clause_type': 'financial',
            'metadata': {'section': '4.1', 'risk_level': 'low'}
        },
        {
            'clause_text': 'The service is provided as-is without any warranty, express or implied.',
            'document_id': 'DOC003',
            'clause_type': 'liability',
            'metadata': {'section': '9.1', 'risk_level': 'high'}
        },
        {
            'clause_text': 'Party A shall indemnify and hold harmless Party B from all claims, damages, and expenses.',
            'document_id': 'DOC003',
            'clause_type': 'liability',
            'metadata': {'section': '8.2', 'risk_level': 'high'}
        },
        {
            'clause_text': 'This agreement shall be governed by the laws of the State of California.',
            'document_id': 'DOC004',
            'clause_type': 'general',
            'metadata': {'section': '15.1', 'risk_level': 'low'}
        },
        {
            'clause_text': 'In the event of force majeure, neither party shall be liable for delays or failures.',
            'document_id': 'DOC004',
            'clause_type': 'force_majeure',
            'metadata': {'section': '13.1', 'risk_level': 'low'}
        }
    ]
    
    vector_store.add_clauses(sample_clauses)
    print(f"Seeded {len(sample_clauses)} sample clauses")


def create_sample_golden_set(filepath: str):
    """Create a sample golden set for testing"""
    golden_set = [
        {
            "question": "What are the liability terms in the contract?",
            "context": ["The Company shall have unlimited liability for any damages arising from gross negligence or willful misconduct.", "The service is provided as-is without any warranty, express or implied."],
            "ground_truth": "The company has unlimited liability for damages from gross negligence or willful misconduct, and the service is provided without warranty."
        },
        {
            "question": "How can I terminate the agreement?",
            "context": ["Either party may terminate this agreement with 30 days written notice."],
            "ground_truth": "Either party can terminate with 30 days written notice."
        },
        {
            "question": "What are the payment terms?",
            "context": ["Payment terms are Net 30 days from invoice date."],
            "ground_truth": "Payment is due within 30 days of invoice."
        },
        {
            "question": "What is the confidentiality requirement?",
            "context": ["All confidential information shall be kept secret for a period of 5 years."],
            "ground_truth": "Confidential information must be kept secret for 5 years."
        },
        {
            "question": "What happens in case of force majeure?",
            "context": ["In the event of force majeure, neither party shall be liable for delays or failures."],
            "ground_truth": "Neither party is liable for delays or failures due to force majeure events."
        }
    ]
    
    with open(filepath, 'w') as f:
        json.dump(golden_set, f, indent=2)
    
    print(f"Created sample golden set: {filepath}")


def main():
    """Main execution function"""
    # Configuration
    config = Config()
    
    if not config.openai_api_key:
        print("Error: OPENAI_API_KEY not set")
        sys.exit(1)
    
    # Initialize components
    print("Initializing pgvector store...")
    vector_store = PgVectorStore(config)
    
    # Seed sample data (comment out if DB already populated)
    print("Seeding sample data...")
    seed_sample_data(vector_store)
    
    # Initialize agent
    print("Initializing ReAct agent...")
    agent = LegalReActAgent(config, vector_store)
    
    # Example query
    print("\n" + "="*60)
    print("EXAMPLE AGENT EXECUTION")
    print("="*60)
    query = "Find liability clauses and assess their risk level"
    result = agent.run(query)
    print(f"\nResult: {result['output']}")
    
    # Create sample golden set
    golden_set_path = "golden_set.json"
    create_sample_golden_set(golden_set_path)
    
    # Run RAGAS evaluation
    print("\n" + "="*60)
    print("RAGAS EVALUATION")
    print("="*60)
    evaluator = RAGASEvaluator(config, agent)
    metrics = evaluator.evaluate(golden_set_path)
    
    # Assert metrics for CI
    success = evaluator.assert_metrics(metrics)
    
    # Cleanup
    vector_store.close()
    
    # Exit with appropriate code for CI
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
