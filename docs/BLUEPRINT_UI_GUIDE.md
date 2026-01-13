# Blueprint UI Creation Guide

This guide explains how to create Blueprint widgets for the Demiurge Client using the Cyber Glass Design System.

## Overview

The Demiurge UI system is built on `UQorGlassPanel`, a C++ base class that provides:
- Frosted glass blur effects
- Animated edge highlighting
- Real-time blockchain RPC integration
- Qor ID identity management

## Creating Your First Blueprint Widget

### Step 1: Create Blueprint Widget Class

1. In Unreal Editor, open **Content Browser**
2. Right-click → **User Interface** → **Widget Blueprint**
3. Name it `WBP_QorIDLogin` (or your preferred name)
4. Double-click to open the Widget Blueprint

### Step 2: Set Parent Class

1. In the **Widget Blueprint** editor, click **File** → **Reparent Blueprint**
2. Search for `Qor ID Login Widget` (or `Qor Glass Panel` for base)
3. Select `Qor ID Login Widget` as parent
4. Click **Reparent**

### Step 3: Design the UI

#### Required Widget Bindings

The C++ code expects these widget names (set in **Details** → **Is Variable**):

**For Qor ID Login Widget:**
- `BackgroundBlur` - Background Blur component
- `GlassTintOverlay` - Image component for tint
- `EdgeGlowBorder` - Image component for edge glow
- `UsernameInput` - Editable Text Box
- `AvailabilityText` - Text Block
- `QorKeyDisplay` - Text Block
- `RegisterButton` - Button
- `CancelButton` - Button

**For Wallet Widget:**
- `BackgroundBlur` - Background Blur component
- `GlassTintOverlay` - Image component
- `EdgeGlowBorder` - Image component
- `BalanceText` - Text Block
- `RecipientInput` - Editable Text Box
- `AmountInput` - Editable Text Box
- `SendButton` - Button

#### Visual Setup

1. **Add Background Blur:**
   - Drag **Background Blur** widget onto canvas
   - Set **Is Variable** = true
   - Name it `BackgroundBlur`
   - Set **Blur Strength** = 15.0 (default)

