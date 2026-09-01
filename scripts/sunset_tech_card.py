# -*- coding: utf-8 -*-
"""
Sunset visual tech card.

═══════════════════════════════════════════════════════════
HOW LUIZASTAN WAS DONE (truth)
═══════════════════════════════════════════════════════════
Living full-frame generation on THEIR scene (dark wood + fireplace).
NO rembg paste onto a different table. Ware = white coupe / plate.

Sunset is the SAME method, but on SUNSET scene template — not Luiza's wood.

═══════════════════════════════════════════════════════════
SUNSET SCENE TEMPLATE (do not invent another table)
═══════════════════════════════════════════════════════════
  PRIMARY: Assets/sunset_templates/bg_45deg.png
  TOPDOWN: Assets/sunset_templates/bg_topdown.png

Look: light-grey ribbed table (cool grey, NOT warm cream), dark booth,
white napkin TL, speckled pinch + herbs TR, silver cutlery BR.

═══════════════════════════════════════════════════════════
WARE (Luizastan white on Sunset template)
═══════════════════════════════════════════════════════════
  V1  white flat dinner plate   78%   ref: Assets/luiza_17_pork_mtsvadi.png
  V2  white shallow coupe bowl  80%   ref: Assets/luiza_21_chkmeruli.png
  V3  ramekin                   48%   locked_V3_45.png
  C1  cup + saucer              54%   locked_C1_45.png

═══════════════════════════════════════════════════════════
GENERATE (living full-frame, NO rembg)
═══════════════════════════════════════════════════════════
1. Refs IN ORDER:
   a) bg_45deg.png / bg_topdown.png  ← SCENE LOCK
   b) Luiza ware photo               ← WARE LOCK
   c) optional real food photo
2. Prompt: copy EXACT table texture/color/props/booth from ref a.
   Serve in EXACT white ware from ref b. Exact rim %.
   Photoreal in-camera; natural contact shadow; no cutout.
3. Resize 1024 → upload. Never rembg paste food onto another table.
"""
from __future__ import annotations

VESSEL_FRAC = {
    "V1": 0.78,
    "V2": 0.80,
    "V3": 0.48,
    "C1": 0.54,
}

VESSEL_REF = {
    "SCENE": "Assets/sunset_templates/bg_45deg.png",
    "SCENE_TOP": "Assets/sunset_templates/bg_topdown.png",
    "V1": "Assets/luiza_17_pork_mtsvadi.png",
    "V2": "Assets/luiza_21_chkmeruli.png",
    "V2_alt": "Assets/luiza_19_ojakhuri.png",
    "V3": "Assets/sunset_vessels/locked_V3_45.png",
    "C1": "Assets/sunset_vessels/locked_C1_45.png",
}

QA_TOL = 0.03
