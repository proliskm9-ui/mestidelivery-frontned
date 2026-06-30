/**
 * Scroll-hero chapters, synced to the cooking narrative:
 *   dough/craft  ->  skillet/fire  ->  plated dish/taste  ->  delivered/CTA
 *
 * `side` alternates left/right so the eye moves across the screen as the story
 * progresses. CSS var names must match CHAPTER_WINDOWS in useScrollVideo.ts.
 */

export type ChapterSide = 'left' | 'right';

export interface ScrollChapter {
    id: 'craft' | 'fire' | 'taste' | 'final';
    /** CSS var written by the hook carrying this chapter's visibility (0..1). */
    cssVar: string;
    side: ChapterSide;
    /** Translation key for the big chapter word. */
    titleKey: string;
    /** Translation key for the supporting line. */
    descKey: string;
    /** Short kicker label, e.g. "01 — Craft". */
    index: string;
}

export const SCROLL_CHAPTERS: ScrollChapter[] = [
    {
        id: 'craft',
        cssVar: '--ch-craft',
        side: 'right',
        index: '01',
        titleKey: 'home.craft_title',
        descKey: 'home.craft_desc',
    },
    {
        id: 'fire',
        cssVar: '--ch-fire',
        side: 'left',
        index: '02',
        titleKey: 'home.fire_title',
        descKey: 'home.fire_desc',
    },
    {
        id: 'taste',
        cssVar: '--ch-taste',
        side: 'right',
        index: '03',
        titleKey: 'home.taste_title',
        descKey: 'home.taste_desc',
    },
    {
        id: 'final',
        cssVar: '--ch-final',
        side: 'left',
        index: '04',
        titleKey: 'home.final_title',
        descKey: 'home.final_desc',
    },
];
