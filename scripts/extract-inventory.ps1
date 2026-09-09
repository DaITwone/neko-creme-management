param([string]$Path, [string]$Output = "$PSScriptRoot/../src/data/inventorySource.json")
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
$stream = [IO.File]::Open($Path, 'Open', 'Read', 'ReadWrite')
$zip = [IO.Compression.ZipArchive]::new($stream)
function Read-Xml($name) {
  $reader = [IO.StreamReader]::new($zip.GetEntry($name).Open())
  try { return [xml]$reader.ReadToEnd() } finally { $reader.Dispose() }
}
try {
  $workbook = Read-Xml 'xl/workbook.xml'
  $sheetName = 'CHI PH' + [char]0x00CD
  $sheet = $workbook.workbook.sheets.sheet | Where-Object name -eq $sheetName
  if (!$sheet) { throw 'Missing cost sheet' }
  $rels = Read-Xml 'xl/_rels/workbook.xml.rels'
  $rid = $sheet.GetAttribute('id', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
  $target = ($rels.Relationships.Relationship | Where-Object Id -eq $rid).Target
  $strings = Read-Xml 'xl/sharedStrings.xml'
  $shared = @($strings.sst.si | ForEach-Object { $_.InnerText })
  $xml = Read-Xml ("xl/" + $target)
  $rows = @()
  $group = ''
  foreach ($row in $xml.worksheet.sheetData.row) {
    $number = [int]$row.r
    if ($number -lt 3 -or $number -gt 86) { continue }
    $cells = @{}
    foreach ($cell in $row.c) {
      $column = $cell.r -replace '[0-9]', ''
      $value = [string]$cell.v
      if ($cell.t -eq 's') { $value = $shared[[int]$value] }
      if ($cell.t -eq 'inlineStr') { $value = $cell.is.InnerText }
      $cells[$column] = $value
    }
    if ($cells['A']) { $group = $cells['A'] }
    $rows += [pscustomobject][ordered]@{ row=$number; sourceGroup=$group; name=$cells['B']; brand=$cells['C']; packSize=$cells['D']; unitPrice=[double]$cells['E']; monthlyTargetQty=[double]$cells['F']; sourceTotal=[double]$cells['G'] }
  }
  if ($rows.Count -ne 84) { throw 'Expected 84 rows' }
  $json = ConvertTo-Json -InputObject $rows -Depth 5
  [IO.File]::WriteAllText([IO.Path]::GetFullPath($Output), $json, [Text.UTF8Encoding]::new($false))
  $rows | Format-Table row,sourceGroup,name,packSize,unitPrice,monthlyTargetQty -AutoSize
  ($rows | ForEach-Object { $_.unitPrice * $_.monthlyTargetQty } | Measure-Object -Sum).Sum
} finally { $zip.Dispose(); $stream.Dispose() }
