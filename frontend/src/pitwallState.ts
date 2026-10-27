export type TimedRow={time:number;driver_number?:number;[key:string]:unknown};
export function latest(rows:TimedRow[],time:number,driver?:number){
 let result:TimedRow|undefined;
 for(const row of rows)if(row.time<=time&&(driver===undefined||row.driver_number===driver)&&(!result||row.time>=result.time))result=row;
 return result;
}
export function freshCar(rows:TimedRow[],time:number){const row=latest(rows,time);return row&&time-row.time<=2?row:undefined;}
export function drsStatus(code:number|null){return code===null?'Unavailable':[10,12,14].includes(code)?'Open':[0,1].includes(code)?'Closed':code===8?'Eligible':'Unknown';}
