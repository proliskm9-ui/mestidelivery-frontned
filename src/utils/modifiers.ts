/**
 * Modifiers (sauces, bread…) live in the restaurant's own menu under a category like
 * "Модификаторы" or "Соусы". They are not shown as menu sections: the customer adds
 * them from a dish card. In the order they go as ordinary items with their own ids.
 */
const MODIFIER_CATEGORY = /модификатор|modifier|дополнени|соус|sauce|მოდიფიკატ|სოუს/i;

/** Dish categories that never get add-ons. */
const NO_ADDONS_CATEGORY = /напит|drink|beverage|десерт|dessert|снек|snack|სასმელ|დესერტ/i;

export function isModifierProduct(p: { category?: string | null }): boolean {
    return MODIFIER_CATEGORY.test(String(p.category || ''));
}

export function acceptsModifiers(p: { category?: string | null }): boolean {
    const category = String(p.category || '');
    return !MODIFIER_CATEGORY.test(category) && !NO_ADDONS_CATEGORY.test(category);
}

export function isAvailableModifier(p: { category?: string | null; is_available?: unknown }): boolean {
    // Unlike menu dishes, add-ons do not need a photo
    return isModifierProduct(p) && p.is_available !== false && p.is_available !== 0;
}
