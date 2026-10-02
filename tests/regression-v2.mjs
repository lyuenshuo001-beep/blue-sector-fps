import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('test-results', {recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage();
 await page.goto('http://localhost:5174/?test=1'); await page.waitForFunction(()=>!!window.__game);
 const result=await page.evaluate(()=>{
  const g=window.__game;g.capture=()=>{};g.start();g.state='paused';const guns=[];
  for(let i=0;i<g.weapons.weapons.length;i++){
   g.weapons.reset();g.input.reset();g.weapons.switch(i);g.weapons.cooldown=0;g.input.fire=true;g.input.pressed=true;
   g.weapons.update(.01,g.input,g.player,()=>{});for(let n=0;n<60;n++)g.weapons.update(.02,g.input,g.player,()=>{});
   const w=g.weapons.current,shots=g.weapons.shots,ammo=w.ammo,total=w.ammo+w.reserve;
   g.input.reset();g.weapons.reload();g.weapons.update(w.spec.reloadTime+.1,g.input,g.player,()=>{});
   guns.push({id:w.spec.id,automatic:w.spec.automatic,shots,ammo,mag:w.spec.magazine,reloaded:w.ammo===w.spec.magazine,conserved:w.ammo+w.reserve===total});
  }
  g.player.reset();g.input.reset();g.input.jump=true;g.player.update(.05,g.input,g.map,g.renderer.camera);const jump=g.player.position.y>0;
  g.input.crouch=true;for(let n=0;n<90;n++)g.player.update(.02,g.input,g.map,g.renderer.camera);const crouch=g.player.height<1.3;
  g.player.reset();g.pickups.reset();g.player.hp=40;const health=g.pickups.items.find(i=>i.type==='health');g.player.position.copy(health.mesh.position);g.pickups.update(.01,g.player,g.weapons,()=>{});const heal=g.player.hp===75&&!health.active;
  const ammo=g.pickups.items.find(i=>i.type==='ammo');g.weapons.current.reserve=0;g.player.position.copy(ammo.mesh.position);g.pickups.update(.01,g.player,g.weapons,()=>{});const refill=g.weapons.current.reserve>0&&!ammo.active;
  g.player.reset();g.input.reset();g.player.update(.02,g.input,g.map,g.renderer.camera);g.enemies.reset();g.enemies.update(.01,g.player,g.renderer.camera,()=>{},()=>{});const wave1=g.enemies.remaining+g.enemies.active.length;g.enemies.pool.forEach(e=>e.die());g.enemies.remaining=0;g.enemies.waveDelay=0;g.enemies.update(.01,g.player,g.renderer.camera,()=>{},()=>{});const wave2=g.enemies.remaining+g.enemies.active.length;
  g.enemies.pool.forEach(e=>e.die());g.enemies.remaining=1;const enemy=g.enemies.pool[0];enemy.spawn(g.player.position.clone().set(0,0,20),1);g.renderer.scene.updateMatrixWorld(true);let damage=0;const random=Math.random;try{Math.random=()=>0;for(let i=0;i<100;i++)g.enemies.update(.04,g.player,g.renderer.camera,n=>damage+=n,()=>{});}finally{Math.random=random;}
  g.state='playing';g.player.hp=1;g.damage(100);const over=g.state==='over';g.start();const restart=g.state==='playing'&&g.player.hp===100&&g.enemies.kills===0&&g.weapons.shots===0;
  return {guns,jump,crouch,heal,refill,wave1,wave2,enemyDamage:damage,over,restart};
 });
 for(const gun of result.guns){assert.ok(gun.automatic?gun.shots>2:gun.shots===1,gun.id);assert.equal(gun.ammo,gun.mag-gun.shots);assert.ok(gun.reloaded&&gun.conserved,gun.id+' reload');}
 for(const key of ['jump','crouch','heal','refill','over','restart'])assert.ok(result[key],key);
 assert.equal(result.wave1,3);assert.equal(result.wave2,5);assert.ok(result.enemyDamage>0);
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});const mobile=await context.newPage();await mobile.goto('http://localhost:5174/?test=1');await mobile.waitForFunction(()=>!!window.__game);await mobile.locator('[data-tab="weapons"]').tap();
 const session=await context.newCDPSession(mobile);await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:75,y:295}]});for(let i=1;i<=8;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:75,y:295-i*20}]});await mobile.waitForTimeout(30);}await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 result.mobileMenuScroll=await mobile.locator('.lobby-left').evaluate(el=>el.scrollTop);assert.ok(result.mobileMenuScroll>40,'Weapon store can scroll using touch');
 await writeFile('test-results/regression-v2.json',JSON.stringify(result,null,2));console.log('PASS: all 14 fire modes / reload, jump, crouch, pickups, AI damage, waves, restart, touch menu scroll');
} finally {await browser.close();}
