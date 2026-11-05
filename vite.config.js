import { defineConfig } from "vite";
export default defineConfig({base:"/rattil/",appType:"spa",worker:{format:"es"},optimizeDeps:{exclude:["onnxruntime-web"]},build:{target:"es2022",outDir:"dist",emptyOutDir:true,rollupOptions:{input:"index.html"}}});
