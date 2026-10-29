import type {UnifiedRaceState} from '../race/unifiedRaceState';

export type CommentaryCue = {
  speaker:'Lead commentator'|'Strategy analyst';
  text:string;
  time:number;
};

export function makeCommentary(
  frame:UnifiedRaceState,
  time:number,
  windowOffset:number,
  selectedDriver:number|null,
  sequence:number
):CommentaryCue {
  const car=frame.cars.find(
    c=>c.driverNumber===selectedDriver
  )??frame.cars[0];

  const name=car?.name||car?.code||'the field';
  const sessionTime=Math.floor(windowOffset+time);
  const minutes=Math.floor(sessionTime/60);
  const seconds=String(sessionTime%60).padStart(2,'0');

  const lines=[
    `We're following ${name} in this recorded race replay.`,
    `The replay clock reads ${minutes} minutes and ${seconds} seconds. Let's follow how this section develops.`,
    `We're tracking ${name}. The displayed car movement may include interpolation between recorded samples.`,
    `Race strategy depends on track position, tyre condition and pit-stop timing. We'll watch for evidence of changes.`,
    `The next section could be important for race strategy. We need verified timing data before calling a position change.`
  ];

  return {
    speaker:sequence%2===0
      ?'Lead commentator'
      :'Strategy analyst',
    text:lines[sequence%lines.length],
    time:sessionTime
  };
}

export function pitCommentary(
  frame:UnifiedRaceState,
  time:number,
  windowOffset:number,
  selectedDriver:number|null
):CommentaryCue|null {
  const car=frame.cars.find(
    c=>c.driverNumber===selectedDriver
  )??frame.cars[0];

  if(!car)return null;

  const messages:Record<string,string>={
    entry:`Replay data indicates ${car.name||car.code} is entering the pit lane.`,
    box:`Replay data indicates ${car.name||car.code} is at the pit box.`,
    exit:`Replay data indicates ${car.name||car.code} is leaving the pit lane.`
  };

  const text=messages[car.pitPhase];
  if(!text)return null;

  return {
    speaker:'Lead commentator',
    text,
    time:Math.floor(windowOffset+time)
  };
}
