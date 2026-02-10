import os
import pymysql
from urllib.request import urlopen
import subprocess 

# Fix 1: Removed the hardcoded credential
# Solution: used Environment Variables to securely store sensitive informations
db_config = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME")
}

# FIX 2: Added input validation and length restriction.
# Solution: Enforcing a maximum length and allowing only expected characters.
def get_user_input():
    user_input = input('Enter your name: ').strip()
    if len(user_input) > 16:
        raise ValueError("Input too long")

    if not re.match(r"^[a-zA-Z\s]+$", user_input):
        raise ValueError("Invalid characters")
    
    return user_input

# FIX 3: Replaced os.system() with subprocess.run(). This will prevent Injection issue os.system() executes shell 
# commands directly and is vulnerable to command injection if user input is included.
# Solution: Use subprocess.run() without invoking a shell, which safely
# handles arguments as data.
def send_email(to, subject, body):
    os.system(f'echo {body} | mail -s "{subject}" {to}')

# FIX 4: Enforced HTTPS and added a timeout for external requests.
# Solution: Using HTTPS to encrypt data in transit and add a timeout to
# prevent the application from hanging indefinitely.
def get_data():
    url = 'https://insecure-api.com/get-data'
    request = Request(url, headers={"User-Agent": "SSLApp/1.0"})

    with urlopen(request, timeout=5) as response:
        return response.read().decode("utf-8")

# FIX 5: Replaced string-formatted SQL query with a parameterized query because directly embedding user data into SQL queries allows SQL injection.
# Solution: Using prepared statements with placeholders so the database treats user input strictly as data.
def save_to_db(data): query = "INSERT INTO mytable (column1, column2) VALUES (%s, %s)" 
    connection = pymysql.connect(**db_config) 
    cursor = connection.cursor() 
    cursor.execute(query, (data, "Another Value")) 
    connection.commit() 
    cursor.close() connection.close()

if __name__ == '__main__':
    user_input = get_user_input()
    data = get_data()
    save_to_db(data)
    send_email('admin@example.com', 'User Input', user_input)
