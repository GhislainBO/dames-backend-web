@echo off
set PATH=C:\Program Files\nodejs;%PATH%
set JAVA_HOME=C:\Users\ghisl\AppData\Local\Programs\Eclipse Adoptium\jdk-21.0.10.7-hotspot
cd /d C:\TCC\frontend
call npx cap sync android
cd /d C:\TCC\frontend\android
call gradlew.bat assembleDebug
echo Build complete!
