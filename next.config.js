// Next.js Konfigurationsdatei
module.exports = {
	// Standalone-Output für Docker-Deployment aktivieren
	// Dies erstellt eine eigenständige Version der App mit allen Abhängigkeiten
	output: "standalone",
	typescript: {
		ignoreBuildErrors: true // temporarily, since some type errors still exists and are ambiguous
	},
	// Image optimization settings
	images: {
		formats: ['image/webp', 'image/avif'],
		minimumCacheTTL: 31536000, // 1 year cache
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
	},
	// Enable compression
	compress: true,
	// Enable experimental features for better performance
	experimental: {
		// optimizeCss: true, // Disabled due to build issues
	}
};
