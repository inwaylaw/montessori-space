$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ImagesDir = Join-Path $Root "images"
New-Item -ItemType Directory -Force -Path $ImagesDir | Out-Null

$script:Items = @()

function C([string]$hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }
function B([string]$hex) { New-Object System.Drawing.SolidBrush((C $hex)) }
function P([string]$hex, [float]$w = 1) { New-Object System.Drawing.Pen((C $hex), $w) }
function F([float]$size, [string]$style = "Regular") {
    $fs = [System.Drawing.FontStyle]::Regular
    if ($style -eq "Bold") { $fs = [System.Drawing.FontStyle]::Bold }
    New-Object System.Drawing.Font("Microsoft YaHei", $size, $fs, [System.Drawing.GraphicsUnit]::Pixel)
}

function Text($g, [string]$text, [float]$x, [float]$y, [float]$size = 24, [string]$color = "#17232c", [string]$style = "Regular") {
    $font = F $size $style
    $brush = B $color
    $g.DrawString($text, $font, $brush, $x, $y)
    $brush.Dispose(); $font.Dispose()
}

function Center($g, [string]$text, [float]$x, [float]$y, [float]$w, [float]$h, [float]$size = 22, [string]$color = "#17232c", [string]$style = "Regular") {
    $font = F $size $style
    $brush = B $color
    $fmt = New-Object System.Drawing.StringFormat
    $fmt.Alignment = [System.Drawing.StringAlignment]::Center
    $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF($x, $y, $w, $h)
    $g.DrawString($text, $font, $brush, $rect, $fmt)
    $fmt.Dispose(); $brush.Dispose(); $font.Dispose()
}

function Rect($g, [float]$x, [float]$y, [float]$w, [float]$h, [string]$fill, [string]$stroke = "", [float]$sw = 1) {
    $brush = B $fill
    $g.FillRectangle($brush, $x, $y, $w, $h)
    $brush.Dispose()
    if ($stroke -ne "") {
        $pen = P $stroke $sw
        $g.DrawRectangle($pen, $x, $y, $w, $h)
        $pen.Dispose()
    }
}

function Ellipse($g, [float]$x, [float]$y, [float]$w, [float]$h, [string]$fill, [string]$stroke = "", [float]$sw = 1) {
    $brush = B $fill
    $g.FillEllipse($brush, $x, $y, $w, $h)
    $brush.Dispose()
    if ($stroke -ne "") {
        $pen = P $stroke $sw
        $g.DrawEllipse($pen, $x, $y, $w, $h)
        $pen.Dispose()
    }
}

function Line($g, [float]$x1, [float]$y1, [float]$x2, [float]$y2, [string]$color = "#55718a", [float]$w = 3) {
    $pen = P $color $w
    $g.DrawLine($pen, $x1, $y1, $x2, $y2)
    $pen.Dispose()
}

function Canvas([string]$name, [string]$title, [string]$time) {
    $bmp = New-Object System.Drawing.Bitmap(1280, 720)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.Clear((C "#f7f4ef"))
    Rect $g 0 0 1280 56 "#17332c"
    Text $g $title 28 12 26 "#ffffff" "Bold"
    Text $g $time 1040 15 21 "#dde8ea"
    Rect $g 0 655 1280 65 "#eef2ea"
    Text $g "Synthetic video frame - no real child data" 28 674 22 "#6b7e78"
    return [ordered]@{ Bitmap = $bmp; Graphics = $g; Path = Join-Path $ImagesDir $name }
}

