$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$ImageName = "prelegal"
$ContainerName = "prelegal"

docker rm -f $ContainerName 2>$null | Out-Null

docker build -t $ImageName .
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

docker run -d --name $ContainerName -p 8000:8000 --env-file .env $ImageName
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Prelegal is running at http://localhost:8000"
