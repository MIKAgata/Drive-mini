"""
Flask Backend untuk Drive System
File Management System dengan Autentikasi dan Admin Panel
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import os
from functools import wraps

# ================================
# FLASK APP CONFIGURATION
# ================================

app = Flask(__name__)

# CORS Configuration
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost/drive'    
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# JWT Configuration
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-this-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# File Upload Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'jpg', 'jpeg', 'png', 'gif'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# ================================
# DATABASE MODELS
# ================================

class User(db.Model):
    """Model untuk tabel users"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')  # 'user' or 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship dengan File
    files = db.relationship('File', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert user object to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class File(db.Model):
    """Model untuk tabel files"""
    __tablename__ = 'files'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    filepath = db.Column(db.String(500), nullable=False)
    size = db.Column(db.Integer)  # Size in bytes
    mimetype = db.Column(db.String(100))
    status = db.Column(db.String(20), default='pending')  # 'pending', 'accepted', 'rejected'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self, include_user=False):
        """Convert file object to dictionary"""
        data = {
            '_id': str(self.id),
            'id': self.id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'size': self.size,
            'mimetype': self.mimetype,
            'status': self.status,
            'userId': self.user_id,
            'uploadedAt': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'createdAt': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_user and self.user:
            data['username'] = self.user.username
            data['email'] = self.user.email
            data['userId'] = {
                'username': self.user.username,
                'email': self.user.email
            }
        
        return data

# ================================
# HELPER FUNCTIONS
# ================================

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def admin_required(fn):
    """Decorator untuk memastikan user adalah admin"""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'message': 'Akses ditolak! Hanya admin yang bisa mengakses.'}), 403
        
        return fn(*args, **kwargs)
    
    return wrapper

