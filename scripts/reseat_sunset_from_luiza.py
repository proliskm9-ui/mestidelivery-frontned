# -*- coding: utf-8 -*-
"""Reseat food from Luizastan (or Sunset real refs) onto locked Sunset charcoal vessels.

Never copies Luizastan scene/white plate — only food cutout into V1/V2 masters.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parent))

import repair_sunset_on_locked_vessels as R  # noqa: E402
from sunset_vessel_system import (  # noqa: E402
    ASSETS,
    SIZE,
    TOPDOWN_STEMS,
    USER_ASSETS,
    VESSEL_CY,
    VESSEL_MAP,
    bg_path_for,
    target_diameter_px,
)

REPO = Path(r"C:\MestiDelivery\Frontend")
LUIZA_RAW = REPO / "Luizastan"
SUNSET_RAW = REPO / "Sunset restaraunt"

# sunset_stem -> preferred food sources (first existing wins)
# Prefer real refs / finished luiza Assets food mass; never Luiza background.
JOBS: list[tuple[str, list[Path]]] = [
    # Nested foreign vessels — must unify to charcoal
    (
        "sunset-33-chkmeruli",
        [
            ASSETS / "luiza_21_chkmeruli.png",
            LUIZA_RAW / "чкмерули.jpg",
            SUNSET_RAW / "курица чкмерули.jpg",
        ],
    ),
    (
        "sunset-46-ojakhuri",
        [
            ASSETS / "luiza_19_ojakhuri.png",
            LUIZA_RAW / "оджухари.jpg",
            LUIZA_RAW / "оджухари с курицей.jpg",
        ],
    ),
    # Strong overlaps — Luiza food looks more natural; seat on Sunset vessel
    (
        "sunset-17-kharcho",
        [ASSETS / "luiza_07_kharcho.png", LUIZA_RAW / "харчо.jpg"],
    ),
    (
        "sunset-22-chikhirtma",
        [ASSETS / "luiza_09_chikhirtma.png", LUIZA_RAW / "чихиртма.jpg", SUNSET_RAW / "чихиртма.jpg"],
    ),
    (
        "sunset-36-khashlama",
        [ASSETS / "luiza_08_khashlama.png", LUIZA_RAW / "хашлама.jpg"],
    ),
    (
        "sunset-21-mushroom-cream",
        [ASSETS / "luiza_10_mushroom_cream.png", LUIZA_RAW / "грибной крем суп.jpg", SUNSET_RAW / "гребной крем суп.jpg"],
    ),
    (
        "sunset-18-veg-soup",
        [ASSETS / "luiza_11_veg_soup.png", LUIZA_RAW / "овощной суп.jpg", SUNSET_RAW / "овощной суп.jpg"],
    ),
    (
        "sunset-43-ajapsandali",
        [ASSETS / "luiza_24_ajapsandali.png", LUIZA_RAW / "аджапсандал.jfif"],
    ),
    (
        "sunset-44-lobio-pot",
        [ASSETS / "luiza_25_lobio.png", LUIZA_RAW / "лобио.jfif"],
    ),
    (
        "sunset-53-khinkali",
        [ASSETS / "luiza_14_khinkali.png", LUIZA_RAW / "Хинкали.jpg"],
    ),
    (
        "sunset-37-pork-mtsvadi",
        [ASSETS / "luiza_17_pork_mtsvadi.png", LUIZA_RAW / "шашлык из свинины.jpg", SUNSET_RAW / "шашлык из свинины.jpg"],
    ),
    (
        "sunset-08-caesar",
        [ASSETS / "luiza_04_caesar.png", SUNSET_RAW / "салат цезарь.jfif"],
    ),
    (
        "sunset-12-eggplant-walnut",
        [ASSETS / "luiza_05_eggplant_walnut.png", LUIZA_RAW / "баклажаны с орехами.jfif", SUNSET_RAW / "баклажаны с орехами.jfif"],
    ),
    (
        "sunset-25-tashmijabi",
        [ASSETS / "luiza_39_tashmijabi.png"],
    ),
    (
        "sunset-26-chvishtari",
        [ASSETS / "luiza_37_chvishtari.png", LUIZA_RAW / "чвиштари.jfif", SUNSET_RAW / "чвиштари.jpg"],
    ),
    (
        "sunset-28-kubdari",
        [ASSETS / "luiza_34_kubdari.png", LUIZA_RAW / "кубдари.jfif"],
    ),
    (
        "sunset-49-imeretian-khachapuri",
        [ASSETS / "luiza_26_imeretian_khachapuri.png", LUIZA_RAW / "хачапури.jfif", SUNSET_RAW / "хачапури.jfif"],
    ),
    (
        "sunset-50-megrelian-khachapuri",
        [ASSETS / "luiza_27_megrelian_khachapuri.png"],
    ),
    (
        "sunset-51-mchadi",
        [ASSETS / "luiza_29_mchadi.png", LUIZA_RAW / "мчади.jfif", SUNSET_RAW / "мчади.jfif"],
    ),
    (
        "sunset-52-lobiani",
        [ASSETS / "luiza_30_lobiani.png", LUIZA_RAW / "лобиани.jpg", SUNSET_RAW / "лобиани.jfif"],
    ),
    (
        "sunset-57-margherita",
        [ASSETS / "luiza_32_margherita.png", SUNSET_RAW / "пицца маргарита.jpg"],
    ),
    (
        "sunset-03-suluguni",
        [ASSETS / "luiza_44_suluguni.png", LUIZA_RAW / "сулугуни.jpg", SUNSET_RAW / "сыр сулугуни.jpg"],
    ),
]


def pick_src(paths: list[Path]) -> Path | None:
    for p in paths:
        if p.exists():
            return p
    return None


def reseat(stem: str, src: Path) -> dict:
    vessel = VESSEL_MAP[stem]
    if vessel not in ("V1", "V2"):
        return {"stem": stem, "skipped": "not V1/V2"}
    angle = "top" if stem in TOPDOWN_STEMS else "45"
    ang_key = "top" if angle == "top" and vessel == "V1" else "45"
    if vessel == "V2":
        ang_key = "45"

    cut = R.load_cutout(vessel, ang_key)
    if cut is None:
        return {"stem": stem, "error": "no cutout"}

    food = R.food_only(R.rembg_rgba(Image.open(src).convert("RGB")))
    if food.getchannel("A").getbbox() is None:
        return {"stem": stem, "error": "empty food", "src": src.name}

    fill = 0.82 if vessel == "V2" else 0.86
    subject = R.place_food_in_vessel(food, cut, fill=fill)
    target = target_diameter_px(vessel)
    bb = subject.getchannel("A").getbbox()
    width = (bb[2] - bb[0]) if bb else subject.width
    scale = target / max(width, 1)
    nw = max(1, int(subject.width * scale))
    nh = max(1, int(subject.height * scale))
    subject = subject.resize((nw, nh), Image.Resampling.LANCZOS)

    canvas = Image.open(bg_path_for(stem)).convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    x = (SIZE - nw) // 2
    y = int(SIZE * VESSEL_CY[vessel] - nh / 2)
    y = max(36, min(SIZE - nh - 36, y))
    sh_h = max(28, int(nh * 0.16))
    sh_w = int(nw * 0.90)
    sh = R.soft_shadow(sh_w, sh_h)
    canvas.paste(sh, (x + (nw - sh_w) // 2, y + nh - int(sh_h * 0.55)), sh)
    canvas.paste(subject, (x, y), subject)

    unders = stem.replace("-", "_")
    canvas.save(ASSETS / f"{unders}.png", "PNG")
    canvas.save(USER_ASSETS / f"{unders}.png", "PNG")
    canvas.save(USER_ASSETS / f"{stem}.png", "PNG")
    return {
        "stem": stem,
        "ok": True,
        "vessel": vessel,
        "src": str(src.relative_to(REPO) if src.is_relative_to(REPO) else src),
        "px": nw,
    }


def main() -> None:
    only = set(sys.argv[1].split(",")) if len(sys.argv) > 1 else None
    results = []
    for stem, paths in JOBS:
        if only and stem not in only:
            continue
        src = pick_src(paths)
        if not src:
            results.append({"stem": stem, "error": "no source"})
            print(f"MISS {stem}")
            continue
        print(f"{stem} <- {src.name} …", flush=True)
        try:
            info = reseat(stem, src)
        except Exception as e:
            info = {"stem": stem, "error": str(e)}
        results.append(info)
        print(f"  {info}", flush=True)
    ok = sum(1 for r in results if r.get("ok"))
    print(f"done ok={ok}/{len(results)}")


if __name__ == "__main__":
    main()
