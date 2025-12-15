"""
Pytest configuration and fixtures for DORA backend tests
This file handles test setup, mocking, and cleanup
"""

import pytest
import os
import sys
from unittest.mock import Mock, MagicMock, patch
import asyncio

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Set test environment variables BEFORE importing main
os.environ['GROQ_API_KEY'] = 'test_groq_key_for_ci'
os.environ['GOOGLE_CLIENT_ID'] = 'test_client_id'
os.environ['GOOGLE_CLIENT_SECRET'] = 'test_client_secret'
os.environ['GOOGLE_REDIRECT_URI'] = 'http://localhost:3000/auth/callback'
os.environ['ENVIRONMENT'] = 'test'
os.environ['LOG_LEVEL'] = 'WARNING'


@pytest.fixture(scope="session", autouse=True)
def mock_chromadb():
    """Mock ChromaDB to prevent initialization errors during tests"""
    with patch('chromadb.PersistentClient') as mock_client:
        # Create a mock collection
        mock_collection = MagicMock()
        mock_collection.count.return_value = 0
        mock_collection.get.return_value = {'ids': [], 'documents': [], 'metadatas': []}
        mock_collection.query.return_value = {'documents': [[]], 'metadatas': [[]], 'distances': [[]]}
        
        # Mock client methods
        mock_client_instance = MagicMock()
        mock_client_instance.get_collection.return_value = mock_collection
        mock_client_instance.create_collection.return_value = mock_collection
        mock_client_instance.list_collections.return_value = []
        
        mock_client.return_value = mock_client_instance
        
        yield mock_client


@pytest.fixture(scope="session", autouse=True)
def mock_sentence_transformer():
    """Mock SentenceTransformer to prevent model download during tests"""
    with patch('sentence_transformers.SentenceTransformer') as mock_st:
        mock_model = MagicMock()
        mock_model.encode.return_value = [[0.1] * 384]  # Mock embedding vector
        mock_st.return_value = mock_model
        yield mock_st


@pytest.fixture(scope="session", autouse=True)
def mock_groq_client():
    """Mock Groq client to prevent API calls during tests"""
    with patch('groq.Groq') as mock_groq:
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Test response from DORA"
        mock_client.chat.completions.create.return_value = mock_response
        mock_groq.return_value = mock_client
        yield mock_groq


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_client():
    """Create FastAPI test client with all mocks in place"""
    from fastapi.testclient import TestClient
    from main import app
    
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_mocks(mock_chromadb, mock_sentence_transformer, mock_groq_client):
    """Reset all mocks before each test"""
    mock_chromadb.reset_mock()
    mock_sentence_transformer.reset_mock()
    mock_groq_client.reset_mock()
    yield
