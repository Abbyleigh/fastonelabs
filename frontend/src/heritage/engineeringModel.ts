/** Dimensionless longitudinal positions; assumed masses, never historical measurements. */
export function staticBalance(enginePosition:number,engineMass:number){
 if(!Number.isFinite(enginePosition)||enginePosition<0||enginePosition>1||!Number.isFinite(engineMass)||engineMass<=0||engineMass>1000)throw Error('Invalid teaching-model inputs');
 const chassisMass=400,driverMass=75,total=chassisMass+driverMass+engineMass;
 const rearFraction=(chassisMass*.5+driverMass*.4+engineMass*enginePosition)/total;
 return {frontFraction:1-rearFraction,rearFraction,total};
}
