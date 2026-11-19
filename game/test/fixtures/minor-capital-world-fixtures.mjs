import {generateHistoricalWorld} from '../../map-historical-world.mjs';
import {finalizeOriginalMapPictures} from '../../map-picture-finalization.mjs';
import {originalCountryTiles} from '../../map-minor-capitals.mjs';
import {pathToFileURL} from 'node:url';
export function capitalWorld(seed){const s=generateHistoricalWorld([...Buffer.from(String(seed))],{timeSeed:seed});s.seaDecorationTile=-1;finalizeOriginalMapPictures(s);return s;}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify([1500,1501].map(seed=>{const s=capitalWorld(seed);return {seed,tiles:Buffer.from(s.tiles).toString('hex'),provinces:Buffer.from(s.provinces).toString('hex'),owners:Array.from({length:16},(_,i)=>({owner:i+6,order:originalCountryTiles(s,i+6)}))};})));
