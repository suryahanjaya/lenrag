"""
Performance Testing and Optimization Tools
Load testing, profiling, and performance monitoring
"""

from locust import HttpUser, task, between
import time


class DORAUser(HttpUser):
    """Simulated user for load testing"""
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    
    def on_start(self):
        """Called when a user starts"""
        self.client.verify = False  # Disable SSL verification for local testing
    
    @task(3)
    def health_check(self):
        """Test health check endpoint (most common)"""
        self.client.get("/health")
    
    @task(2)
    def detailed_health_check(self):
        """Test detailed health check"""
        self.client.get("/health/detailed")
    
    @task(1)
    def liveness_check(self):
        """Test liveness probe"""
        self.client.get("/health/live")
    
    @task(1)
    def readiness_check(self):
        """Test readiness probe"""
        self.client.get("/health/ready")
    
    @task(1)
    def root_endpoint(self):
        """Test root endpoint"""
        self.client.get("/")


class AuthenticationUser(HttpUser):
    """Simulated user testing authentication"""
    
    wait_time = between(2, 5)
    
    @task
    def test_auth_rate_limit(self):
        """Test authentication with rate limiting"""
        response = self.client.post("/auth/google", json={
            "code": "test_code_" + str(time.time())
        })
        # Expected to fail with 400 or 429 (rate limit)


# Run with:
# locust -f backend/tests/performance/load_test.py --host=http://localhost:8000
