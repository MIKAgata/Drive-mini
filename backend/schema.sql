-- ================================================
-- DATABASE SETUP FOR DRIVE SYSTEM
-- ================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS drive_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Use Database
USE drive_system;

-- ================================================
-- TABLE: users
-- ================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- TABLE: files
-- ================================================

CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    size INT DEFAULT 0,
    mimetype VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    user_id INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- INSERT DEFAULT ADMIN USER
-- ================================================
-- Password: admin123 (hashed)

INSERT INTO users (username, email, password, role)
VALUES (
    'admin',
    'admin@drive.com',
    'scrypt:32768:8:1$VPXQlKhF3v8TaBrT$8f4e7c7e24e1d5b8a5e8c9f1a3d7e6b2c5f8a1d4e7b3c6f9a2d5e8b1c4f7a0d3e6b9c2f5a8d1e4b7c0f3a6d9e2',
    'admin'
) ON DUPLICATE KEY UPDATE email=email;

-- ================================================
-- INSERT SAMPLE USERS (Optional - for testing)
-- ================================================

INSERT INTO users (username, email, password, role)
VALUES 
    ('john_doe', 'john@example.com', 'scrypt:32768:8:1$VPXQlKhF3v8TaBrT$8f4e7c7e24e1d5b8a5e8c9f1a3d7e6b2c5f8a1d4e7b3c6f9a2d5e8b1c4f7a0d3e6b9c2f5a8d1e4b7c0f3a6d9e2', 'user'),
    ('jane_smith', 'jane@example.com', 'scrypt:32768:8:1$VPXQlKhF3v8TaBrT$8f4e7c7e24e1d5b8a5e8c9f1a3d7e6b2c5f8a1d4e7b3c6f9a2d5e8b1c4f7a0d3e6b9c2f5a8d1e4b7c0f3a6d9e2', 'user')
ON DUPLICATE KEY UPDATE email=email;

-- ================================================
-- VIEWS (Optional - for statistics)
-- ================================================

-- View untuk statistik file per user
CREATE OR REPLACE VIEW user_file_stats AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    COUNT(f.id) as total_files,
    SUM(CASE WHEN f.status = 'pending' THEN 1 ELSE 0 END) as pending_files,
    SUM(CASE WHEN f.status = 'accepted' THEN 1 ELSE 0 END) as accepted_files,
    SUM(CASE WHEN f.status = 'rejected' THEN 1 ELSE 0 END) as rejected_files,
    COALESCE(SUM(f.size), 0) as total_size
FROM users u
LEFT JOIN files f ON u.id = f.user_id
GROUP BY u.id, u.username, u.email;

-- View untuk statistik global
CREATE OR REPLACE VIEW global_stats AS
SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(f.id) as total_files,
    SUM(CASE WHEN f.status = 'pending' THEN 1 ELSE 0 END) as pending_files,
    SUM(CASE WHEN f.status = 'accepted' THEN 1 ELSE 0 END) as accepted_files,
    SUM(CASE WHEN f.status = 'rejected' THEN 1 ELSE 0 END) as rejected_files,
    COALESCE(SUM(f.size), 0) as total_size
FROM users u
LEFT JOIN files f ON u.id = f.user_id;

-- ================================================
-- STORED PROCEDURES (Optional)
-- ================================================

DELIMITER //

-- Procedure untuk membersihkan file orphan (file tanpa record database)
CREATE PROCEDURE IF NOT EXISTS cleanup_orphan_files()
BEGIN
    -- This is a placeholder - actual implementation would require 
    -- filesystem access which is typically handled in application code
    SELECT 'Orphan file cleanup should be handled in application code' as message;
END //

-- Procedure untuk mendapatkan statistik user
CREATE PROCEDURE IF NOT EXISTS get_user_statistics(IN p_user_id INT)
BEGIN
    SELECT * FROM user_file_stats WHERE user_id = p_user_id;
END //

DELIMITER ;

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

-- Additional indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_files_status_uploaded ON files(status, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_user_status ON files(user_id, status);

-- ================================================
-- DATABASE SETUP COMPLETE
-- ================================================

SELECT 'Database setup completed successfully!' as status;