// ================================
// ADMIN DASHBOARD
// ================================

// Import utility dari auth.js
const { getToken, getUser, showAlert, API_URL, requireAuth } = window.authUtils;

// ================================
// PAGE PROTECTION (ADMIN ONLY)
// ================================

// Pastikan user sudah login
if (!requireAuth()) {
    // Akan redirect otomatis ke login
}

// Cek apakah user adalah admin
const currentUser = getUser();
if (!currentUser || currentUser.role !== 'admin') {
    alert('Akses ditolak! Anda bukan admin.');
    window.location.href = 'home.html';
}

// ================================
// GLOBAL VARIABLES
// ================================

let allFiles = [];
let filteredFiles = [];
let updateModal;

// ================================
// LOAD ALL FILES (ADMIN)
// ================================

/**
 * Load semua file dari semua user
 */
async function loadAllFiles() {
    const token = getToken();
    if (!token) return;

    const loadingSpinner = document.getElementById('loadingSpinner');
    const emptyState = document.getElementById('emptyState');
    const tableContainer = document.getElementById('tableContainer');

    // Show loading
    if (loadingSpinner) loadingSpinner.classList.remove('d-none');
    if (emptyState) emptyState.classList.add('d-none');
    if (tableContainer) tableContainer.classList.add('d-none');

    try {
        const response = await fetch(`${API_URL}/files/admin/all-files`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            allFiles = data.files || [];
            filteredFiles = [...allFiles];
            displayFilesTable(filteredFiles);
            updateAdminStats(filteredFiles);
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
 * Menampilkan file dalam tabel
 * @param {Array} files - Array of file objects
 */
function displayFilesTable(files) {
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('filesTableBody');

    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!files || files.length === 0) {
        if (tableContainer) tableContainer.classList.add('d-none');
        if (emptyState) emptyState.classList.remove('d-none');
        return;
    }

    if (tableContainer) tableContainer.classList.remove('d-none');
    if (emptyState) emptyState.classList.add('d-none');

    files.forEach(file => {
        const row = createTableRow(file);
        tableBody.appendChild(row);
    });
}

/**
 * Membuat row untuk tabel
 * @param {object} file - File object
 * @returns {HTMLElement} - Table row element
 */
function createTableRow(file) {
    const tr = document.createElement('tr');
    tr.className = 'fade-in';

    const username = file.userId?.username || file.username || 'Unknown';
    const email = file.userId?.email || file.email || '-';
    const filename = file.filename || 'Unknown';
    const fileType = getFileType(filename);
    const fileSize = formatFileSize(file.size || 0);
    const uploadDate = formatDateTime(file.uploadedAt || file.createdAt);
    const statusBadge = getStatusBadgeTable(file.status);

    tr.innerHTML = `
        <td>
            <div><strong>${username}</strong></div>
            <small class="text-muted">${email}</small>
        </td>
        <td>
            <i class="bi ${getFileIcon(filename).icon} ${getFileIcon(filename).class}"></i>
            <span class="ms-1">${filename}</span>
        </td>
        <td><span class="badge bg-secondary">${fileType}</span></td>
        <td>${fileSize}</td>
        <td>${uploadDate}</td>
        <td>${statusBadge}</td>
        <td>
            <div class="btn-group btn-group-sm" role="group">
                <button class="btn btn-outline-primary" onclick="downloadFile('${file._id}', '${filename}')" title="Download">
                    <i class="bi bi-download"></i>
                </button>
                <button class="btn btn-outline-warning" onclick="openUpdateStatusModal('${file._id}', '${filename}', '${username}', '${file.status}')" title="Update Status">
                    <i class="bi bi-pencil-square"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="adminDeleteFile('${file._id}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </td>
    `;

    return tr;
}

/**
 * Get file type dari filename
 * @param {string} filename - Nama file
 * @returns {string} - File type
 */
function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    
    const types = {
        pdf: 'PDF',
        doc: 'DOC',
        docx: 'DOCX',
        xls: 'XLS',
        xlsx: 'XLSX',
        ppt: 'PPT',
        pptx: 'PPTX',
        zip: 'ZIP',
        rar: 'RAR',
        jpg: 'JPG',
        jpeg: 'JPEG',
        png: 'PNG',
        gif: 'GIF'
    };

    return types[ext] || ext.toUpperCase();
}

/**
 * Get file icon
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
 * Get status badge untuk tabel
 */
function getStatusBadgeTable(status) {
    const badges = {
        pending: '<span class="badge bg-warning text-dark"><i class="bi bi-clock"></i> Pending</span>',
        accepted: '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Accepted</span>',
        rejected: '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Rejected</span>'
    };

    return badges[status] || badges.pending;
}

/**
 * Format date time
 */
function formatDateTime(date) {
    if (!date) return '-';
    
    const d = new Date(date);
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    const dateStr = d.toLocaleDateString('id-ID', dateOptions);
    const timeStr = d.toLocaleTimeString('id-ID', timeOptions);
    
    return `${dateStr}<br><small class="text-muted">${timeStr}</small>`;
}

/**
 * Format file size
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
 * Update admin statistics
 */
function updateAdminStats(files) {
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
// FILTER & SEARCH
// ================================

/**
 * Filter files berdasarkan search dan filter
 */
function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';

    filteredFiles = allFiles.filter(file => {
        const username = (file.userId?.username || file.username || '').toLowerCase();
        const filename = (file.filename || '').toLowerCase();
        const matchSearch = username.includes(searchTerm) || filename.includes(searchTerm);

        const matchStatus = !statusFilter || file.status === statusFilter;

        let matchType = true;
        if (typeFilter) {
            const ext = file.filename.split('.').pop().toLowerCase();
            if (typeFilter === 'pdf') matchType = ext === 'pdf';
            else if (typeFilter === 'doc') matchType = ['doc', 'docx'].includes(ext);
            else if (typeFilter === 'xls') matchType = ['xls', 'xlsx'].includes(ext);
            else if (typeFilter === 'image') matchType = ['jpg', 'jpeg', 'png', 'gif'].includes(ext);
            else if (typeFilter === 'archive') matchType = ['zip', 'rar'].includes(ext);
        }

        return matchSearch && matchStatus && matchType;
    });

    displayFilesTable(filteredFiles);
    updateAdminStats(filteredFiles);
}

/**
 * Reset semua filter
 */
function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const typeFilter = document.getElementById('typeFilter');

    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    if (typeFilter) typeFilter.value = '';

    filteredFiles = [...allFiles];
    displayFilesTable(filteredFiles);
    updateAdminStats(filteredFiles);
}

