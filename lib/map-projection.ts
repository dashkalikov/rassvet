export type MapFrame={scale:number;translate:[number,number]};

// Lambert conformal conic: two standard parallels suit the northern latitudes.
// Unwrap the Far East around 100° E so Chukotka does not split at ±180°.
const radians=Math.PI/180;
const parallel1=50*radians,parallel2=70*radians;
const n=Math.log(Math.cos(parallel1)/Math.cos(parallel2))/Math.log(Math.tan(Math.PI/4+parallel2/2)/Math.tan(Math.PI/4+parallel1/2));
const f=Math.cos(parallel1)*Math.pow(Math.tan(Math.PI/4+parallel1/2),n)/n;
const origin=f/Math.pow(Math.tan(Math.PI/4+60*radians/2),n);
export function projectRussia(longitude:number,latitude:number,frame?:MapFrame):[number,number]{
 if(!Number.isFinite(longitude)||!Number.isFinite(latitude)||longitude < -180||longitude > 180||latitude <= -90||latitude >= 90)throw new Error('Некорректные географические координаты');
 const unwrapped=longitude<0?longitude+360:longitude;
 const theta=n*(unwrapped-100)*radians;
 const radius=f/Math.pow(Math.tan(Math.PI/4+latitude*radians/2),n);
 const x=radius*Math.sin(theta),y=origin-radius*Math.cos(theta);
 return frame?[frame.translate[0]+x*frame.scale,frame.translate[1]-y*frame.scale]:[x,y];
}
