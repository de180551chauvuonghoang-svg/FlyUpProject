@echo off
cd /d d:\FlyUPnew\FlyUpProject
git add .
git commit -m "feat: upload video material functionality and dependencies"
git push origin HEAD:upload-video-materail
echo %DATE% %TIME% Done > push_result.txt
