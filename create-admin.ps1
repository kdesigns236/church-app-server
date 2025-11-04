# Create admin user on Render server
$apiUrl = "https://church-app-server.onrender.com/api/auth/register"

$body = @{
    name = "Admin"
    email = "admin@church.com"
    password = "admin123"
    profilePicture = "https://res.cloudinary.com/de0zuglgd/image/upload/v1/default-avatar.png"
} | ConvertTo-Json

Write-Host "Creating admin user on Render server..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $apiUrl -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing
    Write-Host "✅ Admin user created successfully!" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`nNow try logging in with:" -ForegroundColor Cyan
Write-Host "Email: admin@church.com" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White
