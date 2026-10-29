import {Component} from 'react';
import type {ReactNode} from 'react';

/** Keep a failed showroom canvas from replacing the catalogue and provenance. */
export default class VehiclePreviewBoundary extends Component<
  {children:ReactNode},
  {failed:boolean}
>{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){
    if(this.state.failed)return <div className="vehicle-analysis" role="alert">
      <h3>Interactive vehicle preview unavailable.</h3>
      <p>The preview cannot start or load in this browser. Vehicle specifications, sources and catalogue controls remain available.</p>
      <button onClick={()=>this.setState({failed:false})}>Retry vehicle preview</button>
    </div>;
    return this.props.children;
  }
}