// Event listeners untuk filter
document.getElementById('searchInput')?.addEventListener('input', applyFilters);
document.getElementById('statusFilter')?.addEventListener('change', applyFilters);
document.getElementById('typeFilter')?.addEventListener('change', applyFilters);

// ================================
// UPDATE FILE STATUS
// ================================

/**
 * Open modal untuk update status
 */
function openUpdateStatusModal(fileId, filename, username, currentStatus) {
    document.getElementById('modalFileName').textContent = filename;
    document.getElementById('modalUserName').textContent = username;
    document.getElementById('fileIdToUpdate').value = fileId;
    document.getElementById('newStatus').value = currentStatus;

    updateModal = new bootstrap.Modal(document.getElementById('updateStatusModal'));
    updateModal.show();
}

/**
 * Update file status
 */
async function updateFileStatus() {
    const fileId = document.getElementById('fileIdToUpdate').value;
    const newStatus = document.getElementById('newStatus').value;
    const token = getToken();

    if (!token || !fileId || !newStatus) return;

    try {
        const response = await fetch(`${API_URL}/files/admin/update-status/${fileId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Status file berhasil diupdate!', 'success');
            updateModal.hide();
            loadAllFiles(); // Reload data
        } else {
            throw new Error(data.message || 'Gagal update status');
        }
    } catch (error) {
        console.error('Update status error:', error);
        showAlert('Gagal update status. ' + error.message, 'danger');
    }
}

// ================================
// DOWNLOAD FILE
// ================================

/**
 * Download file
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
// DELETE FILE (ADMIN)
// ================================

/**
 * Delete file (admin)
 */
async function adminDeleteFile(fileId) {
    if (!confirm('Apakah Anda yakin ingin menghapus file ini?')) {
        return;
    }

    const token = getToken();
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/files/admin/delete/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('File berhasil dihapus!', 'success');
            loadAllFiles();
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

document.addEventListener('DOMContentLoaded', () => {
    loadAllFiles();
});

// Export functions
window.loadAllFiles = loadAllFiles;
window.resetFilters = resetFilters;
window.openUpdateStatusModal = openUpdateStatusModal;
window.updateFileStatus = updateFileStatus;
window.downloadFile = downloadFile;
window.adminDeleteFile = adminDeleteFile;
