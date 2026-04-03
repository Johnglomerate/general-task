/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

process.env.NODE_ENV = 'production'

const plugins = []

try {
    const SentryCliPlugin = require('@sentry/webpack-plugin')
    plugins.push(
        new SentryCliPlugin({
            // Must be the last running plugin
            include: '.',
            ignore: ['node_modules', 'webpack.dev.js', 'webpack.prod.js', 'webpack.common.js'],
            errorHandler: (err) => {
                console.warn('Sentry CLI Plugin warning:', err.message)
            },
        })
    )
} catch (e) {
    console.warn('Sentry CLI Plugin not available, skipping source map upload')
}

module.exports = merge(common, {
    mode: 'production',
    devtool: 'source-map',
    plugins,
})
