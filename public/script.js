@@ .. @@
 // Load client-side modules
+document.head.appendChild(Object.assign(document.createElement('script'), {
+  src: '/client-error-handler.js',
+  type: 'text/javascript'
+}));
+
+document.head.appendChild(Object.assign(document.createElement('script'), {
+  src: '/client-api.js', 
+  type: 'text/javascript'
+}));
+
 document.head.appendChild(Object.assign(document.createElement('script'), {
// Load client-side modules
   src: '/error-integration.js',