function Save($c) {
    $c.Bitmap.Save($c.Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $c.Graphics.Dispose(); $c.Bitmap.Dispose()
}

function Shelf($g, [float]$x, [float]$y, [float]$w = 310, [float]$h = 330) {
    Rect $g $x $y $w $h "#e8d8bd" "#8b6f4e" 4
    Line $g $x ($y + 110) ($x + $w) ($y + 110) "#8b6f4e" 4
    Line $g $x ($y + 220) ($x + $w) ($y + 220) "#8b6f4e" 4
    Text $g "低矮教具架" ($x + 70) ($y + $h + 16) 22 "#55718a"
}

function Child($g, [float]$x, [float]$y, [string]$shirt = "#55718a") {
    Ellipse $g ($x + 28) $y 48 48 "#d8a678"
    Rect $g ($x + 22) ($y + 52) 62 74 $shirt "#334155" 2
    Line $g ($x + 22) ($y + 78) ($x - 22) ($y + 120) "#334155" 8
    Line $g ($x + 84) ($y + 78) ($x + 126) ($y + 118) "#334155" 8
    Line $g ($x + 42) ($y + 126) ($x + 12) ($y + 178) "#334155" 8
    Line $g ($x + 66) ($y + 126) ($x + 94) ($y + 178) "#334155" 8
}

function Mat($g, [float]$x, [float]$y, [float]$w = 430, [float]$h = 255) {
    Rect $g $x $y $w $h "#dbeafe" "#55718a" 4
    Text $g "地垫工作区" ($x + 18) ($y - 34) 23 "#33536b"
}

function AddItem([string]$id, [string[]]$images, [string]$category, [string]$question, [string]$expected, [string]$type = "contains_any", [string[]]$answers = @()) {
    $entry = [ordered]@{
        id = $id
        images = $images
        category = $category
        question = $question
        expected_answer = $expected
        answer_type = $type
        acceptable_answers = $answers
        expected_keywords = @()
    }
    $script:Items += $entry
}

function AddKeywordItem {
    param(
        [string]$id,
        [string[]]$images,
        [string]$category,
        [string]$question,
        [string]$expected,
        [string[]]$answers = @(),
        [string[]]$keywords = @()
    )

    $script:Items += [ordered]@{
        id = $id
        images = $images
        category = $category
        question = $question
        expected_answer = $expected
        answer_type = "contains_all"
        acceptable_answers = $answers
        expected_keywords = $keywords
    }
}

function AddNumericItem {
    param(
        [string]$id,
        [string[]]$images,
        [string]$category,
        [string]$question,
        [string]$expected,
        [string[]]$answers = @(),
        [double]$num
    )

    $script:Items += [ordered]@{
        id = $id
        images = $images
        category = $category
        question = $question
        expected_answer = $expected
        answer_type = "numeric"
        acceptable_answers = $answers
        expected_keywords = @()
        numeric_value = $num
        tolerance = 0
    }
}

# 01 Pink tower on mat
$c = Canvas "01_pink_tower_mat.png" "Montessori frame 01 / floor work" "09:12:08"
$g = $c.Graphics
Shelf $g 70 110
Mat $g 460 300
Child $g 820 258 "#8fb3a5"
$sizes = @(96, 78, 60, 44)
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $s = $sizes[$i]
    Rect $g (555 + $i * 10) (465 - $i * 48) $s $s "#f2a7b5" "#8b5d69" 3
}
Text $g "frame_id: ms-activity-001" 860 606 22 "#6b7e78"
Save $c

AddItem "ms_001" @("images/01_pink_tower_mat.png") "material_recognition" "这一帧最可能记录的是哪种蒙氏教具活动？" "粉红塔" "contains_any" @("粉红塔", "pink tower")
AddItem "ms_002" @("images/01_pink_tower_mat.png") "work_area" "孩子主要在哪个区域进行活动？" "地垫工作区" "contains_any" @("地垫", "地垫工作区", "地板工作区", "floor mat")

# 02 Practical life pouring
$c = Canvas "02_pouring_tray.png" "Montessori frame 02 / practical life" "09:26:41"
$g = $c.Graphics
Rect $g 130 180 760 330 "#f5ead8" "#8b6f4e" 4
Text $g "观察桌" 170 205 26 "#55718a" "Bold"
Rect $g 380 275 360 170 "#d9c7a3" "#8b6f4e" 4
Center $g "托盘" 390 408 90 30 22 "#6b5a43"
Rect $g 440 300 75 95 "#cfe8f3" "#55718a" 3
Rect $g 620 300 75 95 "#ffffff" "#55718a" 3
Ellipse $g 550 382 24 14 "#5bbad5"
Ellipse $g 580 404 20 12 "#5bbad5"
Child $g 900 235 "#d8b06a"
Line $g 500 315 630 335 "#5bbad5" 6
Text $g "frame_id: ms-activity-002" 860 606 22 "#6b7e78"
Save $c

AddItem "ms_003" @("images/02_pouring_tray.png") "activity_type" "这一帧最接近哪类活动？" "倒水练习" "contains_any" @("倒水", "倒水练习", "实用生活", "practical life", "pouring")
AddItem "ms_004" @("images/02_pouring_tray.png") "environment_cue" "画面中最需要家长稍后复核的环境线索是什么？" "托盘有水滴" "contains_any" @("水滴", "托盘有水", "托盘有水滴", "洒水")

# 03 Red rods not returned
$c = Canvas "03_red_rods_not_returned.png" "Montessori frame 03 / order cue" "10:04:19"
$g = $c.Graphics
Shelf $g 80 110 360 330
for ($i = 0; $i -lt 5; $i++) { Rect $g (130 + $i * 42) 170 34 185 "#dc4f45" "#7f1d1d" 2 }
Rect $g 286 170 34 185 "#f7f4ef" "#8b6f4e" 2
Rect $g 640 420 310 36 "#dc4f45" "#7f1d1d" 3
Rect $g 690 470 245 34 "#dc4f45" "#7f1d1d" 3
Child $g 900 250 "#8fb3a5"
Text $g "frame_id: ms-activity-003" 860 606 22 "#6b7e78"
Save $c

