git add .
git commit -m "init"
git push -u heroku master
heroku open
timeout /t 5
heroku logs --tail