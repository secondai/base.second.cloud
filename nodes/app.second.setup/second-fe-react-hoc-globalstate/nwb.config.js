module.exports = {
  type: 'react-component',
  npm: {
    esModules: true,
    umd: {
      global: 'ReactSecondFeHocGlobalState',
      externals: {
        react: 'React'
      }
    }
  }
}
