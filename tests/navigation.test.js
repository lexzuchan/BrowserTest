const {test}=require('node:test');
const assert=require('node:assert/strict');
const {resolveAddress}=require('../navigation');
test('addresses and searches',()=>{assert.equal(resolveAddress('github.com'),'https://github.com/');assert.equal(resolveAddress('localhost:3000'),'http://localhost:3000/');assert.equal(resolveAddress('hello world'),'https://www.google.com/search?q=hello%20world');assert.equal(resolveAddress('https://example.com/a?q=b'),'https://example.com/a?q=b');});
test('privileged and executable protocols are rejected',()=>{for(const input of ['javascript:alert(1)','file:///C:/Windows','data:text/html,test','vscode:foo','about:blank'])assert.equal(resolveAddress(input),null);assert.equal(resolveAddress('  '),null);});
test('domain ports remain valid addresses',()=>{assert.equal(resolveAddress('example.com:8080/path'),'https://example.com:8080/path');});
