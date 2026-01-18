# 🧹 Repository Cleanup Plan

**Date**: 2024-12-19  
**Purpose**: Clean up repository, archive old code, update documentation

---

## ✅ Cleanup Actions

### 1. Archive Old Substrate Code
- [x] Create `archive/substrate-blockchain/` directory
- [ ] Move `blockchain/` to archive (if not needed)
- [ ] Move `substrate/` to archive (if not needed)
- [ ] Update references

### 2. Remove Temporary Files
- [ ] Remove temporary build scripts
- [ ] Remove outdated documentation
- [ ] Remove cursor crash fix docs (no longer needed)
- [ ] Remove disk space crisis docs (resolved)

### 3. Update Documentation
- [x] Update main README.md
- [x] Create docs/README.md
- [ ] Consolidate status docs
- [ ] Update all framework references

### 4. Git Operations
- [ ] Stage all changes
- [ ] Commit with descriptive message
- [ ] Merge to main branch
- [ ] Push to remote

### 5. Server Deployment
- [ ] Remove old repo from server
- [ ] Clone fresh repo
- [ ] Build framework
- [ ] Deploy testnet node

---

## 📋 Files to Archive/Remove

### Archive
- `blockchain/` → `archive/substrate-blockchain/`
- `substrate/` → `archive/substrate/` (if not needed)

### Remove
- Temporary build scripts (`scripts/temp_*.ps1`)
- Cursor crash docs (`CURSOR_STABILITY_FIX.md`, `docs/CURSOR_*.md`)
- Disk space docs (`docs/DISK_SPACE_*.md`)
- Old status docs (consolidate into one)

---

**Status**: In Progress
