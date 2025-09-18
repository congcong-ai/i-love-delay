'use strict';
/*
  最小可用的 uni 桥接兜底：当官方 uni.webview.*.js 加载失败时，提供 window.uni.postMessage。
  注意：此 shim 仅保证 H5 能调用 postMessage；是否能被壳侧 web-view 捕获，取决于平台对 window.parent.postMessage 的转发能力。
  因此，强烈建议优先使用官方脚本 uni.webview.1.5.5.js。
*/
(function () {
  if (typeof window === 'undefined') return;
  if (window.uni && typeof window.uni.postMessage === 'function') return;

  function safeLog() {
    try { console.log.apply(console, arguments); } catch (_) {}
  }

  // 简单实现：优先使用 window.parent.postMessage；若不可用，则退化为本页事件派发（壳侧可能接收不到）。
  function shimPostMessage(msg) {
    try {
      var payload = msg && msg.data ? msg.data : msg;
      var hasParent = typeof window.parent !== 'undefined' && window.parent !== window;
      if (hasParent && typeof window.parent.postMessage === 'function') {
        window.parent.postMessage(payload, '*');
        return;
      }
      // 退化为本页广播，便于调试
      window.postMessage(payload, '*');
    } catch (err) {
      safeLog('[uni-bridge-shim] postMessage error:', err);
    }
  }

  window.uni = window.uni || {};
  window.uni.postMessage = shimPostMessage;

  // 标记已启用 shim
  safeLog('[uni-bridge-shim] window.uni.postMessage is now available (shim).');
})();
