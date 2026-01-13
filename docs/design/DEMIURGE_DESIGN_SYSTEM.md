# 🎨 DEMIURGE DESIGN SYSTEM (DDS)

> *"The interface is not a wrapper—it is a seamless extension of the divine."*

---

## 📋 Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Core Aesthetic: Cyber Glass](#core-aesthetic-cyber-glass)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Component Library](#component-library)
6. [Motion & Animation](#motion--animation)
7. [Framework Implementation](#framework-implementation)
8. [Platform Continuity](#platform-continuity)

---

## Design Philosophy

The Demiurge Design System (DDS) is built on one fundamental principle:

**The user interface must be indistinguishable from the 3D world it represents.**

### Core Tenets

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                      THE FOUR PILLARS OF DDS                                │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   CONTINUITY    │  │  TRANSPARENCY   │  │    FLUIDITY     │             │
│  │                 │  │                 │  │                 │             │
│  │ Installer →     │  │ Glass surfaces  │  │ Elements drift  │             │
│  │ Launcher →      │  │ reveal the      │  │ rather than     │             │
│  │ In-Game must    │  │ world beneath   │  │ snap            │             │
│  │ feel unified    │  │                 │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │    PRESENCE     │                                                        │
│  │                 │                                                        │
│  │ UI exists in    │                                                        │
│  │ the same space  │                                                        │
│  │ as the user     │                                                        │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Aesthetic: Cyber Glass

### Definition

**Cyber Glass** is a next-generation UI paradigm combining:
- Dark, transparent glass surfaces
- High-quality Gaussian blur (frosted effect)
- Bioluminescent accent colors
- Subtle noise grain textures
- Chromatic aberration on edges

### Visual Reference

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ╔══════════════════════════════════════════════════════════════════╗     │
│   ║ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ║     │
│   ║ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ║     │
│   ║ ░░   ┌────────────────────────────────────────────────────┐  ░░ ║     │
│   ║ ░░   │     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │  ░░ ║     │
│   ║ ░░   │     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │  ░░ ║     │
│   ║ ░░   │     ▓▓                                       ▓▓   │  ░░ ║     │
│   ║ ░░   │     ▓▓   CYBER GLASS PANEL                  ▓▓   │  ░░ ║     │
│   ║ ░░   │     ▓▓   • 90% opacity background           ▓▓   │  ░░ ║     │
│   ║ ░░   │     ▓▓   • Gaussian blur: 20px              ▓▓   │  ░░ ║     │
│   ║ ░░   │     ▓▓   • Cyan glow on hover               ▓▓   │  ░░ ║     │
│   ║ ░░   │     ▓▓   • Gold accents for CGT             ▓▓   │  ░░ ║     │
│   ║ ░░   │     ▓▓                                       ▓▓   │  ░░ ║     │
│   ║ ░░   │     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │  ░░ ║     │
│   ║ ░░   │     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │  ░░ ║     │
│   ║ ░░   └────────────────────────────────────────────────────┘  ░░ ║     │
│   ║ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ║     │
│   ║ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ║     │
│   ╚══════════════════════════════════════════════════════════════════╝     │
│                                                                             │
│   Background: 3D World / Desktop visible through blur                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Glass Properties

| Property | Value | CSS/Qt Equivalent |
|----------|-------|-------------------|
| Background Opacity | 90% | `rgba(10, 10, 15, 0.9)` |
| Blur Radius | 20px | `backdrop-filter: blur(20px)` |
| Border | 1px solid | `rgba(0, 255, 255, 0.1)` |
| Border Radius | 12px | `border-radius: 12px` |
| Shadow | Outer glow | `0 0 40px rgba(0, 255, 255, 0.1)` |
| Noise Texture | 3% grain | `background-image: noise.svg` |

---

## Color System

### Primary Palette

```
╔════════════════════════════════════════════════════════════════════════════╗
║                           DEMIURGE COLOR SYSTEM                            ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  VOID BLACK (Primary Background)                                           ║
║  ████████████████████████████████████████████████████████████████████████  ║
║  #0A0A0F                                                                   ║
║  RGB(10, 10, 15)                                                           ║
║  Usage: Panel backgrounds, base layer                                      ║
║                                                                            ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  BIOLUMINESCENT CYAN (Active States)                                       ║
║  ████████████████████████████████████████████████████████████████████████  ║
║  #00FFFF                                                                   ║
║  RGB(0, 255, 255)                                                          ║
║  Usage: Hover states, selections, links, primary actions                   ║
║                                                                            ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  DIVINE GOLD (CGT Currency)                                                ║
║  ████████████████████████████████████████████████████████████████████████  ║
║  #FFD700                                                                   ║
║  RGB(255, 215, 0)                                                          ║
║  Usage: CGT amounts, rewards, premium features, achievements               ║
║                                                                            ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ARCHON PURPLE (Governance/Staking)                                        ║
║  ████████████████████████████████████████████████████████████████████████  ║
║  #9B59B6                                                                   ║
║  RGB(155, 89, 182)                                                         ║
║  Usage: Staking UI, governance, validator badges                           ║
║                                                                            ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ALERT CRIMSON (Warnings/Errors)                                           ║
║  ████████████████████████████████████████████████████████████████████████  ║
║  #FF3B3B                                                                   ║
║  RGB(255, 59, 59)                                                          ║
║  Usage: Errors, warnings, destructive actions                              ║
║                                                                            ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ETHEREAL WHITE (Text)                                                     ║
║  ████████████████████████████████████████████████████████████████████████  ║
║  #F0F0F5                                                                   ║
║  RGB(240, 240, 245)                                                        ║
║  Usage: Primary text, headings                                             ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

### CSS Variables

```css
:root {
  /* Primary */
  --dds-void-black: #0A0A0F;
  --dds-void-black-90: rgba(10, 10, 15, 0.9);
  --dds-void-black-80: rgba(10, 10, 15, 0.8);
  --dds-void-black-60: rgba(10, 10, 15, 0.6);
  
  /* Accents */
  --dds-cyan: #00FFFF;
  --dds-cyan-glow: rgba(0, 255, 255, 0.3);
  --dds-cyan-subtle: rgba(0, 255, 255, 0.1);
  
  --dds-gold: #FFD700;
  --dds-gold-glow: rgba(255, 215, 0, 0.3);
  
  --dds-purple: #9B59B6;
  --dds-purple-glow: rgba(155, 89, 182, 0.3);
  
  --dds-crimson: #FF3B3B;
  --dds-crimson-glow: rgba(255, 59, 59, 0.3);
  
  /* Text */
  --dds-text-primary: #F0F0F5;
  --dds-text-secondary: #A0A0B0;
  --dds-text-muted: #606070;
  
  /* Glass */
  --dds-glass-blur: 20px;
  --dds-glass-border: 1px solid var(--dds-cyan-subtle);
  --dds-glass-radius: 12px;
  --dds-glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
```

---

## Typography

### Font Stack

| Priority | Font Name | Usage | Fallback |
|----------|-----------|-------|----------|
| 1 | **Orbitron** | Headings, Numbers | - |
| 2 | **Exo 2** | Body text | - |
| 3 | **JetBrains Mono** | Code, Data | monospace |

### Type Scale

```
╔════════════════════════════════════════════════════════════════════════════╗
║                           TYPOGRAPHY SCALE                                 ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  DISPLAY (Hero/Splash)                                                     ║
║  Font: Orbitron                                                            ║
║  Size: 48px / 3rem                                                         ║
║  Weight: 700                                                               ║
║  Letter-spacing: 0.05em                                                    ║
║  ─────────────────────────────────────────────────────────────────────     ║
║                                                                            ║
║  H1 (Page Title)                                                           ║
║  Font: Orbitron                                                            ║
║  Size: 32px / 2rem                                                         ║
║  Weight: 600                                                               ║
║  Letter-spacing: 0.03em                                                    ║
║  ─────────────────────────────────────────────────────────────────────     ║
║                                                                            ║
║  H2 (Section Title)                                                        ║
║  Font: Orbitron                                                            ║
║  Size: 24px / 1.5rem                                                       ║
║  Weight: 600                                                               ║
║  Letter-spacing: 0.02em                                                    ║
║  ─────────────────────────────────────────────────────────────────────     ║
║                                                                            ║
║  H3 (Subsection)                                                           ║
║  Font: Exo 2                                                               ║
║  Size: 20px / 1.25rem                                                      ║
║  Weight: 500                                                               ║
║  ─────────────────────────────────────────────────────────────────────     ║
║                                                                            ║
║  BODY (Paragraphs)                                                         ║
║  Font: Exo 2                                                               ║
║  Size: 16px / 1rem                                                         ║
║  Weight: 400                                                               ║
║  Line-height: 1.6                                                          ║
║  ─────────────────────────────────────────────────────────────────────     ║
║                                                                            ║
║  CAPTION (Labels)                                                          ║
║  Font: Exo 2                                                               ║
║  Size: 14px / 0.875rem                                                     ║
║  Weight: 400                                                               ║
║  ─────────────────────────────────────────────────────────────────────     ║
║                                                                            ║
║  MONO (Code/Data)                                                          ║
║  Font: JetBrains Mono                                                      ║
║  Size: 14px / 0.875rem                                                     ║
║  Weight: 400                                                               ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## Component Library

### Glass Panel

```css
.dds-glass-panel {
  background: var(--dds-void-black-90);
  backdrop-filter: blur(var(--dds-glass-blur));
  -webkit-backdrop-filter: blur(var(--dds-glass-blur));
  border: var(--dds-glass-border);
  border-radius: var(--dds-glass-radius);
  box-shadow: var(--dds-glass-shadow);
  
  /* Noise texture overlay */
  position: relative;
}

.dds-glass-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('noise.svg');
  opacity: 0.03;
  pointer-events: none;
  border-radius: inherit;
}
```

### Button States

```css
.dds-button {
  background: var(--dds-void-black-80);
  border: 1px solid var(--dds-cyan-subtle);
  color: var(--dds-text-primary);
  padding: 12px 24px;
  border-radius: 8px;
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dds-button:hover {
  background: var(--dds-void-black-60);
  border-color: var(--dds-cyan);
  box-shadow: 0 0 20px var(--dds-cyan-glow);
  transform: translateY(-2px);
}

.dds-button:active {
  transform: translateY(0);
  box-shadow: 0 0 10px var(--dds-cyan-glow);
}

/* CGT/Gold variant */
.dds-button--gold {
  border-color: rgba(255, 215, 0, 0.3);
}

.dds-button--gold:hover {
  border-color: var(--dds-gold);
  box-shadow: 0 0 20px var(--dds-gold-glow);
}
```

### Input Fields

```css
.dds-input {
  background: var(--dds-void-black-60);
  border: 1px solid var(--dds-cyan-subtle);
  border-radius: 8px;
  padding: 12px 16px;
  color: var(--dds-text-primary);
  font-family: 'Exo 2', sans-serif;
  font-size: 16px;
  transition: all 0.3s ease;
}

.dds-input:focus {
  outline: none;
  border-color: var(--dds-cyan);
  box-shadow: 0 0 15px var(--dds-cyan-glow);
}

.dds-input::placeholder {
  color: var(--dds-text-muted);
}
```

---

## Motion & Animation

### Core Principles

1. **Drift, don't snap** - Windows and panels should float into position
2. **Cinematic easing** - Use bezier curves, not linear
3. **Subtle parallax** - Depth through layered movement
4. **Glow pulses** - Active elements breathe with light

### Timing Functions

```css
:root {
  /* Primary easing - smooth and elegant */
  --dds-ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Entrance - elements floating in */
  --dds-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Bounce - for notifications/alerts */
  --dds-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Durations */
  --dds-duration-fast: 150ms;
  --dds-duration-normal: 300ms;
  --dds-duration-slow: 500ms;
  --dds-duration-cinematic: 800ms;
}
```

### Panel Entrance

```css
@keyframes dds-panel-enter {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
    filter: blur(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

.dds-panel-animated {
  animation: dds-panel-enter var(--dds-duration-cinematic) var(--dds-ease-out) forwards;
}
```

### Glow Pulse

```css
@keyframes dds-glow-pulse {
  0%, 100% {
    box-shadow: 0 0 20px var(--dds-cyan-glow);
  }
  50% {
    box-shadow: 0 0 30px var(--dds-cyan-glow), 0 0 60px rgba(0, 255, 255, 0.1);
  }
}

.dds-glow-active {
  animation: dds-glow-pulse 2s ease-in-out infinite;
}
```

---

## Framework Implementation

### Qt 6.10.1 (Qor Installer / Qor Launcher)

```qml
// CyberGlassPanel.qml
import QtQuick 2.15
import QtQuick.Effects
import Qt5Compat.GraphicalEffects

Rectangle {
    id: root
    
    property real blurRadius: 20
    property color accentColor: "#00FFFF"
    
    color: Qt.rgba(0.04, 0.04, 0.06, 0.9)
    radius: 12
    border.width: 1
    border.color: Qt.rgba(0, 1, 1, 0.1)
    
    // Blur effect (requires background capture)
    layer.enabled: true
    layer.effect: MultiEffect {
        blurEnabled: true
        blur: root.blurRadius / 64
        blurMax: 64
    }
    
    // Subtle glow
    Rectangle {
        anchors.fill: parent
        anchors.margins: -1
        radius: parent.radius + 1
        color: "transparent"
        border.width: 1
        border.color: Qt.rgba(0, 1, 1, 0.05)
        
        layer.enabled: true
        layer.effect: DropShadow {
            horizontalOffset: 0
            verticalOffset: 0
            radius: 40
            samples: 81
            color: Qt.rgba(0, 1, 1, 0.1)
        }
    }
    
    // Noise texture overlay
    Image {
        anchors.fill: parent
        source: "qrc:/assets/noise.png"
        fillMode: Image.Tile
        opacity: 0.03
    }
}
```

### React / Tauri (Web-based tools)

```tsx
// CyberGlassPanel.tsx
import { motion } from 'framer-motion';
import styles from './CyberGlassPanel.module.css';

interface CyberGlassPanelProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export const CyberGlassPanel: React.FC<CyberGlassPanelProps> = ({
  children,
  className,
  animate = true,
}) => {
  const variants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.98,
      filter: 'blur(4px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  const Component = animate ? motion.div : 'div';

  return (
    <Component
      className={`${styles.panel} ${className || ''}`}
      variants={animate ? variants : undefined}
      initial={animate ? 'hidden' : undefined}
      animate={animate ? 'visible' : undefined}
    >
      <div className={styles.noiseOverlay} />
      {children}
    </Component>
  );
};
```

### UE5 Slate/UMG (In-Engine)

```cpp
// SCyberGlassPanel.h
#pragma once

#include "CoreMinimal.h"
#include "Widgets/SCompoundWidget.h"

class DEMIURGE_API SCyberGlassPanel : public SCompoundWidget
{
public:
    SLATE_BEGIN_ARGS(SCyberGlassPanel)
        : _BlurRadius(20.0f)
        , _BackgroundOpacity(0.9f)
        , _AccentColor(FLinearColor(0.0f, 1.0f, 1.0f))
    {}
        SLATE_DEFAULT_SLOT(FArguments, Content)
        SLATE_ARGUMENT(float, BlurRadius)
        SLATE_ARGUMENT(float, BackgroundOpacity)
        SLATE_ARGUMENT(FLinearColor, AccentColor)
    SLATE_END_ARGS()

    void Construct(const FArguments& InArgs);
    
    virtual int32 OnPaint(
        const FPaintArgs& Args,
        const FGeometry& AllottedGeometry,
        const FSlateRect& MyCullingRect,
        FSlateWindowElementList& OutDrawElements,
        int32 LayerId,
        const FWidgetStyle& InWidgetStyle,
        bool bParentEnabled
    ) const override;

private:
    float BlurRadius;
    float BackgroundOpacity;
    FLinearColor AccentColor;
    TSharedPtr<SWidget> ChildContent;
};
```

---

## Platform Continuity

### The Seamless Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   QOR INSTALLER                QOR LAUNCHER              UE5 CLIENT         │
│   (Qt 6.10.1)                  (Qt 6.10.1)               (Slate/UMG)        │
│                                                                             │
│   ┌───────────────┐            ┌───────────────┐         ┌───────────────┐ │
│   │ ░░░░░░░░░░░░░ │   ──►      │ ░░░░░░░░░░░░░ │   ──►   │ ░░░░░░░░░░░░░ │ │
│   │ ░░  CYBER  ░░ │            │ ░░  CYBER  ░░ │         │ ░░  CYBER  ░░ │ │
│   │ ░░  GLASS  ░░ │            │ ░░  GLASS  ░░ │         │ ░░  GLASS  ░░ │ │
│   │ ░░░░░░░░░░░░░ │            │ ░░░░░░░░░░░░░ │         │ ░░░░░░░░░░░░░ │ │
│   └───────────────┘            └───────────────┘         └───────────────┘ │
│                                                                             │
│   • Same color palette         • Same color palette      • Same palette    │
│   • Same typography            • Same typography         • Same typography │
│   • Same glass effects         • Same glass effects      • 3D glass mats   │
│   • Same animations            • Same animations         • World-space UI  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Consistency Checklist

| Element | Qor Installer | Qor Launcher | UE5 Client |
|---------|---------------|--------------|------------|
| Background | `#0A0A0F @ 90%` | `#0A0A0F @ 90%` | Translucent material |
| Blur | Gaussian 20px | Gaussian 20px | Post-process blur |
| Accent (Primary) | `#00FFFF` | `#00FFFF` | Emissive cyan |
| Accent (CGT) | `#FFD700` | `#FFD700` | Emissive gold |
| Font (Headings) | Orbitron | Orbitron | Orbitron (SDF) |
| Font (Body) | Exo 2 | Exo 2 | Exo 2 (SDF) |
| Animation Timing | 800ms ease-out | 800ms ease-out | Timeline curves |
| Noise Texture | 3% overlay | 3% overlay | Material parameter |

---

## Asset Requirements

### Required Font Files

```
/assets/fonts/
├── Orbitron-Regular.ttf
├── Orbitron-Medium.ttf
├── Orbitron-SemiBold.ttf
├── Orbitron-Bold.ttf
├── Exo2-Regular.ttf
├── Exo2-Medium.ttf
├── Exo2-SemiBold.ttf
├── Exo2-Italic.ttf
└── JetBrainsMono-Regular.ttf
```

### Required Textures

```
/assets/textures/
├── noise.png          (512x512, tileable, 8-bit grayscale)
├── noise.svg          (vector version)
├── glow-radial.png    (256x256, radial gradient, RGBA)
└── chromatic-edge.png (64x64, chromatic aberration lookup)
```

---

*Last Updated: January 12, 2026*  
*Document Version: 1.0*  
*Maintainer: Alaustrup*
