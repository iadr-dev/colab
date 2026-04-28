/**
 * oh-my-colab — OpenCode plugin entry
 */
module.exports = {
  name: '@iadr/colab',
  version: '0.1.0',
  contextFile: 'CLAUDE.md',
  onInstall: async () => {
    console.log('oh-my-colab: run `ohc setup` to complete installation');
  }
};
