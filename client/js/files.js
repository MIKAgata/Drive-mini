// ================================
// FILES MANAGEMENT (USER)
// ================================

// Import utility dari auth.js
const { getToken, showAlert, API_URL, requireAuth } = window.authUtils;

// ================================
// PAGE PROTECTION
// ================================

// Pastikan user sudah login
if (!requireAuth()) {
    // Akan redirect otomatis ke login
}

// ================================
// GLOBAL VARIABLES
// ================================

let userFiles = [];

// ================================
// LOAD USER FILES
// ================================

/**
 * Load semua file milik user yang sedang login
 */
async function loadUserFiles() {
    const token = getToken();
    if (!token) return;

    const loadingSpinner = document.getElementById('loadingSpinner');
    const emptyState = document.getElementById('emptyState');
    const filesContainer = document.getElementById('filesContainer');

    // Show loading
    if (loadingSpinner) loadingSpinner.classList.remove('d-none');
    if (emptyState) emptyState.classList.add('d-none');
    if (filesContainer) filesContainer.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/files/my-files`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            userFiles = data.files || [];
            displayFiles(userFiles);
            updateStats(userFiles);
        } else {
            throw new Error(data.message || 'Gagal memuat file');
        }
    } catch (error) {
        console.error('Load files error:', error);
        showAlert('Gagal memuat file. ' + error.message, 'danger');
        
        if (emptyState) emptyState.classList.remove('d-none');
    } finally {
        if (loadingSpinner) loadingSpinner.classList.add('d-none');
    }
}

/**
 * Menampilkan file dalam grid/card layout
 * @param {Array} files - Array of file objects
 */
function displayFiles(files) {
    const filesContainer = document.getElementById('filesContainer');
    const emptyState = document.getElementById('emptyState');

    if (!filesContainer) return;

    filesContainer.innerHTML = '';

    if (!files || files.length === 0) {
        if (emptyState) emptyState.classList.remove('d-none');
        return;
    }

    if (emptyState) emptyState.classList.add('d-none');

    files.forEach(file => {
        const fileCard = createFileCard(file);
        filesContainer.appendChild(fileCard);
    });
}

/**
 * Membuat card untuk satu file
 * @param {object} file - File object
 * @returns {HTMLElement} - Card element
 */
function createFileCard(file) {
    const col = document.createElement('div');
    col.className = 'col-md-3 col-sm-6';

    const fileIcon = getFileIcon(file.filename);
    const statusBadge = getStatusBadge(file.status);
    const uploadDate = formatDate(file.uploadedAt || file.createdAt);
    const fileSize = formatFileSize(file.size || 0);

    col.innerHTML = `
        <div class="file-card">
            <div class="text-center">
                <i class="bi ${fileIcon.icon} file-icon ${fileIcon.class}"></i>
            </div>
            <div class="file-name" title="${file.filename}">${file.filename}</div>
            <div class="file-info mb-2">
                <small>${fileSize} • ${uploadDate}</small>
            </div>
            <div class="mb-2">
                ${statusBadge}
            </div>
            <div class="btn-group w-100" role="group">
                <button class="btn btn-sm btn-outline-primary" onclick="downloadFile('${file._id}', '${file.filename}')" title="Download">
                    <i class="bi bi-download"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteFile('${file._id}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `;

    return col;
}

/**
 * Get icon berdasarkan tipe file
 * @param {string} filename - Nama file
 * @returns {object} - Icon class and color
 */
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    
    const icons = {
        pdf: { icon: 'bi-file-earmark-pdf-fill', class: 'icon-pdf' },
        doc: { icon: 'bi-file-earmark-word-fill', class: 'icon-doc' },
        docx: { icon: 'bi-file-earmark-word-fill', class: 'icon-doc' },
        xls: { icon: 'bi-file-earmark-excel-fill', class: 'icon-xls' },
        xlsx: { icon: 'bi-file-earmark-excel-fill', class: 'icon-xls' },
        ppt: { icon: 'bi-file-earmark-ppt-fill', class: 'icon-ppt' },
        pptx: { icon: 'bi-file-earmark-ppt-fill', class: 'icon-ppt' },
        zip: { icon: 'bi-file-earmark-zip-fill', class: 'icon-archive' },
        rar: { icon: 'bi-file-earmark-zip-fill', class: 'icon-archive' },
        jpg: { icon: 'bi-file-earmark-image-fill', class: 'icon-image' },
        jpeg: { icon: 'bi-file-earmark-image-fill', class: 'icon-image' },
        png: { icon: 'bi-file-earmark-image-fill', class: 'icon-image' },
        gif: { icon: 'bi-file-earmark-image-fill', class: 'icon-image' }
    };

    return icons[ext] || { icon: 'bi-file-earmark-fill', class: 'icon-default' };
}

