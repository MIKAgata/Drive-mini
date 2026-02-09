# 📁 Drive System - Frontend Documentation

Frontend website sistem upload & manajemen file mirip Google Drive yang dibangun dengan HTML5, Bootstrap 5, dan Vanilla JavaScript.

## 🎯 Fitur Utama

### User Features
- ✅ Login & Register dengan validasi
- ✅ Upload file dengan drag & drop
- ✅ Manajemen file pribadi
- ✅ Download file
- ✅ Delete file
- ✅ Lihat status file (pending/accepted/rejected)
- ✅ Dashboard dengan statistik file

### Admin Features
- ✅ Lihat semua file dari semua user
- ✅ Filter & search file
- ✅ Update status file
- ✅ Download & delete file
- ✅ Dashboard dengan statistik lengkap

## 📂 Struktur Folder

```
client/
├── login.html              # Halaman login
├── register.html           # Halaman registrasi
├── home.html              # Dashboard user
├── admin.html             # Dashboard admin
├── css/
│   └── style.css          # Custom CSS
└── js/
    ├── auth.js            # Authentication & utility functions
    ├── upload.js          # File upload handler
    ├── files.js           # User file management
    └── admin.js           # Admin file management
```

## 🔧 Tech Stack

- **HTML5** - Struktur semantik
- **Bootstrap 5** - UI Framework & responsive design
- **Bootstrap Icons** - Icon library
- **Vanilla JavaScript** - No framework, pure JS
- **Fetch API** - HTTP requests
- **LocalStorage** - Token & user data storage

## 🚀 Cara Menggunakan

### 1. Setup Backend API

Pastikan backend API sudah berjalan di `http://localhost:5000/api`

Jika URL backend berbeda, edit konfigurasi di `js/auth.js`:

```javascript
const API_URL = 'http://localhost:5000/api'; // Ganti sesuai backend Anda
```

### 2. Buka Frontend

Cara termudah adalah menggunakan Live Server di VS Code:

```bash
# Install Live Server extension di VS Code
# Klik kanan pada login.html → Open with Live Server
```

Atau gunakan server lokal sederhana:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server
```

Akses di browser: `http://localhost:8000/login.html`

### 3. Testing Flow

#### A. Register User Baru
1. Buka `register.html`
2. Isi form (username, email, password, confirm password)
3. Klik "Daftar"
4. Redirect otomatis ke halaman login

#### B. Login
1. Buka `login.html`
2. Masukkan email & password
3. Klik "Masuk"
4. Redirect ke dashboard sesuai role (user/admin)

#### C. Upload File (User)
1. Di halaman `home.html`
2. Klik tombol "Upload File"
3. Pilih file atau drag & drop
4. File otomatis terupload dan muncul di list

#### D. Manage Files (User)
1. Lihat semua file di dashboard
2. Download file dengan klik icon download
3. Delete file dengan klik icon trash
4. Lihat status file (pending/accepted/rejected)

#### E. Admin Dashboard
1. Login sebagai admin
2. Otomatis redirect ke `admin.html`
3. Lihat semua file dari semua user
4. Filter berdasarkan status atau tipe file
5. Search berdasarkan username atau nama file
6. Update status file
7. Download atau delete file

## 🎨 Kustomisasi UI

### Mengubah Warna Tema

Edit variabel CSS di `css/style.css`:

```css
:root {
    --primary-color: #4285f4;    /* Warna utama */
    --secondary-color: #34a853;  /* Warna sekunder */
    --danger-color: #ea4335;     /* Warna danger */
    --warning-color: #fbbc04;    /* Warna warning */
}
```

### Mengubah Logo

Ganti icon di navbar (file HTML):

```html
<i class="bi bi-cloud-upload-fill text-primary"></i>
```

Atau gunakan logo image:

```html
<img src="path/to/logo.png" alt="Logo">
```

## 📡 API Endpoints yang Digunakan

### Authentication
- `POST /api/auth/register` - Registrasi user baru
- `POST /api/auth/login` - Login user

### Files (User)
- `GET /api/files/my-files` - Get file user
- `POST /api/files/upload` - Upload file
- `GET /api/files/download/:id` - Download file
- `DELETE /api/files/delete/:id` - Delete file

### Files (Admin)
- `GET /api/files/admin/all-files` - Get semua file
- `PUT /api/files/admin/update-status/:id` - Update status file
- `DELETE /api/files/admin/delete/:id` - Delete file

## 🔒 Security Features

1. **JWT Authentication**
   - Token disimpan di localStorage
   - Setiap request API menyertakan token di header
   - Auto redirect ke login jika token tidak ada

2. **Role-based Access**
   - Admin bisa akses admin.html
   - User biasa tidak bisa akses admin dashboard
   - Proteksi di client-side dan harus dikombinasi dengan backend

3. **Client-side Validation**
   - Email format validation
   - Password match validation
   - File size & type validation
   - Form input validation

## 📝 Validasi File Upload

### Ukuran Maksimal
- 10 MB per file

### Tipe File yang Diizinkan
- Dokumen: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- Archive: ZIP, RAR
- Image: JPG, JPEG, PNG, GIF

Edit di `js/upload.js` untuk mengubah:

```javascript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTENSIONS = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 
    'ppt', 'pptx', 'zip', 'rar', 
    'jpg', 'jpeg', 'png', 'gif'
];
```

## 🐛 Troubleshooting

### File tidak terupload
- Cek console browser untuk error
- Pastikan backend API berjalan
- Cek ukuran file tidak melebihi batas
- Cek ekstensi file diizinkan

### Login gagal
- Cek kredensial benar
- Cek backend API berjalan
- Cek console untuk error detail

### Admin page tidak bisa diakses
- Pastikan login sebagai admin
- Cek role user di backend
- Cek console untuk error

### CORS Error
- Pastikan backend sudah enable CORS
- Pastikan URL API benar

## 🔄 Update & Maintenance

### Menambah Tipe File Baru

1. Edit `ALLOWED_EXTENSIONS` di `js/upload.js`
2. Tambahkan icon di fungsi `getFileIcon()` di `js/files.js` dan `js/admin.js`
3. Update CSS untuk warna icon (opsional)

### Menambah Fitur Baru

Struktur kode sudah modular, tinggal:
1. Tambahkan HTML di halaman yang sesuai
2. Buat fungsi JavaScript baru
3. Panggil API endpoint yang sesuai
4. Update UI dengan response

## 📱 Responsive Design

Website sudah responsive dan support:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

Ditest di:
- Chrome
- Firefox
- Safari
- Edge

## 📄 License

Free to use for educational purposes.

## 👨‍💻 Developer Notes

- Kode sudah menggunakan async/await untuk handling promise
- Error handling sudah diterapkan di setiap API call
- Loading state sudah diterapkan di setiap action
- Alert system untuk user feedback
- Clean code dengan komentar lengkap

## 🆘 Support

Jika ada issue atau bug, silakan:
1. Cek console browser
2. Cek network tab untuk API call
3. Cek localStorage untuk token & user data
4. Pastikan backend API sesuai dengan endpoint yang digunakan

---

**Happy Coding! 🚀**
