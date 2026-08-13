# يولّد بطاقة المشاركة (og:image) بخط ثمانية.
# الخط يُحمَّل من ملفه مؤقتًا ويُرسَم داخل الصورة — لا يُنشر كملف خط،
# وهو الاستخدام الذي يجيزه ترخيص ثمانية (تضمين في تصميم، لا web embedding).
param(
  [string]$FontDir = "C:\Users\na900\AppData\Local\Temp\claude\C--Users-na900-Downloads-qu\f246b97b-6e6f-4742-826c-3d2151588238\scratchpad\thmanyah\thmanyah typeface",
  [string]$Out     = "C:\Users\na900\Downloads\qu\silah\cover.png"
)

Add-Type -AssemblyName System.Drawing

$display = Join-Path $FontDir "thmanyahserifdisplay\otf\thmanyahserifdisplay-Bold.otf"
$sans    = Join-Path $FontDir "thmanyahsans\otf\thmanyahsans-Medium.otf"
foreach ($f in @($display, $sans)) {
  if (-not (Test-Path $f)) { Write-Error "font not found: $f"; exit 1 }
}

$pfc = New-Object System.Drawing.Text.PrivateFontCollection
$pfc.AddFontFile($display)
$pfc.AddFontFile($sans)
$famDisplay = $pfc.Families | Where-Object { $_.Name -match 'display' } | Select-Object -First 1
$famSans    = $pfc.Families | Where-Object { $_.Name -notmatch 'display' } | Select-Object -First 1
if (-not $famDisplay) { $famDisplay = $pfc.Families[0] }
if (-not $famSans)    { $famSans    = $pfc.Families[0] }

$W = 1200; $H = 630
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'AntiAliasGridFit'

# أرضية متدرّجة
$rect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect,
  [System.Drawing.Color]::FromArgb(18,138,107), [System.Drawing.Color]::FromArgb(8,62,49), 40)
$g.FillRectangle($bg, $rect)
$hl = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(20,255,255,255))
$g.FillEllipse($hl, -170, -230, 640, 640)
$g.FillEllipse($hl, 890, 370, 540, 540)

# شعار الشجرة
$k = 1.0
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(240,255,255,255), 9)
$pen.StartCap = 'Round'; $pen.EndCap = 'Round'
$cx = 985; $cy = 250
$g.DrawLine($pen, $cx, ($cy+38), $cx, ($cy+108))
$g.DrawLine($pen, $cx, ($cy+108), ($cx-78), ($cy+156))
$g.DrawLine($pen, $cx, ($cy+108), ($cx+78), ($cy+156))
$g.DrawLine($pen, $cx, ($cy+108), $cx, ($cy+192))
$w = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.FillEllipse($w, ($cx-30), ($cy+8), 60, 60)
$g.FillEllipse($w, ($cx-102), ($cy+132), 48, 48)
$g.FillEllipse($w, ($cx+54), ($cy+132), 48, 48)
$g.FillEllipse($w, ($cx-22), ($cy+170), 44, 44)
$gold = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(215,245,199,106), 6)
$g.DrawEllipse($gold, ($cx-56), ($cy-18), 112, 112)

# النصوص — RTL
$fmt = New-Object System.Drawing.StringFormat
$fmt.FormatFlags = [System.Drawing.StringFormatFlags]::DirectionRightToLeft
$fmt.Alignment = 'Near'

$fTitle = New-Object System.Drawing.Font($famDisplay, 104, [System.Drawing.FontStyle]::Bold)
$fSub   = New-Object System.Drawing.Font($famSans, 34, [System.Drawing.FontStyle]::Regular)
$fBody  = New-Object System.Drawing.Font($famSans, 24, [System.Drawing.FontStyle]::Regular)

$goldB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245,199,106))
$soft  = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(228,235,248,243))

$g.DrawString("صِلة", $fTitle, $w, (New-Object System.Drawing.RectangleF(70,120,720,170)), $fmt)
$g.DrawString("رفيقك اليومي في صلة الأرحام", $fSub, $goldB, (New-Object System.Drawing.RectangleF(70,290,720,70)), $fmt)
$g.DrawString("شجرة أرحامك · مؤشر حرارة الصلة", $fBody, $soft, (New-Object System.Drawing.RectangleF(70,382,720,46)), $fmt)
$g.DrawString("لقاءات العائلة · رمضان والعيد", $fBody, $soft, (New-Object System.Drawing.RectangleF(70,428,720,46)), $fmt)
$g.DrawString("«مَنْ وَصَلَنِي وَصَلَهُ اللَّهُ»", $fBody, $goldB, (New-Object System.Drawing.RectangleF(70,510,720,46)), $fmt)

$g.Dispose()
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$pfc.Dispose()
Write-Output "cover written: $Out ($([math]::Round((Get-Item $Out).Length/1KB,1)) KB)"