AddItem "ms_005" @("images/03_red_rods_not_returned.png") "order_return" "哪种教具没有完全归位？" "红棒" "contains_any" @("红棒", "红色长棒", "red rods")
AddItem "ms_006" @("images/03_red_rods_not_returned.png") "observation_tag" "这条观察更适合归入哪个标签？" "归位/秩序" "contains_any" @("归位", "秩序", "整理", "order")

# 04 Cutting work
$c = Canvas "04_cutting_table.png" "Montessori frame 04 / art table" "10:31:52"
$g = $c.Graphics
Rect $g 160 175 760 360 "#f5ead8" "#8b6f4e" 4
Text $g "观察桌" 190 200 26 "#55718a" "Bold"
Rect $g 420 270 180 130 "#ffffff" "#94a3b8" 3
Line $g 455 300 565 370 "#94a3b8" 2
Line $g 455 370 565 300 "#94a3b8" 2
Line $g 650 310 720 365 "#334155" 8
Ellipse $g 632 292 28 28 "#e0f2fe" "#334155" 3
Ellipse $g 682 292 28 28 "#e0f2fe" "#334155" 3
Text $g "剪刀" 635 380 22 "#6b7e78"
Child $g 930 240 "#b78fb3"
Text $g "frame_id: ms-activity-004" 860 606 22 "#6b7e78"
Save $c

AddItem "ms_007" @("images/04_cutting_table.png") "material_recognition" "孩子正在使用哪类材料？" "剪纸/美工材料" "contains_any" @("剪纸", "美工", "手工", "美工材料", "cutting")
AddItem "ms_008" @("images/04_cutting_table.png") "safety_cue" "画面中最明显需要注意的安全物品是什么？" "剪刀" "contains_any" @("剪刀", "scissors")

# 05 Observation boundary card
$c = Canvas "05_observation_boundary.png" "Montessori observation boundary" "11:02:00"
$g = $c.Graphics
Rect $g 120 135 1040 440 "#ffffff" "#dde8ea" 4
Text $g "从视频帧生成观察记录时，应避免诊断和评分。" 170 170 30 "#17332c" "Bold"
Rect $g 180 250 850 70 "#ecfdf5" "#4f8a5b" 3
Text $g "A  孩子正在地垫上使用粉红塔，稍后可确认是否完成归位。" 210 270 25 "#17332c"
Rect $g 180 340 850 70 "#fff7ed" "#d88c43" 3
Text $g "B  孩子今天情绪很差，需要干预。" 210 360 25 "#17332c"
Rect $g 180 430 850 70 "#fef2f2" "#b91c1c" 3
Text $g "C  孩子发展落后，专注力不足。" 210 450 25 "#17332c"
Save $c

AddItem "ms_009" @("images/05_observation_boundary.png") "privacy_boundary" "哪一条更符合观察而不诊断的项目边界？" "A" "contains_any" @("A", "A条", "选A")

# 06-08 Sequence: take, work, return beads
$c = Canvas "06_sequence_take_beads.png" "Sequence frame A / take material" "11:15:10"
$g = $c.Graphics
Shelf $g 80 110 360 330
Rect $g 170 175 155 70 "#a7c7e7" "#55718a" 3
Center $g "串珠盒" 170 175 155 70 24 "#17332c"
Child $g 520 230 "#8fb3a5"
Rect $g 610 305 170 70 "#a7c7e7" "#55718a" 3
Center $g "串珠盒" 610 305 170 70 24 "#17332c"
Save $c

$c = Canvas "07_sequence_work_beads.png" "Sequence frame B / work with material" "11:19:40"
$g = $c.Graphics
Mat $g 420 285 500 290
Child $g 900 250 "#8fb3a5"
for ($i = 0; $i -lt 9; $i++) { Ellipse $g (520 + $i * 32) 390 22 22 "#60a5fa" "#1e3a8a" 2 }
Text $g "串珠操作中" 560 455 26 "#33536b"
Save $c

$c = Canvas "08_sequence_return_beads.png" "Sequence frame C / returned material" "11:27:05"
$g = $c.Graphics
Shelf $g 80 110 360 330
Rect $g 170 175 155 70 "#a7c7e7" "#55718a" 3
Center $g "串珠盒" 170 175 155 70 24 "#17332c"
Child $g 540 250 "#8fb3a5"
Rect $g 500 520 180 48 "#dcfce7" "#4f8a5b" 3
Center $g "已归位" 500 520 180 48 24 "#166534" "Bold"
Save $c

