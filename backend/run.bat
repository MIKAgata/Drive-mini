@echo off
REM Script untuk menjalankan Flask server di Windows

echo ================================================
echo   DRIVE SYSTEM - Backend Server
echo ================================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo X Virtual environment tidak ditemukan!
    echo --^> Jalankan: python -m venv venv
    echo.
    pause
    exit /b 1
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if Flask is installed
python -c "import flask" 2>nul
if errorlevel 1 (
    echo X Dependencies belum terinstall!
    echo --^> Jalankan: pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

REM Create uploads folder if not exists
if not exist "uploads\" (
    echo Creating uploads folder...
    mkdir uploads
)

REM Run Flask server
echo Starting Flask server...
echo Server akan berjalan di: http://localhost:5000
echo.
echo Tekan CTRL+C untuk stop server
echo ================================================
echo.

python app.py