# Static server for domain 1 (neutral membership guide)
$root = $PSScriptRoot
$port = 4173
$prefix = "http://127.0.0.1:$port/"

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".svg"  = "image/svg+xml"
  ".ico"  = "image/x-icon"
}

Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "Serving $root"
Write-Host "Open $prefix"
Write-Host "Press Ctrl+C to stop."

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response

  try {
    $path = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
    if ($path -eq "/") { $path = "/index.html" }

    $relative = $path.TrimStart("/").Replace("/", [IO.Path]::DirectorySeparatorChar)
    $filePath = [IO.Path]::GetFullPath((Join-Path $root $relative))

    if (-not $filePath.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) {
      $response.StatusCode = 403
      $body = [Text.Encoding]::UTF8.GetBytes("403 Forbidden")
      $response.OutputStream.Write($body, 0, $body.Length)
      continue
    }

    if (Test-Path $filePath -PathType Leaf) {
      $bytes = [IO.File]::ReadAllBytes($filePath)
      $ext = [IO.Path]::GetExtension($filePath).ToLower()
      $response.ContentType = $mime[$ext]
      if (-not $response.ContentType) { $response.ContentType = "application/octet-stream" }
      $response.ContentLength64 = $bytes.Length
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $response.StatusCode = 404
      $body = [Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $response.OutputStream.Write($body, 0, $body.Length)
    }
  } finally {
    $response.Close()
  }
}
