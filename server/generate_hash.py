import bcrypt
import sys

def generate_hash(password):
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    return hashed

if __name__ == "__main__":
    password = "admin123"
    if len(sys.argv) > 1:
        password = sys.argv[1]
    
    print(f"Generating hash for password: '{password}'")
    hashed = generate_hash(password)
    print(f"Hash: {hashed}")
    print("\nSQL Command to update/insert admin user:")
    print("-" * 50)
    print(f"INSERT INTO admin_users (username, password_hash, role) VALUES ('admin', '{hashed}', 'super_admin')")
    print(f"ON CONFLICT (username) DO UPDATE SET password_hash = '{hashed}';")
    print("-" * 50)
