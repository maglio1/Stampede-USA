@echo off
echo ============================================
echo  Stampede USA - Push to GitHub
echo ============================================
echo.

cd /d "C:\Users\matta\AI_Stampede\stampede-usa-website"

echo Setting safe directory...
git config --global --add safe.directory C:/Users/matta/AI_Stampede/stampede-usa-website

echo.
echo Current status:
git log --oneline -3
echo.
echo Pushing to GitHub...
git push -u origin main

echo.
if %ERRORLEVEL% == 0 (
    echo SUCCESS! Code is live on GitHub.
) else (
    echo Push failed. Try GitHub Desktop instead - see instructions below.
    echo.
    echo GITHUB DESKTOP STEPS:
    echo 1. Open GitHub Desktop
    echo 2. File menu - Add Local Repository
    echo 3. Paste this path: C:\Users\matta\AI_Stampede\stampede-usa-website
    echo 4. Click "Add Repository"
    echo 5. Click "Push origin" button
)

echo.
pause
