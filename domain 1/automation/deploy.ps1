# Deploy domain 1 site to mydigitalmembershipcard.hk (GitHub Pages)
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File "domain 1/automation/deploy.ps1" [-Message "commit message"]

param(
  [string]$Message = ""
)

$ErrorActionPreference = "Stop"
$src = Join-Path $PSScriptRoot ".."
$src = (Resolve-Path $src).Path
$repoRoot = Split-Path $src -Parent
$deployDir = Join-Path $repoRoot ".deploy-mydigitalmembershipcard"
$repoSsh = "git@github.com:herbertshiu/mydigitalmembershipcard.git"
$cname = "mydigitalmembershipcard.hk"
$exclude = @("serve.ps1", "automation")

function Ensure-DeployRepo {
  if (-not (Test-Path (Join-Path $deployDir ".git"))) {
    if (Test-Path $deployDir) { Remove-Item -Recurse -Force $deployDir }
    git clone $repoSsh $deployDir
  }
  Set-Location $deployDir
  git fetch origin
  git checkout main
  git pull origin main
}

function Copy-SiteFiles {
  Get-ChildItem -Force $deployDir | Where-Object { $_.Name -ne ".git" } |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

  Get-ChildItem $src -File | Where-Object { $exclude -notcontains $_.Name } |
    Copy-Item -Destination $deployDir -Force
}

Ensure-DeployRepo
Copy-SiteFiles
Set-Content -Path (Join-Path $deployDir "CNAME") -Value $cname -NoNewline

Set-Location $deployDir
$status = git status --porcelain
if (-not $status) {
  Write-Host "No changes to deploy."
  exit 0
}

if (-not $Message) {
  $Message = "Update site $(Get-Date -Format 'yyyy-MM-dd')"
}

git add -A
git commit -m $Message
git push origin main

Write-Host "Deployed to $repoSsh (main)"
Write-Host "Live: https://$cname"
