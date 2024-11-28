import secrets 
import os 


jwt_secret = secrets.token_hex(32)

jwt_secret = os.environ.get('JWT_SECRET')

print(jwt_secret)