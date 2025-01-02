const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');

module.exports = {
    input: 'src/bundle-entry.js',
    output: {
        file: 'public/bundles/skinview3d.bundle.js',
        format: 'es',
        sourcemap: true,
        inlineDynamicImports: true
    },
    plugins: [
        nodeResolve({
            browser: true,
            preferBuiltins: false
        }),
        commonjs({
            include: /node_modules/
        })
    ]
}; 