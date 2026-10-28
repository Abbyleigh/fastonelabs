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

test('race selectors change the active tool and preserve the correct event context',async()=>{
 const {screenForEvent,eventInSeason}=await import('../src/navigation.ts');
 const silverstone={year:2024,round:12,name:'British Grand Prix',circuit:'Silverstone Circuit',start:'2024-07-07',status:'completed'};
 assert.deepEqual(screenForEvent({type:'home'},silverstone),{type:'calendar',year:2024,round:12});
 assert.deepEqual(screenForEvent({type:'replay',year:2023,round:10,name:'Old event'},silverstone),{type:'replay',year:2024,round:12,name:'British Grand Prix'});
 assert.equal(screenForEvent({type:'strategy'},silverstone).race.round,12);
 assert.deepEqual(readScreen(screenUrl(screenForEvent({type:'calendar'},silverstone))),{type:'calendar',year:2024,round:12});
 const upcoming={...silverstone,year:2026,round:19,name:'Mexico City Grand Prix',circuit:'Autódromo Hermanos Rodríguez',status:'upcoming'};
 assert.equal(screenForEvent({type:'replay',year:2024,round:12,name:'British Grand Prix'},upcoming).type,'circuit');
 assert.equal(screenForEvent({type:'garage',year:2024,round:12},upcoming).type,'circuit');
 assert.equal(screenForEvent({type:'replay',year:2024,round:12,name:'British Grand Prix'},{...silverstone,year:1990}).type,'race');
 const earlier={...silverstone,year:2023,round:11};
 assert.equal(eventInSeason([upcoming,earlier],silverstone),earlier);
 assert.equal(eventInSeason([upcoming],null),upcoming);
 assert.equal(eventInSeason([],null),null);
});
