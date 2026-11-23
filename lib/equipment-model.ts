import {Box3,MathUtils,Mesh,PerspectiveCamera,Sphere,Texture,Vector3,type Material,type Object3D} from 'three';
export {createTerminalModel} from './equipment-terminal.ts';

export function frameTerminal(model:Object3D,camera:PerspectiveCamera){
 const box=new Box3().setFromObject(model),sphere=box.getBoundingSphere(new Sphere());
 const halfVertical=MathUtils.degToRad(camera.fov/2);
 const halfHorizontal=Math.atan(Math.tan(halfVertical)*Math.max(camera.aspect,.1));
 const direction=new Vector3(-1,.62,1.7).normalize(),right=new Vector3().crossVectors(new Vector3(0,1,0),direction).normalize(),up=new Vector3().crossVectors(direction,right);
 let distance=0;
 // Fit the actual housing and supports instead of leaving a large empty sphere around them.
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
  const offset=new Vector3(x,y,z).sub(sphere.center),depth=offset.dot(direction);
  distance=Math.max(distance,depth+Math.abs(offset.dot(right))/(Math.tan(halfHorizontal)*.86),depth+Math.abs(offset.dot(up))/(Math.tan(halfVertical)*.86));
 }
 return {target:sphere.center,distance,minDistance:sphere.radius*1.25,maxDistance:distance*2.5};
}

export function zoomTerminal(camera:PerspectiveCamera,target:Vector3,distance:number,min:number,max:number){
 const direction=camera.position.clone().sub(target);
 if(direction.lengthSq()===0)direction.set(1,.6,1.5);
 camera.position.copy(target).add(direction.normalize().multiplyScalar(MathUtils.clamp(distance,min,max)));
}

export function disposeModel(model:Object3D){
 const geometries=new Set<import('three').BufferGeometry>(),materials=new Set<Material>(),textures=new Set<Texture>();
 model.traverse(object=>{if(object instanceof Mesh){geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);}});
 for(const material of materials)for(const value of Object.values(material))if(value instanceof Texture)textures.add(value);
 geometries.forEach(geometry=>geometry.dispose());textures.forEach(texture=>texture.dispose());materials.forEach(material=>material.dispose());
}
