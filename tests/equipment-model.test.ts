import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,DataTexture,Light,Mesh,PerspectiveCamera,Texture,Vector3} from 'three';
import {createTerminalModel,disposeModel,frameTerminal,zoomTerminal} from '../lib/equipment-model.ts';

test('each terminal has solid finite geometry, while Mobility keeps its low profile',()=>{
 const bounds=new Map<string,Vector3>();
 for(const id of ['mini','standard','pro','mobility'] as const){
  const model=createTerminalModel(id),box=new Box3().setFromObject(model);
  const size=box.getSize(new Vector3());bounds.set(id,size);
  assert.ok(size.x>1&&size.y>0.1&&size.z>0.1,id);
  assert.ok(Math.abs(box.min.y)<0.001,'feet sit on the ground');
  let triangles=0;
  model.traverse(object=>{if(object instanceof Mesh){
   const positions=object.geometry.getAttribute('position');
   for(let i=0;i<positions.count;i++)assert.ok(Number.isFinite(positions.getX(i))&&Number.isFinite(positions.getY(i))&&Number.isFinite(positions.getZ(i)),id);
   triangles+=(object.geometry.index?.count??positions.count)/3;
  }});
  assert.ok(triangles>300,'all sides have actual surfaces');
  disposeModel(model);
 }
 assert.ok(bounds.get('pro')!.x>bounds.get('standard')!.x);
 assert.ok(bounds.get('mini')!.x<bounds.get('standard')!.x);
 assert.ok(bounds.get('mobility')!.y<bounds.get('mobility')!.x*.3);
});

test('initial camera fits every model in both narrow and wide viewports',()=>{
 for(const id of ['mini','standard','pro','mobility'] as const){
  const model=createTerminalModel(id),box=new Box3().setFromObject(model);
  for(const aspect of [.45,1,1.5,2.4]){
   const camera=new PerspectiveCamera(38,aspect,.01,100);
   const frame=frameTerminal(model,camera);
   camera.position.copy(frame.target).add(new Vector3(1,.65,1.5).normalize().multiplyScalar(frame.distance));
   camera.lookAt(frame.target);camera.updateMatrixWorld();camera.updateProjectionMatrix();
   for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
    const projected=new Vector3(x,y,z).project(camera);
    assert.ok(Math.abs(projected.x)<.94&&Math.abs(projected.y)<.94,`${id}, aspect ${aspect}: model was clipped`);
   }
  }
  disposeModel(model);
 }
});

test('zoom preserves the viewing angle and clamps before going through or losing the model',()=>{
 const camera=new PerspectiveCamera(),target=new Vector3(0,1,0);
 camera.position.set(3,3,4);
 const direction=camera.position.clone().sub(target).normalize();
 zoomTerminal(camera,target,.001,2,20);
 assert.ok(Math.abs(camera.position.distanceTo(target)-2)<1e-8);
 assert.ok(camera.position.clone().sub(target).normalize().distanceTo(direction)<1e-8);
 zoomTerminal(camera,target,1000,2,20);
 assert.ok(Math.abs(camera.position.distanceTo(target)-20)<1e-8);
});

test('leaving a model disposes every geometry and each shared material once',()=>{
 const model=createTerminalModel('pro'),resources=new Set<import('three').BufferGeometry|import('three').Material>();
 model.traverse(object=>{if(object instanceof Mesh){resources.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])resources.add(material);}});
 const counts=new Map<unknown,number>();
 for(const resource of resources)resource.addEventListener('dispose',()=>counts.set(resource,(counts.get(resource)??0)+1));
 disposeModel(model);
 assert.equal(counts.size,resources.size);
 for(const count of counts.values())assert.equal(count,1);
});

test('terminals do not cast or receive shadows in the product viewer',()=>{
 for(const id of ['mini','standard','pro','mobility'] as const){
  const model=createTerminalModel(id);
  model.traverse(object=>{if(object instanceof Mesh||object instanceof Light){assert.equal(object.castShadow,false,id);assert.equal(object.receiveShadow,false,id);}});
  disposeModel(model);
 }
});

test('surface finish textures are local and are released together with the model',()=>{
 const model=createTerminalModel('standard'),textures=new Set<Texture>();
 model.traverse(object=>{if(object instanceof Mesh)for(const material of Array.isArray(object.material)?object.material:[object.material])for(const value of Object.values(material))if(value instanceof Texture)textures.add(value);});
 assert.ok(textures.size>0,'surface finishes need an actual microtexture');
 const counts=new Map<Texture,number>();
 for(const texture of textures){assert.ok(texture instanceof DataTexture);assert.ok(texture.image.data instanceof Uint8Array);texture.addEventListener('dispose',()=>counts.set(texture,(counts.get(texture)??0)+1));}
 disposeModel(model);
 assert.equal(counts.size,textures.size);
 for(const count of counts.values())assert.equal(count,1);
});
