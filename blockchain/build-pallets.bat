@echo off
REM Build script for Demiurge blockchain pallets
REM This script builds each pallet individually to avoid Substrate dependency conflicts

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Demiurge Blockchain - Pallet Build
echo ========================================
echo.

REM List of pallets to build
set pallets=pallet-cgt pallet-qor-identity pallet-drc369 pallet-game-assets pallet-energy pallet-composable-nfts pallet-dex pallet-fractional-assets pallet-drc369-ocw pallet-governance pallet-session-keys pallet-yield-nfts

set count=0
set success=0
set failed=0

for %%P in (%pallets%) do (
    set /a count+=1
    echo [!count!/12] Building %%P...
    
    pushd pallets\%%P
    cargo check >nul 2>&1
    
    if !errorlevel! equ 0 (
        echo [!count!/12] Building %%P... [OK]
        set /a success+=1
    ) else (
        echo [!count!/12] Building %%P... [FAILED]
        set /a failed+=1
    )
    
    popd
)

echo.
echo ========================================
echo Build Summary
echo ========================================
echo Total:     %count%
echo Success:   %success%
echo Failed:    %failed%
echo.

if %failed% equ 0 (
    echo 🎉 All pallets compiled successfully!
    exit /b 0
) else (
    echo ✗ %failed% pallet(s) failed to compile
    exit /b 1
)
