/**
 * Native bridge — abstracts Capacitor APIs with graceful web fallbacks.
 *
 * When running in a Capacitor native shell, these functions use native APIs
 * for camera access, push notifications, haptics, and share sheets.
 * When running in the browser, they fall back to Web APIs or no-ops.
 *
 * Capacitor packages (@capacitor/*) are dynamically required and will
 * only resolve when the app is wrapped in a Capacitor native shell.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Check if running inside a Capacitor native shell */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as unknown as Record<string, unknown>).Capacitor;
}

/** Get the platform: 'ios', 'android', or 'web' */
export function getPlatform(): 'ios' | 'android' | 'web' {
  if (!isNativeApp()) return 'web';
  const cap = (window as unknown as Record<string, unknown>).Capacitor as Record<string, any> | undefined;
  const platform = typeof cap?.getPlatform === 'function' ? cap.getPlatform() : undefined;
  if (platform === 'ios' || platform === 'android') return platform;
  return 'web';
}

/**
 * Dynamically import a Capacitor plugin by name.
 * Returns null if the module is not installed (expected on web).
 */
async function importCapacitorPlugin(name: string): Promise<any> {
  try {
    // Use Function constructor to avoid static module resolution by bundler/TS
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    return await dynamicImport(name);
  } catch {
    return null;
  }
}

/** Trigger haptic feedback (native only) */
export async function hapticFeedback(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
  if (!isNativeApp()) return;

  try {
    const mod = await importCapacitorPlugin('@capacitor/haptics');
    if (!mod) return;
    const { Haptics, ImpactStyle } = mod;
    const styleMap: Record<string, any> = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: styleMap[style] });
  } catch {
    // Haptics not available
  }
}

/** Open the native share sheet (falls back to clipboard on web) */
export async function nativeShare(options: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  // Try Web Share API first (works on mobile browsers and native)
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await navigator.share(options);
      return true;
    } catch {
      // User cancelled or API unavailable
    }
  }

  // Fallback: copy URL to clipboard
  if (options.url && typeof navigator !== 'undefined' && 'clipboard' in navigator) {
    try {
      await navigator.clipboard.writeText(options.url);
      return true;
    } catch {
      // Clipboard access denied
    }
  }

  return false;
}

/** Request camera roll / photo library access (Capacitor native) */
export async function pickPhotosFromLibrary(): Promise<File[]> {
  if (!isNativeApp()) {
    // On web, use a file input (handled by PhotoUpload component)
    return [];
  }

  try {
    const mod = await importCapacitorPlugin('@capacitor/camera');
    if (!mod) return [];
    const { Camera } = mod;
    const result = await Camera.pickImages({ quality: 92, limit: 36 });

    const files: File[] = [];
    for (const photo of result.photos) {
      if (photo.webPath) {
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        const file = new File([blob], `library-${Date.now()}.jpg`, { type: 'image/jpeg' });
        files.push(file);
      }
    }
    return files;
  } catch {
    return [];
  }
}

/** Register for native push notifications (Capacitor) */
export async function registerNativePush(): Promise<string | null> {
  if (!isNativeApp()) return null;

  try {
    const mod = await importCapacitorPlugin('@capacitor/push-notifications');
    if (!mod) return null;
    const { PushNotifications } = mod;

    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return null;

    await PushNotifications.register();

    return new Promise<string | null>((resolve) => {
      PushNotifications.addListener('registration', (token: any) => {
        resolve(token.value);
      });

      PushNotifications.addListener('registrationError', () => {
        resolve(null);
      });

      // Timeout after 10s
      setTimeout(() => resolve(null), 10_000);
    });
  } catch {
    return null;
  }
}

/** Check if the app was installed as a PWA (home screen) */
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as Record<string, boolean>).standalone === true
  );
}
