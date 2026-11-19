const {createStaticServer}=require('../scripts/static-server.cjs');
const port=Number(process.env.IMP_PORT||8774);
createStaticServer({root:__dirname,project:'imperial-ambitions'}).listen(port,'127.0.0.1',()=>console.log('Imperial Ambitions: http://127.0.0.1:'+port));
