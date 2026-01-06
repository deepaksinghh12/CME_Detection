
import requests
import time

def test_endpoint(url, timeout=10):
    print(f"Testing {url}...")
    start = time.time()
    try:
        response = requests.get(url, timeout=timeout)
        elapsed = time.time() - start
        print(f"Status: {response.status_code}, Time: {elapsed:.2f}s")
        if response.status_code == 200:
            print(f"Response (first 100 chars): {response.text[:100]}")
        else:
            print(f"Error Response: {response.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_endpoint("http://localhost:8002/health")
    test_endpoint("http://localhost:8002/api/data/summary", timeout=30)