# ================================
# AUTH ROUTES
# ================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register user baru"""
    try:
        data = request.get_json()
        
        # Validasi input
        if not data or not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Username, email, dan password harus diisi!'}), 400
        
        username = data['username'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        
        # Validasi panjang
        if len(username) < 3:
            return jsonify({'message': 'Username minimal 3 karakter!'}), 400
        
        if len(password) < 6:
            return jsonify({'message': 'Password minimal 6 karakter!'}), 400
        
        # Cek apakah username atau email sudah ada
        if User.query.filter_by(username=username).first():
            return jsonify({'message': 'Username sudah terdaftar!'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'message': 'Email sudah terdaftar!'}), 400
        
        # Hash password
        hashed_password = generate_password_hash(password)
        
        # Buat user baru
        new_user = User(
            username=username,
            email=email,
            password=hashed_password,
            role='user'
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'Registrasi berhasil!',
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Register error: {e}")
        return jsonify({'message': f'Terjadi kesalahan: {str(e)}'}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        # Validasi input
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email dan password harus diisi!'}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        # Cari user berdasarkan email
        user = User.query.filter_by(email=email).first()
        
        if not user or not check_password_hash(user.password, password):
            return jsonify({'message': 'Email atau password salah!'}), 401
        
        # Generate JWT token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'Login berhasil!',
            'token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'message': f'Terjadi kesalahan: {str(e)}'}), 500

# ================================
# FILE ROUTES (USER)
# ================================

@app.route('/api/files/upload', methods=['POST'])
@jwt_required()
def upload_file():
    """Upload file baru"""
    try:
        current_user_id = get_jwt_identity()
        
        # Cek apakah ada file
        if 'file' not in request.files:
            return jsonify({'message': 'Tidak ada file yang diupload!'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'message': 'Tidak ada file yang dipilih!'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'message': 'Tipe file tidak diizinkan!'}), 400
        
        # Secure filename dan simpan
        original_filename = file.filename
        filename = secure_filename(file.filename)
        
        # Tambahkan timestamp untuk menghindari duplikasi
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        name, ext = os.path.splitext(filename)
        filename = f"{name}_{timestamp}{ext}"
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Get file size
        file_size = os.path.getsize(filepath)
        
        # Simpan info file ke database
        new_file = File(
            filename=filename,
            original_filename=original_filename,
            filepath=filepath,
            size=file_size,
            mimetype=file.content_type,
            status='pending',
            user_id=current_user_id
        )
        
        db.session.add(new_file)
        db.session.commit()
        
        return jsonify({
            'message': 'File berhasil diupload!',
            'file': new_file.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Upload error: {e}")
        return jsonify({'message': f'Terjadi kesalahan: {str(e)}'}), 500


@app.route('/api/files/my-files', methods=['GET'])
@jwt_required()
def get_my_files():
    """Get semua file milik user yang sedang login"""
    try:
        current_user_id = get_jwt_identity()
        
        # Ambil semua file user
        files = File.query.filter_by(user_id=current_user_id).order_by(File.uploaded_at.desc()).all()
        
        return jsonify({
            'message': 'Berhasil mengambil file',
            'files': [file.to_dict() for file in files]
        }), 200
        
    except Exception as e:
        print(f"Get my files error: {e}")
        return jsonify({'message': f'Terjadi kesalahan: {str(e)}'}), 500


@app.route('/api/files/download/<int:file_id>', methods=['GET'])
@jwt_required()
def download_file(file_id):
    """Download file"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Ambil file dari database
        file = File.query.get(file_id)
        
        if not file:
            return jsonify({'message': 'File tidak ditemukan!'}), 404
        
        # Cek akses: user hanya bisa download file miliknya sendiri, admin bisa download semua
        if file.user_id != current_user_id and user.role != 'admin':
            return jsonify({'message': 'Anda tidak memiliki akses ke file ini!'}), 403
        
        # Cek apakah file fisik ada
        if not os.path.exists(file.filepath):
            return jsonify({'message': 'File tidak ditemukan di server!'}), 404
        
        return send_file(
            file.filepath,
            as_attachment=True,
            download_name=file.original_filename
        )
        
    except Exception as e:
        print(f"Download error: {e}")
        return jsonify({'message': f'Terjadi kesalahan: {str(e)}'}), 500


@app.route('/api/files/delete/<int:file_id>', methods=['DELETE'])
@jwt_required()
def delete_file(file_id):
    """Delete file milik user"""
    try:
        current_user_id = get_jwt_identity()
        
        # Ambil file dari database
        file = File.query.get(file_id)
        
        if not file:
            return jsonify({'message': 'File tidak ditemukan!'}), 404
        
        # Cek akses: user hanya bisa delete file miliknya sendiri
        if file.user_id != current_user_id:
            return jsonify({'message': 'Anda tidak memiliki akses ke file ini!'}), 403
        
        # Hapus file fisik jika ada
        if os.path.exists(file.filepath):
            os.remove(file.filepath)
        
        # Hapus dari database
        db.session.delete(file)
        db.session.commit()
        
        return jsonify({'message': 'File berhasil dihapus!'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Delete error: {e}")
        return jsonify({'message': f'Terjadi kesalahan: {str(e)}'}), 500

# ================================
# ADMIN ROUTES
# ================================

@app.route('/api/files/admin/all-files', methods=['GET'])
@admin_required
def get_all_files():
    """Get semua file dari semua user (admin only)"""
    try:
        # Ambil semua file dengan info user
        files = File.query.order_by(File.uploaded_at.desc()).all()
        
        return jsonify({
            'message': 'Berhasil mengambil semua file',
            'files': [file.to_dict(include_user=True) for file in files]
        }), 200
        
    except Exception as e:
        print(f"Get all files error: {e}")
        return jsonify({'message': f'Terjadi kesalahan: {str(e)}'}), 500


@app.route('/api/files/admin/update-status/<int:file_id>', methods=['PUT'])
@admin_required
def update_file_status(file_id):
    """Update status file (admin only)"""
    try:
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({'message': 'Status harus diisi!'}), 400
        
        new_status = data['status']
        
        if new_status not in ['pending', 'accepted', 'rejected']:
            return jsonify({'message': 'Status tidak valid!'}), 400
        
        # Ambil file dari database
        file = File.query.get(file_id)
        
        if not file:
            return jsonify({'message': 'File tidak ditemukan!'}), 404
        
        # Update status
        file.status = new_status
        file.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Status file berhasil diupdate!',
            'file': file.to_dict(include_user=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Update status error: {e}")
        return jsonify({'message': f'Terjadi kesalahan: {str(e)}'}), 500


@app.route('/api/files/admin/delete/<int:file_id>', methods=['DELETE'])
@admin_required
def admin_delete_file(file_id):
    """Delete file (admin only)"""
    try:
        # Ambil file dari database
        file = File.query.get(file_id)
        
        if not file:
            return jsonify({'message': 'File tidak ditemukan!'}), 404
        
        # Hapus file fisik jika ada
        if os.path.exists(file.filepath):
            os.remove(file.filepath)
        
        # Hapus dari database
        db.session.delete(file)
        db.session.commit()
        
        return jsonify({'message': 'File berhasil dihapus!'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Admin delete error: {e}")
        return jsonify({'message': f'Terjadi kesalahan: {str(e)}'}), 500

# ================================
# HEALTH CHECK
# ================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'message': 'Server is running',
        'timestamp': datetime.now().isoformat()
    }), 200

# ================================
# ERROR HANDLERS
# ================================

@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error"""
    return jsonify({'message': f'File terlalu besar! Maksimal {MAX_FILE_SIZE // (1024*1024)}MB'}), 413


@app.errorhandler(404)
def not_found(error):
    """Handle 404 error"""
    return jsonify({'message': 'Endpoint tidak ditemukan!'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 error"""
    return jsonify({'message': 'Terjadi kesalahan server!'}), 500

# ================================
# MAIN
# ================================

if __name__ == '__main__':
    # Create database tables
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")
        
        # Create default admin user if not exists
        admin = User.query.filter_by(email='admin@drive.com').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@drive.com',
                password=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
            print("Default admin user created!")
            print("Email: admin@drive.com")
            print("Password: admin123")
    
    # Run Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)