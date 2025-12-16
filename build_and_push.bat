@echo off

echo ========================================================
echo  Plex Payment - Docker Build ^& Push Helper
echo ========================================================
echo.

set /p DOCKER_USER="Enter your Docker Hub Username: "

if "%DOCKER_USER%"=="" (
    echo Error: Docker Hub Username is required.
    pause
    exit /b 1
)

echo.
echo Building image for %DOCKER_USER%/plex-payment:latest...
docker build -t %DOCKER_USER%/plex-payment:latest .

if %ERRORLEVEL% NEQ 0 (
    echo Error: Docker build failed. Make sure Docker Desktop is running.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Pushing image to Docker Hub...
docker push %DOCKER_USER%/plex-payment:latest

if %ERRORLEVEL% NEQ 0 (
    echo Error: Docker push failed. You might need to run 'docker login' first.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo  Success! Image pushed to %DOCKER_USER%/plex-payment:latest
echo ========================================================
pause
