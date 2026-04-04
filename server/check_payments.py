
import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the current directory to sys.path to import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import CRYPTOBOT_TOKEN, BOT_TOKEN, TRIBUTE_PROVIDER_TOKEN, CURRENCY_CODE
from services.payment import create_payment

async def main():
    print("=" * 50)
    print("Payment Integration Health Check")
    print("=" * 50)
    
    # 1. Check Configuration
    print(f"\n1. Checking Environment Variables (from .env):")
    print(f"   - CRYPTOBOT_TOKEN: {'✅ Set' if CRYPTOBOT_TOKEN else '❌ Missing (using fallback)'}")
    print(f"   - BOT_TOKEN: {'✅ Set' if BOT_TOKEN else '❌ Missing (using fallback)'}")
    print(f"   - TRIBUTE_PROVIDER_TOKEN: {'✅ Set' if TRIBUTE_PROVIDER_TOKEN else '❌ Missing (using fallback)'}")
    print(f"   - CURRENCY_CODE: {CURRENCY_CODE}")
    
    # 2. Test CryptoBot logic
    print(f"\n2. Testing CryptoBot Integration:")
    try:
        res = await create_payment(12345, 10.50, "crypto")
        print(f"   - Result: {res}")
        if res and "payment_url" in res:
            url = res["payment_url"]
            if "t.me/CryptoBot?start=" in url:
                print(f"   - Status: ⚠️ Using FALLBACK link (no real invoice created)")
            else:
                print(f"   - Status: ✅ Real API URL generated")
    except Exception as e:
        print(f"   - Error: {e}")
        
    # 3. Test Tribute logic
    print(f"\n3. Testing Tribute (Card) Integration:")
    try:
        res = await create_payment(12345, 10.50, "card")
        print(f"   - Result: {res}")
        if res and "payment_url" in res:
            url = res["payment_url"]
            if "t.me/tribute?startapp=" in url:
                print(f"   - Status: ⚠️ Using FALLBACK link (no real invoice created)")
            else:
                print(f"   - Status: ✅ Real API URL generated")
    except Exception as e:
        print(f"   - Error: {e}")

    print("\n" + "=" * 50)

if __name__ == "__main__":
    asyncio.run(main())
