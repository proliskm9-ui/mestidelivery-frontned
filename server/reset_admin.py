import os
import bcrypt
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
    exit(1)

def get_hash(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def reset_password():
    print(f"Connecting to Supabase: {SUPABASE_URL}")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    username = "admin"
    password = "admin123"
    hashed = get_hash(password)
    
    print(f"Resetting password for user: {username}")
    print(f"New password: {password}")
    print(f"New hash: {hashed}")
    
    # Check if user exists
    try:
        res = supabase.table("admin_users").select("*").eq("username", username).execute()
        
        if not res.data:
            print(f"User {username} not found. Creating...")
            data = {
                "username": username,
                "password_hash": hashed,
                "role": "super_admin"
            }
            res = supabase.table("admin_users").insert(data).execute()
        else:
            print(f"User found. Updating...")
            res = supabase.table("admin_users").update({"password_hash": hashed}).eq("username", username).execute()
            
        print("SUCCESS! Password reset successfully.")
        print(f"Login with: {username} / {password}")
        
    except Exception as e:
        print(f"ERROR: {e}")
        print("Failed to update database. Check your API Key permissions (Row Level Security).")
        print("Try running this script on the server itself if using Service Role key.")

if __name__ == "__main__":
    reset_password()
