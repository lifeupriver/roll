import { OVER_EXPOSURE_THRESHOLD, UNDER_EXPOSURE_THRESHOLD } from '@/lib/utils/constants';

interface ChannelStats {
  mean: number;
  min: number;
  max: number;
  stdev: number;
}

export function detectExposure(stats: { channels: ChannelStats[] }): {
  isOverExposed: boolean;
  isUnderExposed: boolean;
} {
  const meanValue = stats.channels[0]?.mean ?? 128;

  return {
    isOverExposed: meanValue > OVER_EXPOSURE_THRESHOLD,
    isUnderExposed: meanValue < UNDER_EXPOSURE_THRESHOLD,
  };
}
