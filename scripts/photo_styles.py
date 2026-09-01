# -*- coding: utf-8 -*-
"""Photo style locks + generation manifest for Sunset / Luizastan / BURGERS."""

# Shared commercial menu-card FORMAT (learned from BBQ Garden menu audit).
# Background/vessel/light SKIN changes per restaurant — FORMAT stays identical.
MENU_CARD_FORMAT = (
    "COMMERCIAL DELIVERY MENU CARD FORMAT (mandatory, identical across restaurants): "
    "square 1:1 composition, ONE dish only, subject STRICTLY centered, "
    "the serving vessel PLUS food together occupy 75-80 percent of the frame "
    "(golden middle: table faintly visible around the edges, not a hairline crop, not a tiny distant dish), "
    "match BBQ Garden menu thumbnail scale with a slim even band of background around the vessel, "
    "camera high angle about 45-60 degrees, volumetric three-dimensional food, "
    "photorealistic like a real restaurant camera photo, natural imperfections OK, "
    "soft directional side light with appetizing surface gloss, soft natural shadows, "
    "sharp focus, no cutlery, no extra side plates, no glasses, "
    "no decor clutter, no text, no logos, no watermarks, no hands, no people, "
    "do NOT invent ingredients or garnishes — only what is in the authentic dish reference"
)

# Shared food-accuracy locks (append to dish focus prompts)
GEORGIAN_PIE_RULES = (
    "IMPORTANT: authentic Georgian round pie (khachapuri/kubdari/lobiani) with "
    "pizza-like thickness about 1.5–2.5 cm — same body as a hand-tossed pizza, "
    "NOT paper-thin lavash, NOT a thick deep-dish cake or stuffed loaf, "
    "soft doughy crumb at the cut edge like pizza crust, "
    "pre-cut into exactly 8 equal pizza-style wedges still arranged in a circle, "
    "one slice may be slightly pulled aside but do NOT show chunky detailed filling, "
    "golden baked top crust"
)

MCHADI_RULES = (
    "IMPORTANT: mchadi is a SMALL thin corn flatbread cake, roughly palm-sized, "
    "no filling inside, not a large stuffed pie, show 1 or 2 small flat cakes only"
)

DRINK_BOTTLE_RULES = (
    "IMPORTANT: soft drink for delivery — show a closed 0.5 L plastic or glass BOTTLE "
    "standing upright on the table, with light condensation; "
    "NEVER a drinking glass, tumbler, cup, or poured serving"
)

SUNSET_VESSEL_LOCK = (
    "SUNSET VESSEL LOCK (mandatory quiet scale like Luizastan): "
    "use ONE of exactly three matte charcoal-graphite stoneware shapes — "
    "V1 flat round plate with low thin rim (outer diameter 72 percent of frame width), "
    "V2 deep round bowl same outer diameter 72 percent of frame, "
    "V3 small low sauce ramekin outer diameter 48 percent of frame (half of V2, NEVER a dinner bowl for sauces), "
    "C1 charcoal cup with handle on matching saucer together 54 percent of frame for coffee/tea only; "
    "do NOT invent a new vessel shape or shrink the vessel for a small portion — "
    "change food volume inside the full-size vessel only; "
    "keep the locked table scene props (napkin, cutlery, herb pinch bowl) untouched"
)

STYLES = {
    "sunset": {
        "label": "Sunset Restaraunt — premium stone",
        "prompt_suffix": (
            f"{MENU_CARD_FORMAT}, "
            f"{SUNSET_VESSEL_LOCK}, "
            "Sunset skin: elegant matte charcoal stoneware on the locked light-grey ribbed table scene, "
            "soft premium side lighting from upper-left, refined plating"
        ),
    },
    "luizastan": {
        "label": "Luizastan — local Svan homemade",
        "prompt_suffix": (
            f"{MENU_CARD_FORMAT}, "
            "Luizastan skin: beloved local Caucasian guesthouse vibe, warm hospitable home-cooked feel without luxury pretension, "
            "matte natural Caucasian oak or walnut wood tabletop with visible grain, "
            "traditional handmade Georgian clay vessel — deep clay bowl for salads/soups, "
            "round thick-rimmed matte clay ketsi for hot stews, flat dark/terracotta clay plate for grilled/khinkali, "
            "soft golden side light like sunset through a veranda window, faint steam on hot dishes"
        ),
    },
    "bbq": {
        "label": "BBQ Garden — summer terrace cafe",
        "prompt_suffix": (
            f"{MENU_CARD_FORMAT}, "
            "BBQ Garden skin: cozy summer terrace cafe on dark weathered wooden table, "
            "warm matte cream/sand ceramic vessel (not luxury black stoneware), "
            "kraft paper napkins vibe, soft warm evening side light, "
            "rustic hospitable grillhouse without fancy interiors"
        ),
    },
    "burgers": {
        "label": "BURGERS — modern rustic",
        "prompt_suffix": (
            f"{MENU_CARD_FORMAT}, "
            "BURGERS skin: dark stained wooden table, warm amber lighting, "
            "tasteful casual gourmet presentation, subtle village-modern vibe"
        ),
    },
}

