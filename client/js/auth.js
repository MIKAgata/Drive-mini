// ================================
// CONFIGURATION
// ================================

// Base URL API - sesuaikan dengan backend Anda
const API_URL = 'http://localhost:5000/api';

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Menampilkan alert di halaman
 * @param {string} message - Pesan yang akan ditampilkan
 * @param {string} type - Tipe alert (success, danger, warning, info)
 */
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

/**
 * Menyimpan token ke localStorage
 * @param {string} token - JWT token
 */
function saveToken(token) {
    localStorage.setItem('token', token);
}

/**
 * Mengambil token dari localStorage
 * @returns {string|null} - JWT token atau null
 */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * Menghapus token dari localStorage
 */
function removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

/**
 * Menyimpan data user ke localStorage
 * @param {object} user - Data user
 */
function saveUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Mengambil data user dari localStorage
 * @returns {object|null} - Data user atau null
 */
function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

/**
 * Cek apakah user sudah login
 * @returns {boolean}
 */
function isAuthenticated() {
    return !!getToken();
}

/**
 * Redirect ke halaman tertentu jika belum login
 * @param {string} page - Halaman tujuan jika sudah login
 */
function requireAuth(page = 'home.html') {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

/**
 * Redirect ke home jika sudah login
 */
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = 'home.html';
    }
}

/**
 * Toggle button loading state
 * @param {boolean} isLoading - Loading state
 * @param {string} btnId - Button ID
 */
function toggleButtonLoading(isLoading, btnId = 'loginBtn') {
    const btn = document.getElementById(btnId);
    const btnText = btn.querySelector('#btnText');
    const btnSpinner = btn.querySelector('#btnSpinner');

    if (isLoading) {
        btn.disabled = true;
        btnText.classList.add('d-none');
        btnSpinner.classList.remove('d-none');
    } else {
        btn.disabled = false;
        btnText.classList.remove('d-none');
        btnSpinner.classList.add('d-none');
    }
}

// ================================
// LOGIN HANDLER
// ================================

if (document.getElementById('loginForm')) {
    // Redirect jika sudah login
    redirectIfAuthenticated();

    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Validasi client-side
        if (!email || !password) {
            showAlert('Email dan password harus diisi!', 'danger');
            return;
        }

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert('Format email tidak valid!', 'danger');
            return;
        }

        toggleButtonLoading(true, 'loginBtn');

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Simpan token dan data user
                saveToken(data.token);
                saveUser(data.user);

                showAlert('Login berhasil! Mengalihkan...', 'success');

                // Redirect berdasarkan role
                setTimeout(() => {
                    if (data.user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'home.html';
                    }
                }, 1000);
            } else {
                showAlert(data.message || 'Login gagal! Periksa email dan password Anda.', 'danger');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('Terjadi kesalahan! Pastikan server berjalan.', 'danger');
        } finally {
            toggleButtonLoading(false, 'loginBtn');
        }
    });
}

// ================================
// REGISTER HANDLER
// ================================

if (document.getElementById('registerForm')) {
    // Redirect jika sudah login
    redirectIfAuthenticated();

    const registerForm = document.getElementById('registerForm');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const passwordMatchError = document.getElementById('passwordMatchError');

    // Real-time password match validation
    confirmPassword.addEventListener('input', () => {
        if (confirmPassword.value && password.value !== confirmPassword.value) {
            passwordMatchError.classList.remove('d-none');
            confirmPassword.classList.add('is-invalid');
        } else {
            passwordMatchError.classList.add('d-none');
            confirmPassword.classList.remove('is-invalid');
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const passwordValue = password.value;
        const confirmPasswordValue = confirmPassword.value;

        // Validasi client-side
        if (!username || !email || !passwordValue || !confirmPasswordValue) {
            showAlert('Semua field harus diisi!', 'danger');
            return;
        }

        if (username.length < 3) {
            showAlert('Username minimal 3 karakter!', 'danger');
            return;
        }

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert('Format email tidak valid!', 'danger');
            return;
        }

        if (passwordValue.length < 6) {
            showAlert('Password minimal 6 karakter!', 'danger');
            return;
        }

        if (passwordValue !== confirmPasswordValue) {
            showAlert('Password dan konfirmasi password tidak cocok!', 'danger');
            return;
        }

        toggleButtonLoading(true, 'registerBtn');

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    username, 
                    email, 
                    password: passwordValue 
                })
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Registrasi berhasil! Mengalihkan ke halaman login...', 'success');
                
                // Reset form
                registerForm.reset();

                // Redirect ke login setelah 2 detik
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showAlert(data.message || 'Registrasi gagal! Email mungkin sudah terdaftar.', 'danger');
            }
        } catch (error) {
            console.error('Register error:', error);
            showAlert('Terjadi kesalahan! Pastikan server berjalan.', 'danger');
        } finally {
            toggleButtonLoading(false, 'registerBtn');
        }
    });
}

// ================================
// LOGOUT HANDLER
// ================================

// Handler untuk tombol logout (bisa di home.html atau admin.html)
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Hapus token dan data user
        removeToken();
        
        // Redirect ke login
        window.location.href = 'login.html';
    });
}

// ================================
// DISPLAY USER INFO IN NAVBAR
// ================================

/**
 * Menampilkan info user di navbar
 */
function displayUserInfo() {
    const user = getUser();
    if (!user) return;

    const navUsername = document.getElementById('navUsername');
    const userEmail = document.getElementById('userEmail');

    if (navUsername) navUsername.textContent = user.username;
    if (userEmail) userEmail.textContent = user.email;
}

// Panggil fungsi saat halaman load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', displayUserInfo);
} else {
    displayUserInfo();
}

// ================================
// EXPORT FUNCTIONS (untuk digunakan di file lain)
// ================================

// Fungsi-fungsi ini bisa diakses dari file JS lain
window.authUtils = {
    getToken,
    getUser,
    isAuthenticated,
    requireAuth,
    showAlert,
    API_URL
};
