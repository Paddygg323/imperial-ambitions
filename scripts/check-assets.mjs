import {access,readFile} from 'node:fs/promises';
import {SPRITES} from '../game/reviewed-sprite-data.mjs';
const manifest=JSON.parse(await readFile('outputs/sprite-library-review/manifest.json','utf8'));
for(const s of Object.values(SPRITES))await access('game/'+s.file);
for(const s of manifest.sprites){
 await access('outputs/sprite-library-review/'+s.image);
 if(s.composite){await access('outputs/sprite-library-review/'+s.composite.base);await access('outputs/sprite-library-review/'+s.composite.ore.image);}
}
console.log('Validated '+Object.keys(SPRITES).length+' runtime mappings and '+manifest.sprites.length+' library entries.');
