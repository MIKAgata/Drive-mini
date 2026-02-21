#!/bin/bash

# Script untuk menjalankan Flask server

echo "================================================"
echo "  DRIVE SYSTEM - Backend Server"
echo "================================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment tidak ditemukan!"
    echo "➡️  Jalankan: python -m venv venv"
    echo ""
    exit 1
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Check if requirements are installed
if ! python -c "import flask" 2>/dev/null; then
    echo "❌ Dependencies belum terinstall!"
    echo "➡️  Jalankan: pip install -r requirements.txt"
    echo ""
    exit 1
fi

# Create uploads folder if not exists
if [ ! -d "uploads" ]; then
    echo "📁 Creating uploads folder..."
    mkdir uploads
fi

# Run Flask server
echo "🚀 Starting Flask server..."
echo "📡 Server akan berjalan di: http://localhost:5000"
echo ""
echo "Tekan CTRL+C untuk stop server"
echo "================================================"
echo ""

python app.py