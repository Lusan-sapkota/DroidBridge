const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

/**
 * Plugin to copy static assets to dist folder
 * @type {import('esbuild').Plugin}
 */
const copyAssetsPlugin = {
	name: 'copy-assets',
	setup(build) {
		build.onEnd(() => {
			// Ensure dist directory exists
			if (!fs.existsSync('dist')) {
				fs.mkdirSync('dist', { recursive: true });
			}

			// Copy media folder for webview assets
			if (fs.existsSync('media')) {
				copyRecursive('media', 'dist/media');
			}

			// Copy binaries folder if it exists
			if (fs.existsSync('binaries')) {
				copyRecursive('binaries', 'dist/binaries');
			}
		});
	},
};

/**
 * Recursively copy directory
 */
function copyRecursive(src, dest) {
	if (!fs.existsSync(dest)) {
		fs.mkdirSync(dest, { recursive: true });
	}

	const entries = fs.readdirSync(src, { withFileTypes: true });
	
	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);
		
		if (entry.isDirectory()) {
			copyRecursive(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

async function main() {
	const ctx = await esbuild.context({
		entryPoints: [ 'src/extension.ts' ],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outfile: 'dist/extension.js',
		external: ['vscode'],
		logLevel: 'silent',
		target: 'node16',
		keepNames: true,
		metafile: production,
		treeShaking: false,
		plugins: [
			copyAssetsPlugin,
			esbuildProblemMatcherPlugin,
		],
		define: {
			'process.env.NODE_ENV': production ? '"production"' : '"development"'
		}
	});

	if (watch) {
		await ctx.watch();
	} else {
		await ctx.rebuild();
		
		if (production) {
			// Generate bundle analysis in production
			const result = await ctx.rebuild();
			if (result.metafile) {
				fs.writeFileSync('dist/meta.json', JSON.stringify(result.metafile, null, 2));
				console.log('Bundle analysis written to dist/meta.json');
			}
		}
		
		await ctx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