2. **Add Glass Tint Overlay:**
   - Drag **Image** widget, make it fill parent
   - Set **Is Variable** = true
   - Name it `GlassTintOverlay`
   - Set **Tint** = `(10, 10, 15, 200)` (Dark Void #0A0A0F)
   - Set **Opacity** = 0.8

3. **Add Edge Glow Border:**
   - Drag **Image** widget, make it fill parent
   - Set **Is Variable** = true
   - Name it `EdgeGlowBorder`
   - Import/create a border texture with alpha gradient
   - Set **Tint** = `(0, 255, 255, 255)` (Cyan)
   - Set **Opacity** = 0.0 (will be animated)

4. **Add Content:**
   - Add your UI elements (text, buttons, inputs) on top
   - Ensure they're children of the Background Blur or in a proper hierarchy

### Step 4: Bind Widget Variables

1. Open **Graph** view (top toolbar)
2. In **My Blueprint** panel, verify all widgets are listed under **Variables**
3. If missing, go back to **Designer**, select widget, check **Is Variable**

### Step 5: Connect Events (Optional)

The C++ code handles most logic automatically, but you can extend in Blueprint:

**Example: Custom Register Button Logic**

1. In **Graph** view, find `On Register Clicked` event
2. Add custom logic before/after the parent call:
   ```
   Event On Register Clicked
   → [Your Custom Logic]
   → Call Parent Function (On Register Clicked)
   ```

**Example: Visual Feedback on Availability**

1. Find `On Availability Checked` event (from delegate)
2. Add visual effects:
   ```
   Event On Availability Checked (bIsAvailable: bool)
   → Branch (bIsAvailable)
     → True: Play Animation (Green Glow)
     → False: Play Animation (Red Pulse)
   ```

## Widget Classes Reference

### UQorIDLoginWidget

**Purpose:** Login/Registration interface for Qor ID

**Key Functions:**
- `OnRegisterClicked()` - Trigger registration
- `IsUsernameValid()` - Check username format
- `GetCurrentUsername()` - Get input username

**Delegates:**
- `OnAvailabilityChecked(bool)` - Fired when username availability is checked
- `OnQorIDRegistered(FString, FString)` - Fired on successful registration

**Blueprint Events:**
- `On Register Clicked` - Override for custom logic
- `On Cancel Clicked` - Override for custom logic

### UQorWalletWidget

**Purpose:** Display CGT balance and send transfers

**Key Functions:**
- `RefreshBalance()` - Query blockchain for balance
- `SendCGT(FString, int64)` - Send CGT to address
- `FormatBalance(int64)` - Format balance for display

**Delegates:**
- `OnBalanceUpdated(int64)` - Fired when balance changes

**Blueprint Events:**
- `On Send Clicked` - Override for custom send logic

### UQorGlassPanel (Base Class)

**Purpose:** Foundation for all Cyber Glass UI

**Key Functions:**
- `SetBlurStrength(float)` - Adjust blur (0-100)
- `SetGlassColor(FLinearColor)` - Change tint color
- `SetEdgeGlowEnabled(bool)` - Toggle edge glow
- `ApplyPleromaStyle()` - Apply "Pleroma" theme
- `ApplyArchonStyle()` - Apply "Archon" theme
- `ApplyWarningStyle()` - Apply warning theme
- `ApplySuccessStyle()` - Apply success theme

**Style Presets:**
- **Pleroma:** Deep teal/cyan, medium blur
- **Archon:** Purple/violet, high blur
- **Warning:** Red/orange, pulsing glow
- **Success:** Green, smooth glow

## Common Blueprint Patterns

### Pattern 1: Real-time Username Validation

```
Event: UsernameInput → On Text Changed
→ Delay (0.5 seconds) [Debounce]
→ Call: Check Username Availability (from QorGlassPanel)
→ Event: On Availability Checked
  → Update visual feedback
```

### Pattern 2: Balance Refresh on Panel Open

```
Event: Construct
→ Call: Refresh Balance (from Wallet Widget)
→ Event: On Balance Updated
  → Update Balance Text
```

### Pattern 3: Animated Panel Entrance

```
Event: Add to Viewport
→ Call: Animate In (from QorGlassPanel)
→ Timeline: Fade In + Blur Increase
→ Event: On Panel Animation Complete
  → Enable interactions
```

## Troubleshooting

### Widgets Not Binding

**Problem:** C++ code can't find widget variables

**Solution:**
1. Ensure widget name matches exactly (case-sensitive)
2. Check **Is Variable** is enabled
3. Recompile C++ code after adding new widgets
4. Check **Compile** button in Blueprint editor

### Blur Not Showing

**Problem:** Background blur appears flat

**Solution:**
1. Set **Scalability** → **Post Processing** to Medium or High
2. Ensure **Blur Strength** > 0
3. Check **Background Blur** widget is properly sized
4. Verify **Render Opacity** is not 0

### RPC Calls Not Working

**Problem:** Username checks or balance queries fail

**Solution:**
1. Verify `UDemiurgeNetworkManager` is initialized in GameMode
2. Check WebSocket connection status
3. Verify node URL is correct (`ws://51.210.209.112:9944`)
4. Check **Output Log** for RPC errors

## Next Steps

1. **Create Inventory Widget:** Extend `QorGlassPanel` for DRC-369 item display
2. **Create Trade Widget:** Build trade offer UI using `DemiurgePlayerController`
3. **Create HUD Integration:** Add widgets to `ADemiurgeHUD` for in-game UI
4. **Create Menu System:** Build main menu using Cyber Glass panels

## Example Blueprint Setup

See `Content/UI/Blueprints/` for example widget Blueprints:
- `WBP_QorIDLogin` - Complete login widget
- `WBP_Wallet` - Wallet interface
- `WBP_Inventory` - Item inventory display

---

**Note:** All Blueprint widgets must inherit from C++ classes (`UQorGlassPanel` or subclasses) to access blockchain functionality. Pure Blueprint widgets cannot directly call RPC methods.
