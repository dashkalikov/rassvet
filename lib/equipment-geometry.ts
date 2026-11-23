import {
 CatmullRomCurve3,CylinderGeometry,DataTexture,ExtrudeGeometry,Group,Mesh,
 LinearFilter,LinearMipmapLinearFilter,MeshPhysicalMaterial,MeshStandardMaterial,Path,RepeatWrapping,RGBAFormat,Shape,
 TorusGeometry,TubeGeometry,Vector3,type Material,type Object3D,
} from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';

function finishTexture(brushed:boolean){
 const side=128,data=new Uint8Array(side*side*4);
 for(let y=0;y<side;y++)for(let x=0;x<side;x++){
  const hash=Math.imul((x+11)^(Math.imul(y+3,1597334677)),2246822519)>>>0;
  const grain=(hash&255)/255;
  const value=Math.round(brushed?125+Math.sin(y*1.7)*13+grain*13:108+grain*40);
  const i=(y*side+x)*4;data[i]=value;data[i+1]=value;data[i+2]=value;data[i+3]=255;
 }
 const texture=new DataTexture(data,side,side,RGBAFormat);
 texture.wrapS=texture.wrapT=RepeatWrapping;texture.repeat.set(brushed?8:24,brushed?14:24);
 texture.magFilter=LinearFilter;texture.minFilter=LinearMipmapLinearFilter;texture.anisotropy=4;
 texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}

export function terminalFinishes(){
 const grain=finishTexture(false),brushed=finishTexture(true);
 return {
  face:new MeshPhysicalMaterial({color:'#edede9',metalness:.02,roughness:.56,bumpMap:grain,bumpScale:.0008,clearcoat:.12,clearcoatRoughness:.6}),
  aluminum:new MeshPhysicalMaterial({color:'#a1a8ad',metalness:.88,roughness:.3,anisotropy:.38,anisotropyRotation:Math.PI/2,bumpMap:brushed,bumpScale:.0005,envMapIntensity:1.05}),
  cast:new MeshStandardMaterial({color:'#727c84',metalness:.75,roughness:.43,bumpMap:grain,bumpScale:.0012}),
  chassis:new MeshStandardMaterial({color:'#323c44',metalness:.65,roughness:.38,bumpMap:grain,bumpScale:.0007}),
  rubber:new MeshStandardMaterial({color:'#171d22',metalness:.02,roughness:.87}),
  bolt:new MeshStandardMaterial({color:'#bbc1c6',metalness:.95,roughness:.23}),
  socket:new MeshStandardMaterial({color:'#090d11',metalness:.2,roughness:.5}),
 };
}
export type TerminalFinishes=ReturnType<typeof terminalFinishes>;

function outline(w:number,h:number,r:number){
 const x=-w/2,y=-h/2,shape=new Shape();r=Math.min(r,w/2,h/2);
 shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);
 shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
 shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);
 shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);return shape;
}

function extruded(shape:Shape,depth:number,material:Material,bevel=Math.min(depth*.17,.012)){
 const geometry=new ExtrudeGeometry(shape,{depth:depth-2*bevel,steps:1,curveSegments:16,bevelEnabled:true,bevelSegments:4,bevelSize:bevel,bevelThickness:bevel});
 geometry.translate(0,0,-(depth-2*bevel)/2);
 // Smoothing only around the machined bevel avoids faceted edges and preserves flat faces.
 return new Mesh(toCreasedNormals(geometry,.9),material);
}

export function plate(w:number,h:number,d:number,r:number,material:Material){
 const b=Math.min(d*.17,.012);
 return extruded(outline(w-2*b,h-2*b,Math.max(.001,r-b)),d,material,b);
}

export function frame(w:number,h:number,d:number,r:number,border:number,material:Material){
 const shape=outline(w,h,r);
 shape.holes.push(new Path(outline(w-2*border,h-2*border,Math.max(.01,r-border)).getPoints(20).reverse()));
 return extruded(shape,d,material,Math.min(.006,d*.12,border*.12));
}

export function softBox(w:number,h:number,d:number,material:Material,r=Math.min(w,h,d)*.18){
 return new Mesh(new RoundedBoxGeometry(w,h,d,2,Math.max(.001,r)),material);
}

export function beam(parent:Object3D,start:Vector3,end:Vector3,w:number,d:number,material:Material,taper=1){
 const direction=end.clone().sub(start),length=direction.length(),mesh=softBox(w,length,d,material,Math.min(w,d)*.22);
 if(taper!==1){
  const positions=mesh.geometry.getAttribute('position');
  for(let i=0;i<positions.count;i++){
   const t=(positions.getY(i)+length/2)/length;
   positions.setX(i,positions.getX(i)*(1+(taper-1)*t));
   positions.setZ(i,positions.getZ(i)*(1+(taper-1)*t*.65));
  }
  toCreasedNormals(mesh.geometry,.9);
 }
 mesh.position.copy(start).add(end).multiplyScalar(.5);
 mesh.quaternion.setFromUnitVectors(new Vector3(0,1,0),direction.normalize());parent.add(mesh);return mesh;
}

