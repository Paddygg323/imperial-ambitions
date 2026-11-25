const {createStaticServer}=require('../../scripts/static-server.cjs');
import('./prepare-military.mjs').then(m=>m.prepareMilitary()).then(()=>{
 createStaticServer({root:__dirname,project:'imperial-ambitions-sprites'}).listen(8790,'127.0.0.1',()=>console.log('Sprite library: http://127.0.0.1:8790/ — current army: /military.html'));
}).catch(error=>{console.error(error);process.exitCode=1;});
