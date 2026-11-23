import {
 ACESFilmicToneMapping,DirectionalLight,HemisphereLight,PerspectiveCamera,
 PMREMGenerator,Scene,SRGBColorSpace,Vector3,WebGLRenderer,Spherical,TOUCH,
} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createTerminalModel,disposeModel,frameTerminal,zoomTerminal} from './equipment-model';
import type {ModelId} from './equipment';

export type EquipmentViewerHandle={zoom:(factor:number)=>void;reset:()=>void;destroy:()=>void};

/** Loaded only after choosing 3D. The studio renders on interaction, rather than in an idle loop. */
export function mountEquipmentViewer(host:HTMLElement,id:ModelId,onFailure:()=>void):EquipmentViewerHandle{
 const renderer=new WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
 const cleanup:Array<()=>void>=[()=>{renderer.dispose();renderer.forceContextLoss();}];
 let disposed=false,raf=0;
 function destroy(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);for(const release of cleanup.reverse())release();}
 try{
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 renderer.outputColorSpace=SRGBColorSpace;renderer.toneMapping=ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.shadowMap.enabled=false;
 renderer.setClearColor(0,0);
 const canvas=renderer.domElement;
 canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Объёмная модель терминала. Стрелки — вращение, плюс и минус — масштаб, Home — исходный вид.');
 host.appendChild(canvas);
 cleanup.push(()=>canvas.remove());
 const scene=new Scene(),camera=new PerspectiveCamera(38,1,.01,150);
 cleanup.push(()=>disposeModel(scene));
 const model=createTerminalModel(id);
 scene.add(model);
 const environmentScene=new RoomEnvironment(),generator=new PMREMGenerator(renderer);
 const environment=(()=>{try{return generator.fromScene(environmentScene,.04);}finally{environmentScene.dispose();generator.dispose();}})();
 cleanup.push(()=>environment.dispose());scene.environment=environment.texture;
 scene.add(new HemisphereLight('#ffffff','#86909a',.8));
 const key=new DirectionalLight('#fffaf5',3);key.position.set(-3,5,6);
 scene.add(key);
 const rim=new DirectionalLight('#e4edff',1.4);rim.position.set(4,3,-4);scene.add(rim);
 const controls=new OrbitControls(camera,canvas),motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 cleanup.push(()=>controls.dispose());
 controls.enableDamping=!motion.matches;controls.dampingFactor=.09;controls.enablePan=false;
 controls.rotateSpeed=.65;controls.zoomSpeed=.7;controls.minPolarAngle=.08;controls.maxPolarAngle=Math.PI*.88;
 controls.touches.TWO=TOUCH.DOLLY_ROTATE;
 let frame=frameTerminal(model,camera),initialized=false;
 function render(){
  raf=0;if(disposed)return;
  controls.update();renderer.render(scene,camera);
 }
 function requestRender(){if(!disposed&&!raf)raf=window.requestAnimationFrame(render);}
 controls.addEventListener('change',requestRender);
 cleanup.push(()=>controls.removeEventListener('change',requestRender));
 function reset(){
  controls.target.copy(frame.target);controls.minDistance=frame.minDistance;controls.maxDistance=frame.maxDistance;
  camera.position.copy(frame.target).add(new Vector3(-1,.62,1.7).normalize().multiplyScalar(frame.distance));
  camera.lookAt(frame.target);controls.update();requestRender();
 }
 function zoom(factor:number){
  zoomTerminal(camera,controls.target,camera.position.distanceTo(controls.target)*factor,frame.minDistance,frame.maxDistance);
  controls.update();requestRender();
 }
 function resize(){
  if(disposed)return;
  const width=Math.max(host.clientWidth,1),height=Math.max(host.clientHeight,1);
  const zoomRatio=initialized?camera.position.distanceTo(controls.target)/frame.distance:1;
  camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);
  frame=frameTerminal(model,camera);
  if(!initialized){reset();initialized=true;}
  else{controls.minDistance=frame.minDistance;controls.maxDistance=frame.maxDistance;zoomTerminal(camera,controls.target,frame.distance*zoomRatio,frame.minDistance,frame.maxDistance);controls.update();}
  requestRender();
 }
 const observer=new ResizeObserver(resize);cleanup.push(()=>observer.disconnect());observer.observe(host);resize();
 function keyboard(event:KeyboardEvent){
  if(event.key==='+'||event.key==='='){event.preventDefault();zoom(.8);return;}
  if(event.key==='-'){event.preventDefault();zoom(1.25);return;}
  if(event.key==='Home'||event.key==='0'){event.preventDefault();reset();return;}
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
  event.preventDefault();
  const offset=camera.position.clone().sub(controls.target),sphere=new Spherical().setFromVector3(offset);
  if(event.key==='ArrowLeft')sphere.theta-=.15;if(event.key==='ArrowRight')sphere.theta+=.15;
  if(event.key==='ArrowUp')sphere.phi=Math.max(controls.minPolarAngle,sphere.phi-.12);
  if(event.key==='ArrowDown')sphere.phi=Math.min(controls.maxPolarAngle,sphere.phi+.12);
  camera.position.copy(controls.target).add(offset.setFromSpherical(sphere));controls.update();requestRender();
 }
 function motionChanged(){controls.enableDamping=!motion.matches;requestRender();}
 function contextLost(event:Event){event.preventDefault();if(!disposed)onFailure();}
 canvas.addEventListener('keydown',keyboard);canvas.addEventListener('webglcontextlost',contextLost);
 motion.addEventListener('change',motionChanged);
 cleanup.push(()=>{
  canvas.removeEventListener('keydown',keyboard);canvas.removeEventListener('webglcontextlost',contextLost);
  motion.removeEventListener('change',motionChanged);
 });
 return {zoom,reset,destroy};
 }catch(error){destroy();throw error;}
}
