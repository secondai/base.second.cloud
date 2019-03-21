module.exports = {
  type: 'react-component',
  npm: {
    esModules: true,
    umd: {
      global: 'ReactSecondComponentLeftRight',
      externals: {
        react: 'React'
      }
    }
  }
}
