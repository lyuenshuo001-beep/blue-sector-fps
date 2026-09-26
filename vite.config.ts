import {defineConfig} from 'vite';
export default defineConfig({base:'./',optimizeDeps:{noDiscovery:true,include:[]},build:{target:'es2020',chunkSizeWarningLimit:650},server:{port:5173}});
