'use strict';
const fs = require('fs-extra');
const parse5 = require('parse5');

function findImportLink(node, container) {
  if (node.nodeName === 'link') {
    let attr = node.attrs.find((item) => item.name === 'rel' && item.value === 'import');
    if (attr) {
      container.push(node);
    }
    return container;
  }
  if (node.childNodes && node.childNodes.length) {
    for (let i = 0, len = node.childNodes.length; i < len; i++) {
      let res = findImportLink(node.childNodes[i], []);
      if (res && res.length) {
        container = container.concat(res);
      }
    }
  }
  return container;
}

function countLinks(content) {
  const doc = parse5.parse(content);
  const links = findImportLink(doc, []);
  return links;
}

function countLinksfromFile(path) {
  return fs.readFile(path, 'utf8')
  .then((data) => {
    return countLinks(data, []);
  });
}

exports.countImportLinks = countLinks;
exports.countImportLinksfromFile = countLinksfromFile;
