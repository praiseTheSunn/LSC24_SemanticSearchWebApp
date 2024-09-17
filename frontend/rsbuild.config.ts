import { defineConfig } from '@rsbuild/core'
import { pluginCssMinimizer } from '@rsbuild/plugin-css-minimizer'
import { pluginImageCompress } from '@rsbuild/plugin-image-compress'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginSass } from '@rsbuild/plugin-sass'
import { pluginTypeCheck } from '@rsbuild/plugin-type-check'

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  plugins: [
    pluginTypeCheck({
      enable: isProduction,
    }),
    pluginSass(),
    pluginCssMinimizer(),
    pluginImageCompress(),
    pluginReact(),
  ],
  security: {
    sri: {
      enable: isProduction && 'auto',
      algorithm: 'sha256',
    },
  },
  html: {
    title: 'SnapSeek',
    favicon: 'public/snapseek.ico',
  },
  source: {
    define: {
      'process.env.NODE_DEBUG': false,
    },
  },
})
