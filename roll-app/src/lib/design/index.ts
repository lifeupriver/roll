// Smart Design System
// A comprehensive design intelligence layer that ensures beautiful layouts
// across magazines, books, and blogs — automatically.
//
// Architecture:
//   photo-analysis.ts  → Understands each photo (aspect ratio, visual weight)
//   typography.ts      → Font pairings, type scale, caption rules
//   composition.ts     → Whitespace, rhythm, balance, pacing
//   design-engine.ts   → Central brain that combines all rules
//
// Key principles:
//   1. Never crop photos — show them at natural aspect ratios
//   2. Generous whitespace — space is a luxury
//   3. Visual rhythm — alternate between dense and sparse
//   4. Story pacing — opening, rising, climax, resolution
//   5. Layout diversity — never repeat the same layout back-to-back
//   6. Beautiful typography — consistent hierarchy, optical sizing

export {
  // Photo analysis
  classifyAspectRatio,
  getAspectRatio,
  areAspectRatiosCompatible,
  getOrientation,
  calculateVisualWeight,
  analyzePhotoSet,
  groupByCompatibility,
  type AspectRatioClass,
  type Orientation,
  type PhotoMetrics,
  type VisualWeightResult,
  type PhotoSetAnalysis,
} from './photo-analysis';

export {
  // Typography
  TYPE_SCALE,
  FONT_PAIRINGS,
  getFontPairing,
  getCaptionStyle,
  getPrintTextSizing,
  isPullQuoteWorthy,
  SPACING,
  type TypeScaleStep,
  type FontPairing,
  type CaptionPlacement,
} from './typography';

export {
  // Composition
  EDITORIAL_RHYTHM,
  getRhythmBeat,
  rhythmToDensity,
  evaluateSpreadBalance,
  getStoryPhase,
  getPhaseMaxDensity,
  createLayoutHistory,
  isLayoutStale,
  isOrientationHarmonious,
  calculateWhitespaceBudget,
  scoreSceneAdjacency,
  type PageDensity,
  type RhythmBeat,
  type StoryPhase,
} from './composition';

export {
  // Design engine
  smartDesignMagazine,
  smartDesignFromFavorites,
  smartAssembleBook,
  smartAssembleBookFromSections,
  smartDesignBlog,
  selectBestCoverPhoto,
  type DesignOptions,
  type MagazineSection,
  type BlogBlock,
  type BlogBlockType,
} from './design-engine';
