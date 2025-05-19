from flask import Flask, request, jsonify, send_from_directory, render_template_string, redirect, url_for, session
from chatbot import run_chatbot_response
import sqlite3
import os
import logging
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import time

app = Flask(__name__, static_folder='./')
app.secret_key = os.environ.get("SESSION_SECRET", "super-secret-key")  # Use environment variable in production

# Configure upload folder for profile pictures
UPLOAD_FOLDER = 'profile_uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]')

def allowed_file(filename):
    if not filename:
        return False
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def get_db_connection():
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with users table if it doesn't exist"""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        profile_pic TEXT
    )
    ''')
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

@app.route('/')
def home():
    """Serve the homepage with user session injected"""
    try:
        with open("enomy.html", encoding="utf-8") as f:
            html = f.read()
        
        # Inject user session data
        html = html.replace('{{ session.get("user", "") }}', session.get('user', ''))
        html = html.replace('{{ session.get("profilePic", "") }}', session.get('profilePic', ''))
        
        # No need to modify image paths since they're already correct in your structure
        
        return render_template_string(html)
    except Exception as e:
        logging.error(f"Error serving homepage: {str(e)}")
        return f"Error loading homepage: {str(e)}", 500

@app.route('/navbar')
def navbar():
    try:
        with open("navbar.html", encoding="utf-8") as f:
            html = f.read()
        
        # Inject user session data
        html = html.replace('{{ session.get("user", "") }}', session.get('user', ''))
        html = html.replace('{{ session.get("profilePic", "") }}', session.get('profilePic', ''))
        
        return render_template_string(html)
    except Exception as e:
        logging.error(f"Error serving navbar: {str(e)}")
        return "Error loading navbar", 500

# Chatbot ask route
@app.route("/ask", methods=["POST"])
def ask_bot():
    data = request.get_json()
    question = data.get("question", "")
    answer = run_chatbot_response(question)
    return jsonify({"answer": answer})

# Serve uploaded profile pictures
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Upload profile picture route
@app.route('/upload-profile-pic', methods=['POST'])
@login_required
def upload_profile_pic():
    if 'profile-pic' not in request.files:
        return jsonify({'success': False, 'message': 'No file part'})

    file = request.files['profile-pic']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No selected file'})

    if file and allowed_file(file.filename):
        username = session.get('user')
        if not username:
            return jsonify({'success': False, 'message': 'User not logged in'})

        extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = secure_filename(f"{username}_{int(time.time())}.{extension}")
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)

        # Save filename in database
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("UPDATE users SET profile_pic = ? WHERE username = ?", (unique_filename, username))
        conn.commit()
        conn.close()

        session['profilePic'] = unique_filename

        # Return success response with URL to the uploaded file
        return jsonify({
            'success': True,
            'imageUrl': url_for('uploaded_file', filename=unique_filename)
        })

    return jsonify({'success': False, 'message': 'Invalid file'})

# Get current user data
@app.route("/user-data")
@login_required
def user_data():
    username = session.get('user')
    profile_pic = session.get('profilePic')
    
    return jsonify({
        'username': username,
        'profilePic': url_for('uploaded_file', filename=profile_pic) if profile_pic else None
    })

# Signup page and form handling
@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        hashed_password = generate_password_hash(password)

        try:
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                      (username, email, hashed_password))
            conn.commit()
            conn.close()
            
            # Set session variables after successful signup
            session['user'] = username
            session['profilePic'] = None
            
            # Show success message
            with open("signed_successfully.html", encoding="utf-8") as f:
                html = f.read()
            return render_template_string(html)
        except sqlite3.IntegrityError as e:
            if conn:
                conn.close()
            error_message = "Email or username already registered."
            with open("signup.html", encoding="utf-8") as f:
                html = f.read()
                html = html.replace('<body>', f'<body>\n<div style="color: red; text-align: center; margin-top: 20px;">{error_message}</div>')
            return render_template_string(html)
    
    try:
        with open("signup.html", encoding="utf-8") as f:
            html = f.read()
            # No need to modify paths since they're already correct
            return render_template_string(html)
    except Exception as e:
        logging.error(f"Error serving signup page: {str(e)}")
        return f"Error loading signup page: {str(e)}", 500

# Login page and form handling
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form['email']
        password = request.form['password']

        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = c.fetchone()
        conn.close()

        if user and check_password_hash(user['password'], password):
            # Set session variables after successful login
            session['user'] = user['username']
            session['profilePic'] = user['profile_pic']
            
            # Show success message
            with open("logged_successfully.html", encoding="utf-8") as f:
                html = f.read()
            return render_template_string(html)
        else:
            error_message = "Invalid email or password."
            with open("login.html", encoding="utf-8") as f:
                html = f.read()
                html = html.replace('<body>', f'<body>\n<div style="color: red; text-align: center; margin-top: 20px;">{error_message}</div>')
            return render_template_string(html)
    
    try:
        with open("login.html", encoding="utf-8") as f:
            html = f.read()
            # No need to modify paths since they're already correct
            return render_template_string(html)
    except Exception as e:
        logging.error(f"Error serving login page: {str(e)}")
        return f"Error loading login page: {str(e)}", 500

# Logout route
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for('home'))

# Currency Conversion Page
@app.route("/currency-conversion")
def currency_conversion():
    try:
        with open("CurrencyConversion.html", encoding="utf-8") as f:
            html = f.read()
        
        # Inject user session data
        html = html.replace('{{ session.get("user", "") }}', session.get('user', ''))
        html = html.replace('{{ session.get("profilePic", "") }}', session.get('profilePic', ''))
        
        return render_template_string(html)
    except Exception as e:
        logging.error(f"Error serving currency conversion page: {str(e)}")
        return f"Error loading currency conversion page: {str(e)}", 500

# Basic Savings Calculator Page
@app.route("/basic-savings")
@login_required
def basic_savings():
    try:
        with open("savings_calculator.html", encoding="utf-8") as f:
            html = f.read()
        
        # Inject user session data
        html = html.replace('{{ session.get("user", "") }}', session.get('user', ''))
        html = html.replace('{{ session.get("profilePic", "") }}', session.get('profilePic', ''))
        
        return render_template_string(html)
    except Exception as e:
        logging.error(f"Error serving basic savings page: {str(e)}")
        return f"Error loading basic savings page: {str(e)}", 500

# Advanced Savings Calculator Page
@app.route("/savings-plus")
@login_required
def savings_plus():
    try:
        with open("savings.html", encoding="utf-8") as f:
            html = f.read()
        
        # Inject user session data
        html = html.replace('{{ session.get("user", "") }}', session.get('user', ''))
        html = html.replace('{{ session.get("profilePic", "") }}', session.get('profilePic', ''))
        
        return render_template_string(html)
    except Exception as e:
        logging.error(f"Error serving savings plus page: {str(e)}")
        return f"Error loading savings plus page: {str(e)}", 500

# Managed Stocks Page
@app.route("/managed-stocks")
@login_required
def managed_stocks():
    # For now, redirect to homepage if this page doesn't exist
    return redirect(url_for('home'))

# User Profile Page
@app.route("/profile")
@login_required
def profile():
    # For now, redirect to homepage if this page doesn't exist
    return redirect(url_for('home'))

# --- Serve static files like images, CSS, JS, etc. ---
@app.route('/static/<path:filename>')
def serve_static_files(filename):
    return send_from_directory('./', filename)

# Custom error handlers
@app.errorhandler(404)
def page_not_found(e):
    try:
        with open("error.log", encoding="utf-8") as f:
            html = f.read()
        html = html.replace("{{ error }}", "404 - Page not found")
        return render_template_string(html), 404
    except:
        return "404 - Page not found", 404

@app.errorhandler(500)
def internal_server_error(e):
    logging.error("500 error: %s", str(e))
    try:
        with open("error.log", encoding="utf-8") as f:
            html = f.read()
        html = html.replace("{{ error }}", "500 - Internal server error. Please try again later.")
        return render_template_string(html), 500
    except:
        return "500 - Internal server error. Please try again later.", 500

if __name__ == "__main__":
    app.run(debug=True, host='127.0.0.1', port=8080)