# Image generation checklist: slug -> (restaurant_key, short dish focus for prompt)
BURGERS_SHOTS = [
    ("burgers_01_cheeseburger", "Cheeseburger with melted cheese, beef patty, fresh lettuce tomato, soft bun"),
    ("burgers_02_hamburger", "Classic hamburger with grilled beef patty, fresh toppings, soft bun, no cheese"),
    ("burgers_03_chickenburger", "Chicken burger with juicy breaded or grilled chicken patty, sauce, soft bun"),
    ("burgers_04_vegburger", "Veggie falafel burger with crispy falafel patty, fresh vegetables, sauces, soft bun"),
    ("burgers_05_fries", "Golden crispy French fries in a metal basket or on wood"),
    ("burgers_06_garlic_sauce", "Small portion cup of creamy white garlic sauce"),
    ("burgers_07_ketchup", "Small portion cup of red ketchup"),
    ("burgers_08_cheese_sauce", "Small portion cup of yellow melted cheese sauce"),
    ("burgers_09_bbq_sauce", "Small portion cup of dark BBQ sauce"),
    ("burgers_10_chili_sauce", "Small portion cup of red chili sauce"),
    ("burgers_11_honey_mustard", "Small portion cup of honey mustard sauce"),
    ("burgers_12_jalapenos", "Sliced green jalapeño rings in a small bowl"),
    ("burgers_13_beer", "Cold beer in a glass with condensation, foam head"),
    ("burgers_14_naal_beer", "Cold non-alcoholic beer in a glass with condensation"),
    ("burgers_15_cola", "Closed 0.5 L dark cola plastic bottle with condensation, upright on table"),
    ("burgers_16_cola_zero", "Closed 0.5 L dark zero-cola plastic bottle with condensation, upright"),
    ("burgers_17_water", "Closed 0.5 L clear still-water plastic bottle with condensation, upright"),
    ("burgers_18_borjomi", "Closed Borjomi-style mineral water glass bottle, upright on table"),
    ("burgers_19_borjomi_lemonade", "Closed 0.5 L flavoured lemonade plastic bottle, upright on table"),
    ("burgers_20_cold_tea", "Iced cold tea in a tall glass with ice"),
]

# Round thin pies cut into 8 — Luizastan
LUIZA_PIE_SHOTS = [
    (
        "luiza_26_imeretian_khachapuri",
        "Round Imeretian khachapuri cheese flatbread, thin golden crust, cut into 8 wedges",
    ),
    (
        "luiza_27_megrelian_khachapuri",
        "Round Megrelian khachapuri with light cheese sprinkle on top, thin, cut into 8 wedges",
    ),
    (
        "luiza_30_lobiani",
        "Round Georgian lobiani bean pie, thin flatbread style, cut into 8 wedges",
    ),
    (
        "luiza_34_kubdari",
        "Round Svan kubdari meat pie, thin flatbread style, cut into 8 wedges",
    ),
    (
        "luiza_35_potato_khachapuri",
        "Round khachapuri with potato-cheese, thin flat pie, cut into 8 wedges",
    ),
    (
        "luiza_36_millet_khachapuri",
        "Round Svan millet khachapuri, thin flat pie, cut into 8 wedges",
    ),
]

LUIZA_MCHADI_SHOTS = [
    (
        "luiza_29_mchadi",
        "One or two small golden fried corn flatbreads mchadi, palm-sized, no filling, optional tiny cheese cube beside",
    ),
]

LUIZA_DRINK_SHOTS = [
    ("luiza_60_lemonade", "Closed 0.5 L Georgian lemonade plastic bottle, upright, condensation"),
    ("luiza_62_cola", "Closed 0.5 L dark cola plastic bottle, upright, condensation"),
    ("luiza_64_still_water", "Closed 0.5 L clear still-water plastic bottle, upright, condensation"),
]

SUNSET_PIE_SHOTS = [
    (
        "sunset_28_kubdari",
        "Round Svan kubdari meat pie, thin flatbread style, cut into 8 wedges",
    ),
    (
        "sunset_29_millet_khachapuri",
        "Round Svan millet khachapuri, thin flat pie, cut into 8 wedges",
    ),
    (
        "sunset_30_royal_khachapuri",
        "Larger round royal Svan millet khachapuri, still thin flat pie not thick cake, cut into 8 wedges",
    ),
    (
        "sunset_49_imeretian_khachapuri",
        "Round Imeretian khachapuri cheese flatbread, thin golden crust, cut into 8 wedges",
    ),
    (
        "sunset_50_megrelian_khachapuri",
        "Round Megrelian khachapuri with light cheese on top, thin, cut into 8 wedges",
    ),
    (
        "sunset_52_lobiani",
        "Round Georgian lobiani bean pie, thin flatbread style, cut into 8 wedges",
    ),
]

SUNSET_MCHADI_SHOTS = [
    (
        "sunset_51_mchadi",
        "One or two small golden fried corn flatbreads mchadi, palm-sized, no filling",
    ),
]

SUNSET_DRINK_SHOTS = [
    ("sunset_67_cola", "Closed 0.5 L dark cola plastic bottle, upright, condensation"),
    ("sunset_69_water", "Closed 0.5 L clear still-water plastic bottle, upright, condensation"),
    (
        "sunset_70_natakhtari",
        "Closed 0.5 L Georgian Natakhtari-style lemonade bottle, upright, condensation, generic label blur",
    ),
    (
        "sunset_71_zedazeni",
        "Closed 0.5 L Georgian Zedazeni-style lemonade bottle, upright, condensation, generic label blur",
    ),
]


def build_prompt(restaurant_key: str, dish_focus: str, extra_rules: str = "") -> str:
    style = STYLES[restaurant_key]["prompt_suffix"]
    parts = [dish_focus.strip()]
    if extra_rules:
        parts.append(extra_rules.strip())
    parts.append(style)
    return ", ".join(parts)
