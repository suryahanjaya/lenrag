"""
Script to list all available Gemini models
"""
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

# Configure API
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("ERROR: GEMINI_API_KEY not found in .env")
    exit(1)

genai.configure(api_key=api_key)

print("=" * 80)
print("AVAILABLE GEMINI MODELS")
print("=" * 80)

try:
    models = genai.list_models()
    
    print("\nModels that support generateContent:")
    print("-" * 80)
    
    for model in models:
        # Check if model supports generateContent
        if 'generateContent' in model.supported_generation_methods:
            print(f"\n✅ {model.name}")
            print(f"   Display Name: {model.display_name}")
            print(f"   Description: {model.description[:100]}..." if len(model.description) > 100 else f"   Description: {model.description}")
            print(f"   Supported Methods: {', '.join(model.supported_generation_methods)}")
    
    print("\n" + "=" * 80)
    print("RECOMMENDED MODELS FOR YOUR APP:")
    print("=" * 80)
    print("\n1. models/gemini-1.5-pro (Best quality, lower quota)")
    print("2. models/gemini-1.5-flash (Fast, high quota)")
    print("3. models/gemini-pro (Stable, good balance)")
    
except Exception as e:
    print(f"\nERROR: {e}")
    print("\nTrying alternative method...")
    
    # Try specific models
    test_models = [
        'gemini-pro',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
    ]
    
    print("\nTesting specific models:")
    for model_name in test_models:
        try:
            model = genai.GenerativeModel(model_name)
            print(f"✅ {model_name} - AVAILABLE")
        except Exception as e:
            print(f"❌ {model_name} - NOT AVAILABLE: {str(e)[:50]}")