export function slottedBrace(parent:Object3D,start:Vector3,end:Vector3,w:number,d:number,material:Material,sideways=false){
 const direction=end.clone().sub(start),length=direction.length(),shape=outline(w,length,w*.38);
 shape.holes.push(new Path(outline(w*.43,length*.63,w*.2).getPoints(18).reverse()));
 const mesh=extruded(shape,d,material,Math.min(.007,d*.13));
 mesh.position.copy(start).add(end).multiplyScalar(.5);
 mesh.quaternion.setFromUnitVectors(new Vector3(0,1,0),direction.normalize());
 if(sideways)mesh.rotateY(Math.PI/2);parent.add(mesh);return mesh;
}

function disk(r:number,d:number,material:Material,segments=32){
 const mesh=new Mesh(new CylinderGeometry(r,r,d,segments),material);mesh.rotation.x=Math.PI/2;return mesh;
}

export function screw(parent:Object3D,position:Vector3,r:number,finishes:TerminalFinishes,normal=new Vector3(0,0,1)){
 const group=new Group();group.position.copy(position);group.quaternion.setFromUnitVectors(new Vector3(0,0,1),normal);
 const washer=new Mesh(new TorusGeometry(r*.91,r*.13,6,24),finishes.chassis);washer.position.z=-r*.08;group.add(washer);
 const head=disk(r*.77,r*.38,finishes.bolt,24);group.add(head);
 const recess=disk(r*.34,r*.025,finishes.socket,6);recess.position.z=r*.2;group.add(recess);
 parent.add(group);return group;
}

export function hinge(parent:Object3D,position:Vector3,r:number,finishes:TerminalFinishes){
 const group=new Group();group.position.copy(position);group.rotation.y=Math.PI/2;
 const housing=disk(r,r*.9,finishes.chassis,40);group.add(housing);
 for(const side of [-1,1]){
  const cap=disk(r*.88,r*.16,finishes.aluminum,40);cap.position.z=side*r*.52;group.add(cap);
  const groove=new Mesh(new TorusGeometry(r*.73,r*.025,6,36),finishes.chassis);groove.position.z=side*r*.62;group.add(groove);
  screw(group,new Vector3(0,0,side*r*.65),r*.25,finishes,new Vector3(0,0,side));
 }
 parent.add(group);return group;
}

export function connector(parent:Object3D,position:Vector3,r:number,finishes:TerminalFinishes,normal=new Vector3(0,0,-1),capped=false){
 const group=new Group();group.position.copy(position);group.quaternion.setFromUnitVectors(new Vector3(0,0,1),normal);
 const gasket=disk(r*1.15,.035,finishes.rubber);group.add(gasket);
 const flange=disk(r,.055,finishes.aluminum,6);flange.position.z=.025;group.add(flange);
 const barrel=disk(r*.83,.095,finishes.chassis);barrel.position.z=.09;group.add(barrel);
 for(let i=0;i<4;i++){const groove=new Mesh(new TorusGeometry(r*.83,.007,5,32),finishes.aluminum);groove.position.z=.065+i*.016;group.add(groove);}
 const opening=disk(r*.66,.012,capped?finishes.rubber:finishes.socket);opening.position.z=.143;group.add(opening);
 if(!capped){
  for(const x of [-.25,.25])for(const y of [-.18,.18]){const pin=disk(r*.07,.015,finishes.bolt,8);pin.position.set(x*r,y*r,.151);group.add(pin);}
 }else{
  const curve=new CatmullRomCurve3([new Vector3(-r,0,.025),new Vector3(-r*1.5,-r*1.7,.1),new Vector3(r*.9,-r*1.8,.13),new Vector3(r*.8,0,.14)]);
  group.add(new Mesh(new TubeGeometry(curve,20,.009,6,false),finishes.rubber));
 }
 parent.add(group);return group;
}

export function floorPad(parent:Object3D,x:number,z:number,w:number,d:number,finishes:TerminalFinishes){
 const rubber=plate(w,d,.055,.055,finishes.rubber);rubber.rotation.x=-Math.PI/2;rubber.position.set(x,.034,z);parent.add(rubber);
 const top=plate(w*.94,d*.94,.055,.05,finishes.aluminum);top.rotation.x=-Math.PI/2;top.position.set(x,.087,z);parent.add(top);
 return top;
}
