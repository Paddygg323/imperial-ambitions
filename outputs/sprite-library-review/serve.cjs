const {createStaticServer}=require('../../scripts/static-server.cjs');
createStaticServer({root:__dirname,project:'imperial-ambitions-sprites'}).listen(8790,'127.0.0.1',()=>console.log('Sprite library: http://127.0.0.1:8790/'));
