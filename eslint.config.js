const antfu = require('@antfu/eslint-config').default

module.exports = antfu({
    ignores: [
        '/build/',
        '/dist/',
        '/*.js',
        '/test/unit/coverage/'
    ],
    files: [
        'src/*.{js,ts,vue}'
    ]
})
