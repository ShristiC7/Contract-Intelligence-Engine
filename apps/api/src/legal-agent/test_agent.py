"""
Unit tests for the legal agent system
"""

import unittest
import json
import os
import tempfile
from unittest.mock import Mock, patch
from legal_agent import Config, PgVectorStore, LegalTools, RAGASEvaluator, LegalReActAgent


class TestLegalTools(unittest.TestCase):
    
    def setUp(self):
        self.config = Config()
        # Mock the vector store for unit tests
        self.vector_store = Mock(spec=PgVectorStore)
        self.tools = LegalTools(self.vector_store)
    
    def test_extract_clauses(self):
        """Test clause extraction functionality"""
        doc = '''
        This agreement is entered into on January 1, 2024.
        
        LIABILITY CLAUSE: The Company shall have unlimited liability for damages.
        
        PAYMENT CLAUSE: Payment is due within 30 days.
        
        TERMINATION CLAUSE: Either party may terminate with 30 days notice.
        '''
        result = self.tools.extract_clauses(doc)
        data = json.loads(result)
        
        self.assertGreater(data['num_clauses'], 0)
        self.assertIn('clauses', data)
        self.assertIn('total_length', data)
        
        # Check that clauses are properly classified
        clause_types = [clause['type'] for clause in data['clauses']]
        self.assertIn('liability', clause_types)
        self.assertIn('financial', clause_types)
        self.assertIn('termination', clause_types)
    
    def test_score_risk_high(self):
        """Test high risk clause scoring"""
        clause = "The Company accepts unlimited liability and waives all rights to indemnification."
        result = self.tools.score_risk(clause)
        data = json.loads(result)
        
        self.assertEqual(data['risk_level'], 'HIGH')
        self.assertGreater(data['risk_score'], 7)
        self.assertGreater(data['high_risk_indicators'], 0)
    
    def test_score_risk_medium(self):
        """Test medium risk clause scoring"""
        clause = "The service may be terminated at our discretion without notice."
        result = self.tools.score_risk(clause)
        data = json.loads(result)
        
        self.assertIn(data['risk_level'], ['MEDIUM', 'HIGH'])
        self.assertGreater(data['risk_score'], 3)
    
    def test_score_risk_low(self):
        """Test low risk clause scoring"""
        clause = "Both parties agree to work in good faith with reasonable efforts."
        result = self.tools.score_risk(clause)
        data = json.loads(result)
        
        self.assertEqual(data['risk_level'], 'LOW')
        self.assertLess(data['risk_score'], 5)
    
    def test_classify_clause(self):
        """Test clause classification"""
        # Test liability clause
        liability_clause = "The company shall not be liable for any damages."
        self.assertEqual(self.tools._classify_clause(liability_clause), 'liability')
        
        # Test financial clause
        financial_clause = "Payment of $1000 is due within 30 days."
        self.assertEqual(self.tools._classify_clause(financial_clause), 'financial')
        
        # Test termination clause
        termination_clause = "This agreement may be terminated by either party."
        self.assertEqual(self.tools._classify_clause(termination_clause), 'termination')
        
        # Test confidentiality clause
        confidentiality_clause = "All information shall remain confidential."
        self.assertEqual(self.tools._classify_clause(confidentiality_clause), 'confidentiality')
    
    def test_search_legal_db(self):
        """Test legal database search"""
        # Mock the vector store search results
        mock_results = [
            {
                'id': 1,
                'clause_text': 'Test liability clause for unit testing',
                'document_id': 'TEST001',
                'clause_type': 'liability',
                'metadata': {'test': True},
                'similarity': 0.95
            }
        ]
        self.vector_store.similarity_search.return_value = mock_results
        
        result = self.tools.search_legal_db('liability')
        data = json.loads(result)
        
        self.assertEqual(data['query'], 'liability')
        self.assertEqual(data['num_results'], 1)
        self.assertIn('results', data)
        self.assertIn('liability', data['results'][0]['clause'].lower())


