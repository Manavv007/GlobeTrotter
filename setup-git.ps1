# PowerShell script to set up Git and push to GitHub
# Run this script from the project root directory

Write-Host "🚀 Setting up Git and pushing to GitHub..." -ForegroundColor Green

# Check if Git is installed
try {
    git --version | Out-Null
    Write-Host "✅ Git is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed. Please install Git first:" -ForegroundColor Red
    Write-Host "   Download from: https://git-scm.com/downloads" -ForegroundColor Yellow
    exit 1
}

# Check if .git folder exists
if (Test-Path ".git") {
    Write-Host "✅ Git repository already initialized" -ForegroundColor Green
} else {
    Write-Host "📁 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

# Check if .gitignore exists
if (Test-Path ".gitignore") {
    Write-Host "✅ .gitignore file exists" -ForegroundColor Green
} else {
    Write-Host "❌ .gitignore file missing!" -ForegroundColor Red
    Write-Host "   Please create .gitignore file first" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Cyan
Write-Host "1. Add your GitHub repository as remote:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/yourusername/globetrotter.git" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Add and commit your files:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Yellow
Write-Host "   git commit -m 'Initial commit: GlobeTrotter app'" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Push to GitHub:" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Then deploy to Railway (backend) and Vercel (frontend)" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Make sure .env file is in .gitignore before pushing!" -ForegroundColor Red
