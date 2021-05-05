import typescript from '@rollup/plugin-typescript'

export default {
  input: './src/ts/drawer.ts',
  output: {
    name: 'Drawer',
    file: './dist/drawer.js',
    format: 'iife',
    sourcemap: 'inline',
  },
  plugins: [
    typescript()
  ]
}