class TestPgVectorStore(unittest.TestCase):
    
    def setUp(self):
        self.config = Config()
        # Skip tests if no database connection available
        try:
            self.store = PgVectorStore(self.config)
        except Exception:
            self.skipTest("Database connection not available")
    
    def test_add_and_search(self):
        """Test adding clauses and searching"""
        clauses = [
            {
                'clause_text': 'Test liability clause for unit testing',
                'document_id': 'TEST001',
                'clause_type': 'liability',
                'metadata': {'test': True}
            }
        ]
        
        # Mock the embeddings to avoid API calls
        with patch.object(self.store.embeddings, 'embed_documents') as mock_embed:
            mock_embed.return_value = [[0.1] * 1536]  # Mock embedding
            self.store.add_clauses(clauses)
        
        # Mock the search to avoid API calls
        with patch.object(self.store.embeddings, 'embed_query') as mock_query:
            mock_query.return_value = [0.1] * 1536  # Mock query embedding
            results = self.store.similarity_search('liability', k=1)
        
        # Since we're mocking, we can't test actual results
        # But we can test that the methods were called correctly
        self.assertIsNotNone(results)
    
    def tearDown(self):
        if hasattr(self, 'store'):
            self.store.close()


class TestRAGASEvaluator(unittest.TestCase):
    
    def setUp(self):
        self.config = Config()
        self.agent = Mock(spec=LegalReActAgent)
        self.evaluator = RAGASEvaluator(self.config, self.agent)
    
    def test_load_golden_set(self):
        """Test loading golden set from JSON"""
        # Create temporary file with test data
        test_data = [
            {
                "question": "What is the liability clause?",
                "context": ["Test context"],
                "ground_truth": "Test answer"
            }
        ]
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(test_data, f)
            temp_file = f.name
        
        try:
            loaded_data = self.evaluator.load_golden_set(temp_file)
            self.assertEqual(len(loaded_data), 1)
            self.assertEqual(loaded_data[0]['question'], "What is the liability clause?")
        finally:
            os.unlink(temp_file)
    
    def test_assert_metrics_pass(self):
        """Test metrics assertion with passing scores"""
        metrics = {
            'faithfulness': 0.9,
            'answer_relevancy': 0.85,
            'num_samples': 10
        }
        
        result = self.evaluator.assert_metrics(metrics)
        self.assertTrue(result)
    
    def test_assert_metrics_fail(self):
        """Test metrics assertion with failing scores"""
        metrics = {
            'faithfulness': 0.7,  # Below threshold
            'answer_relevancy': 0.85,
            'num_samples': 10
        }
        
        result = self.evaluator.assert_metrics(metrics)
        self.assertFalse(result)


class TestConfig(unittest.TestCase):
    
    def test_config_defaults(self):
        """Test configuration defaults"""
        config = Config()
        
        self.assertEqual(config.embedding_model, "text-embedding-3-small")
        self.assertEqual(config.llm_model, "gpt-4")
        self.assertEqual(config.faithfulness_threshold, 0.85)
        self.assertEqual(config.pg_host, "localhost")
        self.assertEqual(config.pg_port, 5432)
    
    def test_config_from_env(self):
        """Test configuration from environment variables"""
        with patch.dict(os.environ, {
            'OPENAI_API_KEY': 'test-key',
            'PG_HOST': 'test-host',
            'PG_PORT': '5433',
            'FAITHFULNESS_THRESHOLD': '0.9'
        }):
            config = Config()
            
            self.assertEqual(config.openai_api_key, 'test-key')
            self.assertEqual(config.pg_host, 'test-host')
            self.assertEqual(config.pg_port, 5433)
            self.assertEqual(config.faithfulness_threshold, 0.9)


class TestIntegration(unittest.TestCase):
    """Integration tests that require full system setup"""
    
    def setUp(self):
        self.config = Config()
        if not self.config.openai_api_key:
            self.skipTest("OpenAI API key not available")
    
    @unittest.skip("Requires full system setup")
    def test_full_agent_workflow(self):
        """Test complete agent workflow"""
        # This test would require a full setup with database and API keys
        # Skip in unit test environment
        pass


if __name__ == '__main__':
    # Create test suite
    test_suite = unittest.TestSuite()
    
    # Add test cases
    test_suite.addTest(unittest.makeSuite(TestLegalTools))
    test_suite.addTest(unittest.makeSuite(TestConfig))
    test_suite.addTest(unittest.makeSuite(TestRAGASEvaluator))
    
    # Add PgVectorStore tests only if database is available
    try:
        config = Config()
        store = PgVectorStore(config)
        store.close()
        test_suite.addTest(unittest.makeSuite(TestPgVectorStore))
    except Exception:
        print("Skipping PgVectorStore tests - database not available")
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Exit with appropriate code
    sys.exit(0 if result.wasSuccessful() else 1)
