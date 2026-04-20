/**
 * Updates the PWA manifest and icons based on partner slug
 * This ensures the correct branding is used when the user logs in
 * or when the partner changes
 */
export function updatePWAManifest(partnerSlug: string | null) {
  const manifestLink = document.getElementById('pwa-manifest') as HTMLLinkElement | null;
  const appleIcon = document.getElementById('apple-touch-icon') as HTMLLinkElement | null;
  const themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null;

  if (partnerSlug) {
    // Update manifest to partner-specific version
    if (manifestLink) {
      manifestLink.href = `/manifest-${partnerSlug}.json`;
    }

    // Update apple-touch-icon to partner-specific version
    if (appleIcon) {
      // Convert kebab-case to snake_case for folder names
      const folderName = partnerSlug.replace(/-/g, '_');
      appleIcon.href = `/icons/${folderName}/icon-512.png`;
    }

    // Fetch the manifest to get partner-specific theme color and name
    fetch(`/manifest-${partnerSlug}.json`)
      .then((response) => response.json())
      .then((manifest) => {
        // Update theme-color meta tag
        if (themeColorMeta && manifest.theme_color) {
          themeColorMeta.content = manifest.theme_color;
        }

        // Update apple-mobile-web-app-title
        if (appleTitleMeta && manifest.short_name) {
          appleTitleMeta.content = manifest.short_name;
        }

        // Update document title
        if (manifest.name) {
          document.title = manifest.name;
        }
      })
      .catch((error) => {
        console.error('Failed to load partner manifest:', error);
      });
  } else {
    // Reset to default Fit Nation branding
    if (manifestLink) {
      manifestLink.href = '/manifest.json';
    }

    if (appleIcon) {
      appleIcon.href = '/icons/fit_nation/icon-512.png';
    }

    if (themeColorMeta) {
      themeColorMeta.content = '#2563eb';
    }

    if (appleTitleMeta) {
      appleTitleMeta.content = 'Fit Nation';
    }

    document.title = 'Fit Nation';
  }
}
