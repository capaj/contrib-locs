let modules = process.env.BABEL_MODULES || 'auto'

if (process.env.BABEL_MODULES === 'false') {
  modules = false
}

module.exports = (api) => {
  api.cache.forever()

  return {
    presets: [['@babel/preset-env', { targets: { node: 'current' }, modules }]],
    plugins: [
      'babel-plugin-const-enum',
      ['@babel/plugin-transform-typescript', { isTSX: true }],

      '@babel/plugin-proposal-object-rest-spread'
    ],
    env: {
      test: {
        presets: [
          [
            '@babel/preset-env',
            { targets: { node: 'current' }, modules: 'cjs' }
          ]
        ]
      },
      production: {
        ignore: [/[/\\.]test\.[tj]sx?$/, /[/\\]__demo__[/\\]/]
      }
    }
  }
}
