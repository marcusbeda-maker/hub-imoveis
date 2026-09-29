# Instalador do video-imovel para Windows.
# Rode assim (PowerShell comum, NAO precisa ser administrador):
#   powershell -ExecutionPolicy Bypass -File "CAMINHO\video-imovel\instalar-windows.ps1"
#
# O que ele faz (pode rodar de novo quantas vezes quiser; so instala o que falta):
#   1. copia o plugin para %USERPROFILE%\.claude\plugins-local\video-imovel
#   2. instala Node.js, Python e FFmpeg pelo winget (se faltarem)
#   3. baixa o whisper-cli (transcricao) e poe no PATH do usuario
#   4. baixa o modelo de transcricao em portugues (~466 MB, uma vez)
#   5. instala o edge-tts (vozes Francisca e Antonio)
#   6. cria %USERPROFILE%\.video-imovel\marca.json para voce preencher
# Mensagens sem acento de proposito: o PowerShell 5 do Windows le .ps1 como ANSI.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'   # deixa o Invoke-WebRequest bem mais rapido

function Passo($texto) { Write-Host ""; Write-Host "==> $texto" -ForegroundColor Cyan }
function Ok($texto) { Write-Host "    OK  $texto" -ForegroundColor Green }
function Aviso($texto) { Write-Host "    !!  $texto" -ForegroundColor Yellow }

function Atualizar-Path {
  $maquina = [Environment]::GetEnvironmentVariable('Path', 'Machine')
  $usuario = [Environment]::GetEnvironmentVariable('Path', 'User')
  $env:Path = "$maquina;$usuario"
}

function Tem($comando) {
  $c = Get-Command $comando -ErrorAction SilentlyContinue
  if (-not $c) { return $false }
  # o "python" da pasta WindowsApps e so um atalho que abre a Microsoft Store
  if ($c.Source -like '*\WindowsApps\*') { return $false }
  return $true
}

function Python-Cmd {
  if (Tem 'py') { return 'py' }
  if (Tem 'python') { return 'python' }
  return $null
}

function Instalar-Winget($id, $comando) {
  if (Tem $comando) { Ok "$comando ja instalado"; return }
  if (-not (Tem 'winget')) { throw "winget nao encontrado. Atualize o 'Instalador de Aplicativo' na Microsoft Store e rode de novo." }
  Write-Host "    instalando $id ..."
  winget install --id $id -e --silent --accept-source-agreements --accept-package-agreements | Out-Host
  Atualizar-Path
  if (Tem $comando) { Ok "$comando instalado" } else { Aviso "$comando instalado, mas so aparece num PowerShell NOVO. Feche, abra outro e rode este script de novo." }
}

$origem = $PSScriptRoot
$destino = Join-Path $env:USERPROFILE '.claude\plugins-local\video-imovel'
$pastaUsuario = Join-Path $env:USERPROFILE '.video-imovel'

# 1. plugin -------------------------------------------------------------------
Passo "1/6 Copiando o plugin"
if (-not (Test-Path (Join-Path $origem '.claude-plugin\plugin.json'))) {
  throw "Nao achei .claude-plugin\plugin.json ao lado deste script. Rode o instalar-windows.ps1 que esta DENTRO da pasta video-imovel."
}
if ((Resolve-Path $origem).Path -ne $destino) {
  New-Item -ItemType Directory -Force -Path $destino | Out-Null
  robocopy $origem $destino /E /XD .git node_modules /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy falhou (codigo $LASTEXITCODE)" }
  Ok "copiado para $destino"
} else {
  Ok "ja esta em $destino"
}

# 2. Node, Python, FFmpeg -----------------------------------------------------
Passo "2/6 Node.js, Python e FFmpeg"
Instalar-Winget 'OpenJS.NodeJS.LTS' 'node'
if (Python-Cmd) { Ok "python ja instalado" } else { Instalar-Winget 'Python.Python.3.12' 'py' }
Instalar-Winget 'Gyan.FFmpeg' 'ffmpeg'

# 3. whisper-cli --------------------------------------------------------------
Passo "3/6 whisper-cli (transcricao)"
if (Tem 'whisper-cli') {
  Ok "whisper-cli ja instalado"
} else {
  $pastaWhisper = Join-Path $pastaUsuario 'whisper'
  New-Item -ItemType Directory -Force -Path $pastaWhisper | Out-Null
  $zip = Join-Path $pastaWhisper 'whisper-bin-x64.zip'
  $url = 'https://github.com/ggml-org/whisper.cpp/releases/download/v1.8.3/whisper-bin-x64.zip'
  Write-Host "    baixando $url"
  Invoke-WebRequest -Uri $url -OutFile $zip
  Expand-Archive -Path $zip -DestinationPath $pastaWhisper -Force
  $exe = Get-ChildItem -Path $pastaWhisper -Recurse -Filter 'whisper-cli.exe' | Select-Object -First 1
  if (-not $exe) { throw "Baixei o whisper, mas nao achei whisper-cli.exe dentro do zip." }
  $pastaExe = $exe.DirectoryName
  $pathUsuario = [Environment]::GetEnvironmentVariable('Path', 'User')
  if ($pathUsuario -notlike "*$pastaExe*") {
    [Environment]::SetEnvironmentVariable('Path', "$pathUsuario;$pastaExe", 'User')
  }
  Atualizar-Path
  Ok "whisper-cli em $pastaExe"
}

# 4. modelo de transcricao ----------------------------------------------------
Passo "4/6 Modelo de transcricao multilingue (ggml-small, ~466 MB)"
$pastaModelo = Join-Path $env:USERPROFILE '.cache\whisper-ggml'
$modelo = Join-Path $pastaModelo 'ggml-small.bin'
if ((Test-Path $modelo) -and ((Get-Item $modelo).Length -gt 400MB)) {
  Ok "modelo ja baixado"
} else {
  New-Item -ItemType Directory -Force -Path $pastaModelo | Out-Null
  Write-Host "    baixando... pode levar alguns minutos"
  Invoke-WebRequest -Uri 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin' -OutFile $modelo
  Ok "modelo salvo em $modelo"
}

# 5. edge-tts -----------------------------------------------------------------
Passo "5/6 Vozes (edge-tts)"
$py = Python-Cmd
if ($py) {
  & $py -m pip install --user --quiet --upgrade edge-tts | Out-Host
  Ok "edge-tts instalado (vozes pt-BR-FranciscaNeural e pt-BR-AntonioNeural)"
} else {
  Aviso "Python ainda nao aparece neste PowerShell. Abra um PowerShell NOVO e rode o script de novo."
}

# 6. marca --------------------------------------------------------------------
Passo "6/6 Sua marca"
New-Item -ItemType Directory -Force -Path $pastaUsuario | Out-Null
$marca = Join-Path $pastaUsuario 'marca.json'
if (Test-Path $marca) {
  Ok "marca.json ja existe (nao mexi): $marca"
} else {
  Copy-Item -Path (Join-Path $destino 'template\src\marca.json') -Destination $marca
  Ok "criado $marca  <- abra no Bloco de Notas e preencha"
}

Write-Host ""
Write-Host "PRONTO. Proximos passos:" -ForegroundColor Green
Write-Host "  1) Preencha:  notepad `"$marca`""
Write-Host "  2) No Claude Code rode, um de cada vez:"
Write-Host "       /plugin marketplace add $destino"
Write-Host "       /plugin install video-imovel@video-imovel"
Write-Host "  3) Feche e abra o Claude Code. Teste:  /video-imovel C:\caminho\do\video.mp4 reels"
