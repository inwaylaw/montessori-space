$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ImagesDir = Join-Path $Root "images"
New-Item -ItemType Directory -Force -Path $ImagesDir | Out-Null

$script:Items = @()

function New-Font {
    param(
        [float]$Size,
        [string]$Style = "Regular"
    )
    $fontStyle = [System.Drawing.FontStyle]::Regular
    if ($Style -eq "Bold") { $fontStyle = [System.Drawing.FontStyle]::Bold }
    if ($Style -eq "Italic") { $fontStyle = [System.Drawing.FontStyle]::Italic }
    return New-Object System.Drawing.Font("Microsoft YaHei", $Size, $fontStyle, [System.Drawing.GraphicsUnit]::Pixel)
}

function Color-Html {
    param([string]$Hex)
    return [System.Drawing.ColorTranslator]::FromHtml($Hex)
}

function New-Brush {
    param([string]$Hex)
    return New-Object System.Drawing.SolidBrush((Color-Html $Hex))
}

function New-Pen {
    param([string]$Hex, [float]$Width = 1)
    return New-Object System.Drawing.Pen((Color-Html $Hex), $Width)
}

function Draw-Text {
    param(
        [System.Drawing.Graphics]$G,
        [string]$Text,
        [float]$X,
        [float]$Y,
        [float]$Size = 28,
        [string]$Color = "#111827",
        [string]$Style = "Regular"
    )
    $font = New-Font $Size $Style
    $brush = New-Brush $Color
    $G.DrawString($Text, $font, $brush, $X, $Y)
    $brush.Dispose()
    $font.Dispose()
}

function Draw-CenteredText {
    param(
        [System.Drawing.Graphics]$G,
        [string]$Text,
        [float]$X,
        [float]$Y,
        [float]$W,
        [float]$H,
        [float]$Size = 26,
        [string]$Color = "#111827",
        [string]$Style = "Regular"
    )
    $font = New-Font $Size $Style
    $brush = New-Brush $Color
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF($X, $Y, $W, $H)
    $G.DrawString($Text, $font, $brush, $rect, $format)
    $format.Dispose()
    $brush.Dispose()
    $font.Dispose()
}

function Fill-Rect {
    param([System.Drawing.Graphics]$G, [float]$X, [float]$Y, [float]$W, [float]$H, [string]$Color)
    $brush = New-Brush $Color
    $G.FillRectangle($brush, $X, $Y, $W, $H)
    $brush.Dispose()
}

function Draw-Rect {
    param([System.Drawing.Graphics]$G, [float]$X, [float]$Y, [float]$W, [float]$H, [string]$Color = "#334155", [float]$Width = 2)
    $pen = New-Pen $Color $Width
    $G.DrawRectangle($pen, $X, $Y, $W, $H)
    $pen.Dispose()
}

function Fill-Ellipse {
    param([System.Drawing.Graphics]$G, [float]$X, [float]$Y, [float]$W, [float]$H, [string]$Color)
    $brush = New-Brush $Color
    $G.FillEllipse($brush, $X, $Y, $W, $H)
    $brush.Dispose()
}

function Draw-Line {
    param([System.Drawing.Graphics]$G, [float]$X1, [float]$Y1, [float]$X2, [float]$Y2, [string]$Color = "#334155", [float]$Width = 2)
    $pen = New-Pen $Color $Width
    $G.DrawLine($pen, $X1, $Y1, $X2, $Y2)
    $pen.Dispose()
}

function New-Canvas {
    param([string]$FileName, [string]$Title)
    $bmp = New-Object System.Drawing.Bitmap(1200, 850)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.Clear((Color-Html "#f8fafc"))
    Fill-Rect $g 0 0 1200 78 "#0f172a"
    Draw-Text $g $Title 38 18 34 "#ffffff" "Bold"
    return [ordered]@{
        Bitmap = $bmp
        Graphics = $g
        Path = Join-Path $ImagesDir $FileName
    }
}

