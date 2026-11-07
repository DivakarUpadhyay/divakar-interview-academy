// AdSense ad unit IDs (AdSense → Ads → By ad unit). Kept outside the "use client" AdSense module so
// server components can read the values; an unset ID means that slot renders nothing.
export const AD_SLOTS = {
  lessonTop: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LESSON_TOP,
  lessonBottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LESSON_BOTTOM,
};