AddKeywordItem -id "ms_010" -images @("images/06_sequence_take_beads.png","images/07_sequence_work_beads.png","images/08_sequence_return_beads.png") -category "multi_frame_event" -question "三帧最准确的事件顺序是什么？" -expected "取用串珠-操作-归位" -answers @("取用串珠-操作-归位") -keywords @("取用","串珠","操作","归位")
AddItem "ms_011" @("images/06_sequence_take_beads.png","images/07_sequence_work_beads.png","images/08_sequence_return_beads.png") "multi_frame_event" "最后一帧中串珠盒的状态是什么？" "已归位" "contains_any" @("已归位", "归位", "放回")

# 09 Two work areas
$c = Canvas "09_two_work_areas.png" "Montessori frame 09 / two work areas" "14:05:33"
$g = $c.Graphics
Shelf $g 60 110 320 330
Mat $g 450 150 290 220
Mat $g 820 330 300 220
Child $g 520 205 "#8fb3a5"
Child $g 910 385 "#d8b06a"
Rect $g 575 290 75 55 "#f2a7b5" "#8b5d69" 3
Rect $g 980 455 70 48 "#a7c7e7" "#55718a" 3
Text $g "frame_id: ms-activity-009" 860 606 22 "#6b7e78"
Save $c

AddNumericItem -id "ms_012" -images @("images/09_two_work_areas.png") -category "counting_work_areas" -question "画面中有几个正在使用的工作区？" -expected "2" -answers @("2", "两个", "2个") -num 2
AddItem "ms_013" @("images/09_two_work_areas.png") "space_layout" "两个工作区主要分布在教具架的哪一侧？" "右侧" "contains_any" @("右侧", "右边", "右", "right")

# 10 Report preview
$c = Canvas "10_daily_report_preview.png" "Daily observation preview" "16:40:00"
$g = $c.Graphics
Rect $g 160 105 960 500 "#ffffff" "#dde8ea" 4
Text $g "今日整理观察" 210 145 34 "#17332c" "Bold"
Rect $g 210 220 850 60 "#ecfdf5" "#4f8a5b" 2
Text $g "专注片段：粉红塔地垫工作约 12 分钟" 240 238 25 "#17332c"
Rect $g 210 305 850 60 "#eff6ff" "#55718a" 2
Text $g "实用生活：倒水练习，托盘有水滴，待确认" 240 323 25 "#17332c"
Rect $g 210 390 850 60 "#fff7ed" "#d88c43" 2
Text $g "归位提醒：红棒未完全归位" 240 408 25 "#17332c"
Rect $g 210 475 850 60 "#f8fafc" "#94a3b8" 2
Text $g "边界：不做儿童评分、诊断或情绪识别" 240 493 25 "#17332c"
Save $c

AddKeywordItem -id "ms_014" -images @("images/10_daily_report_preview.png") -category "report_reading" -question "报告中待家长确认的观察是什么？" -expected "倒水练习托盘有水滴" -answers @("倒水练习托盘有水滴") -keywords @("倒水","托盘","水滴")
AddKeywordItem -id "ms_015" -images @("images/10_daily_report_preview.png") -category "privacy_boundary" -question "报告明确不做什么？" -expected "儿童评分、诊断或情绪识别" -answers @("儿童评分、诊断或情绪识别") -keywords @("评分","诊断","情绪识别")

$JsonlPath = Join-Path $Root "testset.jsonl"
$script:Items | ForEach-Object { $_ | ConvertTo-Json -Compress -Depth 8 } | Set-Content -Path $JsonlPath -Encoding UTF8

$AnswerKeyPath = Join-Path $Root "answer_key.md"
$lines = @("# Montessori Frame Eval Answer Key", "")
foreach ($item in $script:Items) {
    $lines += ("- **{0}** `{1}`: {2}" -f $item.id, $item.category, $item.expected_answer)
}
$lines | Set-Content -Path $AnswerKeyPath -Encoding UTF8

$ReadmePath = Join-Path $Root "README.md"
$readme = @(
    "# Montessori Frame Eval Set",
    "",
    "Synthetic Montessori Space video-frame evaluation set. It uses generated frames only and contains no real child data.",
    "",
    "## Coverage",
    "",
    "- Montessori material recognition",
    "- Work-area recognition",
    "- Practical-life activity recognition",
    "- Order / return-to-shelf cues",
    "- Safety and environment cues",
    "- Observation-boundary language",
    "- Multi-frame event sequencing",
    "- Daily report reading",
    "",
    "## Run",
    "",
    '```powershell',
    "node ..\model-selection\run_openrouter_eval.js --models qwen/qwen3-vl-8b-instruct --testset .\testset.jsonl --delay-ms 1500",
    '```'
)
$readme | Set-Content -Path $ReadmePath -Encoding UTF8

Write-Host "Generated $($script:Items.Count) Montessori frame evaluation items"
Write-Host "Images: $ImagesDir"
Write-Host "Manifest: $JsonlPath"