/**
 * Get status badge HTML
 * @param {string} status - Status file
 * @returns {string} - Badge HTML
 */
function getStatusBadge(status) {
    const badges = {
        pending: '<span class="badge status-pending"><i class="bi bi-clock"></i> Pending</span>',
        accepted: '<span class="badge status-accepted"><i class="bi bi-check-circle"></i> Accepted</span>',
        rejected: '<span class="badge status-rejected"><i class="bi bi-x-circle"></i> Rejected</span>'
    };

    return badges[status] || badges.pending;
}

/**
 * Format tanggal
 * @param {string} date - ISO date string
 * @returns {string} - Formatted date
 */
function formatDate(date) {
    if (!date) return '-';
    
    const d = new Date(date);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('id-ID', options);
}

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size
 */
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    
    if (bytes < 1024) {
        return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(2) + ' KB';
    } else {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

/**
 * Update statistik file
 * @param {Array} files - Array of files
 */
function updateStats(files) {
    const totalFiles = files.length;
    const pendingFiles = files.filter(f => f.status === 'pending').length;
    const acceptedFiles = files.filter(f => f.status === 'accepted').length;
    const rejectedFiles = files.filter(f => f.status === 'rejected').length;

    const totalEl = document.getElementById('totalFiles');
    const pendingEl = document.getElementById('pendingFiles');
    const acceptedEl = document.getElementById('acceptedFiles');
    const rejectedEl = document.getElementById('rejectedFiles');

    if (totalEl) totalEl.textContent = totalFiles;
    if (pendingEl) pendingEl.textContent = pendingFiles;
    if (acceptedEl) acceptedEl.textContent = acceptedFiles;
    if (rejectedEl) rejectedEl.textContent = rejectedFiles;
}

// ================================
// DOWNLOAD FILE
// ================================

/**
 * Download file
 * @param {string} fileId - ID file
 * @param {string} filename - Nama file
 */
async function downloadFile(fileId, filename) {
    const token = getToken();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/files/download/${fileId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Gagal download file');
        }

        // Create blob dan download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        showAlert('File berhasil didownload!', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showAlert('Gagal download file. ' + error.message, 'danger');
    }
}

// ================================
// DELETE FILE
// ================================

/**
 * Delete file (dengan konfirmasi)
 * @param {string} fileId - ID file
 */
async function deleteFile(fileId) {
    // Konfirmasi delete
    if (!confirm('Apakah Anda yakin ingin menghapus file ini?')) {
        return;
    }

    const token = getToken();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/files/delete/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('File berhasil dihapus!', 'success');
            loadUserFiles(); // Reload list
        } else {
            throw new Error(data.message || 'Gagal menghapus file');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showAlert('Gagal menghapus file. ' + error.message, 'danger');
    }
}

// ================================
// INITIALIZE
// ================================

// Load files saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    loadUserFiles();
});

// Export functions agar bisa dipanggil dari luar
window.loadUserFiles = loadUserFiles;
window.downloadFile = downloadFile;
window.deleteFile = deleteFile;
