# 🚀 Deploy Blockchain Connection Fix - RUN THIS NOW

All changes have been pushed to git. To deploy to the server, run these commands:

## Quick Deploy (Copy & Paste)

```bash
ssh ubuntu@51.210.209.112
cd /data/Demiurge-Blockchain
git pull origin main
sudo bash scripts/deploy-from-git.sh
```

## What This Does

1. ✅ Pulls latest changes (nginx.conf, blockchain.ts)
2. ✅ Backs up current nginx.conf
3. ✅ Tests Nginx configuration
4. ✅ Restarts Nginx with WebSocket proxy enabled
5. ✅ Checks/starts blockchain node
6. ✅ Rebuilds Hub with updated blockchain client
7. ✅ Restarts Hub
8. ✅ Shows service status

## After Deployment

1. Visit: `https://demiurge.cloud`
2. Open browser console (F12)
3. Look for: `[Blockchain] Successfully connected to Demiurge blockchain at wss://demiurge.cloud/rpc`
4. Verify: Blockchain status banner should disappear

## Troubleshooting

If something fails, check logs:
```bash
docker logs demiurge-nginx --tail 50
docker logs demiurge-hub --tail 50
docker logs demiurge-node --tail 50
```

---

**Status:** ✅ Ready to deploy  
**Git Commit:** d410e03  
**Files Changed:** nginx.conf, blockchain.ts, deploy scripts
