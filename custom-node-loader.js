module.exports = function () {
  const path = require('path');
  let nodeUrl = JSON.stringify(this.resourcePath);
  if (process.env.NODE_ENV === 'production') {
    nodeUrl = '__dirname +' + JSON.stringify('/' + path.basename(this.resourcePath));
  }
  return 'try {global.process.dlopen(module, ' + nodeUrl + '); } catch(e) {' +
    "throw new Error('Cannot open ' + " + nodeUrl + " + ': ' + e);}";
};
