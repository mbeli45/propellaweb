const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');

// Execute the real entry point with rendering/telemetry mocked. Native bridge
// properties match the getter-only API exposed by WKWebView on iOS.
const source = fs.readFileSync(path.join(__dirname, '../src/main.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.React,
    esModuleInterop: true,
  },
}).outputText;

function boot(window) {
  let rendered = false;
  const root = {};
  const modules = {
    react: { createElement: () => ({}), StrictMode: () => null },
    'react-dom/client': { createRoot: element => {
      assert.equal(element, root);
      return { render: () => { rendered = true; } };
    } },
    '@sentry/react': { ErrorBoundary: () => null },
    './App.tsx': { default: () => null },
    './index.css': {},
    './lib/sentry': { initSentry: () => {} },
  };
  vm.runInNewContext(compiled, {
    exports: {}, window,
    document: { getElementById: () => root },
    require: name => {
      assert.ok(name in modules, `Unexpected import: ${name}`);
      return modules[name];
    },
  });
  assert.equal(rendered, true, 'Startup must reach React rendering');
}

test('starts without a native browser bridge', () => boot({}));
test('starts with getter-only iOS messageHandlers and preserves native handlers', () => {
  const handlers = Object.freeze({ nativeHandler: { postMessage() {} } });
  const webkit = Object.defineProperty({}, 'messageHandlers', { get: () => handlers });
  boot({ webkit });
  assert.equal(webkit.messageHandlers, handlers);
});
test('does not probe restricted native bridge properties', () => {
  const window = Object.defineProperty({}, 'webkit', {
    get() { throw new Error('Native bridge access is restricted'); },
  });
  boot(window);
});
