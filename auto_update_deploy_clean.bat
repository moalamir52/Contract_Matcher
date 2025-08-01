@echo off
setlocal ENABLEDELAYEDEXPANSION

echo ------------------------------------------
echo 🚀 Starting project update and deployment
echo Current folder: %CD%
echo ------------------------------------------

:: Ensure console remains open even if something fails
set SCRIPT_FAILED=false

:: Check if main branch exists and switch to it
git checkout main 2>nul
if errorlevel 1 (
    echo ❌ 'main' branch does not exist. Creating it from current branch...
    git branch -m main
    git push -u origin main --force
) else (
    echo ✅ Switched to 'main' branch
)

echo ------------------------------------------
echo 🛠️ Running build...
npm install || set SCRIPT_FAILED=true
npm run build || set SCRIPT_FAILED=true

:: Copy build output to root
echo ------------------------------------------
echo 🔄 Copying build output to root...
xcopy /E /Y /I build\* .\ >nul
if errorlevel 1 (
    echo ⚠️ Failed to copy build files
    set SCRIPT_FAILED=true
) else (
    echo ✅ Build files copied to project root
)

:: Add, commit, and push changes
echo ------------------------------------------
echo 💾 Committing and pushing changes...
git add .
git commit -m "Auto-deploy: build copied to root and pushed"
git push origin main

:: Delete old branches if exist
echo ------------------------------------------
echo 🧹 Cleaning up old branches...
git push origin --delete gh-pages 2>nul
IF %ERRORLEVEL% EQU 0 (
    echo 🗑️ Deleted 'gh-pages'
) ELSE (
    echo ℹ️ 'gh-pages' branch does not exist or already deleted
)

git push origin --delete master 2>nul
IF %ERRORLEVEL% EQU 0 (
    echo 🗑️ Deleted 'master'
) ELSE (
    echo ℹ️ 'master' branch does not exist or already deleted
)

:: Clean up remote references
git remote prune origin

echo ------------------------------------------
if "!SCRIPT_FAILED!"=="true" (
    echo ❌ Deployment finished with some errors. Please check the above logs.
) else (
    echo ✅ Deployment Complete!
    echo 🌐 Visit your GitHub Pages URL to check the result.
)
echo ------------------------------------------

pause
