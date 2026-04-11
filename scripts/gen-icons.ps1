Add-Type -AssemblyName System.Drawing

function make($size, $path) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(22,163,74))), 0, 0, $size, $size)
    $fs = [int]($size * 0.45)
    $font = New-Object System.Drawing.Font("Arial", $fs, [System.Drawing.FontStyle]::Bold)
    $tb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString("L", $font, $tb, [System.Drawing.RectangleF]::new(0,0,$size,$size), $sf)
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Host "OK: $path"
}

make 192 "public\icons\icon-192.png"
make 512 "public\icons\icon-512.png"
Copy-Item "public\icons\icon-192.png" "public\icons\apple-touch-icon.png"
Write-Host "Done"
