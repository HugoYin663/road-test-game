const {chromium}=require('playwright');const fs=require('fs');(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const p=await b.newPage();p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>console.log('LOG',m.text()));
await p.goto('http://localhost:8766/bake.html');const P=JSON.parse(process.argv[2]);
const d=await p.evaluate(P=>bake(P),P);fs.writeFileSync(process.argv[3],Buffer.from(d.split(',')[1],'base64'));await b.close()})();
