import {useId,useState} from 'react';
import {staticBalance} from './engineeringModel';
export default function EngineeringHistory({onSelect}:{onSelect:(id:string)=>void}){
 const [position,setPosition]=useState(.2),[mass,setMass]=useState(150),label=useId();
 const result=staticBalance(position,mass);
 return <section className="hc-engineering" aria-labelledby={label}>
  <p className="hc-eyebrow">ENGINEERING HISTORY / A CHANGE IN ARCHITECTURE</p>
  <h3 id={label}>Move the engine. Question the balance.</h3>
  <div className="hc-story-path" aria-label="Cooper engineering milestones"><button onClick={()=>onSelect('rear-engine-transition')}>1958 / The breakthrough →</button><button onClick={()=>onSelect('cooper-t51')}>1959 / The T51 →</button><button onClick={()=>onSelect('cooper-t53')}>1960 / The T53 →</button></div>
  <p>Period accounts place the Cooper engine behind the driver. The T53 museum account also describes a tubular frame and changed suspension. These are connected design decisions, not proof that engine placement alone wins a championship.</p>
  <div className="hc-circuit-stage"><div>
   <div className="hc-story-path"><button aria-pressed={position===.2} onClick={()=>setPosition(.2)}>Front-position assumption</button><button aria-pressed={position===.7} onClick={()=>setPosition(.7)}>Behind-driver assumption</button></div>
   <label>Assumed engine position: {position.toFixed(2)} of axle spacing<input type="range" min="0.1" max="0.9" step="0.01" value={position} onChange={e=>setPosition(+e.target.value)}/></label>
   <label>Assumed engine mass: {mass} kg<input type="range" min="100" max="300" step="10" value={mass} onChange={e=>setMass(+e.target.value)}/></label>
  </div><figure className="hc-balance-figure">
   <svg viewBox="0 0 600 220" role="img" aria-label={`Teaching beam model: ${(result.frontFraction*100).toFixed(1)} percent front static load, ${(result.rearFraction*100).toFixed(1)} percent rear`}>
    <line x1="60" y1="145" x2="540" y2="145" stroke="#b7c4d0" strokeWidth="4"/>
    <path d="M60 145L40 180H80Z M540 145L520 180H560Z" fill="#8adecf"/>
    <rect x="230" y="80" width="60" height="50" fill="#7d94ac"/><text x="260" y="65" textAnchor="middle" fill="#ecefe9" fontSize="15">Driver</text>
    <rect x={60+position*480-30} y="95" width="60" height="40" fill="#f0ae7d"/><text x={60+position*480} y="45" textAnchor="middle" fill="#f0ae7d" fontSize="15">Engine mass</text>
    <text x="60" y="208" textAnchor="middle" fill="#b7c4d0" fontSize="15">Front axle</text><text x="540" y="208" textAnchor="middle" fill="#b7c4d0" fontSize="15">Rear axle</text>
   </svg><figcaption>Original free-body teaching diagram. No bodywork, dimensions, suspension geometry or authentic historic reconstruction is depicted.</figcaption>
   <div className="hc-balance-results" role="status"><span>Front <strong>{(result.frontFraction*100).toFixed(1)}%</strong></span><span>Rear <strong>{(result.rearFraction*100).toFixed(1)}%</strong></span></div>
  </figure></div>
  <details><summary>Model assumptions and historical evidence</summary><p>Positions run from front axle 0 to rear axle 1. Chassis mass is assumed to be 400 kg at 0.5; driver mass is 75 kg at 0.4. Engine mass and position are adjustable assumptions. Rear fraction = Σ(m × x) / Σm; front fraction = 1 − rear fraction. This models static vertical reactions on level ground. It omits braking, acceleration, tyre behaviour, roll, suspension kinematics, fuel movement, aero forces and lap time. It does not predict oversteer, traction or a real Cooper weight distribution.</p><p><a href="https://openstax.org/books/university-physics-volume-1/pages/12-2-examples-of-static-equilibrium" target="_blank" rel="noreferrer">Physics reference: OpenStax, static equilibrium ↗</a> · <a href="https://api.goodwood.com/grr/event-coverage/goodwood-revival/stirling-moss-race-winning-cooper-t51-returned-to-goodwood/" target="_blank" rel="noreferrer">T51 placement: Goodwood ↗</a> · <a href="https://sdautomuseum.org/explore/exhibits/formula-one-stories/1961-cooper-t53/" target="_blank" rel="noreferrer">T53 chassis/suspension: museum account ↗</a></p></details>
 </section>;
}
