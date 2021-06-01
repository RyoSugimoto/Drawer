import typescript from '@rollup/plugin-typescript'
import { babel as pluginBabel } from '@rollup/plugin-babel'
import { terser as pluginTerser } from 'rollup-plugin-terser'
import * as path from 'path'

export default [
  {
    input: './src/ts/drawer.ts',
    output: [
      {
        name: 'Drawer',
        file: './dist/drawer.js',
        format: 'iife',
        sourcemap: 'inline',
      },
      {
        name: 'Drawer',
        file: './dist/drawer.min.js',
        format: 'iife',
        plugins: [
          pluginTerser()
        ]
      },
    ],
    plugins: [
      typescript(),
      pluginBabel({
        extensions: ['.js', '.ts'],
        babelHelpers: 'bundled',
        configFile: path.resolve(__dirname, 'babel.config.json'),
      }),
    ]
  },
  {
    input: './src/ts/drawer.ts',
    output: {
      name: 'Drawer',
      file: './dist/drawer-module.js',
      format: 'esm',
      sourcemap: 'inline',
    },
    plugins: [
      typescript(),
      pluginBabel({
        extensions: ['.js', '.ts'],
        babelHelpers: 'bundled',
        configFile: path.resolve(__dirname, 'babel.config.json'),
      }),
    ]
  }
]
