import {Box3,CylinderGeometry,Group,Mesh,Vector3} from 'three';
import type {ModelId} from './equipment.ts';
import {beam,connector,floorPad,frame,hinge,plate,screw,slottedBrace,softBox,terminalFinishes} from './equipment-geometry.ts';

/** Catalog-specific construction with smooth die-cast parts and local surface finishes. */
export function createTerminalModel(id:ModelId):Group{
 const root=new Group();root.name=`rassvet-${id}`;
 const finish=terminalFinishes();
 const dimensions={mini:[1.4,1.2,.18,.15],standard:[2.5,1.75,.19,.15],pro:[3.25,2.25,.29,.12],mobility:[2.25,2.25,.16,.21]} as const;
 const [width,height,depth,radius]=dimensions[id],panel=new Group();panel.name='antenna-housing';
 const inset=id==='pro'?.13:.045;
 panel.add(plate(width,height,depth,radius,finish.chassis));
 const edge=frame(width-.014,height-.014,.025,radius,inset,finish.aluminum);edge.position.z=depth/2-.005;panel.add(edge);
 const gasket=frame(width-inset*1.4,height-inset*1.4,.016,radius*.85,.013,finish.rubber);gasket.position.z=depth/2+.009;panel.add(gasket);
 const face=plate(width-inset*2,height-inset*2,.037,radius*.83,finish.face);face.position.z=depth/2+.026;panel.add(face);
 const rear=plate(width*.9,height*.85,depth*.46,radius*.8,finish.cast);rear.position.z=-depth*.61;panel.add(rear);
 const service=plate(width*.32,height*.28,.025,.06,finish.chassis);service.position.set(0,-height*.1,-depth*.86);panel.add(service);
 for(const x of [-1,1])for(const y of [-1,1])screw(panel,new Vector3(x*width*.135,-height*.1+y*height*.105,-depth*.88),.018,finish,new Vector3(0,0,-1));
 // Interrupted radiator banks leave room for the mounting interface and service panel.
 const count=id==='pro'?26:16;
 for(let i=0;i<count;i++)for(const sign of [-1,1]){
  const rib=softBox(.025,height*.235,.075,finish.chassis,.009);
  rib.position.set((i-(count-1)/2)*width*.77/count,sign*height*.27,-depth*.87);panel.add(rib);
 }
 for(const x of [-1,1])for(const y of [-1,1]){
  const recess=plate(.14,.065,.015,.02,finish.chassis);recess.position.set(x*width*.35,y*height*.36,-depth*.86);panel.add(recess);
  screw(panel,new Vector3(x*width*.35,y*height*.36,-depth*.88),.021,finish,new Vector3(0,0,-1));
 }
 if(id==='pro'){
  for(const y of [-1,1])for(const x of [-.46,-.28,-.09,.09,.28,.46])screw(panel,new Vector3(width*x,y*(height/2-.047),depth/2+.018),.022,finish);
  for(const x of [-1,1])for(const y of [-.29,0,.29])screw(panel,new Vector3(x*(width/2-.047),y*height,depth/2+.018),.022,finish);
 }
 root.add(panel);
 const rearPoint=(x:number,y:number,z:number)=>{root.updateMatrixWorld(true);return panel.localToWorld(new Vector3(x,y,z));};
 if(id==='mini'){
  panel.rotation.x=-.2;panel.position.set(0,.72,.055);
  connector(panel,new Vector3(.18,-height/2+.025,-.025),.064,finish,new Vector3(0,-1,0));
  const rearZ=-.64;
  for(const side of [-1,1]){
   const pivot=rearPoint(side*.56,.02,-depth/2-.045),end=new Vector3(side*.56,.105,rearZ);
   slottedBrace(root,pivot,end,.14,.055,finish.aluminum,true);hinge(root,pivot,.075,finish);
   floorPad(root,side*.56,rearZ,.15,.21,finish);
   const front=rearPoint(side*.52,-height/2+.075,0);floorPad(root,side*.52,front.z,.15,.17,finish);
  }
  beam(root,new Vector3(-.56,.115,rearZ),new Vector3(.56,.115,rearZ),.065,.11,finish.aluminum);
 }else if(id==='standard'){
  panel.rotation.x=-.43;panel.position.set(0,1.18,0);
  connector(panel,new Vector3(.32,-.27,-depth*.86),.07,finish);
  const pivot=rearPoint(0,-.23,-depth/2-.1),hubZ=pivot.z;
  const neck=new Mesh(new CylinderGeometry(.135,.17,pivot.y-.23,48),finish.aluminum);neck.position.set(0,(pivot.y+.23)/2,hubZ);root.add(neck);
  const collar=new Mesh(new CylinderGeometry(.177,.19,.07,48),finish.chassis);collar.position.set(0,.255,hubZ);root.add(collar);
  const upper=plate(.35,.27,.11,.075,finish.cast);upper.position.copy(pivot);upper.position.z-=.045;root.add(upper);
  for(const side of [-1,1])hinge(root,new Vector3(side*.145,pivot.y,hubZ),.105,finish);
  const hub=new Mesh(new CylinderGeometry(.2,.26,.18,48),finish.cast);hub.position.set(0,.17,hubZ);root.add(hub);
  // Three tapered feet reproduce the cast Y-base in the product photograph.
  for(const angle of [.25,2.35,4.45]){
   const end=new Vector3(Math.cos(angle)*.92,.105,hubZ+Math.sin(angle)*.92);
   beam(root,new Vector3(Math.cos(angle)*.13,.22,hubZ+Math.sin(angle)*.13),end,.29,.16,finish.aluminum,.62);
   const pad=plate(.19,.26,.055,.065,finish.rubber);pad.rotation.x=-Math.PI/2;pad.rotation.z=-angle;pad.position.set(end.x,.035,end.z);root.add(pad);
  }
 }else if(id==='pro'){
  panel.rotation.x=-.31;panel.position.set(0,1.48,-.02);
  const base=frame(3.06,1.43,.13,.15,.17,finish.chassis);base.rotation.x=-Math.PI/2;base.position.y=.18;root.add(base);
  const trim=frame(3.08,1.45,.035,.15,.032,finish.aluminum);trim.rotation.x=-Math.PI/2;trim.position.y=.245;root.add(trim);
  for(const side of [-1,1]){
   const x=side*1.28;
   for(const z of [-.53,.53]){
    floorPad(root,x,z,.46,.35,finish);
    const pedestal=softBox(.32,.2,.28,finish.cast,.045);pedestal.position.set(x,.2,z);root.add(pedestal);
    for(const sx of [-1,1])screw(root,new Vector3(x+sx*.12,.312,z),.028,finish,new Vector3(0,1,0));
   }
   const lower=new Vector3(side*1.39,.37,.35),elbow=new Vector3(side*1.57,.71,.07),upper=rearPoint(side*1.69,-.31,-depth/2-.11);
   slottedBrace(root,lower,elbow,.23,.095,finish.aluminum,true);slottedBrace(root,elbow,upper,.22,.09,finish.aluminum,true);
   hinge(root,lower,.12,finish);hinge(root,elbow,.105,finish);hinge(root,upper,.13,finish);
   beam(root,upper,rearPoint(side*1.45,-.31,-depth/2-.11),.09,.1,finish.cast);
   beam(root,new Vector3(x,.28,-.5),elbow,.075,.085,finish.chassis);
  }
  const fascia=plate(1.12,.27,.065,.045,finish.cast);fascia.position.set(0,.28,.735);root.add(fascia);
  for(const x of [-.35,.35])connector(root,new Vector3(x,.28,.78),.068,finish,new Vector3(0,0,1),true);
  const centerCover=plate(.21,.19,.028,.04,finish.chassis);centerCover.position.set(0,.28,.788);root.add(centerCover);
  for(const x of [-.5,.5])screw(root,new Vector3(x,.28,.776),.02,finish);
  beam(root,new Vector3(-1.25,.19,-.5),new Vector3(.55,.19,.52),.07,.07,finish.cast);
  beam(root,new Vector3(1.25,.19,-.5),new Vector3(-.55,.19,.52),.07,.07,finish.cast);
 }else{
  panel.rotation.x=-Math.PI/2;panel.position.y=.43;
  connector(panel,new Vector3(0,-.55,-depth*.9),.06,finish);
  for(const x of [-.94,.94])for(const z of [-.94,.94]){
   floorPad(root,x,z,.39,.32,finish);
   const isolator=new Mesh(new CylinderGeometry(.105,.135,.12,32),finish.rubber);isolator.position.set(x,.16,z);root.add(isolator);
   const flange=new Mesh(new CylinderGeometry(.145,.17,.055,8),finish.aluminum);flange.position.set(x,.223,z);root.add(flange);
   beam(root,new Vector3(x,.23,z),new Vector3(x*.87,.33,z*.87),.22,.13,finish.cast,.7);
   for(const side of [-1,1])screw(root,new Vector3(x+side*.115,.132,z),.027,finish,new Vector3(0,1,0));
  }
 }
 root.updateMatrixWorld(true);root.position.y-=new Box3().setFromObject(root).min.y;root.updateMatrixWorld(true);return root;
}
