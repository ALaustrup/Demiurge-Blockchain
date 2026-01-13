# UE5 Integration: Next Steps

## ✅ Prerequisites Complete

- ✅ UE5 5.7.1 installed via Launcher
- ✅ C++ modules implemented (`DemiurgeClient`, `DemiurgeWeb3`, `QorUI`)
- ✅ Blueprint-ready widget classes created
- ✅ Documentation ready (`BLUEPRINT_UI_GUIDE.md`)

---

## 🎯 Immediate Actions (In Unreal Editor)

### Step 1: Open Project

1. Launch **Unreal Engine 5.7.1** (from Launcher)
2. Click **Browse** or **Open**
3. Navigate to: `x:\Demiurge-Blockchain\client\DemiurgeClient\`
4. Select `DemiurgeClient.uproject`
5. Click **Open**

**Expected:** Editor will detect C++ modules and prompt to rebuild

### Step 2: Generate Visual Studio Files

If prompted, or manually:
1. **File** → **Refresh Visual Studio Project**
   - OR right-click `.uproject` → **Generate Visual Studio project files**

**Expected:** Creates `DemiurgeClient.sln` in the project directory

### Step 3: Compile C++ Modules

**Option A: From Editor**
1. **Tools** → **Compile** (or press `Ctrl+Alt+F11`)
2. Wait for compilation to complete
3. Check **Output Log** for errors

**Option B: From Visual Studio**
1. Open `DemiurgeClient.sln` in Visual Studio 2026
2. Set configuration to **Development Editor**
3. Build Solution (`Ctrl+Shift+B`)
4. Return to Unreal Editor

**Expected:** All modules compile successfully, Editor reloads

---

## 🎨 Step 4: Create Blueprint Widgets

### Widget 1: Qor ID Login (`WBP_QorIDLogin`)

1. **Content Browser** → Right-click → **User Interface** → **Widget Blueprint**
2. Name: `WBP_QorIDLogin`
3. Double-click to open
4. **File** → **Reparent Blueprint** → Search `Qor ID Login Widget`
5. Select `Qor ID Login Widget` as parent
6. **Designer** tab:
   - Add **Background Blur** widget
   - Set **Is Variable** = true, name = `BackgroundBlur`
   - Add **Image** widgets for `GlassTintOverlay` and `EdgeGlowBorder`
   - Add **Editable Text Box** for `UsernameInput`
   - Add **Text Block** widgets for `AvailabilityText` and `QorKeyDisplay`
   - Add **Button** widgets for `RegisterButton` and `CancelButton`
7. **Graph** tab:
   - Bind button clicks to `On Register Clicked` and `On Cancel Clicked`
   - Connect `On Availability Checked` delegate for visual feedback

### Widget 2: Wallet (`WBP_Wallet`)

1. Create Widget Blueprint: `WBP_Wallet`
2. Reparent to `Qor Wallet Widget`
3. Add widgets:
   - `BalanceText` (Text Block)
   - `RecipientInput` (Editable Text Box)
   - `AmountInput` (Editable Text Box)
   - `SendButton` (Button)
4. Bind `On Send Clicked` event
5. Connect `On Balance Updated` delegate

### Widget 3: Inventory (`WBP_Inventory`)

1. Create Widget Blueprint: `WBP_Inventory`
2. Reparent to `Qor Glass Panel` (base class)
3. Add List/Grid widget for item display
4. Implement item detail view

---

## 🔌 Step 5: Configure Network Manager

### In GameMode Blueprint

1. Create or open `BP_DemiurgeGameMode`
2. Set **Default Node URL** = `ws://51.210.209.112:9944` (or `ws://127.0.0.1:9944` for local)
3. Set **Auto Connect On Start** = true
4. Set **Environment Manager Class** = `BP_DemiurgeEnvironmentManager`

### In Level

1. Place `BP_DemiurgeEnvironmentManager` in level
2. Configure post-process settings
3. Set world state (Eden, Pleroma, etc.)

---

## 🧪 Step 6: Test Connection

### Test RPC Connection

1. **Play** in Editor (PIE)
2. Check **Output Log** for connection messages:
   ```
   [Demiurge] Connecting to ws://51.210.209.112:9944...
   [Demiurge] WebSocket connected successfully
   ```
3. Test username availability:
   - Open login widget
   - Type username
   - Verify availability check works

### Expected Behavior

- ✅ WebSocket connects to node
- ✅ RPC calls succeed
- ✅ Username availability updates in real-time
- ✅ Balance queries return data
- ✅ UI updates reflect blockchain state

---

## 📋 Troubleshooting

### C++ Modules Won't Compile

**Issue:** Missing includes or module dependencies

**Solution:**
1. Check `*.Build.cs` files for missing dependencies
2. Verify all `#include` paths are correct
3. Rebuild from Visual Studio

### Blueprint Widgets Not Showing

**Issue:** Widget variables not bound

**Solution:**
1. Ensure widget names match exactly (case-sensitive)
2. Check **Is Variable** is enabled
3. Recompile C++ code after adding widgets

### RPC Connection Fails

**Issue:** Can't connect to node

**Solution:**
1. Verify node is running: `demiurge-node --dev`
2. Check firewall allows port 9944
3. Verify WebSocket URL is correct
4. Check node logs for RPC errors

### Editor Crashes

**Issue:** Unreal Editor crashes on startup

**Solution:**
1. Delete `Binaries` and `Intermediate` folders
2. Regenerate project files
3. Rebuild from Visual Studio
4. Check for missing plugins

---

## 📚 Reference Documents

- `docs/BLUEPRINT_UI_GUIDE.md` - Detailed Blueprint creation guide
- `docs/ROADMAP.md` - Overall development roadmap
- `client/DemiurgeClient/Source/` - C++ source code

---

*Last Updated: January 12, 2026*