function Save-Canvas {
    param($Canvas)
    $Canvas.Bitmap.Save($Canvas.Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $Canvas.Graphics.Dispose()
    $Canvas.Bitmap.Dispose()
}

function Add-Item {
    param(
        [string]$Id,
        [string[]]$Images,
        [string]$Category,
        [string]$Question,
        [string]$ExpectedAnswer,
        [string]$AnswerType = "contains_any",
        [string[]]$AcceptableAnswers = @(),
        [string[]]$ExpectedKeywords = @(),
        [double]$NumericValue = [double]::NaN,
        [double]$Tolerance = 0
    )

    $entry = [ordered]@{
        id = $Id
        images = $Images
        category = $Category
        question = $Question
        expected_answer = $ExpectedAnswer
        answer_type = $AnswerType
        acceptable_answers = $AcceptableAnswers
        expected_keywords = $ExpectedKeywords
    }
    if (-not [double]::IsNaN($NumericValue)) {
        $entry.numeric_value = $NumericValue
        $entry.tolerance = $Tolerance
    }
    $script:Items += $entry
}

function Draw-Arrow {
    param([System.Drawing.Graphics]$G, [float]$X1, [float]$Y1, [float]$X2, [float]$Y2, [string]$Color = "#2563eb", [float]$Width = 5)
    Draw-Line $G $X1 $Y1 $X2 $Y2 $Color $Width
    $angle = [Math]::Atan2($Y2 - $Y1, $X2 - $X1)
    $len = 20
    $a1 = $angle + [Math]::PI * 0.82
    $a2 = $angle - [Math]::PI * 0.82
    Draw-Line $G $X2 $Y2 ($X2 + [Math]::Cos($a1) * $len) ($Y2 + [Math]::Sin($a1) * $len) $Color $Width
    Draw-Line $G $X2 $Y2 ($X2 + [Math]::Cos($a2) * $len) ($Y2 + [Math]::Sin($a2) * $len) $Color $Width
}

# 01 Receipt OCR
$c = New-Canvas "01_receipt.png" "Receipt OCR Test"
$g = $c.Graphics
Fill-Rect $g 300 120 600 620 "#ffffff"
Draw-Rect $g 300 120 600 620 "#cbd5e1" 3
Draw-CenteredText $g "BEACON CAFE" 300 142 600 50 36 "#0f172a" "Bold"
Draw-Text $g "Date: 2026-05-21 14:32" 360 220 26
Draw-Text $g "Order No: A-1047" 360 262 30 "#b91c1c" "Bold"
Draw-Line $g 350 318 850 318 "#cbd5e1" 2
Draw-Text $g "Latte x2" 360 350 28
Draw-Text $g "18.00" 760 350 28
Draw-Text $g "Blueberry Muffin x1" 360 400 28
Draw-Text $g "16.80" 760 400 28
Draw-Text $g "Sparkling Water x1" 360 450 28
Draw-Text $g "8.00" 775 450 28
Draw-Line $g 350 506 850 506 "#cbd5e1" 2
Draw-Text $g "Subtotal" 360 535 28
Draw-Text $g "60.80" 760 535 28
Draw-Text $g "Discount" 360 582 28
Draw-Text $g "-3.00" 765 582 28
Draw-Text $g "TOTAL" 360 644 34 "#0f766e" "Bold"
Draw-Text $g "57.80 RMB" 690 644 34 "#0f766e" "Bold"
Draw-Text $g "Payment: Alipay" 360 700 24 "#475569"
Save-Canvas $c

Add-Item "mve_001" @("images/01_receipt.png") "ocr_receipt" "这张收据的订单号是多少？" "A-1047" "exact" @("A-1047", "A1047", "订单号 A-1047")
Add-Item "mve_002" @("images/01_receipt.png") "ocr_receipt" "应付总额是多少？" "57.80 RMB" "numeric" @("57.80", "57.8", "57.80 RMB", "57.80元") @() 57.8 0.01
Add-Item "mve_003" @("images/01_receipt.png") "ocr_receipt" "购买了几杯拿铁？" "2 杯" "numeric" @("2", "2杯", "两杯") @() 2 0

# 02 Shelf counting
$c = New-Canvas "02_shelf.png" "Shelf Counting Test"
$g = $c.Graphics
Fill-Rect $g 110 145 980 530 "#fff7ed"
Draw-Rect $g 110 145 980 530 "#92400e" 5
Draw-Line $g 110 320 1090 320 "#92400e" 5
Draw-Line $g 110 500 1090 500 "#92400e" 5
$x = 160
for ($i = 0; $i -lt 3; $i++) { Fill-Rect $g ($x + $i * 95) 205 68 88 "#ef4444"; Draw-CenteredText $g "MILK" ($x + $i * 95) 205 68 88 18 "#ffffff" "Bold" }
for ($i = 0; $i -lt 2; $i++) { Fill-Rect $g (530 + $i * 95) 205 68 88 "#38bdf8"; Draw-CenteredText $g "WATER" (530 + $i * 95) 205 68 88 16 "#083344" "Bold" }
for ($i = 0; $i -lt 4; $i++) { Fill-Rect $g (160 + $i * 95) 380 68 88 "#22c55e"; Draw-CenteredText $g "TEA" (160 + $i * 95) 380 68 88 20 "#052e16" "Bold" }
Fill-Rect $g 760 380 68 88 "#facc15"; Draw-CenteredText $g "JUICE" 760 380 68 88 16 "#713f12" "Bold"
Fill-Rect $g 170 590 180 50 "#ffffff"; Draw-CenteredText $g "Milk ¥6.50" 170 590 180 50 24
Fill-Rect $g 500 590 220 50 "#ffffff"; Draw-CenteredText $g "Water ¥3.50" 500 590 220 50 24
Fill-Rect $g 780 590 200 50 "#ffffff"; Draw-CenteredText $g "Tea ¥5.00" 780 590 200 50 24
Draw-Text $g "Red milk: 3    Blue water: 2    Green tea: 4    Yellow juice: 1" 130 710 28 "#334155"
Save-Canvas $c

Add-Item "mve_004" @("images/02_shelf.png") "counting" "绿色茶盒有几个？" "4 个" "numeric" @("4", "四个", "4个") @() 4 0
Add-Item "mve_005" @("images/02_shelf.png") "visual_reasoning" "单价最低的商品是什么？" "Water / 矿泉水" "contains_any" @("Water", "water", "矿泉水", "水") @("water")

# 03 Traffic scene
$c = New-Canvas "03_traffic.png" "Traffic Scene Test"
$g = $c.Graphics
Fill-Rect $g 0 78 1200 350 "#bfdbfe"
Fill-Rect $g 0 428 1200 422 "#475569"
Draw-Line $g 0 620 1200 620 "#facc15" 6
Fill-Rect $g 120 365 960 64 "#22c55e"
Fill-Rect $g 770 220 95 95 "#ffffff"; Draw-Rect $g 770 220 95 95 "#0f172a" 4
Draw-CenteredText $g "SCHOOL`n30" 770 220 95 95 24 "#111827" "Bold"
Fill-Rect $g 910 165 60 170 "#111827"
Fill-Ellipse $g 922 178 36 36 "#334155"
Fill-Ellipse $g 922 226 36 36 "#22c55e"
Fill-Ellipse $g 922 274 36 36 "#334155"
Fill-Rect $g 390 500 250 90 "#ef4444"; Fill-Rect $g 455 450 115 60 "#fecaca"
Fill-Ellipse $g 425 575 55 55 "#111827"; Fill-Ellipse $g 555 575 55 55 "#111827"
Fill-Ellipse $g 755 565 60 60 "#111827"; Fill-Ellipse $g 900 565 60 60 "#111827"; Draw-Line $g 785 595 875 520 "#2563eb" 8; Draw-Line $g 875 520 930 595 "#2563eb" 8; Draw-Line $g 785 595 930 595 "#2563eb" 8
Fill-Ellipse $g 825 455 42 42 "#fbbf24"; Draw-Line $g 846 497 846 565 "#111827" 6; Draw-Line $g 846 525 805 555 "#111827" 5; Draw-Line $g 846 525 890 555 "#111827" 5
Draw-Text $g "Car is center-left. Bicycle is to the right of the car. Light is green." 90 735 28 "#e2e8f0"
Save-Canvas $c

Add-Item "mve_006" @("images/03_traffic.png") "scene_understanding" "交通灯当前是什么颜色？" "绿色" "contains_any" @("绿色", "绿灯", "green")
Add-Item "mve_007" @("images/03_traffic.png") "ocr_sign" "路牌上的限速是多少？" "30" "numeric" @("30", "30公里", "30 km/h") @() 30 0
Add-Item "mve_008" @("images/03_traffic.png") "spatial_reasoning" "自行车在红色汽车的哪一侧？" "右侧" "contains_any" @("右", "右侧", "右边", "在汽车右边", "right")

# 04 Chart
$c = New-Canvas "04_chart.png" "Chart Understanding Test"
$g = $c.Graphics
Fill-Rect $g 100 140 1000 600 "#ffffff"
Draw-Rect $g 100 140 1000 600 "#cbd5e1" 2
Draw-Text $g "Monthly Users and Cost" 150 165 32 "#0f172a" "Bold"
$months = @("Jan", "Feb", "Mar", "Apr", "May", "Jun")
$users = @(120, 160, 150, 230, 280, 260)
$cost = @(30, 38, 35, 45, 50, 48)
$plotX = 180; $plotY = 245; $plotW = 820; $plotH = 390
Draw-Line $g $plotX ($plotY + $plotH) ($plotX + $plotW) ($plotY + $plotH) "#334155" 3
Draw-Line $g $plotX $plotY $plotX ($plotY + $plotH) "#334155" 3
for ($i = 0; $i -lt $months.Count; $i++) {
    $xpos = $plotX + 80 + $i * 135
    $barH = $cost[$i] * 5.5
    Fill-Rect $g ($xpos - 26) ($plotY + $plotH - $barH) 52 $barH "#bfdbfe"
    Draw-CenteredText $g $months[$i] ($xpos - 45) ($plotY + $plotH + 18) 90 35 22
}
$points = @()
for ($i = 0; $i -lt $users.Count; $i++) {
    $xpos = $plotX + 80 + $i * 135
    $ypos = $plotY + $plotH - (($users[$i] - 100) / 200) * $plotH
    $points += ,@($xpos, $ypos)
}
for ($i = 0; $i -lt $points.Count - 1; $i++) {
    Draw-Line $g $points[$i][0] $points[$i][1] $points[$i + 1][0] $points[$i + 1][1] "#dc2626" 5
}
for ($i = 0; $i -lt $points.Count; $i++) {
    Fill-Ellipse $g ($points[$i][0] - 8) ($points[$i][1] - 8) 16 16 "#dc2626"
    Draw-CenteredText $g ([string]$users[$i]) ($points[$i][0] - 35) ($points[$i][1] - 45) 70 28 20 "#dc2626" "Bold"
}
Draw-Text $g "Red line = users. Blue bars = cost." 660 170 25 "#475569"
Draw-Text $g "Cost labels: 30, 38, 35, 45, 50, 48" 150 690 24 "#475569"
Save-Canvas $c

Add-Item "mve_009" @("images/04_chart.png") "chart" "用户数最高的是哪个月份？" "May / 5月" "contains_any" @("May", "5月", "五月")
Add-Item "mve_010" @("images/04_chart.png") "chart" "3月到4月用户数增加了多少？" "80" "numeric" @("80", "80人", "增加80") @() 80 0
Add-Item "mve_011" @("images/04_chart.png") "chart" "成本最高的是哪个月份？" "May / 5月" "contains_any" @("May", "5月", "五月")

# 05 Schedule table
$c = New-Canvas "05_schedule_table.png" "Schedule Table Test"
$g = $c.Graphics
Fill-Rect $g 125 145 950 585 "#ffffff"
Draw-Rect $g 125 145 950 585 "#334155" 3
$cols = @(125, 325, 565, 825, 1075)
for ($i = 1; $i -lt $cols.Count - 1; $i++) { Draw-Line $g $cols[$i] 145 $cols[$i] 730 "#cbd5e1" 3 }
for ($r = 0; $r -lt 5; $r++) { Draw-Line $g 125 (145 + $r * 117) 1075 (145 + $r * 117) "#cbd5e1" 3 }
Fill-Rect $g 125 145 950 117 "#e0f2fe"
Draw-CenteredText $g "Day" 125 145 200 117 28 "#0f172a" "Bold"
Draw-CenteredText $g "Time" 325 145 240 117 28 "#0f172a" "Bold"
Draw-CenteredText $g "Task" 565 145 260 117 28 "#0f172a" "Bold"
Draw-CenteredText $g "Owner" 825 145 250 117 28 "#0f172a" "Bold"
$rows = @(
    @("Mon", "09:00", "Camera test", "Chen"),
    @("Wed", "14:30", "Model eval", "Li"),
    @("Fri", "16:00", "Demo", "Wang"),
    @("Sun", "10:15", "Report", "Zhao")
)
for ($r = 0; $r -lt $rows.Count; $r++) {
    $y = 262 + $r * 117
    Draw-CenteredText $g $rows[$r][0] 125 $y 200 117 28
    Draw-CenteredText $g $rows[$r][1] 325 $y 240 117 28
    Draw-CenteredText $g $rows[$r][2] 565 $y 260 117 28
    Draw-CenteredText $g $rows[$r][3] 825 $y 250 117 28
}
Save-Canvas $c

Add-Item "mve_012" @("images/05_schedule_table.png") "table" "模型评测安排在星期几、几点？" "周三 14:30" "contains_all" @("Wed 14:30", "周三14:30", "星期三14:30") @("14:30")
Add-Item "mve_013" @("images/05_schedule_table.png") "table" "周五演示的负责人是谁？" "Wang / 王" "contains_any" @("Wang", "王")

# 06 UI dashboard
$c = New-Canvas "06_ui_dashboard.png" "UI Dashboard Test"
$g = $c.Graphics
Fill-Rect $g 90 135 1020 610 "#ffffff"
Draw-Rect $g 90 135 1020 610 "#cbd5e1" 2
Draw-Text $g "Edge AI Console" 135 170 36 "#111827" "Bold"
$cards = @(
    @("Battery", "72%", "#ecfdf5", "#047857"),
    @("Status", "Online", "#eff6ff", "#1d4ed8"),
    @("Alerts", "3", "#fef2f2", "#b91c1c")
)
for ($i = 0; $i -lt 3; $i++) {
    $xcard = 135 + $i * 320
    Fill-Rect $g $xcard 250 270 145 $cards[$i][2]
    Draw-Rect $g $xcard 250 270 145 "#cbd5e1" 2
    Draw-Text $g $cards[$i][0] ($xcard + 22) 272 24 "#334155"
    Draw-Text $g $cards[$i][1] ($xcard + 22) 318 42 $cards[$i][3] "Bold"
}
Fill-Rect $g 135 470 240 78 "#2563eb"; Draw-CenteredText $g "Run Eval" 135 470 240 78 30 "#ffffff" "Bold"
Fill-Rect $g 410 470 240 78 "#e5e7eb"; Draw-CenteredText $g "Stop" 410 470 240 78 30 "#6b7280" "Bold"
Fill-Rect $g 685 470 240 78 "#f1f5f9"; Draw-CenteredText $g "Export Log" 685 470 240 78 30 "#334155" "Bold"
Draw-Text $g "Camera: connected     Model: qwen3.5-4b-int4     Latency target: 5s" 135 635 26 "#475569"
Save-Canvas $c

Add-Item "mve_014" @("images/06_ui_dashboard.png") "ui" "状态卡片显示的状态是什么？" "Online / 在线" "contains_any" @("Online", "online", "在线")
Add-Item "mve_015" @("images/06_ui_dashboard.png") "ui" "告警数量是多少？" "3" "numeric" @("3", "三个", "3个") @() 3 0
Add-Item "mve_016" @("images/06_ui_dashboard.png") "ui" "哪个按钮是蓝色高亮的？" "Run Eval" "contains_any" @("Run Eval", "运行评测", "评测")

# 07 Flow diagram
$c = New-Canvas "07_flow_diagram.png" "Pipeline Diagram Test"
$g = $c.Graphics
$boxY = 240
$labels = @("Input Image", "Preprocess", "VLM", "Decision", "Action")
for ($i = 0; $i -lt $labels.Count; $i++) {
    $xbox = 80 + $i * 220
    Fill-Rect $g $xbox $boxY 160 95 "#ffffff"
    Draw-Rect $g $xbox $boxY 160 95 "#2563eb" 3
    Draw-CenteredText $g $labels[$i] $xbox $boxY 160 95 24 "#1e3a8a" "Bold"
    if ($i -lt $labels.Count - 1) { Draw-Arrow $g ($xbox + 160) ($boxY + 48) ($xbox + 210) ($boxY + 48) "#2563eb" 4 }
}
Fill-Rect $g 305 420 110 62 "#fef3c7"; Draw-CenteredText $g "Resize" 305 420 110 62 22 "#92400e" "Bold"
Fill-Rect $g 430 420 110 62 "#fef3c7"; Draw-CenteredText $g "OCR" 430 420 110 62 22 "#92400e" "Bold"
Draw-Line $g 380 335 360 420 "#f59e0b" 3
Draw-Line $g 380 335 485 420 "#f59e0b" 3
Draw-Text $g "Preprocess has two sub-tasks: Resize and OCR." 80 610 30 "#475569"
Save-Canvas $c

Add-Item "mve_017" @("images/07_flow_diagram.png") "diagram" "VLM 之后的步骤是什么？" "Decision" "contains_any" @("Decision", "决策", "判断")
Add-Item "mve_018" @("images/07_flow_diagram.png") "diagram" "预处理阶段包含哪两个子任务？" "Resize 和 OCR" "contains_all" @("Resize OCR", "resize 和 OCR", "缩放 OCR") @("resize", "ocr")

# 08 Map spatial
$c = New-Canvas "08_floor_map.png" "Floor Map Spatial Test"
$g = $c.Graphics
Fill-Rect $g 120 135 960 610 "#ffffff"
Draw-Rect $g 120 135 960 610 "#334155" 5
Draw-Line $g 510 135 510 745 "#334155" 5
Draw-Line $g 120 470 1080 470 "#334155" 5
Draw-Text $g "Lab A" 170 170 36 "#0f172a" "Bold"
Draw-Text $g "Storage" 590 170 36 "#0f172a" "Bold"
Draw-Text $g "Charging Station" 590 515 34 "#0f172a" "Bold"
Fill-Ellipse $g 295 310 80 80 "#2563eb"; Draw-CenteredText $g "R1" 295 310 80 80 26 "#ffffff" "Bold"
Fill-Rect $g 725 270 190 115 "#fee2e2"; Draw-Rect $g 725 270 190 115 "#dc2626" 4; Draw-CenteredText $g "HAZARD`nZONE" 725 270 190 115 25 "#b91c1c" "Bold"
Fill-Rect $g 685 595 210 85 "#dcfce7"; Draw-Rect $g 685 595 210 85 "#16a34a" 4; Draw-CenteredText $g "CHARGE" 685 595 210 85 30 "#166534" "Bold"
Draw-Line $g 510 365 510 420 "#ffffff" 14
Draw-Text $g "Door" 525 378 24 "#475569"
Save-Canvas $c

Add-Item "mve_019" @("images/08_floor_map.png") "spatial_reasoning" "机器人 R1 当前在哪个区域？" "Lab A" "contains_any" @("Lab A", "实验室A", "A区")
Add-Item "mve_020" @("images/08_floor_map.png") "spatial_reasoning" "红色危险区位于哪个房间？" "Storage" "contains_any" @("Storage", "仓库", "储物间")
Add-Item "mve_021" @("images/08_floor_map.png") "spatial_reasoning" "充电站在机器人 R1 的哪个方向？" "右下方" "contains_any" @("右下", "右下方", "东南", "southeast")

# 09 Bilingual sign
$c = New-Canvas "09_bilingual_sign.png" "Bilingual Sign Test"
$g = $c.Graphics
Fill-Rect $g 170 180 860 420 "#111827"
Draw-Rect $g 170 180 860 420 "#facc15" 8
Draw-Text $g "入口  Entrance" 250 245 52 "#ffffff" "Bold"
Draw-Arrow $g 900 300 720 300 "#22c55e" 10
Draw-Text $g "出口  Exit" 250 420 52 "#ffffff" "Bold"
Draw-Arrow $g 650 465 880 465 "#ef4444" 10
Draw-Text $g "Left arrow points to Entrance. Right arrow points to Exit." 190 660 30 "#334155"
Save-Canvas $c

Add-Item "mve_022" @("images/09_bilingual_sign.png") "multilingual_ocr" "出口的箭头指向哪边？" "右边" "contains_any" @("右", "右边", "右侧", "right")
Add-Item "mve_023" @("images/09_bilingual_sign.png") "multilingual_ocr" "Entrance 对应的中文是什么？" "入口" "exact" @("入口")

# 10 Safety scene
$c = New-Canvas "10_safety_scene.png" "Safety Scene Test"
$g = $c.Graphics
Fill-Rect $g 0 78 1200 772 "#e5e7eb"
Fill-Rect $g 0 590 1200 260 "#94a3b8"
Fill-Rect $g 140 210 270 300 "#cbd5e1"; Draw-Rect $g 140 210 270 300 "#64748b" 3
Fill-Ellipse $g 545 220 95 95 "#fbbf24"; Draw-Text $g "helmet" 515 175 24 "#92400e"
Fill-Ellipse $g 560 300 70 70 "#fcd34d"
Draw-Line $g 595 370 595 520 "#111827" 8
Draw-Line $g 595 405 535 460 "#111827" 7; Draw-Line $g 595 405 660 450 "#111827" 7
Draw-Line $g 595 520 550 600 "#111827" 7; Draw-Line $g 595 520 650 600 "#111827" 7
Draw-Text $g "No goggles" 505 640 28 "#b91c1c" "Bold"
Fill-Rect $g 735 535 180 70 "#38bdf8"; Draw-Text $g "water spill" 740 555 24 "#075985" "Bold"
Fill-Rect $g 820 300 80 190 "#f97316"; Fill-Rect $g 795 480 130 25 "#ea580c"; Draw-Text $g "Wet Floor" 760 255 28 "#9a3412" "Bold"
Fill-Rect $g 995 355 55 150 "#ef4444"; Fill-Rect $g 985 330 75 35 "#dc2626"; Draw-Text $g "Fire`nextinguisher" 930 520 24 "#334155"
Save-Canvas $c

Add-Item "mve_024" @("images/10_safety_scene.png") "safety" "画面中最明显的地面安全隐患是什么？" "地面积水 / water spill" "contains_any" @("积水", "水渍", "地面有水", "water spill", "wet floor")
Add-Item "mve_025" @("images/10_safety_scene.png") "safety" "工人缺少哪种眼部防护？" "护目镜" "contains_any" @("护目镜", "goggles", "防护眼镜")

# 11-12 Before/after comparison
$c = New-Canvas "11_before_boxes.png" "Before: Inventory Boxes"
$g = $c.Graphics
$boxNames = @("A", "B", "C")
$counts = @(4, 5, 3)
for ($i = 0; $i -lt 3; $i++) {
    $xbox = 170 + $i * 310
    Fill-Rect $g $xbox 250 230 250 "#f8fafc"
    Draw-Rect $g $xbox 250 230 250 "#334155" 4
    Draw-CenteredText $g ("Box " + $boxNames[$i]) $xbox 275 230 60 34 "#0f172a" "Bold"
    Draw-CenteredText $g ("Count: " + $counts[$i]) $xbox 355 230 80 38 "#2563eb" "Bold"
}
Draw-Text $g "Snapshot time: 10:00" 170 625 30 "#475569"
Save-Canvas $c

$c = New-Canvas "12_after_boxes.png" "After: Inventory Boxes"
$g = $c.Graphics
$counts = @(4, 2, 3)
for ($i = 0; $i -lt 3; $i++) {
    $xbox = 170 + $i * 310
    Fill-Rect $g $xbox 250 230 250 "#f8fafc"
    Draw-Rect $g $xbox 250 230 230 "#334155" 4
    Draw-CenteredText $g ("Box " + $boxNames[$i]) $xbox 275 230 60 34 "#0f172a" "Bold"
    Draw-CenteredText $g ("Count: " + $counts[$i]) $xbox 355 230 80 38 "#2563eb" "Bold"
    if ($boxNames[$i] -eq "C") {
        Fill-Rect $g ($xbox + 55) 455 120 40 "#dc2626"
        Draw-CenteredText $g "ALERT" ($xbox + 55) 455 120 40 22 "#ffffff" "Bold"
    }
}
Draw-Text $g "Snapshot time: 10:30" 170 625 30 "#475569"
Save-Canvas $c

Add-Item "mve_026" @("images/11_before_boxes.png", "images/12_after_boxes.png") "multi_image_compare" "对比两张图，哪个箱子的数量减少了？" "Box B" "contains_any" @("Box B", "B箱", "箱子B", "B")
Add-Item "mve_027" @("images/11_before_boxes.png", "images/12_after_boxes.png") "multi_image_compare" "哪个箱子新增了红色警示标签？" "Box C" "contains_any" @("Box C", "C箱", "箱子C", "C")

$JsonlPath = Join-Path $Root "testset.jsonl"
$script:Items | ForEach-Object {
    $_ | ConvertTo-Json -Compress -Depth 8
} | Set-Content -Path $JsonlPath -Encoding UTF8

$TemplatePath = Join-Path $Root "predictions_template.jsonl"
$script:Items | ForEach-Object {
    [ordered]@{
        id = $_.id
        answer = ""
    } | ConvertTo-Json -Compress
} | Set-Content -Path $TemplatePath -Encoding UTF8

$AnswerKeyPath = Join-Path $Root "answer_key.md"
$answerLines = @("# Multimodal Eval Answer Key", "")
foreach ($item in $script:Items) {
    $answerLines += ("- **{0}** `{1}`: {2}" -f $item.id, $item.category, $item.expected_answer)
}
$answerLines | Set-Content -Path $AnswerKeyPath -Encoding UTF8

$ReadmePath = Join-Path $Root "README.md"
@"
# Multimodal Model Eval Set

This folder contains a deterministic Chinese multimodal evaluation set for quickly comparing local or cloud vision-language models.

## Contents

- `images/`: 12 generated PNG images, 1200 x 850.
- `testset.jsonl`: 27 labeled evaluation items.
- `predictions_template.jsonl`: fill this with model answers.
- `answer_key.md`: human-readable expected answers.
- `score_answers.js`: simple local scorer for exact, contains, and numeric checks.

## JSONL Fields

- `id`: stable sample id.
- `images`: one or more relative image paths. Multi-image items use two image paths.
- `category`: skill being tested, such as OCR, chart, table, spatial reasoning, UI, or safety.
- `question`: Chinese user-facing question.
- `expected_answer`: concise gold answer.
- `answer_type`: `exact`, `contains_any`, `contains_all`, or `numeric`.
- `acceptable_answers`: allowed variants for automatic scoring.
- `numeric_value` and `tolerance`: used when `answer_type` is `numeric`.

## How to Use

1. Send each item question plus its image(s) to the model.
2. Save responses as JSONL with fields `id` and `answer`.
3. Run:

```powershell
node .\score_answers.js .\testset.jsonl .\predictions.jsonl
```

The scorer is intentionally simple. For final model selection, review wrong answers manually, especially for semantically correct Chinese paraphrases.
"@ | Set-Content -Path $ReadmePath -Encoding UTF8

Write-Host "Generated $($script:Items.Count) evaluation items"
Write-Host "Images: $ImagesDir"
Write-Host "Manifest: $JsonlPath"
