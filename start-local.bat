@echo off
setlocal
pushd "%~dp0"
where node >nul 2>nul
if %errorlevel%==0 (
  start "Griya Madu Local Server" cmd /k "node server.js"
) else (
  where py >nul 2>nul
  if %errorlevel%==0 (
    start "Griya Madu Local Server" cmd /k "py -m http.server 8765 --bind 127.0.0.1"
  ) else (
    where python >nul 2>nul
    if %errorlevel%==0 (
      start "Griya Madu Local Server" cmd /k "python -m http.server 8765 --bind 127.0.0.1"
    ) else (
      echo Node.js atau Python 3 tidak ditemukan. Instal salah satunya lalu coba lagi.
      pause
      popd
      exit /b 1
    )
  )
)
popd
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8765/index.html"
endlocal
