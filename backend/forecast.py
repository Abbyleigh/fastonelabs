"""Experimental ridge-regression forecast, trained only on earlier rounds.
Finishing position includes retirements. Simulation frequencies are uncalibrated.
"""
import numpy as np
from collections import defaultdict

def build_forecast(races, target_round, grid_rows=None):
    history=defaultdict(list);team_history=defaultdict(list);last={};X=[];y=[];holdouts=[]
    ordered=sorted((r for r in races if int(r['round'])<target_round),key=lambda r:int(r['round']))
    for race in ordered:
        pending=[]
        for result in race.get('Results',[]):
            driver=result['Driver'];id=driver['driverId'];team=result.get('Constructor',{}).get('constructorId','unknown')
            n=max(1,len(race['Results']));pos=float(result['position'])/n
            grid=int(result.get('grid') or 0);grid=grid if grid>0 else n
            form=float(np.mean(history[id][-5:])) if history[id] else .55
            tf=float(np.mean(team_history[team][-10:])) if team_history[team] else .55
            feature=[1.,grid/n,form,tf]
            pending.append((id,team,pos,feature,driver,result,grid,n))
        # Chronological holdout: fit before adding this race to training.
        if len(X)>=60:
            coefficients=fit(X,y)
            holdouts.extend([(float(np.dot(p[3],coefficients)),p[2]) for p in pending])
        for id,team,pos,feature,driver,result,grid,n in pending:
            X.append(feature);y.append(pos);history[id].append(pos);team_history[team].append(pos)
            last[id]={'driver':driver,'team':result.get('Constructor',{}).get('name','Unknown'),'team_id':team,'grid':grid,'field':n,'last_round':int(race['round'])}
    if len(ordered)<4 or len(X)<60:
        raise ValueError('At least four earlier races and 60 classified results are needed. Choose a later round.')
    coefficients=fit(X,y)
    # Entry list is an estimate from the most recent round when qualifying is unavailable.
    latest=max(int(r['round']) for r in ordered)
    entries={id:row for id,row in last.items() if row['last_round']==latest}
    grid_map={r['Driver']['driverId']:int(r.get('position') or 0) for r in (grid_rows or [])}
    if grid_rows:
        for row in grid_rows:
            id=row['Driver']['driverId']
            if id not in entries:entries[id]={'driver':row['Driver'],'team':row.get('Constructor',{}).get('name','Unknown'),'team_id':row.get('Constructor',{}).get('constructorId','unknown'),'grid':int(row.get('position') or 0),'field':len(grid_rows),'last_round':latest}
        entries={id:row for id,row in entries.items() if id in grid_map}
    ids=sorted(entries);n=len(ids)
    if n<2:raise ValueError('Not enough entrants to forecast.')
    features=[];details=[]
    for id in ids:
        row=entries[id];known=grid_map.get(id,0)>0
        grid=grid_map[id] if known else max(1,min(n,row['grid']))
        form=float(np.mean(history[id][-5:])) if history[id] else .55
        teamform=float(np.mean(team_history[row['team_id']][-10:])) if team_history[row['team_id']] else .55
        features.append([1.,grid/n,form,teamform]);details.append((row,grid,known,form))
    predictions=np.asarray(features)@coefficients
    residual=np.asarray(y)-np.asarray(X)@coefficients
    spread=max(.12,float(np.std(residual)))
    rng=np.random.default_rng(2026+target_round)
    samples=predictions[None,:]+rng.normal(0,spread,(2000,n))
    ranks=np.argsort(np.argsort(samples,axis=1),axis=1)+1
    rows=[]
    for i,id in enumerate(ids):
        row,grid,known,form=details[i];d=row['driver']
        rows.append({'id':id,'name':(d.get('givenName','')+' '+d.get('familyName','')).strip(),'team':row['team'],'estimated_position':round(float(np.mean(ranks[:,i])),1),'win_percent':round(float(np.mean(ranks[:,i]==1))*100,1),'podium_percent':round(float(np.mean(ranks[:,i]<=3))*100,1),'range':[int(np.quantile(ranks[:,i],.1)),int(np.quantile(ranks[:,i],.9))],'grid':grid,'grid_known':known,'recent_finish_fraction':round(form,3)})
    rows.sort(key=lambda r:r['estimated_position'])
    mae=float(np.mean([abs(a-b) for a,b in holdouts]))*n if holdouts else None
    return {'model':'Ridge regression · experimental v1','training_races':len(ordered),'training_results':len(X),'trained_through_round':latest,'holdout_mean_error_positions':round(mae,2) if mae is not None else None,'holdout_rows':len(holdouts),'simulations':2000,'drivers':rows,'limitations':'Uncalibrated simulation frequencies, not betting odds. Uses grid (or last-race grid estimate), five-race driver form and ten-result team form. Entry list is inferred from qualifying or the last earlier race. Excludes weather, penalties, upgrades and circuit-specific pace. Earlier-round results only; holdout errors use pre-race fits, scaled to the current field size. Retirements count as classified positions.'}

def fit(X,y):
    matrix=np.asarray(X);target=np.asarray(y);penalty=np.diag([0.,1.,1.,1.])
    return np.linalg.solve(matrix.T@matrix+penalty,matrix.T@target)

def forecast_race(fetch,year,round_num):
    # Pagination avoids silently training on a truncated season response.
    races={};offset=0
    while True:
        data=fetch(f'{year}/results',{'limit':100,'offset':offset},cache_seconds=3600)
        for race in data.get('RaceTable',{}).get('Races',[]):
            if int(race['round'])>=round_num:continue
            key=race['round'];races.setdefault(key,{**race,'Results':[]})['Results'].extend(race.get('Results',[]))
        offset+=100
        if offset>=int(data.get('total',0)) or offset>=3000:break
    qualifying=fetch(f'{year}/{round_num}/qualifying',{'limit':100},cache_seconds=3600)
    qr=qualifying.get('RaceTable',{}).get('Races',[])
    grid=qr[0].get('QualifyingResults',[]) if qr else []
    return {'season':year,'round':round_num,**build_forecast(list(races.values()),round_num,grid)}
