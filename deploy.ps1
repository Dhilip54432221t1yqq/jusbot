# Sync files from local Windows to AWS server
# Note: This will create a 'reflx' folder in the user's home directory on AWS
# and sync the server and client folders.

$IP = "51.20.131.117"
$KEY = "reflx-server.pem"

Write-Host "--- Syncing files to AWS ($IP) ---" -ForegroundColor Cyan
scp -i $KEY -r ./server ./client ubuntu@${IP}:~/reflx/

Write-Host "--- Rebuilding & Restarting on AWS ---" -ForegroundColor Cyan
# This command connects via SSH and runs the build/restart commands automatically
ssh -i $KEY ubuntu@${IP} "cd ~/reflx/client && npm install && npm run build && cd ~/reflx/server && npm install && pm2 restart reflx-backend || pm2 start index.js --name 'reflx-backend'"

Write-Host "--- Deployment Complete! ---" -ForegroundColor Green
