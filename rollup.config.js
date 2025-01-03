const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');

module.exports = {
    input: 'src/bundle-entry.js',
    output: {
        file: 'public/bundles/skinview3d.bundle.js',
        format: 'iife',
        name: 'skinview3d',
        sourcemap: true,
        globals: {
            'three': 'THREE'
        }
    },
    external: ['three'],
    plugins: [
        nodeResolve({
            browser: true,
            preferBuiltins: false,
            mainFields: ['browser', 'module', 'main']
        }),
        commonjs({
            include: /node_modules/,
            transformMixedEsModules: true,
            ignoreDynamicRequires: true,
            namedExports: {
                'skinview3d': ['SkinViewer', 'PlayerObject']
            }
        })
    ]
}; 