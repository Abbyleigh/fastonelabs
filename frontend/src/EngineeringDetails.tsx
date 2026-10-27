import React from 'react';
const SOURCES={
 chassis:{label:'McLaren: chassis and safety structures',url:'https://www.mclaren.com/racing/formula-1/2026/what-is-the-technical-specification-of-our-2026-formula-1/'},
 wing:{label:'Formula 1: front-wing glossary',url:'https://www.formula1.com/en/latest/article/f1-glossary-f-j.2g6grJVxT6dFCDpSmgoCQX'},
 aero:{label:'Formula 1: 2026 aerodynamics explained',url:'https://www.formula1.com/en/latest/article/the-beginners-guide-to-the-2026-regulations.6j0tS0hrHG2T01tpmK6XYz'},
 floor:{label:'Formula 1: diffuser glossary',url:'https://www.formula1.com/en/latest/article/f1-glossary-a-e.1MFONigMlQSbSQtpP7YCy2'},
 power:{label:'FIA: hybrid power-unit principles',url:'https://www.fia.com/news/new-era-competition-fia-showcases-future-focused-formula-1-regulations-2026-and-beyond'},
 tyres:{label:'Pirelli: Formula 1 tyre compounds',url:'https://www.pirelli.com/tyres/en-gb/motorsport/car/formula-1'},
 suspension:{label:'Mercedes: suspension and platform control',url:'https://www.mercedesamgf1.com/news/the-suspension-of-a-formula-one-car'}
};
const NOTES={
 body:{
  what:'The central structure supports the driver and connects the car’s major systems. The outer panels manage cooling and airflow; they are not all part of the protective survival cell.',
  why:'An F1 car needs a strong, stiff core without unnecessary mass. A stable chassis lets suspension loads act predictably, while the bodywork packages equipment and guides air around it.',
  how:'A real monocoque uses engineered composite construction. Cooling openings admit air to heat exchangers, and shaped panels guide the surrounding flow. Safety structures and removable covers perform different jobs.',
  compromise:'Opening more cooling area can help control temperatures but changes aerodynamic performance. Compact bodywork can improve packaging and airflow while making heat management and access more demanding.',
  model:'This selection groups the visible chassis, sidepods, engine cover, halo and mirrors. The surface model is not a cutaway of the survival cell, fuel system or cooling hardware.',
  pieces:[
   ['Monocoque / survival cell','The protective cockpit structure and central attachment platform. F1 uses it to support the driver and carry loads from the rest of the car.'],
   ['Nose and front impact structure','The forward assembly supports the front wing and shapes approaching airflow. A real nose also incorporates an energy-absorbing impact structure; this mesh does not demonstrate its crash behaviour.'],
   ['Left and right sidepods','Separate body panels around the cooling package. Their openings and outer contours must satisfy cooling needs while influencing airflow towards the rear.'],
   ['Airbox and engine cover','The upper inlet supplies air to systems beneath the cover; the exact routing varies by design. The cover encloses machinery and shapes the external flow rather than producing engine power itself.'],
   ['Halo','The structure surrounding the cockpit helps protect the driver’s head from external impacts. It is a safety component, not a windscreen.'],
   ['Mirrors','Let the driver monitor cars behind and alongside. Their location balances useful visibility with packaging and airflow constraints.']
  ],sources:[SOURCES.chassis]
 },
 frontWing:{
  what:'The low aerodynamic assembly ahead of the front wheels. Its shaped elements create front-end aerodynamic load and influence the airflow that reaches the tyres and the rest of the car.',
  why:'F1 uses the front wing to help the front tyres generate cornering grip and to balance the aerodynamic load between the front and rear axles. That balance influences how willingly the car turns.',
  how:'Pressure differences around the wing surfaces produce downforce. Changes to geometry and flap setting alter both load and the surrounding flow; the front wing is part of a whole-car aerodynamic system.',
  compromise:'A setting that improves front-end response can change drag and balance. More front load does not automatically mean a faster car if the rear can no longer provide matching grip.',
  model:'The separated mesh represents a complete wing assembly. Slots and surfaces are visible, but there is no airflow simulation or animated 2026 flap mechanism.',
  pieces:[
   ['Main plane','The principal wing surface establishes the basic aerodynamic shape and carries load.'],
   ['Flaps and slots','Additional surfaces and the gaps between them help manage the flow around the wing. Their geometry provides ways to tune load and balance.'],
   ['Outer wing sections / end regions','Control how flow leaves the outer part of the assembly and interacts with the front-wheel region. The exact design is constrained by the rules.']
  ],sources:[SOURCES.wing,SOURCES.aero]
 },
 rearWing:{
  what:'The elevated aerodynamic assembly behind the rear wheels. It contributes rear downforce and affects how the car’s wake develops.',
  why:'The rear tyres must support cornering forces while also transmitting driving force. Rear aerodynamic load helps give the driver a stable rear end at speed.',
  how:'The wing’s shape and setting create a pressure distribution that pushes the car down. For 2026, front and rear wing elements can change between lower-drag straight-line and higher-load cornering configurations.',
  compromise:'Additional rear load usually carries a drag cost. A circuit with long straights can favour a different balance from one dominated by corners. Rear-wing changes also need to work with the front wing and floor.',
  model:'This is exterior concept geometry. It does not reproduce a verified team wing specification, active-aero linkage, actuator or control system.',
  pieces:[
   ['Main wing and upper flap','The main aerodynamic surfaces supply rear load. Their relative positions affect the balance between drag and downforce.'],
   ['Supports','Connect the assembly to the car and transmit its aerodynamic loads into the structure.'],
   ['Outer edges','Influence the flow around the wing ends. Their shape works with the entire rear aerodynamic package.']
  ],sources:[SOURCES.aero]
 },
 floor:{
  what:'The broad underside of the car and its shaped rear outlet. The floor influences the pressure beneath the car; the diffuser manages the transition of underbody flow towards the rear.',
  why:'Underbody aerodynamics can contribute useful load without relying entirely on the exposed wings. F1 teams develop this area together with ride height, bodywork and wheel-flow management.',
  how:'The shape of the underside, its distance from the track and the flow leaving it determine the pressure distribution. The expanding diffuser region must manage that flow without excessive separation.',
  compromise:'Lower ride height is not automatically better. Bumps, kerbs, changing loads and flow separation can upset performance. The aerodynamic design must remain useful over the car’s operating range.',
  model:'The mesh shows an exterior floor and rear outlet, not measured pressure or a complete underbody engineering drawing. Do not read this independent 2026 concept as an exact 2022–25 tunnel-floor design.',
  pieces:[
   ['Floor surface and edges','Define much of the underbody flow path. The edges interact with air outside the car and with disturbances from the rotating wheels.'],
   ['Diffuser / rear outlet','Allows the underbody flow to transition towards the surrounding air. Its shape influences how effectively the upstream floor operates.']
  ],sources:[SOURCES.floor,SOURCES.aero]
 },
 power:{
  what:'The real hybrid power unit combines a combustion engine, turbocharger, electrical motor-generator, energy store and control electronics. It produces and manages energy for propulsion.',
  why:'Combining combustion and electrical systems lets the car recover energy and deploy electrical assistance when useful. Teams must manage available energy across a lap rather than think only about maximum engine output.',
  how:'The engine converts fuel energy into mechanical work. The turbocharger uses exhaust energy to compress intake air. The MGU-K can recover energy and can act as a motor; the battery and electronics store and control electrical energy. The 2026 system does not use the earlier MGU-H.',
  compromise:'Energy deployment, recovery, cooling and reliability interact. Aggressive deployment can help an attack but leaves less available later unless the energy is recovered.',
  model:'Important: the installed detailed car contains an exterior exhaust outlet, not a complete internal engine, turbocharger, battery or motor-generator. In the procedural fallback, the simple internal block is only a conceptual placeholder.',
  pieces:[
   ['Exhaust outlet — visible in this asset','Carries exhaust gas away from the engine. It is a small exterior part of the powertrain, not the whole power unit.'],
   ['Engine and turbocharger — explained, not modelled','Supply combustion power and compressed intake air. Their real shapes and internal mechanisms are not shown here.'],
   ['MGU-K, battery and electronics — explained, not modelled','Recover, store and deploy electrical energy. Their presence in a real F1 car must not be inferred from this exterior mesh.']
  ],sources:[SOURCES.power]
 },
 wheels:{
  what:'Four wheel-and-tyre assemblies form the car’s contact with the track. The tyre supplies grip; the rigid wheel supports it and connects the assembly to the hub.',
  why:'Acceleration, braking and cornering all depend on the forces transmitted through the tyre contact patches. Selecting and managing tyres is therefore central to race pace and pit-stop decisions.',
  how:'The rubber deforms against the road and operates within useful temperature conditions. Slicks suit dry surfaces. Intermediate and full-wet tread patterns manage water, with different operating needs.',
  compromise:'Compound choice balances pace, warm-up and durability for the conditions. Wear, overheating and surface damage are different problems; a tyre can lose performance even when substantial rubber remains.',
  model:'The asset shows exterior wheel assemblies. It does not simulate tyre deformation, heat, wear or water clearance, and it is not a detailed brake cutaway.',
  pieces:[
   ['Front-left and front-right tyres','Provide steering response as well as braking and cornering grip. Their condition strongly influences whether the car follows the intended line.'],
   ['Rear-left and rear-right tyres','Transmit driving force while also providing cornering grip. Excess wheelspin can waste traction and stress the tyres.'],
   ['Wheel / rim','Supports the tyre and transfers loads to the hub. The visible dark wheel assembly should not be mistaken for a flexible rubber-only component.'],
   ['Hub and brakes — mostly hidden','The hub locates the rotating wheel; the brakes slow it. Their full mechanisms are not separated or demonstrated in this model.']
  ],sources:[SOURCES.tyres]
 },
 suspension:{
  what:'The links between the chassis and wheel assemblies allow controlled wheel movement. Visible links are only part of a larger system that also contains concealed springing and damping hardware.',
  why:'F1 needs the tyres to maintain useful contact with uneven track surfaces while controlling the body’s attitude. Suspension must support mechanical grip and keep the aerodynamic platform predictable.',
  how:'Wishbones locate each wheel. Push-rods or pull-rods transmit movement to inboard mechanisms. Springs resist displacement, dampers control motion, and anti-roll elements influence the car’s response in corners.',
  compromise:'A very stiff setup can control body movement but become less forgiving over bumps and kerbs. Softer settings can improve compliance while allowing more ride-height variation. Link placement also affects airflow.',
  model:'The imported front and rear suspension are exterior assemblies. The mesh does not animate working joints or reveal every inboard spring, damper, steering mechanism or bearing.',
  pieces:[
   ['Front suspension','Locates the steering wheels and manages their movement under cornering and braking loads.'],
   ['Rear suspension','Locates the driven wheels and manages their movement as power and cornering forces act on the rear axle.'],
   ['Wishbones and rods','Provide wheel location and transmit loads. Thin-looking links are structural components, not decorative aerodynamic fins.'],
   ['Inboard elements — not fully modelled','Springs, dampers and associated mechanisms control movement behind the bodywork.']
  ],sources:[SOURCES.suspension]
 }
};
export default function EngineeringDetails({id}:{id:keyof typeof NOTES}){
 const note=NOTES[id];
 return <div style={{fontSize:13,color:'#c3d2e5',lineHeight:1.75,marginTop:16}}>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,260px),1fr))',gap:14}}>{[['What it is',note.what],['Why F1 uses it',note.why],['How it works',note.how],['Design trade-offs',note.compromise]].map(([title,text])=><section key={title} style={{background:'#142033',padding:15,borderRadius:9}}><h4 style={{margin:'0 0 6px',fontSize:14,color:'#f5f8fc'}}>{title}</h4><p style={{margin:0}}>{text}</p></section>)}</div>
  <h4 style={{fontSize:15,margin:'20px 0 8px',color:'#f5f8fc'}}>Individual pieces and their purpose</h4><dl style={{margin:0}}>{note.pieces.map(([name,text])=><div key={name} style={{padding:'10px 0',borderBottom:'1px solid #34465e'}}><dt style={{fontWeight:700,color:'#e4ecf8'}}>{name}</dt><dd style={{margin:'3px 0 0'}}>{text}</dd></div>)}</dl>
  <aside style={{background:'#172b35',padding:14,borderRadius:9,marginTop:16}}><strong style={{color:'#a5e2dc'}}>What this model actually shows</strong><p style={{margin:'5px 0 0'}}>{note.model}</p></aside>
  <p style={{fontSize:12,marginBottom:0}}>Learn more: {note.sources.map((source,i)=><React.Fragment key={source.url}>{i>0?' · ':''}<a href={source.url} target="_blank" rel="noreferrer" style={{color:'#8bcaff'}}>{source.label}</a></React.Fragment>)}</p>
 </div>;
}
