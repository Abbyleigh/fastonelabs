import test from 'node:test';
import assert from 'node:assert/strict';
import {readScreen,screenUrl,nextSlide,shouldAdvance} from '../src/navigation.ts';
test('bookmarked app screens preserve event, driver and strategy context',()=>{
 const screens=[{type:'home'},{type:'news'},{type:'careers'},{type:'careers',id:'hamilton'},{type:'calendar',year:2024},{type:'drivers'},{type:'driver',id:'max_verstappen'},{type:'garage',year:2026,round:18,driver:'norris'},{type:'replay',year:2024,round:12,name:'British Grand Prix'},{type:'race',year:2024,round:12},{type:'forecast',year:2026,round:19,name:'Mexico City Grand Prix'},{type:'strategy',race:{season:2026,round:19,name:'Mexico City Grand Prix',circuit:'Autódromo Hermanos Rodríguez',date:'2026-11-01'}}];
 for(const screen of screens)assert.deepEqual(readScreen(screenUrl(screen)),screen);
});
test('invalid URLs never request arbitrary driver paths or invalid races',()=>{
 for(const hash of ['#driver?id=../../secret','#garage?year=NaN&round=12','#race?year=2024&round=-1','#replay?year=2024.5&round=12','#other','#race?year=9999&round=12'])assert.deepEqual(readScreen(hash),{type:'home'});
 assert.deepEqual(readScreen('#strategy?race=%7Bbad'),{type:'strategy'});
});
test('carousel wraps and handles empty rosters safely',()=>{assert.equal(nextSlide(5,1,6),0);assert.equal(nextSlide(0,-1,6),5);assert.equal(nextSlide(0,1,0),0);});
test('automatic advance stops for each accessibility and interaction pause condition',()=>{assert.equal(shouldAdvance(true,false,false,false,true,6),true);for(const args of [[false,false,false,false,true,6],[true,true,false,false,true,6],[true,false,true,false,true,6],[true,false,false,true,true,6],[true,false,false,false,false,6],[true,false,false,false,true,1]])assert.equal(shouldAdvance(...args),false);});
