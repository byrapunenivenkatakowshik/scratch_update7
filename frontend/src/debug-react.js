// Debug script to help identify React DOM issues
// Run this in the browser console

console.log('=== React Debug Information ===');

// Check React version
console.log('React version:', React.version);

// Check if React DOM is available
console.log('ReactDOM available:', typeof ReactDOM !== 'undefined');

// Check React Dev Tools
console.log('React Dev Tools:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ? 'Available' : 'Not available');

// Check for common React errors
const commonErrors = [
  'Cannot read property',
  'Cannot read properties',
  'null is not an object',
  'undefined is not a function',
  'Cannot destructure property',
  'hooks can only be called inside',
  'rendered fewer hooks than expected',
  'rendered more hooks than expected'
];

// Monitor console errors
const originalError = console.error;
console.error = function(...args) {
  const message = args.join(' ');
  
  // Check if it's a React-related error
  const isReactError = commonErrors.some(error => 
    message.toLowerCase().includes(error.toLowerCase())
  );
  
  if (isReactError) {
    console.log('🚨 React-related error detected:', message);
  }
  
  // Call original error function
  originalError.apply(console, args);
};

// Check for memory leaks
let componentCount = 0;
const originalMount = React.Component.prototype.componentDidMount;
const originalUnmount = React.Component.prototype.componentWillUnmount;

if (originalMount) {
  React.Component.prototype.componentDidMount = function() {
    componentCount++;
    console.log(`📈 Component mounted. Total: ${componentCount}`);
    if (originalMount) originalMount.call(this);
  };
}

if (originalUnmount) {
  React.Component.prototype.componentWillUnmount = function() {
    componentCount--;
    console.log(`📉 Component unmounted. Total: ${componentCount}`);
    if (originalUnmount) originalUnmount.call(this);
  };
}

// Check for performance issues
const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    if (entry.entryType === 'measure' && entry.name.includes('React')) {
      console.log(`⏱️ React performance: ${entry.name} took ${entry.duration}ms`);
    }
  });
});

if (typeof PerformanceObserver !== 'undefined') {
  observer.observe({ entryTypes: ['measure', 'navigation'] });
}

// Check local storage and session storage
console.log('📦 Local Storage items:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(`  ${key}: ${value ? value.substring(0, 50) + '...' : 'null'}`);
}

// Check for common DOM issues
console.log('🔍 DOM checks:');
console.log('  Document ready state:', document.readyState);
console.log('  Root element exists:', !!document.getElementById('root'));
console.log('  Body exists:', !!document.body);
console.log('  Head exists:', !!document.head);

// Check for JavaScript errors in the last 5 seconds
setTimeout(() => {
  console.log('✅ React debug monitoring active for 5 seconds');
}, 5000);

// Export for manual testing
window.reactDebug = {
  componentCount: () => componentCount,
  clearErrors: () => console.clear(),
  version: React.version,
  checkMemory: () => {
    if (performance.memory) {
      console.log('💾 Memory usage:', {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
      });
    }
  }
};

console.log('🎯 React debug tools available at window.reactDebug');
console.log('Type "reactDebug.checkMemory()" to check memory usage');
console.log('Type "reactDebug.componentCount()" to check component count');