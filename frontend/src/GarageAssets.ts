export type GarageCar = { id:string; name:string; team:string; season:number; drivers:string[]; path:string; author:string; source:string; license:string; licenseUrl:string };
export const garageCars: GarageCar[] = [{
 id:'ferrari-2023',name:'Ferrari SF23',team:'Ferrari',season:2023,drivers:['leclerc','sainz'],
 path:'/models/cars/ferrari/2023/sf23.glb',author:'Redgrund',
 source:'https://sketchfab.com/3d-models/scuderia-ferrari-f1-sf23-2023-ecb0f812bc454331bbe721655b0780ec',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/'
}, ...[
 {id:'ferrari-2026',name:'Ferrari SF-26',team:'Ferrari',season:2026,drivers:['hamilton','leclerc'],path:'/models/cars/ferrari/2026/car.glb',source:'https://sketchfab.com/3d-models/2026-ferrari-sf-26-e5ca6cecdc42449283f4bed27360f2a7'},
 {id:'mercedes-2026',name:'Mercedes W17',team:'Mercedes',season:2026,drivers:['russell','antonelli'],path:'/models/cars/mercedes/2026/car.glb',source:'https://sketchfab.com/3d-models/2026-mercedes-w17-b806f1e70aa343219e7158169549b97b'}
,
{"id": "mclaren-2026", "name": "McLaren MCL40", "team": "McLaren", "season": 2026, "drivers": ["norris", "piastri"], "path": "/models/cars/mclaren/2026/car.glb", "source": "https://sketchfab.com/3d-models/96214ad5624f42a0861f77008f8d29e7"},
{"id": "aston-martin-2026", "name": "Aston Martin AMR26", "team": "Aston Martin", "season": 2026, "drivers": ["alonso", "stroll"], "path": "/models/cars/aston-martin/2026/car.glb", "source": "https://sketchfab.com/3d-models/a50d1c7bc086455c9412470d93fc3fc7"},
{"id": "cadillac-2026", "name": "Cadillac MAC-26", "team": "Cadillac F1 Team", "season": 2026, "drivers": ["perez", "bottas"], "path": "/models/cars/cadillac/2026/car.glb", "source": "https://sketchfab.com/3d-models/95bcd37aa7c649779efc33b90b6c023e"},
{"id": "audi-2026", "name": "Audi R26", "team": "Audi", "season": 2026, "drivers": ["hulkenberg", "bortoleto"], "path": "/models/cars/audi/2026/car.glb", "source": "https://sketchfab.com/3d-models/32bf228264b047669b100b0f1b8769ac"},
{"id": "red-bull-2026", "name": "Red Bull RB22", "team": "Red Bull", "season": 2026, "drivers": ["max_verstappen", "hadjar"], "path": "/models/cars/red-bull/2026/car.glb", "source": "https://sketchfab.com/3d-models/0a3d24a58e0549d591a5a48c22eec383"},
{"id": "haas-2026", "name": "Haas VF-26", "team": "Haas F1 Team", "season": 2026, "drivers": ["ocon", "bearman"], "path": "/models/cars/haas/2026/car.glb", "source": "https://sketchfab.com/3d-models/1f41e03886724bc6acd16c92402989bc"}
].map(car=>({...car,author:'Dave Love SketchFab',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/'}))];
// Explicit identity matching: recolouring never makes a car a different season.
export function matchGarageCar(driver:string|undefined,team:string,season:number|undefined){
 return garageCars.find(car=>car.season===season&&car.team.toLowerCase()===team.toLowerCase()&&!!driver&&car.drivers.includes(driver));
}
