# Sync Script for Game Hub (Full Add/Remove)
# This script keeps games.js perfectly in sync with the physical folders

$gamesJsPath = Join-Path $PSScriptRoot "games.js"
if (-not (Test-Path $gamesJsPath)) {
    Write-Host "Error: games.js not found!" -ForegroundColor Red
    pause
    exit
}

# 1. Read existing games.js
$content = Get-Content $gamesJsPath -Raw -Encoding utf8
$gameBlocks = @()

# Regex to find each { ... } block in the array
# This captures id, title, description, and svg
$regex = '\{\s*id:\s*''([^'']*)'',\s*title:\s*''([^'']*)'',\s*description:\s*''([^'']*)'',\s*svg:\s*''([^'']*)''\s*\}'
$matches = [regex]::Matches($content, $regex)

foreach ($m in $matches) {
    $gameBlocks += [PSCustomObject]@{
        id          = $m.Groups[1].Value
        title       = $m.Groups[2].Value
        description = $m.Groups[3].Value
        svg         = $m.Groups[4].Value
    }
}

# 2. Get list of current physical folders with index.html
$subdirs = Get-ChildItem -Path $PSScriptRoot -Directory | Where-Object { Test-Path (Join-Path $_.FullName "index.html") }
$currentFolderNames = $subdirs.Name

# 3. Synchronize
$newGameList = @()
$addedCount = 0
$removedCount = 0

# A. Keep existing games that still exist physically
foreach ($game in $gameBlocks) {
    if ($game.id -in $currentFolderNames) {
        $newGameList += $game
    } else {
        Write-Host "Pruning deleted game: $($game.id)" -ForegroundColor Yellow
        $removedCount++
    }
}

# B. Add new physical folders that aren't in the list
$existingIds = $newGameList.id
foreach ($dir in $subdirs) {
    if ($dir.Name -notin $existingIds) {
        Write-Host "Found new game: $($dir.Name)" -ForegroundColor Cyan
        
        $title = $dir.Name -replace "-", " "
        $title = (Get-Culture).TextInfo.ToTitleCase($title.ToLower())
        
        # Check for any .svg in the folder
        $svgFiles = Get-ChildItem -Path $dir.FullName -Filter "*.svg"
        $targetSvgFile = $svgFiles | Where-Object { $_.Name -eq "icon.svg" } | Select-Object -First 1
        if (-not $targetSvgFile) { $targetSvgFile = $svgFiles | Select-Object -First 1 }
        
        $svgMarkup = '<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>'
        if ($targetSvgFile) {
            $svgContent = Get-Content $targetSvgFile.FullName -Raw
            $svgMarkup = $svgContent -replace '<\?xml.*?\?>', '' -replace '<!DOCTYPE.*?>', '' -replace '\r|\n', '' -replace '\s+', ' '
            $svgMarkup = $svgMarkup.Trim()
        }

        $newGameList += [PSCustomObject]@{
            id          = $dir.Name
            title       = $title
            description = "New logic puzzle found in $($dir.Name) folder."
            svg         = $svgMarkup
        }
        $addedCount++
    }
}

# 4. Save back to games.js
if ($addedCount -gt 0 -or $removedCount -gt 0) {
    $sb = New-Object System.Text.StringBuilder
    $sb.AppendLine("const games = [")
    
    for ($i = 0; $i -lt $newGameList.Count; $i++) {
        $g = $newGameList[$i]
        $sb.AppendLine("  {")
        $sb.AppendLine("    id: '$($g.id)',")
        $sb.AppendLine("    title: '$($g.title)',")
        $sb.AppendLine("    description: '$($g.description)',")
        $sb.AppendLine("    svg: '$($g.svg)'")
        
        if ($i -lt $newGameList.Count - 1) {
            $sb.AppendLine("  },")
        } else {
            $sb.AppendLine("  }")
        }
    }
    
    $sb.AppendLine("];")
    
    Set-Content -Path $gamesJsPath -Value $sb.ToString() -Encoding utf8
    Write-Host "Sync Complete: Added $addedCount, Removed $removedCount." -ForegroundColor Green
} else {
    Write-Host "Everything is already in sync." -ForegroundColor Gray
}

Start-Sleep -Seconds 2
