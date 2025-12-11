# -*- coding: utf-8 -*-
"""
Script untuk memverifikasi konfigurasi Google OAuth
"""

import os
import sys
from dotenv import load_dotenv

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

def main():
    print("\n" + "="*60)
    print("VERIFIKASI KONFIGURASI GOOGLE OAUTH")
    print("="*60)
    
    # Load .env file
    env_path = ".env"
    if not os.path.exists(env_path):
        print(f"\nERROR: File {env_path} tidak ditemukan!")
        print("Buat file .env di folder backend dengan konfigurasi berikut:")
        print("\nGOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com")
        print("GOOGLE_CLIENT_SECRET=your-client-secret")
        print("GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback")
        print("GEMINI_API_KEY=your-gemini-api-key")
        return
    
    load_dotenv(env_path)
    
    print("\nMemeriksa environment variables...")
    print("-" * 60)
    
    # Check required variables
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/callback")
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    issues = []
    
    # Check GOOGLE_CLIENT_ID
    if client_id:
        print(f"[OK] GOOGLE_CLIENT_ID: {client_id[:20]}...{client_id[-10:]}")
    else:
        print("[ERROR] GOOGLE_CLIENT_ID: TIDAK DITEMUKAN")
        issues.append("GOOGLE_CLIENT_ID tidak ada")
    
    # Check GOOGLE_CLIENT_SECRET
    if client_secret:
        print(f"[OK] GOOGLE_CLIENT_SECRET: {client_secret[:10]}...")
    else:
        print("[ERROR] GOOGLE_CLIENT_SECRET: TIDAK DITEMUKAN")
        issues.append("GOOGLE_CLIENT_SECRET tidak ada")
    
    # Check GOOGLE_REDIRECT_URI
    expected_redirect = "http://localhost:3000/auth/callback"
    print(f"[INFO] GOOGLE_REDIRECT_URI: {redirect_uri}")
    if redirect_uri == expected_redirect:
        print(f"[OK] Redirect URI sesuai: {expected_redirect}")
    else:
        print(f"[WARNING] Redirect URI berbeda dari expected: {expected_redirect}")
        print(f"          Pastikan di Google Cloud Console menggunakan: {redirect_uri}")
    
    # Check GEMINI_API_KEY
    if gemini_key:
        print(f"[OK] GEMINI_API_KEY: {gemini_key[:10]}...")
    else:
        print("[ERROR] GEMINI_API_KEY: TIDAK DITEMUKAN")
        issues.append("GEMINI_API_KEY tidak ada")
    
    # Check frontend .env.local
    print("\n" + "-" * 60)
    print("Memeriksa frontend configuration...")
    print("-" * 60)
    
    frontend_env_paths = [
        "../.env.local",
        ".env.local"
    ]
    
    frontend_found = False
    for path in frontend_env_paths:
        if os.path.exists(path):
            load_dotenv(path, override=False)
            frontend_client_id = os.getenv("NEXT_PUBLIC_GOOGLE_CLIENT_ID")
            if frontend_client_id:
                print(f"[OK] Frontend .env.local ditemukan: {path}")
                print(f"[INFO] NEXT_PUBLIC_GOOGLE_CLIENT_ID: {frontend_client_id[:20]}...")
                
                if client_id and frontend_client_id == client_id:
                    print("[OK] Client ID SAMA di backend dan frontend")
                else:
                    print("[ERROR] Client ID BERBEDA di backend dan frontend!")
                    issues.append("Client ID tidak konsisten")
                
                frontend_found = True
                break
    
    if not frontend_found:
        print("[WARNING] Frontend .env.local tidak ditemukan")
        print("          Buat file .env.local di root project dengan:")
        print("          NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id")
        issues.append("Frontend .env.local tidak ditemukan")
    
    # Google Cloud Console checklist
    print("\n" + "="*60)
    print("CHECKLIST GOOGLE CLOUD CONSOLE")
    print("="*60)
    print("\n1. Buka: https://console.cloud.google.com/")
    print("2. Pilih project Anda")
    print("3. APIs & Services -> Credentials")
    print("4. Klik OAuth 2.0 Client ID Anda")
    print("\n5. Verifikasi konfigurasi:")
    print("   - Application type: Web application")
    print("   - Authorized JavaScript origins:")
    print("     * http://localhost:3000")
    print("   - Authorized redirect URIs:")
    print(f"     * {redirect_uri}")
    print("\n6. Pastikan API sudah enabled:")
    print("   - Google Drive API")
    print("   - Google Docs API")
    print("   - Google+ API atau People API")
    
    # Summary
    print("\n" + "="*60)
    print("RINGKASAN")
    print("="*60)
    
    if not issues:
        print("\n[OK] Semua konfigurasi terlihat baik!")
        print("\nJika masih error 'invalid_grant':")
        print("1. Restart backend server (Ctrl+C lalu python main.py)")
        print("2. Clear browser cache/cookies atau gunakan Incognito mode")
        print("3. Login ulang dari awal (jangan gunakan code lama)")
        print("4. Pastikan redirect URI di Google Console PERSIS sama")
    else:
        print("\n[ERROR] Ditemukan masalah:")
        for i, issue in enumerate(issues, 1):
            print(f"  {i}. {issue}")
        print("\nSilakan perbaiki masalah di atas.")
    
    print("\n" + "="*60)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
