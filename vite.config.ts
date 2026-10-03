import {defineConfig} from 'vite';
export default defineConfig({base:'./',optimizeDeps:{noDiscovery:true,include:[]},build:{target:'es2020',chunkSizeWarningLimit:750,rollupOptions:{output:{manualChunks:{engine:['three']}}}},server:{port:5173}});
