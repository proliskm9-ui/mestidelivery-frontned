"""
Quick API test script
Run: python test_api.py
"""
import httpx
import asyncio

API_URL = "http://localhost:3001"

async def test_api():
    async with httpx.AsyncClient(timeout=10.0) as client:
        print("=" * 50)
        print("Testing Mestigo API")
        print("=" * 50)
        
        # Test root
        print("\n1. Testing root endpoint...")
        try:
            r = await client.get(f"{API_URL}/")
            print(f"   Status: {r.status_code}")
            print(f"   Response: {r.json()}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Test ping
        print("\n2. Testing /api/ping...")
        try:
            r = await client.get(f"{API_URL}/api/ping")
            print(f"   Status: {r.status_code}")
            print(f"   Response: {r.json()}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Test categories
        print("\n3. Testing /api/categories...")
        try:
            r = await client.get(f"{API_URL}/api/categories")
            print(f"   Status: {r.status_code}")
            data = r.json()
            print(f"   Found {len(data)} categories" if isinstance(data, list) else f"   Response: {data}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Test restaurants
        print("\n4. Testing /api/restaurants...")
        try:
            r = await client.get(f"{API_URL}/api/restaurants")
            print(f"   Status: {r.status_code}")
            data = r.json()
            print(f"   Found {len(data)} restaurants" if isinstance(data, list) else f"   Response: {data}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Test products
        print("\n5. Testing /api/products...")
        try:
            r = await client.get(f"{API_URL}/api/products?limit=5")
            print(f"   Status: {r.status_code}")
            data = r.json()
            print(f"   Found {len(data)} products" if isinstance(data, list) else f"   Response: {data}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Test stores
        print("\n6. Testing /api/stores...")
        try:
            r = await client.get(f"{API_URL}/api/stores")
            print(f"   Status: {r.status_code}")
            data = r.json()
            print(f"   Found {len(data)} stores" if isinstance(data, list) else f"   Response: {data}")
        except Exception as e:
            print(f"   Error: {e}")
        
        print("\n" + "=" * 50)
        print("API Test Complete!")
        print("=" * 50)

if __name__ == "__main__":
    asyncio.run(test_api())
