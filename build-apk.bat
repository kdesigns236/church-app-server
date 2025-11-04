@echo off
echo Building Church App APK...
echo.

cd android
echo Running Gradle clean...
call gradlew.bat clean

echo.
echo Building debug APK...
call gradlew.bat assembleDebug

echo.
echo Done! Check android\app\build\outputs\apk\debug\app-debug.apk
pause
