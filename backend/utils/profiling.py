"""
Performance Profiling Tools
Profile code to find bottlenecks
"""

import cProfile
import pstats
import io
from functools import wraps
import time
import logging

logger = logging.getLogger(__name__)


def profile_function(func):
    """Decorator to profile a function"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()
        
        result = func(*args, **kwargs)
        
        profiler.disable()
        
        # Print stats
        s = io.StringIO()
        ps = pstats.Stats(profiler, stream=s).sort_stats('cumulative')
        ps.print_stats(20)  # Top 20 functions
        
        logger.info(f"\n{'='*60}\nProfile for {func.__name__}:\n{s.getvalue()}\n{'='*60}")
        
        return result
    return wrapper


def time_function(func):
    """Decorator to time a function"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        duration = time.time() - start
        
        logger.info(f"⏱️  {func.__name__} took {duration:.3f}s")
        
        return result
    return wrapper


class PerformanceMonitor:
    """Monitor performance metrics"""
    
    def __init__(self):
        self.metrics = {}
    
    def record(self, name: str, duration: float):
        """Record a performance metric"""
        if name not in self.metrics:
            self.metrics[name] = []
        self.metrics[name].append(duration)
    
    def get_stats(self, name: str):
        """Get statistics for a metric"""
        if name not in self.metrics:
            return None
        
        values = self.metrics[name]
        return {
            'count': len(values),
            'min': min(values),
            'max': max(values),
            'avg': sum(values) / len(values),
            'total': sum(values)
        }
    
    def print_report(self):
        """Print performance report"""
        print("\n" + "="*60)
        print("📊 Performance Report")
        print("="*60)
        
        for name in sorted(self.metrics.keys()):
            stats = self.get_stats(name)
            print(f"\n{name}:")
            print(f"  Count: {stats['count']}")
            print(f"  Min:   {stats['min']:.3f}s")
            print(f"  Max:   {stats['max']:.3f}s")
            print(f"  Avg:   {stats['avg']:.3f}s")
            print(f"  Total: {stats['total']:.3f}s")
        
        print("="*60)


# Global performance monitor
perf_monitor = PerformanceMonitor()


# Usage example:
# @profile_function
# def my_slow_function():
#     # ... code ...
#     pass
#
# @time_function
# def my_function():
#     # ... code ...
#     pass
