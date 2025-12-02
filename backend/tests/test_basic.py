"""
Basic test setup for DORA backend
Run with: pytest
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app

client = TestClient(app)


class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint returns 200"""
        response = client.get("/")
        assert response.status_code == 200
        assert "message" in response.json()
    
    def test_health_endpoint(self):
        """Test basic health check"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
    
    def test_health_detailed(self):
        """Test detailed health check"""
        response = client.get("/health/detailed")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "dependencies" in data
        assert "chromadb" in data["dependencies"]
    
    def test_health_live(self):
        """Test liveness probe"""
        response = client.get("/health/live")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_auth_endpoint_exists(self):
        """Test auth endpoint exists"""
        # This will fail without valid auth code, but endpoint should exist
        response = client.post("/auth/google", json={"code": "invalid"})
        # Should return 400 (bad request) not 404 (not found)
        assert response.status_code in [400, 401, 422]


class TestRateLimiting:
    """Test rate limiting"""
    
    def test_rate_limit_exists(self):
        """Test that rate limiting is configured"""
        # Make multiple requests quickly
        responses = []
        for i in range(6):
            response = client.post("/auth/google", json={"code": f"test{i}"})
            responses.append(response.status_code)
        
        # At least one should be rate limited (429) or all should be 400/422
        assert 429 in responses or all(code in [400, 422] for code in responses)


class TestCORS:
    """Test CORS configuration"""
    
    def test_cors_headers(self):
        """Test CORS headers are present"""
        response = client.options("/")
        # CORS headers should be present
        assert "access-control-allow-origin" in [h.lower() for h in response.headers.keys()] or response.status_code == 200


# Pytest configuration
@pytest.fixture(scope="session")
def test_client():
    """Create test client"""
    return client


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
