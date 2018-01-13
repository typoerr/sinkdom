import typescript from 'rollup-plugin-typescript'
import resolve from 'rollup-plugin-node-resolve'
import minify from 'rollup-plugin-babel-minify'

export default {
    input: 'src/index.ts',
    output: {
        file: 'dist/sinkdom.bundle.js',
        format: 'iife',
        name: 'sinkdom',
    },
    plugins: [
        resolve(),
        typescript({
            tsconfig: 'tsconfig.lib.json',
            module: 'es2015',
            typescript: require('typescript'),
        }),
        minify({ comments: false }),
    ],
}