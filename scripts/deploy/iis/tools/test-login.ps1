# Tests the admin login through IIS. Asks for the password; nothing is saved.
#   powershell -ExecutionPolicy Bypass -File .\test-login.ps1
#   powershell -ExecutionPolicy Bypass -File .\test-login.ps1 -BaseUrl "http://127.0.0.1:8090"

param(
  [string]$BaseUrl = "http://127.0.0.1:8090",
  [string]$Email = "admin@careerportal.com"
)

$secure = Read-Host "Admin password for $Email" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
  $body = @{ email = $Email; password = $plain } | ConvertTo-Json
  $response = Invoke-WebRequest "$BaseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $body -UseBasicParsing
  Write-Host "LOGIN -> $($response.StatusCode)" -ForegroundColor Green
} catch {
  $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { "no response" }
  Write-Host "LOGIN -> FAIL ($status): $($_.Exception.Message)" -ForegroundColor Red
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  Remove-Variable plain, body -ErrorAction SilentlyContinue
}
