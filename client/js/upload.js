// ================================
// UPLOAD FILE HANDLER
// ================================

// Import utility dari auth.js
const { getToken, showAlert, API_URL } = window.authUtils;

// ================================
// GLOBAL VARIABLES
// ================================

let selectedFile = null;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB dalam bytes

// Allowed file extensions
const ALLOWED_EXTENSIONS = [
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 
    'ppt', 'pptx', 'zip', 'rar', 
    'jpg', 'jpeg', 'png', 'gif'
];

// ================================
// DOM ELEMENTS
// ================================

const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const uploadForm = document.getElementById('uploadForm');
const uploadBtn = document.getElementById('uploadBtn');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = uploadProgress?.querySelector('.progress-bar');

// ================================
// FILE INPUT CHANGE HANDLER
// ================================

if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    });
}

// ================================
// DRAG & DROP HANDLERS
// ================================

if (dropArea) {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.remove('dragover');
        }, false);
    });

    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);

    // Click to select file
    dropArea.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
            fileInput.click();
        }
    });
}

/**
 * Prevent default drag behaviors
 */
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

/**
 * Handle file drop
 */
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
}

// ================================
// FILE VALIDATION & SELECTION
// ================================

/**
 * Handle file selection (dari input atau drag & drop)
 * @param {File} file - File yang dipilih
 */
function handleFileSelect(file) {
    // Validasi file
    const validation = validateFile(file);
    
    if (!validation.valid) {
        showAlert(validation.message, 'danger');
        fileInput.value = ''; // Reset input
        return;
    }

    selectedFile = file;
    displayFileInfo(file);
}

/**
 * Validasi file (ukuran dan ekstensi)
 * @param {File} file - File yang akan divalidasi
 * @returns {object} - Result validasi
 */
function validateFile(file) {
    // Cek ukuran file
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            message: `Ukuran file terlalu besar! Maksimal ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        };
    }

    // Cek ekstensi file
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
        return {
            valid: false,
            message: `Tipe file tidak diizinkan! Hanya: ${ALLOWED_EXTENSIONS.join(', ')}`
        };
    }

    return { valid: true };
}

/**
 * Menampilkan info file yang dipilih
 * @param {File} file - File yang dipilih
 */
function displayFileInfo(file) {
    if (!fileInfo || !fileName || !fileSize) return;

    fileName.textContent = file.name;
    fileSize.textContent = ` (${formatFileSize(file.size)})`;
    fileInfo.classList.remove('d-none');
}

/**
 * Format ukuran file ke format yang readable
 * @param {number} bytes - Ukuran dalam bytes
 * @returns {string} - Ukuran dalam format KB/MB
 */
function formatFileSize(bytes) {
    if (bytes < 1024) {
        return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(2) + ' KB';
    } else {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

// ================================
// UPLOAD FORM HANDLER
// ================================

if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            showAlert('Pilih file terlebih dahulu!', 'warning');
            return;
        }

        await uploadFile(selectedFile);
    });
}

/**
 * Upload file ke server
 * @param {File} file - File yang akan diupload
 */
async function uploadFile(file) {
    const token = getToken();
    if (!token) {
        showAlert('Anda harus login terlebih dahulu!', 'danger');
        window.location.href = 'login.html';
        return;
    }

    // Disable upload button
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Uploading...';

    // Show progress bar
    if (uploadProgress) {
        uploadProgress.classList.remove('d-none');
        updateProgress(0);
    }

    // Prepare FormData
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Upload dengan XMLHttpRequest untuk tracking progress
        const uploadedFile = await uploadWithProgress(formData, token);

        // Success
        showAlert('File berhasil diupload!', 'success');
        
        // Reset form dan state
        resetUploadForm();

        // Close modal
        const uploadModal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
        if (uploadModal) {
            uploadModal.hide();
        }

        // Reload files list
        if (typeof loadUserFiles === 'function') {
            loadUserFiles();
        }

    } catch (error) {
        console.error('Upload error:', error);
        showAlert(error.message || 'Terjadi kesalahan saat upload file!', 'danger');
    } finally {
        // Enable upload button
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="bi bi-cloud-upload"></i> Upload';

        // Hide progress bar
        if (uploadProgress) {
            setTimeout(() => {
                uploadProgress.classList.add('d-none');
                updateProgress(0);
            }, 1000);
        }
    }
}

/**
 * Upload file dengan progress tracking
 * @param {FormData} formData - Form data berisi file
 * @param {string} token - JWT token
 * @returns {Promise} - Promise yang resolve dengan response data
 */
function uploadWithProgress(formData, token) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                updateProgress(percentComplete);
            }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
            } else {
                const error = JSON.parse(xhr.responseText);
                reject(new Error(error.message || 'Upload failed'));
            }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
            reject(new Error('Network error occurred'));
        });

        xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
        });

        // Send request
        xhr.open('POST', `${API_URL}/files/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
    });
}

/**
 * Update progress bar
 * @param {number} percent - Percentage (0-100)
 */
function updateProgress(percent) {
    if (!progressBar) return;
    
    const rounded = Math.round(percent);
    progressBar.style.width = `${rounded}%`;
    progressBar.textContent = `${rounded}%`;
    progressBar.setAttribute('aria-valuenow', rounded);
}

/**
 * Reset upload form ke state awal
 */
function resetUploadForm() {
    selectedFile = null;
    
    if (fileInput) fileInput.value = '';
    if (fileInfo) fileInfo.classList.add('d-none');
    if (fileName) fileName.textContent = '';
    if (fileSize) fileSize.textContent = '';
    if (uploadForm) uploadForm.reset();
}

// ================================
// MODAL RESET ON CLOSE
// ================================

const uploadModal = document.getElementById('uploadModal');
if (uploadModal) {
    uploadModal.addEventListener('hidden.bs.modal', () => {
        resetUploadForm();
    });
}
