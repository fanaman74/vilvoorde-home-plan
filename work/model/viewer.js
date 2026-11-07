import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';

const scene=new THREE.Scene();scene.background=new THREE.Color('#101517');
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
document.querySelector('#scene').appendChild(renderer.domElement);
const camera=new THREE.OrthographicCamera(-9,9,7,-7,.1,250);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.485;controls.minDistance=3;controls.maxDistance=90;
scene.add(new THREE.HemisphereLight(0xdce9ee,0x514635,2.25));
const sun=new THREE.DirectionalLight(0xffe6c6,4);sun.position.set(-7,17,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-16,right:16,top:15,bottom:-15,near:1,far:50});sun.shadow.bias=-.0005;sun.shadow.normalBias=.025;scene.add(sun);
const fill=new THREE.DirectionalLight(0xc9dcff,1.3);fill.position.set(8,9,-10);scene.add(fill);
const root=new THREE.Group();root.name='House - approximate reconstruction - metres';root.userData={source:'House-plans.pdf, sheets A-100 to A-103; owner room photographs',units:'metres',status:'Concept reconstruction: inconsistent printed dimensions; heights and furnishings estimated',front:'positive Z',rear:'negative Z'};scene.add(root);
const levels={},upper=[],roofParts=[],nameSprites=[];let current;
const C={wall:'#d6d2c7',cream:'#e8e0ce',blue:'#8fa9b4',navy:'#253c59',red:'#853946',white:'#edece4',grey:'#a9b3b5',dark:'#242829',wood:'#96724b',darkwood:'#49372c',green:'#275d40',metal:'#939e9f',tile:'#a7aaa5',rug:'#d9d3c4'};
const mats=new Map();
function mat(c,options={}){let key=c+JSON.stringify(options);if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.78,...options}));return mats.get(key)}
function mesh(geo,c,x,y,z,name,parent=current,options={}){const m=new THREE.Mesh(geo,mat(c,options));m.position.set(x,y,z);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function box(n,x,z,w,d,h,c,y=h/2,parent=current,r=.015){let geo=r?new RoundedBoxGeometry(w,h,d,1,Math.min(r,w/4,h/4,d/4)):new THREE.BoxGeometry(w,h,d);return mesh(geo,c,x,y,z,n,parent)}
function cyl(n,x,z,r,h,c,y=h/2,parent=current){return mesh(new THREE.CylinderGeometry(r,r,h,20),c,x,y,z,n,parent)}
function beam(n,a,b,t,c,parent=current){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),v=B.clone().sub(A);const o=mesh(new THREE.BoxGeometry(t,v.length(),t),c,...A.clone().add(B).multiplyScalar(.5).toArray(),n,parent);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return o}
function group(name,parent=current){const g=new THREE.Group();g.name=name;parent.add(g);return g}
function level(id,name){const g=new THREE.Group();g.name=name;g.userData.level=id;root.add(g);levels[id]=g;current=g;return g}
function polygon(n,points,c,y=-.16,h=.16,parent=current,holes=[]){let s=new THREE.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();for(const hp of holes){const p=new THREE.Path();hp.forEach(([x,z],i)=>i?p.lineTo(x,-z):p.moveTo(x,-z));p.closePath();s.holes.push(p)}const geo=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);return mesh(geo,c,0,y,0,n,parent)}
const outline=[[1.44,0],[7.44,0],[7.44,-9.42],[0,-9.42],[0,-1.8]];
function slab(holes=[]){polygon('Floor slab',outline,'#545b59',-.23,.23,current,holes.length?[holes]:[])}
let timberMat;
function woodMaterial(){if(timberMat)return timberMat;const c=document.createElement('canvas');c.width=512;c.height=1024;const q=c.getContext('2d');for(let i=0;i<6;i++){let v=144+(i*17%19);q.fillStyle=`rgb(${v+8},${v+9},${v+2})`;q.fillRect(i*86,0,85,1024);for(let j=0;j<70;j++){q.strokeStyle=`rgba(70,78,67,${.02+(j%4)*.008})`;q.beginPath();q.moveTo(i*86+(j*13%84),0);q.bezierCurveTo(i*86+(j*13%84)+4,300,i*86+(j*13%84)-5,650,i*86+(j*13%84),1024);q.stroke()}q.fillStyle='#858d82';q.fillRect(i*86,0,1,1024);q.fillRect(i*86,(i*173)%850,86,1)}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(.9,.4);timberMat=new THREE.MeshStandardMaterial({map:t,roughness:.85});return timberMat}
function roomfloor(n,p,c,holes=[]){const m=polygon(n+' flooring',p,c,.002,.025,current,holes);if(/Living|Dining|Bedroom|Blue|Red|Attic/.test(n))m.material=woodMaterial()}
function wall(n,a,b,t=.18,c=C.wall,holes=[],height=2.68){
 const H=n.includes('attic knee wall')?1.08:height;const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),ang=-Math.atan2(dz,dx);const g=group(n);g.position.set(a[0],0,a[1]);g.rotation.y=ang;
 function part(x0,x1,y0,y1,top=false){if(x1-x0<.005||y1-y0<.005)return;const target=top?group(n+' upper',g):g;if(top)upper.push(target);box(n+' masonry',(x0+x1)/2,0,x1-x0,t,y1-y0,c,(y0+y1)/2,target,0)}
 let cursor=0;holes.sort((a,b)=>a.start-b.start);for(const o of [...holes,{start:L,width:0}]){const e=Math.min(L,o.start);part(cursor,e,0,1.08);part(cursor,e,1.08,H,true);if(o.width){const sill=o.sill??(o.type==='window'?.84:.05),head=o.head??2.16,fc=o.frameColor||C.white;if(o.type==='window')part(e,e+o.width,0,sill);part(e,e+o.width,head+.02,H,true);const f=group(n+' '+o.type,g);f.position.x=e+o.width/2;const z=.012;if(o.type==='window'||o.type==='glassdoor'){
 const hh=head-sill;
 const pane=box('Glass',0,z,o.width-.08,.035,hh,'#a9c4ca',sill+hh/2,f,0);pane.material=mat('#a9c4ca',{transparent:true,opacity:.18,roughness:.15});pane.castShadow=false;
 box('Frame sill',0,z,o.width,.09,.055,fc,sill,f);box('Frame lintel',0,z,o.width,.09,.055,fc,head,f);
 for(let i=0;i<=(o.divisions??2);i++){const x=-o.width/2+i*o.width/(o.divisions??2);box('Frame',x,z,.045,.09,hh,fc,sill+hh/2,f);}
 if(o.type==='glassdoor')box('Wood lower panel',0,z,o.width-.08,.06,.55,C.darkwood,.34,f);
 }else if(o.type!=='open'){const leaf=box('Door leaf',-.1,.18,o.width*.94,.05,head-.08,(o.frameColor||'#b0aba0'),(head-.08)/2,f);leaf.rotation.y=.34;upper.push(f)}
 }cursor=e+(o.width||0)}
 return g;
}
function extWalls(first=false){wall('Right exterior',[7.32,-9.42],[7.32,0],.24,C.cream);wall('Left rear exterior',[.1,-9.42],[.1,-5.04],.24,C.cream);wall('Left front exterior',[.1,-5.04],[.1,-1.8],.24,C.cream,[{start:1.72,width:.85,type:'window'}]);wall('Angled front bay',[.1,-1.8],[1.44,-.1],.24,C.cream,[{start:.16,width:1.86,type:'window'}]);wall('Front facade',[1.44,-.1],[7.32,-.1],.24,C.cream,first?[{start:.5,width:1.25,type:'window'},{start:3.32,width:1.25,type:'window'}]:[{start:.5,width:1.2,type:'window'},{start:4,width:.9,type:'glassdoor'}]);}
function label(text,x,z){const c=document.createElement('canvas');c.width=768;c.height=100;const ctx=c.getContext('2d');ctx.fillStyle='rgba(18,26,29,.86)';ctx.beginPath();ctx.roundRect(0,0,768,100,25);ctx.fill();ctx.font='42px Segoe UI';ctx.textAlign='center';ctx.fillStyle='#f5efdf';ctx.fillText(text,384,63);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false}));s.scale.set(2.35,.305,1);s.position.set(x,.2,z);s.name='Label '+text;current.add(s);nameSprites.push(s)}
function rug(n,x,z,w,d,c,pattern=false){box(n,x,z,w,d,.018,c,.045);if(pattern){for(let a=-w/2+.22;a<w/2;a+=.48)for(let b=-d/2+.18;b<d/2;b+=.5){const m=box('Rug diamond',x+a,z+b,.15,.17,.008,((Math.round((a+w/2)/.48)+Math.round((b+d/2)/.5))%3===0?'#a65846':'#3d586a'),.058);m.rotation.y=Math.PI/4}}}
function chair(n,x,z,rot=0,c=C.wood,office=false){const g=group(n);g.position.set(x,0,z);g.rotation.y=rot;box('Seat',0,0,.43,.44,.08,c,.46,g);box('Chair back',0,.2,.43,.055,.49,c,.74,g);if(office){cyl('Pedestal',0,0,.035,.42,C.dark,.23,g);box('Chair foot',0,0,.48,.06,.04,C.dark,.04,g);box('Chair foot',0,0,.06,.48,.04,C.dark,.04,g)}else for(let a of [-.16,.16])for(let b of [-.16,.16])box('Leg',a,b,.035,.035,.45,c,.225,g)}
function desk(n,x,z,w,d,c=C.white,rot=0){const g=group(n);g.position.set(x,0,z);g.rotation.y=rot;box('Desk top',0,0,w,d,.055,c,.74,g);for(let a of [-w/2+.06,w/2-.06])for(let b of [-d/2+.05,d/2-.05])box('Desk leg',a,b,.035,.035,.72,C.metal,.36,g);box('Monitor stand',0,.03,.22,.16,.025,C.dark,.79,g);box('Monitor',0,-d*.24,.62,.035,.38,C.dark,1.01,g);return g}
function bed(n,x,z,w,d,rot,frame,bedding){const g=group(n);g.position.set(x,0,z);g.rotation.y=rot;box('Bed frame',0,0,w,d,.3,frame,.2,g);box('Mattress',0,0,w-.07,d-.05,.19,C.white,.43,g,.07);box('Duvet',0,.18,w-.08,d-.5,.13,bedding,.56,g,.07);box('Headboard',0,-d/2+.04,w,.08,.9,frame,.5,g);for(let a of [-w*.24,w*.24])box('Pillow',a,-d/2+.32,w*.41,.41,.12,C.white,.58,g,.08)}
function cabinet(n,x,z,w,d,h,c,rot=0){const g=group(n);g.position.set(x,0,z);g.rotation.y=rot;box(n,0,0,w,d,h,c,h/2,g);for(let j=0;j<Math.max(1,Math.round(w/.5));j++){const ww=w/Math.max(1,Math.round(w/.5));const xx=-w/2+(j+.5)*ww;box('Cabinet door',xx,d/2+.012,ww-.015,.025,h-.04,c,h/2+.01,g);box('Handle',xx+ww*.3,d/2+.035,.018,.02,.13,C.metal,h*.56,g)}return g}
function shelf(n,x,z,w,h,c,rot=0){const g=group(n);g.position.set(x,0,z);g.rotation.y=rot;box('Back',0,-.145,w,.025,h,c,h/2,g);for(let a of [-w/2,w/2])box('Side',a,0,.035,.32,h,c,h/2,g);for(let y=.08;y<h;y+=.34){box('Shelf',0,0,w,.32,.025,c,y,g);let k=0;for(let xx=-w/2+.065;xx<w/2-.07;xx+=.075){const ht=.18+((k++*13)%8)*.012;box('Book',xx,.02,.045,.18,ht,['#8b5648','#c6bd95','#425c67','#b9ac86','#687369'][k%5],y+ht/2+.015,g,0)}}return g}
function sofa(n,x,z,w,d,c,rot=0,chaise=false){const g=group(n);g.position.set(x,0,z);g.rotation.y=rot;box('Sofa base',0,0,w,d,.28,c,.25,g,.07);box('Sofa back',0,-d/2+.08,w,.17,.65,c,.56,g,.07);for(let a of [-w/2+.09,w/2-.09])box('Armrest',a,0,.17,d,.44,c,.46,g,.06);const num=3;for(let i=0;i<num;i++){let xx=-w/2+(i+.5)*w/num;box('Seat cushion',xx,.06,w/num-.045,d-.24,.15,c,.49,g,.06);box('Scatter cushion',xx,-d/2+.23,.36,.15,.32,i===1?'#c27853':'#c1a04a',.75,g,.07)}if(chaise)box('Chaise',-w/2+.48,.66,.94,1.05,.44,c,.31,g,.07);return g}
function stairs(x,z,full=true){const g=group('U winder stair - estimated risers');const N=16,H=2.9/N;for(let i=0;i<7;i++)box('Ascending tread '+(i+1),x+.73,z-i*.27,.78,.275,H*(i+1),C.darkwood,H*(i+1)/2,g,0);box('Turning landing',x+.3,z-1.88,1.65,.73,1.55,C.darkwood,.775,g,0);for(let i=0;i<8;i++)box('Return tread '+(i+9),x-.46,z-1.55+i*.23,.78,.235,1.65+i*.16,C.darkwood,(1.65+i*.16)/2,g,0);for(let i=0;i<7;i++){const yy=H*(i+1);cyl('Black baluster',x+.3,z-i*.27,.014,.8,C.dark,yy+.4,g)}beam('Handrail',[x+.3,H+.82,z],[x+.3,H*7+.82,z-1.62],.045,C.dark,g);return g}
function radiator(n,x,z,w,rot=0){const g=group(n);g.position.set(x,0,z);g.rotation.y=rot;box('Radiator',0,0,w,.08,.6,C.white,.49,g);for(let i=-w/2+.03;i<w/2;i+=.055)box('Fin',i,.05,.016,.015,.52,'#d0d1c8',.49,g)}
// Photo-led corrections: living storage, hall, attic stair, rear doors and fixtures.
const atticPreviews=[],gardenPivots=[];
function livingStorage(){
 const c='#737d78',x=4.34;
 shelf('Living open bookcase beside hall door',4.4,-3.16,.68,2.04,c,-Math.PI/2);
 const h=group('Living glazed hutch over double cupboard');h.position.set(x,0,-2.37);h.rotation.y=-Math.PI/2;
 box('Hutch base carcass',0,0,.88,.44,.8,c,.4,h);
 for(const a of [-.215,.215]){box('Lower cupboard framed door',a,.235,.415,.025,.73,c,.42,h);box('Lower cupboard inset panel',a,.253,.33,.018,.61,'#7f8981',.42,h);cyl('Cupboard knob',a+(a<0?.13:-.13),.274,.02,.025,C.metal,.49,h).rotation.x=Math.PI/2;}
 box('Hutch counter',0,0,.94,.47,.045,c,.825,h);
 for(const a of [-.425,.425])box('Upper cabinet stile',a,-.06,.03,.32,1.25,c,1.46,h);
 box('Upper cabinet back',0,-.205,.86,.025,1.25,c,1.46,h);
 for(const y of [.86,1.16,1.49,1.81,2.08])box('Display shelf',0,-.055,.86,.32,.025,c,y,h);
 for(const a of [-.215,.215]){
  const pane=box('Glazed cupboard door',a,.113,.385,.018,1.12,'#b7c9c5',1.47,h);pane.material=mat('#b7c9c5',{transparent:true,opacity:.15,roughness:.15});pane.castShadow=false;
  for(const xx of [a-.2,a+.2])box('Glass door side frame',xx,.13,.025,.035,1.2,c,1.47,h);
  for(const yy of [.87,2.07])box('Glass door rail',a,.13,.425,.035,.035,c,yy,h);
  box('Glass door handle',a+(a<0?.15:-.15),.16,.026,.03,.075,C.metal,1.44,h);
 }
 for(const y of [1.19,1.52,1.84])for(const a of [-.23,.18]){for(let k=0;k<3;k++)cyl('Displayed plate',a,-.04,.11,.016,'#d5d7c9',y+k*.018,h);}
 cabinet('Living low printer cupboard',x,-1.59,.66,.44,.77,c,-Math.PI/2);
 const p=group('Living printer and open upper shelves');p.position.set(x,0,-1.59);p.rotation.y=-Math.PI/2;
 box('Printer',0,.03,.47,.32,.22,'#343c3b',.91,p);box('Printer paper tray',0,.205,.4,.19,.025,'#bdc7bf',.9,p);
 for(const a of [-.315,.315])box('Printer shelving side',a,-.055,.025,.32,1.08,c,1.32,p);
 box('Printer shelving back',0,-.205,.64,.025,1.08,c,1.32,p);
 for(const y of [1.25,1.56,1.87]){box('Printer upper shelf',0,-.055,.64,.32,.025,c,y,p);if(y<1.8)for(let i=0;i<7;i++)box('Books above printer',-.26+i*.075,-.04,.045,.16,.22,['#9d6957','#c9c5a3','#52696a'][i%3],y+.13,p);}
 shelf('Living narrow bookcase by front window',4.4,-1.05,.4,1.98,c,-Math.PI/2);
}
function groundStair(){
 const g=group('Hall stair - straight lower flight and turning head');const R=3.1/16,x=6.77,z=-3.02;
 for(let i=0;i<10;i++){const top=(i+1)*R,zz=z-i*.225;box('Hall tread '+(i+1),x,zz,.9,.235,.065,C.darkwood,top-.0325,g,i<2?.055:.012);box('Hall riser '+(i+1),x,zz+.104,.9,.025,R,C.darkwood,top-R/2,g);cyl('Hall black baluster',6.29,zz,.014,.85,'#26362e',top+.425,g);const loop=mesh(new THREE.TorusGeometry(.09,.009,6,24),'#26362e',6.28,top+.43,zz,'Ornamental railing loop',g);loop.rotation.y=Math.PI/2;loop.scale.y=1.6;}
 beam('Hall inner wood stringer',[6.3,.06,-2.9],[6.3,1.9,-5.2],.115,C.darkwood,g);beam('Hall outer wood stringer',[7.19,.06,-2.9],[7.19,1.9,-5.2],.115,C.darkwood,g);beam('Hall handrail',[6.29,R+.89,z],[6.29,10*R+.89,z-9*.225],.05,C.darkwood,g);
 for(let i=0;i<6;i++){const a=i*Math.PI/6,b=(i+1)*Math.PI/6;const pts=[[6.32+.08*Math.cos(a),-5.1-.08*Math.sin(a)],[6.32+.9*Math.cos(a),-5.1-.9*Math.sin(a)],[6.32+.9*Math.cos(b),-5.1-.9*Math.sin(b)],[6.32+.08*Math.cos(b),-5.1-.08*Math.sin(b)]];polygon('Hall turning tread '+(i+11),pts,C.darkwood,(i+11)*R-.065,.065,g);}
 return g;
}
function stairToAttic(){
 const g=group('First floor stair to attic - top at desk end'),R=3.1/16;
 for(let i=0;i<7;i++){let y=(i+1)*R,z=-5.62+i*.25;box('Attic connection lower tread '+i,6.65,z,.75,.26,.065,C.darkwood,y-.0325,g);box('Attic connection lower riser '+i,6.65,z-.118,.75,.025,R,C.darkwood,y-R/2,g);}
 for(let i=0;i<4;i++){const a=i*Math.PI/4,b=(i+1)*Math.PI/4;polygon('Attic connection turning tread '+i,[[6+.28*Math.cos(a),-4.12+.28*Math.sin(a)],[6+Math.cos(a),-4.12+Math.sin(a)],[6+Math.cos(b),-4.12+Math.sin(b)],[6+.28*Math.cos(b),-4.12+.28*Math.sin(b)]],C.darkwood,(i+8)*R-.065,.065,g);}
 for(let i=0;i<5;i++){let y=(i+12)*R,z=-4.25-i*.3;box('Attic connection upper tread '+i,5.35,z,.75,.31,.065,C.darkwood,y-.0325,g);box('Attic connection upper riser '+i,5.35,z+.14,.75,.025,R,C.darkwood,y-R/2,g);cyl('Attic connection baluster',5.76,z,.014,.78,C.dark,y+.39,g);}
 box('Attic top landing at sliding door',5.35,-5.76,.83,.31,.07,C.darkwood,3.065,g);
 beam('Attic upper stringer',[5.72,12*R-.08,-4.1],[5.72,3.02,-5.88],.11,C.darkwood,g);beam('Attic handrail',[5.76,12*R+.83,-4.25],[5.76,3.1+.83,-5.45],.045,C.darkwood,g);
 g.scale.x=-1;g.position.x=12;g.userData={upperFlight:'outside wall side',topLanding:'desk-end doorway'};return g;
}
function hallDetails(){
 const c='#7d8580';
 // Open coat recess to the left of the kitchen door, behind the living-room doorway.
 box('Coat niche back',4.24,-5.48,.05,.73,2.2,c,1.1);box('Coat niche top shelf',4.46,-5.48,.47,.73,.045,C.white,1.93);beam('Coat hanging rail',[4.53,1.72,-5.78],[4.53,1.72,-5.18],.027,C.dark);
 for(const z of [-5.7,-5.47,-5.24]){box('Hanging coat',4.48,z,.18,.18,.87,'#30383a',1.22);}
 for(const y of [.09,.3,.49])box('White shoe rack shelf',4.48,-5.48,.4,.61,.025,C.white,y);for(const z of [-5.75,-5.21])box('Shoe rack side',4.48,z,.4,.025,.51,C.white,.26);
 // Cube storage runs lengthways beside the stair and faces the hall.
 const q=group('Hall cube storage beside stair');q.position.set(6.09,0,-4.02);q.rotation.y=-Math.PI/2;
 for(const y of [.025,.39,.765])box('Cube shelf horizontal',0,0,1.47,.39,.03,c,y,q);
 for(let i=0;i<=4;i++)box('Cube shelf divider',-.735+i*.3675,0,.028,.39,.77,c,.39,q);
 box('Cube shelf back',0,-.18,1.47,.025,.77,c,.39,q);
 for(let i=0;i<4;i++)for(let j=0;j<2;j++)if(i!==3||j!==1)box('Dark fabric storage bin',-.55+i*.367,j*.001,.31,.31,.3,'#38423f',.2+j*.37,q,.02);
 // Separate cellar access at the high end under the stairs.
 const d=group('Cellar access door under stairs');d.position.set(6.27,0,-5.47);d.rotation.y=-Math.PI/2;
 box('Cellar door leaf',0,0,.72,.045,1.95,'#aaa99f',.975,d);for(const a of [-.4,.4])box('Cellar door jamb',a,0,.06,.09,2.04,C.wall,1.02,d);box('Cellar door header',0,0,.86,.09,.065,C.wall,2.02,d);box('Cellar door handle',-.25,.05,.13,.03,.025,C.metal,.92,d);
 rug('Hall patterned runner',5.32,-4.34,.77,2.75,'#824d45');rug('Front entrance mat',5.95,-.84,1.05,.7,'#424a48');
 for(let x=4.83;x<7.15;x+=.48)box('Hall tile grout',x,-3.02,.008,5.66,.003,'#737b76',.033,current,0);for(let z=-5.78;z<-.25;z+=.48)box('Hall tile grout',5.98,z,2.35,.008,.003,'#737b76',.033,current,0);
}
function kitchenFridge(){
 const f=group('Silver fridge freezer beside microwave');f.position.set(6.88,0,-6.35);f.rotation.y=-Math.PI/2;
 box('Fridge body',0,0,.6,.65,1.94,'#8c9999',.97,f);box('Upper refrigerator door',0,.34,.57,.035,1.23,'#a6b3b4',1.31,f);box('Bottom freezer drawer',0,.34,.57,.035,.61,'#929f9f',.33,f);box('Fridge black handle',0,.375,.49,.035,.045,C.dark,.68,f);box('Fridge digital display',.12,.365,.08,.015,.22,C.dark,1.52,f);box('Display light',.12,.377,.035,.006,.012,'#3ba1cf',1.54,f);
 for(let i=0;i<7;i++){const a=-.21+(i%3)*.17,y=.92+Math.floor(i/3)*.3;box('Fridge note',a,.375,.11,.009,.16,'#e5e1cf',y,f,0);box('Fridge magnet',a,.384,.035,.01,.03,['#b04e3f','#607c9e','#beab54'][i%3],y+.065,f);}
}
function rearGardenDoors(){
 const g=group('Four-leaf timber garden glazing');g.position.set(1.05,0,-9.3);const w=.475,H=2.15;
 for(let i=0;i<4;i++){
  const rightHinged=i===1||i===3,p=group('Garden leaf '+(i+1),g);p.position.x=(rightHinged?i+1:i)*w;p.userData={leaf:i+1,opening:i===0?'fixed / closed':'inward toward dining room',thermostatSide:i>0};const cx=(rightHinged?-1:1)*w/2;
  for(const xx of [cx-w/2+.022,cx+w/2-.022])box('Timber door stile',xx,0,.044,.065,H,C.darkwood,H/2,p);
  for(const yy of [.06,.58,H-.03])box('Timber door rail',cx,0,w,.065,.055,C.darkwood,yy,p);
  box('Timber lower door panel',cx,0,w-.055,.045,.48,'#77533b',.32,p);
  const pane=box('Clear garden door glass',cx,0,w-.065,.018,1.48,'#b7d2cb',1.35,p);pane.material=mat('#b7d2cb',{transparent:true,opacity:.08,roughness:.08,depthWrite:false});pane.castShadow=false;
  if(i>0){gardenPivots.push({pivot:p,sign:rightHinged?1:-1});box('Brass garden door handle',cx+(rightHinged?-.13:.13),.045,.055,.03,.025,'#b8a678',.88,p);}
 }
 box('Garden door lintel',.95,0,2.03,.12,.09,C.darkwood,2.22,g);box('Garden threshold',.95,0,2.03,.13,.035,'#8e8775',.025,g);
 // Thermostat on the right-hand wall establishes which three leaves open inward.
 box('Dining room thermostat',4.005,-8.8,.025,.19,.11,'#e7e5d8',1.35);box('Thermostat screen',3.989,-8.8,.008,.11,.045,C.dark,1.36);
 setGardenDoors(false);
}
function setGardenDoors(open){gardenPivots.forEach(({pivot,sign})=>pivot.rotation.y=open?sign*Math.PI*.26:0);}
function garden(){buildPhotoGarden();}
// Outdoor geometry is estimated from photographs; dimensions are not surveyed.
const exteriorRoofParts=[],dimensionParts=[],dimensionSprites=[];
let brickTexture;
const brickMaterials=new Map();
function brickMat(w,h){
 if(!brickTexture){const c=document.createElement('canvas');c.width=512;c.height=256;const q=c.getContext('2d');q.fillStyle='#b6a991';q.fillRect(0,0,512,256);for(let j=0;j<4;j++)for(let i=-1;i<5;i++){const x=i*128+(j%2)*64,y=j*64;const v=(i*17+j*29+93)%40;q.fillStyle=`rgb(${141+v},${79+v*.7},${58+v*.6})`;q.fillRect(x+4,y+4,120,56);q.fillStyle='#ffffff12';for(let k=0;k<18;k++)q.fillRect(x+8+(k*23%108),y+8+(k*17%46),8,2);}brickTexture=new THREE.CanvasTexture(c);brickTexture.colorSpace=THREE.SRGBColorSpace;brickTexture.wrapS=brickTexture.wrapT=THREE.RepeatWrapping;}
 const key=w.toFixed(2)+'/'+h.toFixed(2);if(!brickMaterials.has(key)){const t=brickTexture.clone();t.repeat.set(w/.84,h/.26);brickMaterials.set(key,new THREE.MeshStandardMaterial({map:t,roughness:.94}));}return brickMaterials.get(key);
}
function photoBrickWall(n,a,b,t,holes=[],height=2.25){const g=wall(n,a,b,t,'#a77258',holes,height);g.traverse(o=>{if(o.isMesh&&o.name===n+' masonry'){o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;o.material=brickMat(b.max.x-b.min.x,b.max.y-b.min.y);}});return g;}
function outdoorDim(text,a,b,offset=0){
 const g=group('Estimated dimension '+text);dimensionParts.push(g);beam('Dimension line',[a[0],.08,a[1]],[b[0],.08,b[1]],.012,'#d6c49e',g);for(const p of [a,b])beam('Dimension tick',[p[0]-.09,.08,p[1]-.09],[p[0]+.09,.08,p[1]+.09],.015,'#d6c49e',g);
 label(text,(a[0]+b[0])/2,(a[1]+b[1])/2+offset);const s=nameSprites[nameSprites.length-1];s.userData.dimension=true;s.scale.set(2.7,.35,1);dimensionSprites.push(s);
}
function setOutdoorDimensions(on){dimensionParts.forEach(g=>g.visible=on);dimensionSprites.forEach(g=>g.visible=on);nameSprites.forEach(g=>{if(!g.userData.dimension)g.visible=!on&&(document.querySelector('#labels')?.checked??true)});}
function setExteriorRoofs(on){exteriorRoofParts.forEach(g=>g.visible=on);}
function greyMasonryMaterial(w,h){
 const c=document.createElement('canvas');c.width=512;c.height=256;const q=c.getContext('2d');q.fillStyle='#343d40';q.fillRect(0,0,512,256);
 for(let j=0;j<4;j++)for(let i=-1;i<5;i++){const v=67+(i*11+j*7+30)%14;q.fillStyle=`rgb(${v},${v+5},${v+6})`;q.fillRect(i*128+(j%2)*64+3,j*64+3,122,58);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(w/.84,h/.26);return new THREE.MeshStandardMaterial({map:t,roughness:.96});
}
const SURVEY_SITE={"origin":[150158.97571276085,176905.19487093968],"xAxis":[-0.9468001696078692,-0.32182206082012166],"zAxis":[-0.32182206082012166,0.9468001696078692],"parcel":[[7.141,-22.922],[3.831,-23.115],[-0.785,-23.385],[-0.79,-23.385],[-0.725,-21.416],[-0.49,-14.196],[-0.482,-13.963],[-0.463,-13.371],[-0.327,-9.184],[-0.205,-5.762],[-0.077,-2.175],[2.024,0.0],[6.632,0.0],[7.777,-12.773],[8.185,-17.326],[8.678,-22.832],[7.141,-22.922]],"garage":[[3.471,-24.949],[3.822,-24.959],[3.831,-23.115],[7.141,-22.922],[7.16,-25.115],[8.878,-25.059],[9.12,-27.761],[3.379,-28.025],[3.471,-24.949]],"houseAndBrickWing":[[-0.205,-5.762],[-0.077,-2.175],[2.024,0.0],[6.632,0.0],[7.777,-12.773],[8.185,-17.326],[8.06,-19.554],[5.425,-19.71],[5.183,-17.567],[4.725,-17.65],[4.192,-10.491],[3.017,-10.627],[3.064,-9.304],[-0.327,-9.184],[-0.205,-5.762]],"source":"GRB WFS EPSG:31370","garageFeature":"GBG.7855611","houseFeature":"GBG.319140","garageParcel":[[3.379,-28.025],[-0.945,-28.223],[-0.941,-28.054],[-0.928,-27.637],[-0.842,-25.002],[-0.79,-23.385],[-0.785,-23.385],[3.831,-23.115],[7.141,-22.922],[8.678,-22.832],[8.878,-25.059],[9.12,-27.761],[3.379,-28.025]],"garageParcelId":"ADP.9010670"};
// Metric site coordinates registered to the front facade. Footprints come from
// GRB; separation into two brick roof sections and all fittings come from photos.
function fenceRun(name,a,b,height=1.8){
 const len=Math.hypot(b[0]-a[0],b[1]-a[1]),g=group(name);g.position.set(a[0],0,a[1]);g.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);
 box(name+' timber',len/2,0,len,.07,height-.3,'#695441',.3+(height-.3)/2,g,0);
 for(let y=.38;y<height;y+=.12)box('Fence board seam',len/2,.041,len,.01,.012,'#483f32',y,g,0);
 const n=Math.ceil(len/1.8);for(let i=0;i<=n;i++)box('Fence post',i*len/n,0,.1,.12,height+.1,'#82775e',(height+.1)/2,g);
 return g;
}
function gardenBrickBuilding(name,p,facadeName,holes,low,high,roofName,slabName){
 const g=group(name),old=current;current=g;const innerFar=p.at(-1);
 g.userData={isOutbuilding:true,buildingId:name.startsWith('Smaller')?2:1,estimate:true,footprintPolygon:p,source:'GRB envelope plus photo roof division'};
 polygon(slabName,p,'#73776e',-.09,.13);
 photoBrickWall(facadeName,p[0],innerFar,.16,holes,low);
 photoBrickWall(name+' boundary',p[2],p[1],.16,[],high);
 for(const [a,b] of [[p[0],p[1]],[p[3],p[2]]]){
  photoBrickWall(name+' end',a,b,.16,[],low);
  const t=new THREE.BufferGeometry();t.setAttribute('position',new THREE.Float32BufferAttribute([a[0],low,a[1],b[0],low,b[1],b[0],high,b[1]],3));t.setIndex([0,1,2]);t.computeVertexNormals();const m=mesh(t,'#a77258',0,0,0,'Sloping end infill');m.material=brickMat(Math.hypot(b[0]-a[0],b[1]-a[1]),high-low);m.material.side=THREE.DoubleSide;upper.push(m);
 }
 if(p.length===5)photoBrickWall(name+' rear step',innerFar,p[3],.16,[],low);
 const roof=group(roofName);exteriorRoofParts.push(roof);const v=[],ix=[],nu=12,nv=90,L=Math.hypot(innerFar[0]-p[0][0],innerFar[1]-p[0][1]);
 for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){
  const u=-.025+i/nu*1.05,t=-.02+j/nv*1.04;
  const a=[p[0][0]+(innerFar[0]-p[0][0])*t,p[0][1]+(innerFar[1]-p[0][1])*t],b=[p[1][0]+(p[2][0]-p[1][0])*t,p[1][1]+(p[2][1]-p[1][1])*t];
  v.push(a[0]+(b[0]-a[0])*u,low+.05+(high-low)*u+.02*Math.cos(t*L*Math.PI*2/.18),a[1]+(b[1]-a[1])*u);
 }
 for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;ix.push(a,b,a+1,a+1,b,b+1);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setIndex(ix);geo.computeVertexNormals();mesh(geo,name.startsWith('Smaller')?'#7b817c':'#695952',0,0,0,'Profiled roofing sheets',roof,{side:THREE.DoubleSide,roughness:.85});
 beam('Garden gutter',[p[0][0]-.08,low,p[0][1]],[innerFar[0]-.08,low,innerFar[1]],.09,C.metal,roof);
 if(!name.startsWith('Smaller')){cyl('Outbuilding roof flue',7.35,-16.3,.065,.85,C.metal,high+.35,roof);cyl('Roof flue collar',7.35,-16.3,.12,.08,C.metal,high+.05,roof);}
 current=old;return g;
}
const OWNER_EXTERIOR={"pathPolygon":[[3.687829427888401,-22.95781803305718],[2.9121705721115987,-22.54218196694282],[4.291986022210998,-19.967174260771408],[4.405972947515191,-18.934167750202157],[4.382031256446739,-18.93687848798742],[4.353268385327346,-18.68283998292593],[3.8559303561256697,-18.772968927082566],[3.338581276662289,-11.819985854567882],[3.30554418747467,-11.369480092918524],[4.168227637826681,-11.30621663989271],[4.201230956332925,-11.756261892250588],[4.6472411371270335,-17.75047616716002],[5.108760855529289,-17.666838314261796],[5.224379375002837,-18.68800048275893],[5.317345500588511,-18.69825881385804],[5.1480139777890015,-20.232825739228595],[3.687829427888401,-22.95781803305718]],"lawnPolygon":[[3.3114489806606446,-11.45],[3.338581276662289,-11.819985854567882],[3.8559303561256697,-18.772968927082566],[4.353268385327346,-18.68283998292593],[4.382031256446739,-18.93687848798742],[4.405972947515191,-18.934167750202157],[4.291986022210998,-19.967174260771408],[2.9121705721115987,-22.54218196694282],[3.113380281690137,-22.65],[-0.6962162162162162,-22.65],[-0.28,-11.45],[3.3114489806606446,-11.45]],"garageModel":[[3.822,-23.35],[8.73,-23.35],[9.12,-27.761],[3.379,-28.025],[3.822,-23.35]],"garageCorrection":"Owner confirms garage does not project into garden; forward map-derived section removed; garden-facing wall straight behind fence line.","fenceEndPaving":[[-0.75,-22.65],[3.85,-22.65],[3.85,-23.115],[-0.79,-23.385],[-0.75,-22.65]],"lawnCorrection":"Owner third photograph: uninterrupted green lawn to rear fence-end stones. No central path, bark bed or broad paved forecourt in main lawn. Beds retained behind brick buildings in service corner."};
function buildRearGardenDetails(){
 const old=current,g=group('Grey garden garage');current=g;
 g.userData={isGardenStructure:true,structureType:'garage',footprintPolygon:OWNER_EXTERIOR.garageModel,source:'Owner-corrected garage: straight face behind garden fence; map-derived forward section removed',heightEstimate:true};
 polygon('Garage floor slab',OWNER_EXTERIOR.garageModel,'#596165',-.07,.1);
 const p=OWNER_EXTERIOR.garageModel.slice(0,-1);
 for(let i=0;i<p.length;i++){
  const a=p[i],b=p[(i+1)%p.length];
  const n=i===0?'Garage garden window wall':i===3?'Garage drive wall':'Garage wall '+i;
  const holes=i===0?[{start:3.55,width:.72,type:'window',sill:1.35,head:1.65,frameColor:'#899393',divisions:1}]:i===3?[{start:.3,width:2.4,type:'open',head:2.02}]:[];
  const w=wall(n,a,b,.14,'#4a5355',holes,2.1);w.traverse(o=>{if(o.isMesh&&o.name===n+' masonry'){o.geometry.computeBoundingBox();const q=o.geometry.boundingBox;o.material=greyMasonryMaterial(q.max.x-q.min.x,q.max.y-q.min.y);}});
  if(i===3){const door=group('Garage vehicle door',w);door.position.x=1.5;box('Garage sectional door',0,0,2.4,.07,2,'#303b3b',1,door,0);for(let y=.15;y<2;y+=.22)box('Garage door panel seam',0,.045,2.4,.008,.012,'#1f2929',y,door,0);}
 }
 const roof=group('Garage flat roof');exteriorRoofParts.push(roof);polygon('Garage roof cap',OWNER_EXTERIOR.garageModel,'#3f494b',2.1,.1,roof);
 current=old;label('Garage · behind fence',6.15,-26.6);
 // Drive lies beside the garage inside its mapped companion parcel.
 polygon('Garage drive and apron',SURVEY_SITE.garageParcel,'#9c9d8c',-.08,.1);
 for(let z=-27.8;z<-23.6;z+=.42)for(let x=-.65;x<3.25;x+=.42)box('Drive paving joint',x,z,.4,.009,.008,'#777f73',.028,current,0);
 box('Veldstraat pavement',-1.32,-25.6,1.2,6,.06,'#999c8e',-.02);
 box('Veldstraat context',-3.05,-25.6,2.25,6,.08,'#777e76',-.07);
 for(let z=-28.45;z<-22.7;z+=.22)box('Street cobble joint',-3.05,z,2.2,.012,.008,'#5d655e',-.023,current,0);
 // Owner photographs show the gap at the end of the fence, beside the garage.
 const ga=[2.93,-23.168],gb=[3.831,-23.115];
 polygon('Pedestrian passage to garage drive',[[2.82,-22.5],[3.75,-22.5],[3.75,-24.7],[2.82,-24.7]],'#a7aa99',-.006,.035);
 label('Fence gap → garage drive',3.35,-23.45);label('Veldstraat access',.7,-26.2);
 const passage=group('Fence opening to garage drive');passage.userData={clearWidth:.9,endpoints:[ga,gb],confirmedByOwner:true};
 outdoorDim('Gap ~0.9 m',ga,gb,.35);
}

function buildRearServiceCorner(buildingEnd,garageEnd){
 const corner=group('Rear service corner');
 const garageFace=-23.28;
 const pathLeft=-22.05;
 const pathRight=-21.15;
 const mulchFront=5.36;
 const mulchBack=7.08;
 const binPadEnd=8.41;
 const planterFront=5.92;
 const planterBack=7.77;
 const planterWall=-19.78;

 // The path runs between the two beds, with a paved apron and bin pad beside it.
 const pavingColors=['#a59d88','#969581','#b3a590','#8f9588'];
 function blockPaving(name,xStart,xEnd,zStart,zEnd){
  box(name,(xStart+xEnd)/2,(zStart+zEnd)/2,xEnd-xStart,zEnd-zStart,.045,'#878476',.003,corner,0);
  const columns=Math.round((xEnd-xStart)/.16);
  const rows=Math.round((zEnd-zStart)/.16);
  const width=(xEnd-xStart)/columns;
  const depth=(zEnd-zStart)/rows;
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
   box('Rear garden path paver',xStart+(col+.5)*width,zStart+(row+.5)*depth,width-.007,depth-.007,.028,pavingColors[(row*7+col*3)%4],.039,corner,0);
  }
 }
 blockPaving('Rear block-paved walkway',4.23,8.45,pathLeft,pathRight);
 blockPaving('Paved apron in front of wood chips',4.23,mulchFront,garageFace,pathLeft);
 box('Paved bin pad behind wood chips',(mulchBack+binPadEnd)/2,(garageFace+pathLeft)/2,binPadEnd-mulchBack,pathLeft-garageFace,.052,'#666d64',.012,corner,0);
 for(let x=7.34;x<8.37;x+=.27)box('Bin pad slab joint',x,(garageFace+pathLeft)/2,.008,pathLeft-garageFace,.004,'#50574f',.04,corner,0);
 box('Paving along the raised bed front',5.34,-20.46,1.16,1.38,.047,'#858b7d',.013,corner,0);

 box('Service corner bark bed',(mulchFront+mulchBack)/2,(garageFace+pathLeft)/2,mulchBack-mulchFront,pathLeft-garageFace,.05,'#504238',.016,corner,0);
 for(let i=0;i<130;i++){
  const x=mulchFront+.04+(i*37%162)/100;
  const z=garageFace+.04+(i*53%113)/100;
  const chip=box('Service bark chip',x,z,.025,.039,.007,['#806950','#44392f','#aa9276'][i%3],.044,corner,0);
  chip.rotation.y=i*2.4;
 }
 box('Wood-chip bed edging beside path',(mulchFront+mulchBack)/2,pathLeft,mulchBack-mulchFront,.064,.105,'#a6ab9c',.053,corner);
 for(const x of [mulchFront,mulchBack])box('Wood-chip bed end edging',x,(garageFace+pathLeft)/2,.063,pathLeft-garageFace,.105,'#a6ab9c',.053,corner);

 box('Raised flower-bed soil',(planterFront+planterBack)/2,(pathRight+planterWall)/2,planterBack-planterFront,planterWall-pathRight,.28,'#4f4c40',.14,corner);
 const blockDepth=(planterWall-pathRight)/7;
 for(let row=0;row<3;row++)for(let i=0;i<7;i++){
  box('Flower-bed front retaining block',planterFront,pathRight+(i+.5)*blockDepth,.15,blockDepth-.008,.104,'#a5aaa0',.055+row*.107,corner);
 }
 box('Raised bed timber edge beside path',(planterFront+planterBack)/2,pathRight,planterBack-planterFront,.064,.25,'#705042',.155,corner);
 box('Raised bed rear timber edge',planterBack,(pathRight+planterWall)/2,.064,planterWall-pathRight,.31,'#705042',.155,corner);
 for(let i=0;i<12;i++){
  const x=6.12+(i%4)*.4;
  const z=-20.94+Math.floor(i/4)*.25;
  if(x<6.63&&z>-20.57)continue;
  const shrub=mesh(new THREE.IcosahedronGeometry(.19,1),'#4e7146',x,.4,z,'Flower bed foliage',corner);
  shrub.scale.y=.75;
  for(let j=0;j<3;j++)mesh(new THREE.IcosahedronGeometry(.033,1),'#be7798',x+(j-1)*.072,.53+j*.012,z,'Pink flowers',corner);
 }

 const barrelX=6.27;
 const barrelZ=-20.11;
 const barrelBase=.28;
 const wallZ=-19.79;
 const barrel=new THREE.LatheGeometry([
  new THREE.Vector2(.235,0),new THREE.Vector2(.257,.045),new THREE.Vector2(.29,.25),
  new THREE.Vector2(.3,.49),new THREE.Vector2(.286,.74),new THREE.Vector2(.269,.86),
  new THREE.Vector2(.287,.86),new THREE.Vector2(.287,.89),new THREE.Vector2(.252,.89),
  new THREE.Vector2(.252,.805),new THREE.Vector2(.224,.04),
 ],32);
 mesh(barrel,'#218f86',barrelX,barrelBase,barrelZ,'Turquoise rain barrel',corner,{side:THREE.DoubleSide});
 cyl('Dark inside of rain barrel',barrelX,barrelZ,.252,.012,'#205f57',barrelBase+.65,corner);
 beam('Smaller building rainwater pipe',[barrelX,2.17,wallZ],[barrelX,1.27,wallZ],.058,'#c0c8c1',corner);
 beam('Rain barrel feed',[barrelX,1.27,wallZ],[barrelX,1.2,barrelZ],.053,'#c0c8c1',corner);

 const length=Math.hypot(garageEnd[0]-buildingEnd[0],garageEnd[1]-buildingEnd[1]);
 const boundary=group('Straight rear service boundary plinth',corner);
 boundary.position.set(buildingEnd[0],0,buildingEnd[1]);
 boundary.rotation.y=-Math.atan2(garageEnd[1]-buildingEnd[1],garageEnd[0]-buildingEnd[0]);
 const plinth=box('Rear service boundary brick base',length/2,0,length,.15,.43,'#a77258',.215,boundary,0);
 plinth.material=brickMat(length,.43);
 for(let i=0;i<14;i++){
  const y=.49+i*.094;
  box('Rear boundary horizontal timber slat',length/2,0,length,.058,.078,'#6f4b3b',y,boundary,0);
 }
 for(const x of [0,length*.55,length]){
  const pier=box('Rear boundary brick pier',x,0,.19,.21,.85,'#a77258',.425,boundary);
  pier.material=brickMat(.19,.85);
  box('Rear boundary fence post',x,0,.09,.1,.98,'#817d6b',1.29,boundary);
 }

 const bins=group('Bins on rear paved pad',corner);
 box('Rear storage bin',8.03,-22.99,.38,.43,.78,'#303d3d',.42,bins);
 box('Rear bin light doors',7.83,-22.99,.024,.35,.63,'#c2c8bc',.42,bins);
 cyl('Rear black round bin',8.03,-22.49,.17,.72,'#2c3332',.39,bins);
 cyl('Rear round bin light lid',8.03,-22.49,.19,.06,'#c6c9bc',.775,bins);
}

function buildPhotoGarden(){
 const old=current,site=group('Garden and garage - aerial and GRB registration');current=site;
 site.userData={source:'Owner photographs, Google aerial, GRB WFS EPSG:31370',registration:SURVEY_SITE.origin,estimate:true,gardenDepth:14.0,rearBuildingGap:3.64,fenceGap:.9};
 const garden=[[-.335,-9.42],[7.477,-9.42],[8.678,-22.832],[7.141,-22.922],[3.831,-23.115],[-.79,-23.385]];
 polygon('Garden ground',garden,'#758065',-.16,.12);
 polygon('Main rear patio paving',[[0,-9.42],[4.96,-9.42],[4.4,-11.45],[.05,-11.45]],'#a5a79a',-.045,.06);
 for(let x=.15;x<4.4;x+=.3)box('Patio tile grout',x,-10.42,.008,2.03,.005,'#737a72',.018,current,0);for(let z=-11.4;z<-9.4;z+=.3)box('Patio tile grout',2.25,z,4.3,.008,.005,'#737a72',.018,current,0);
 polygon('Main garden lawn',OWNER_EXTERIOR.lawnPolygon,'#5e804b',-.042,.06);
 const paved=polygon('Path beside outbuilding',OWNER_EXTERIOR.pathPolygon,'#727f78',-.025,.065);paved.userData={width:.865,continuous:true,ownerConfirmed:true,footprintPolygon:OWNER_EXTERIOR.pathPolygon};
 for(let z=-11.95;z>-17.6;z-=.62){const x=4.286+(-z-11.75)*.439/5.9;beam('Building-side paving joint',[x-.93,.044,z-.065],[x-.09,.044,z],.012,'#53645b');}
 beam('Paving edge beside lawn',[3.316,.046,-11.52],[3.778,.046,-17.72],.025,'#b2b8aa');
 // The main lawn continues to the fence; paving is only along its edges.
 const rearStones=polygon('Paved stones at rear fence',OWNER_EXTERIOR.fenceEndPaving,'#9ba491',-.025,.065);rearStones.userData={footprintPolygon:OWNER_EXTERIOR.fenceEndPaving,ownerConfirmed:true};
 for(let x=-.55;x<3.75;x+=.31)beam('Fence-end paving joint',[x,.044,-22.66],[x,.044,-23.08],.012,'#6f7b6a');
 for(const [x,z] of [[1.28,-13.5],[1.28,-14.42]])box('Lawn service cover',x,z,.52,.52,.04,'#6d7669',.022);
 // Boundary splays outward towards the rear; the rear fence stops at the gap.
 fenceRun('Street-side garden fence',[-.335,-9.42],[-.79,-23.385]);
 fenceRun('Rear fence before pedestrian gap',[-.79,-23.385],[2.93,-23.168]);
 const plinth=box('Rear fence brick plinth',1.07,-23.275,3.72,.13,.4,'#a77258',.2);plinth.material=brickMat(3.72,.4);plinth.rotation.y=-.058;
 box('Left planting soil',-.15,-16.6,.5,10.3,.13,'#4f4c3d',.01);
 for(let i=0;i<17;i++){const z=-10.1-i*.72;for(let j=0;j<3;j++){const m=mesh(new THREE.IcosahedronGeometry(.24,1),['#617344','#456141','#6f844d'][j],-.15+(j-1)*.11,.45+j*.25,z,'Boundary shrubs');m.scale.y=1.45;}}
 gardenBrickBuilding('Separate garden brick outbuilding',[[4.286,-11.75],[7.685,-11.75],[8.185,-17.326],[5.183,-17.567],[4.725,-17.65]],'Outbuilding garden facade',[{start:.35,width:.82,type:'glassdoor',head:2.05,frameColor:C.darkwood,divisions:1},{start:3.05,width:1.75,type:'window',sill:.8,head:1.95,frameColor:C.darkwood,divisions:3}],2.25,2.72,'Outbuilding corrugated roof','Outbuilding floor slab');
 // Use the larger building's outer wall line through the smaller building and fence.
 const boundarySlope=(8.185-7.685)/(-17.326+11.75);
 const boundaryX=z=>8.185+(z+17.326)*boundarySlope;
 const smallerBuildingEnd=[boundaryX(-19.554),-19.554];
 const garageBoundaryEnd=[boundaryX(-23.28),-23.28];
 gardenBrickBuilding('Smaller garden brick building',[[5.183,-17.567],[8.185,-17.326],smallerBuildingEnd,[5.425,-19.71]],'Smaller building garden facade',[{start:.15,width:.72,type:'door',head:1.98,frameColor:C.darkwood},{start:1.3,width:.53,type:'window',sill:.85,head:1.87,frameColor:C.darkwood,divisions:1}],2.22,2.4,'Smaller building separate low roof','Smaller building floor slab');
 buildRearServiceCorner(smallerBuildingEnd,garageBoundaryEnd);
 // Keep the confirmed kitchen doorway and annex alignment.
 const pier=box('Patio brick pier',3.05,-11.32,.28,.28,1.12,'#a6795d',.56);pier.material=brickMat(.28,1.12);box('Patio pier stone cap',3.05,-11.32,.34,.34,.055,'#a6ab9f',1.145);
 const low=box('Patio low brick side wall',3.05,-10.5,.14,1.62,.9,'#a6795d',.45);low.material=brickMat(1.62,.9);
 const shade=group('Green patio awning');exteriorRoofParts.push(shade);const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute([3.05,2.6,-9.43,4.98,2.6,-9.43,4.98,2.28,-11.35,3.05,2.28,-11.35],3));sg.setIndex([0,1,2,0,2,3]);sg.computeVertexNormals();mesh(sg,'#316455',0,0,0,'Green canopy fabric',shade,{side:THREE.DoubleSide});beam('Awning support',[3.05,1.17,-11.32],[3.05,2.28,-11.32],.055,C.darkwood,shade);
 const screen=box('Patio side mesh screen',3.05,-10.53,.018,1.57,1.23,'#70675e',1.65,shade,0);screen.material=mat('#70675e',{transparent:true,opacity:.38,roughness:1});screen.castShadow=false;
 for(const [x,z] of [[3.3,-10.2],[3.3,-10.85]]){box('Patio waste bin',x,z,.4,.43,.69,'#59635c',.35);box('Waste bin lid',x,z,.43,.45,.045,C.metal,.72);}
 box('Kitchen doormat',4.55,-9.75,.56,.35,.015,'#9d8050',.034);box('Patio service hatch',4.05,-10.42,.38,.38,.015,'#665e4d',.03);
 buildRearGardenDetails();label('Larger brick building',6.2,-14.6);label('Smaller brick building',6.65,-18.5);label('Lawn',2.2,-14.3);
 outdoorDim('Rear gap ~3.6 m',[6.0,-19.71],[6,-23.35],.2);outdoorDim('Garden ~14 m deep',[-.95,-9.42],[-.95,-23.385],.2);
 current=old;
}


function blueAlcoveStorage(){
 const c=group('Narrow glass cabinet in rear alcove');c.position.set(6.95,0,-8.99);c.rotation.y=-Math.PI/2;
 box('Alcove cabinet base',0,0,.4,.3,.48,C.white,.24,c);box('Alcove cabinet back',0,-.14,.4,.025,1.8,C.white,.9,c);for(const x of [-.19,.19])box('Alcove cabinet side',x,0,.025,.3,1.8,C.white,.9,c);for(const y of [.49,.88,1.26,1.79])box('Alcove glass shelf',0,0,.4,.3,.025,C.white,y,c);
 const pane=box('Alcove glazed door',0,.16,.34,.018,1.2,'#adbfbb',1.12,c);pane.material=mat('#adbfbb',{transparent:true,opacity:.17,roughness:.1});pane.castShadow=false;for(const x of [-.185,.185])box('Alcove door stile',x,.17,.025,.03,1.25,C.white,1.12,c);for(const y of [.49,1.75])box('Alcove door rail',0,.17,.4,.03,.03,C.white,y,c);for(let i=0;i<4;i++)box('Alcove books',-.12+i*.075,0,.045,.15,.24,['#a87861','#718b87','#bcbba0'][i%3],1.015,c);
 const q=group('Blue room cube shelf');q.position.set(6.5,0,-8.46);q.rotation.y=-Math.PI/2;
 for(const y of [.025,.385,.755])box('Blue cube horizontal',0,0,.77,.39,.03,C.white,y,q);for(const x of [-.37,0,.37])box('Blue cube divider',x,0,.03,.39,.77,C.white,.385,q);box('Blue cube back',0,-.18,.77,.025,.77,C.white,.385,q);box('Upper cube fabric bin',.19,.01,.33,.32,.3,'#aeb3ad',.57,q);box('Lower cube fabric bin',-.19,.01,.33,.32,.3,'#aeb3ad',.19,q);box('Speaker on cube unit',0,-.06,.43,.12,.2,C.white,.88,q);
}
function annexFixtures(){
 const basin=group('WC hand basin');basin.position.set(5.67,0,-11.12);box('Basin support',0,0,.5,.32,.12,C.white,.79,basin);box('Basin bowl',0,0,.39,.22,.018,'#b8c9c4',.86,basin);cyl('Basin tap',0,-.1,.018,.14,C.metal,.93,basin);
 const w=group('WC storage washing machine');w.position.set(6.92,0,-9.9);w.rotation.y=-Math.PI/2;
 box('Washing machine body',0,0,.62,.62,.86,'#d0d5cf',.43,w);box('Washer front',0,.32,.6,.025,.8,C.white,.43,w);const drum=cyl('Washer circular door',0,.34,.205,.025,C.dark,.39,w);drum.rotation.x=Math.PI/2;const glass=cyl('Washer door glass',0,.36,.16,.028,'#70898a',.39,w);glass.rotation.x=Math.PI/2;box('Washer controls',0,.34,.55,.025,.11,'#a2aca6',.75,w);cyl('Washer dial',.18,.37,.035,.025,C.metal,.75,w).rotation.x=Math.PI/2;
}

function ground(){level('ground','Ground floor');slab([[5.6,-3.28],[7.15,-3.28],[7.15,-5.85],[5.6,-5.85]]);extWalls();roomfloor('Living room',[[1.44,-.23],[4.58,-.23],[4.58,-5.04],[.23,-5.04],[.23,-1.8]],'#a5a49a');roomfloor('Dining room',[[.23,-5.04],[4.03,-5.04],[4.03,-9.28],[.23,-9.28]],'#a5a49a');
 roomfloor('Hall',[[4.73,-.23],[7.19,-.23],[7.19,-5.88],[4.73,-5.88]],C.tile);roomfloor('Kitchen',[[4.2,-6.1],[7.19,-6.1],[7.19,-9.28],[4.2,-9.28]],C.tile);
 wall('Rear dining wall',[.1,-9.3],[4.1,-9.3],.24,C.cream,[{start:.95,width:1.9,type:'open'}]);wall('Rear kitchen wall',[4.1,-9.3],[7.32,-9.3],.24,C.cream,[{start:.1,width:.8,type:'glassdoor'}]);wall('Living room to hall',[4.65,-5.04],[4.65,-.1],.17,C.blue,[{start:.62,width:.88,type:'door'}]);wall('Closed hall dining partition',[4.1,-5.04],[4.65,-5.04],.17,C.blue);wall('Dining kitchen partition',[4.1,-9.3],[4.1,-5.04],.16,C.blue,[{start:.32,width:.84,type:'door'}]);wall('Kitchen hall partition',[4.1,-5.94],[7.32,-5.94],.17,'#a7aaa3',[{start:.7,width:.9,type:'door'}]);
 // Broad curved arch, faithfully preserving the two connected rooms.
 wall('Arch left pier',[.1,-5.04],[.86,-5.04],.22,C.cream);wall('Arch right pier',[3.84,-5.04],[4.12,-5.04],.22,C.cream);
 const arc=group('Dark wood arch');let shape=new THREE.Shape();shape.moveTo(.86,2.68);shape.lineTo(3.84,2.68);shape.lineTo(3.84,1.68);shape.absellipse(2.35,1.68,1.49,.82,0,Math.PI,false,0);shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:.19,bevelEnabled:false});mesh(geo,C.darkwood,0,0,-5.13,'Curved arch',arc);
 // Front dining use within the room named Living room on the supplied plan.
 rug('Front multicolour rug',2.45,-2.36,2.45,2.05,'#424d4b');box('Dining table',2.45,-2.36,1.8,.95,.07,'#b67570',.77);for(let a of [-.74,.74])for(let b of [-.36,.36])box('Table leg',2.45+a,-2.36+b,.055,.055,.74,C.wood,.37);for(let dx of [-.52,.52]){chair('Dining chair',2.45+dx,-3.13,Math.PI);chair('Dining chair',2.45+dx,-1.59,0)}livingStorage();chair('Wood armchair',.8,-4.36,Math.PI,'#a89977');radiator('Front radiator',.34,-2.42,1.1,Math.PI/2);
 // Rear lounge used as dining-room label in source.
 rug('Diamond lounge rug',2.13,-7.05,2.7,2.85,C.rug,true);sofa('Grey corner sofa',3.5,-6.97,2.55,.85,'#a5aaa5',-Math.PI/2,true);cabinet('TV console',.56,-5.83,1.55,.42,.43,C.white,Math.PI/2);let tv=box('Living television',.61,-5.83,.05,1.28,.74,C.dark,1.05);box('Chimney breast',.34,-7.22,.55,.86,2.68,C.cream,1.34);box('Pellet stove',.78,-7.22,.46,.52,.91,'#793b39',.46);box('Stove glass',1.02,-7.22,.015,.33,.46,C.dark,.47);const gd=desk('Garden desk',.56,-8.61,1.18,.5,'#65716f',Math.PI/2);gd.remove(gd.getObjectByName('Monitor'),gd.getObjectByName('Monitor stand'));box('Papers on garden desk',.56,-8.61,.21,.3,.008,C.white,.775);chair('Garden office chair',1.15,-8.61,Math.PI/2,C.white,true);
 // Kitchen: pantry across from appliance run, no island.
 for(let i=0;i<4;i++)cabinet('Green pantry module',4.47,-7.96+i*.5,.49,.55,2.12,C.green,Math.PI/2);
 for(let i=0;i<3;i++)cabinet('Kitchen base drawer unit',6.9,-8.75+i*.37,.36,.59,.86,C.grey,-Math.PI/2);
 box('Right black countertop',6.9,-8.39,.65,1.2,.045,C.dark,.9);box('Induction hob',6.88,-8.28,.52,.62,.015,'#101b1c',.932);for(let i=0;i<3;i++)cabinet('Kitchen wall cabinet',6.96,-8.75+i*.37,.36,.38,.84,'#bbbdb6',-Math.PI/2).position.y=1.57;
 cabinet('Oven microwave tall housing',6.91,-7.225,1.15,.6,2.45,C.grey,-Math.PI/2);for(let z of [-7.505,-6.93]){box('Built in appliance face',6.585,z,.035,.51,.48,'#171e20',1.22);box('Appliance handle',6.558,z,.03,.38,.025,C.metal,1.4)}kitchenFridge();

 cabinet('Sink base',6.41,-8.97,1.1,.6,.86,C.grey);box('Rear black countertop',6.4,-8.97,1.16,.65,.045,C.dark,.91);box('Stainless sink rim',6.32,-8.97,.54,.4,.018,C.metal,.942);box('Sink bowl',6.32,-8.97,.43,.31,.02,'#54625e',.953);cyl('Kitchen tap',6.32,-9.16,.025,.26,C.metal,1.06);box('Dishwasher',5.81,-8.97,.53,.6,.86,C.grey,.43);
 for(let x=4.23;x<7.14;x+=.48)box('Kitchen tile joint',x,-7.7,.008,3.12,.003,'#727b78',.033, current,0);for(let z=-9.2;z<-6.1;z+=.48)box('Kitchen tile joint',5.7,z,2.9,.008,.003,'#727b78',.033,current,0);
 groundStair();hallDetails();cabinet('Entrance shoe cupboard',4.91,-1.05,.85,.3,1.03,C.white,Math.PI/2);radiator('Hall radiator',7.15,-1.42,.85,-Math.PI/2);
 // WC / storage extension, one undivided room.
 box('Annex slab',6.23,-10.41,2.32,1.98,.2,'#535b58',-.1);wall('Annex rear',[5.1,-11.35],[7.32,-11.35],.22);wall('Annex right',[7.32,-11.35],[7.32,-9.42],.22);wall('Annex left',[5.1,-11.35],[5.1,-9.42],.2,C.wall,[{start:.2,width:.7,type:'door'},{start:1.04,width:.7,type:'door'}]);toilet(6.94,-10.86,-Math.PI/2);annexFixtures();rearGardenDoors();garden();label('Living room · dining table',2.3,-3.75);label('Dining room · lounge',2.08,-6.16);label('Kitchen',5.7,-7.6);label('Entrance hall',5.85,-1.7);label('WC / storage',6.25,-10.1);
}
function toilet(x,z,rot=0){const g=group('Wall hung toilet');g.position.set(x,0,z);g.rotation.y=rot;box('Cistern box',0,-.22,.65,.22,1.13,'#68716f',.565,g);const bowl=mesh(new THREE.SphereGeometry(.26,20,12),C.white,0,.43,.06,'Toilet bowl',g);bowl.scale.set(1,.56,1.35);box('Toilet seat',0,.05,.48,.61,.04,C.white,.53,g,.08)}
function first(){level('first','First floor');slab([[5.4,-3.28],[7.15,-3.28],[7.15,-5.86],[5.4,-5.86]]);extWalls(true);roomfloor('Bedroom',[[.23,-5.12],[4.12,-5.12],[4.12,-9.28],[.23,-9.28]],'#a9a89c');roomfloor('Blue room',[[4.29,-6.04],[7.17,-6.04],[7.17,-9.28],[4.29,-9.28]],'#a9a89c');roomfloor('Red room',[[1.44,-.23],[4.58,-.23],[4.58,-5.03],[.23,-5.03],[.23,-1.8]],'#b4afa0');
 wall('Bedroom rear',[.1,-9.3],[4.2,-9.3],.22,C.cream,[{start:.55,width:2.3,type:'window'}]);wall('Blue terrace rear',[4.2,-9.3],[7.32,-9.3],.22,C.navy,[{start:.85,width:1.4,type:'glassdoor'}]);wall('Bedroom blue wall',[4.2,-9.3],[4.2,-5.95],.16,C.navy);wall('Bedroom front',[.1,-5.1],[4.6,-5.1],.16,C.cream,[{start:3.55,width:.85,type:'door'}]);wall('Blue room front',[4.2,-5.97],[7.32,-5.97],.16,C.navy,[{start:.52,width:.85,type:'door'}]);wall('Red room hall',[4.65,-5.1],[4.65,-.1],.16,C.red,[{start:.52,width:.9,type:'door'}]);wall('Bathroom rear',[4.65,-3.18],[7.32,-3.18],.16,C.white,[{start:.5,width:.84,type:'door'}]);
 bed('Main double bed',2.91,-7.56,1.7,2.1,-Math.PI/2,C.darkwood,'#5a7378');cabinet('Bedroom wardrobe rear alcove',.55,-8.19,1,.58,2.3,'#3f352e',Math.PI/2);cabinet('Bedroom wardrobe front alcove',.55,-6.16,1,.58,2.3,'#3f352e',Math.PI/2);box('Bedroom chimney breast',.37,-7.17,.55,.8,2.68,C.cream,1.34);cabinet('Red bedroom chest',.91,-7.17,.78,.41,1.05,'#c74736',Math.PI/2);for(let z of [-8.79,-6.3])cabinet('Bedside chest',3.72,z,.45,.4,.55,C.darkwood);
 bed('Red room double bed',3.27,-1.05,1.56,2.09,-Math.PI/2,'#ad8c5c','#656a66');cabinet('Mirrored red room wardrobe',4.2,-3.29,1,.58,2.25,'#b49c77',-Math.PI/2);cabinet('Red room rear wardrobe',1.12,-4.71,1.5,.58,2.15,'#b49c77');desk('Red room bay desk',1.3,-1.44,1.4,.65,C.wood,-Math.PI/4);chair('Red room office chair',2,-1.96,Math.PI*3/4,C.dark,true);rug('Desk dark mat',1.7,-1.9,1.3,1.1,'#535652');
 desk('Blue room desk',4.73,-8.03,1.4,.75,C.white,Math.PI/2);chair('Blue room office chair',5.54,-8.03,Math.PI/2,C.dark,true);sofa('Blue sofa bed',6.77,-7.14,1.85,.9,'#c2c1ac',-Math.PI/2);blueAlcoveStorage();box('Blue chimney breast',6.95,-8.41,.5,.66,2.68,C.navy,1.34);rug('Blue desk mat',5.5,-8.07,1.15,1.7,'#273031');
 // Terrace above rear annex.
 box('Terrace slab',6.03,-10.02,2.65,1.35,.18,'#85877c',-.05);for(let x=4.8;x<7.3;x+=.28)box('Terrace railing',x,-10.66,.035,.035,.85,C.metal,.43);beam('Terrace handrail',[4.76,.88,-10.66],[7.32,.88,-10.66],.045,C.metal);wall('Terrace side',[7.32,-10.7],[7.32,-9.3],.16,C.wall);
 stairToAttic();bathroom();label('Bedroom',2.2,-6.01);label('Red room',2.3,-3.32);label('Blue room',5.81,-6.62);label('Bathroom',5.9,-2.62);
}
function bathroom(){roomfloor('Bathroom',[[4.74,-.23],[7.17,-.23],[7.17,-3.07],[4.74,-3.07]],'#a3a7a0');box('Bath apron',6.04,-.62,2.26,.75,.55,'#7f8d89',.28);box('Bath inner',6.04,-.62,2.05,.57,.06,C.white,.56);}
// Override basin details independently to preserve a recessed-looking bath.
function bathDetails(){let x=6.04,z=-.62;box('Bath rim left',x-1.08,z,.1,.75,.08,C.white,.61);box('Bath rim right',x+1.08,z,.1,.75,.08,C.white,.61);box('Bath back rim',x,z-.33,2.2,.09,.08,C.white,.61);box('Bath front rim',x,z+.33,2.2,.09,.08,C.white,.61);box('Bath cavity',x,z,1.99,.49,.02,'#c7d3ce',.55);for(let a=-1.1;a<1.1;a+=.14)for(let y=.12;y<.56;y+=.11)box('Mosaic tile',x+a,z+.382,.12,.012,.08,['#62726d','#b8c0b7','#929e96'][Math.abs(Math.round(a*12+y*9))%3],y);
 toilet(6.91,-1.63,-Math.PI/2);cabinet('Floating bathroom vanity',4.99,-1.51,.6,.45,.55,'#3e413c',Math.PI/2).position.y=.2;box('Vanity basin',4.99,-1.51,.5,.6,.08,C.white,.84);box('Vanity mirror',4.8,-1.51,.03,.58,.7,'#a1b6b8',1.47);box('Shower tray',6.73,-2.6,.86,.86,.07,'#414d4a',.045);const glass=box('Shower glass',6.28,-2.58,.028,.88,1.95,'#a6bdbe',1.02);glass.material=mat('#a6bdbe',{transparent:true,opacity:.28,roughness:.12,metalness:.1});cyl('Shower riser',7.13,-2.73,.025,1.52,C.metal,1.13);box('Shower head',7,-2.73,.24,.24,.025,C.metal,1.92);rug('Turquoise bathmat',5.65,-1.55,.6,.8,'#4b9894');for(let y=.84;y<1.9;y+=.14)beam('Towel radiator',[7.18,y,-.95],[7.18,y,-1.4],.028,C.white);}
function attic(){level('attic','Attic / loft');slab([[4.65,-3.08],[7.2,-3.08],[7.2,-5.88],[4.65,-5.88]]);roomfloor('Attic grey timber',outline,'#a8aaa1',[[[4.65,-3.08],[7.2,-3.08],[7.2,-5.88],[4.65,-5.88]]]);wall('Rear attic knee wall',[.14,-9.3],[7.28,-9.3],.22,C.white);wall('Right attic knee wall',[7.28,-9.3],[7.28,-.14],.2,C.white);wall('Front attic knee wall',[1.45,-.14],[7.28,-.14],.2,C.white);wall('Angled attic knee wall',[.14,-1.82],[1.45,-.14],.2,C.white);wall('Left attic knee wall',[.14,-1.82],[.14,-9.3],.2,C.white);
 // Open loft with enclosed stairwell; sliding door is at the desk end.
 wall('Attic stair left',[4.66,-5.88],[4.66,-3.08],.16,C.white);wall('Attic stair front',[4.66,-3.08],[7.28,-3.08],.16,C.white);wall('Attic stair rear',[4.66,-5.88],[7.28,-5.88],.16,C.white,[{start:1.55,width:.85,type:'door'}]);const preview=levels.first.getObjectByName('First floor stair to attic - top at desk end').clone(true);preview.name='Descending attic stair preview';preview.position.y=-3.1;preview.userData={previewOnly:true};current.add(preview);atticPreviews.push(preview);let sliding=box('White sliding door',5.65,-6,.92,.055,2.1,C.white,1.05);upper.push(sliding);beam('Sliding track',[5.15,2.23,-6.04],[7.1,2.23,-6.04],.06,C.wood);
 bed('Attic white bed',2.28,-7.65,1.55,2.08,0,C.white,'#404e62');cabinet('Attic bedside drawers',3.29,-8.42,.46,.4,.55,C.white);cabinet('Low TV bench',1.06,-6.24,1.3,.4,.35,C.dark,Math.PI/2);box('Attic television',1.15,-6.24,.04,1.16,.69,C.dark,.83);shelf('Low white bookcase',1.1,-4.83,.85,1.05,C.white,Math.PI/2);cabinet('Attic cube shelf',3.22,-1.4,.78,.39,.78,C.white);cabinet('Attic front low cupboard',5,-1.34,1.4,.42,1.05,C.white);cabinet('Attic chest',6.42,-1.34,.78,.44,1.1,C.white);desk('Attic desk',6.38,-7.39,1.4,.7,C.white,-Math.PI/2);chair('Attic desk chair',5.48,-7.39,-Math.PI/2,'#687079',true);radiator('Attic panel heater',1.1,-7.11,.75,Math.PI/2);
 const base=polygon('White truss boxed plinth',[[3.15,-4.6],[3.35,-4.87],[4.22,-4.87],[4.38,-4.6],[4.22,-4.34],[3.35,-4.34]],C.white,.03,.45);beam('White truss vertical',[3.42,.48,-4.6],[3.42,2.92,-4.6],.14,C.white);beam('White truss diagonal',[4.12,.48,-4.6],[5.25,2.92,-4.6],.16,C.white);
 for(let xx of [1.52,5.95]){beam('Dark exposed purlin',[xx,1.35,-.7],[xx,1.35,-8.8],.18,C.darkwood);for(let zz of [-2.3,-6.9])beam('Dark exposed rafter',[xx,1.35,zz],[3.74,3.05,zz],.13,C.darkwood)}
 const rg=group('Cutaway sloping roof sections');roofParts.push(rg);for(let left of [true,false]){let a=left?.18:7.25,b=left?1.3:6.1;const pts=left?[[.18,1.02,-9.2],[1.3,1.8,-9.2],[1.3,1.8,-.52],[.18,1.02,-1.92]]:[[6.1,1.8,-9.2],[7.25,1.02,-9.2],[7.25,1.02,-.3],[6.1,1.8,-.3]];const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(pts.flat(),3));gg.setIndex([0,1,2,0,2,3]);gg.computeVertexNormals();const panel=mesh(gg,'#e2e2d8',0,0,0,'Short white roof slope',rg,{side:THREE.DoubleSide});if(left)for(let zz of [-7.6,-2.45]){let win=box('Wood roof window frame',(a+b)/2,zz,.9,.8,.07,C.wood,1.54,rg);win.rotation.z=left?.59:-.59;let pane=box('Roof window glass',(a+b)/2,zz,.72,.63,.04,'#7fadb7',1.61,rg);pane.rotation.z=left?.59:-.59}}
 label('Open attic / bedroom',2.6,-5.7);label('Desk',6.16,-8.49);
}
function basement(){level('basement','Basement - excavated strip only');polygon('Basement excavated slab',[[4.1,-.1],[7.44,-.1],[7.44,-9.42],[4.1,-9.42]],'#737972',-.2,.2);wall('Cellar left',[4.14,-9.33],[4.14,-.14],.28,'#83887f');wall('Cellar right',[7.32,-9.33],[7.32,-.14],.28,'#83887f');wall('Cellar rear',[4.14,-9.33],[7.32,-9.33],.28,'#83887f');wall('Cellar front',[4.14,-.14],[7.32,-.14],.28,'#83887f');wall('Cellar open doorway',[4.14,-6.15],[7.32,-6.15],.2,'#83887f',[{start:.65,width:.86,type:'open'}]);
 for(let i=0;i<13;i++)box('Cellar stair tread '+i,6.82,-2.26-i*.23,.78,.235,.12+i*.17,C.tile,(.12+i*.17)/2);label('Storage under kitchen',5.7,-7.76);label('Technical / storage',5.55,-4.9);shelf('Cellar storage shelf',4.5,-8.18,1.55,1.65,'#777c71',Math.PI/2);cyl('Indicative technical tank',4.8,-5.35,.23,1.25,'#afbbb5',.63);}
// Build all geometry. Every level remains an independent named group in GLB.
ground();first();bathDetails();attic();basement();
const info={ground:['Ground floor','Kitchen, two connected reception rooms, entrance hall and rear WC / storage.'],first:['First floor','Main bedroom, red room, blue room, bathroom and rear terrace.'],attic:['Attic','Open loft, white truss, exposed dark beams and enclosed stair. Roof form is estimated.'],basement:['Basement','Only the right-hand strip is excavated. Remaining footprint has no cellar.'],garden:['Garden structures','Green lawn runs to the rear fence-end paving, with a paved path beside the brick buildings. Garage and drive remain behind the fence, reached through its gap.'],all:['All four levels','Exploded view: basement below ground floor, first floor and attic.']};
function view(id,reset=true){const wasGarden=currentView==='garden';currentView=id;setExteriorRoofs(id==='garden');document.querySelector('#exterior-roofs').checked=id==='garden';if(id==='garden'||wasGarden){wallMode(id==='garden');document.querySelector('#fullwalls').checked=id==='garden';}atticPreviews.forEach(g=>g.visible=id==='attic');for(const [k,g] of Object.entries(levels)){g.visible=id==='all'||id===k||(id==='garden'&&k==='ground');g.position.y=id==='all'?{basement:-4.3,ground:0,first:4.3,attic:8.6}[k]:0}document.querySelectorAll('[data-floor]').forEach(b=>b.classList.toggle('active',b.dataset.floor===id));document.querySelector('#floor-title').textContent=info[id][0];document.querySelector('#floor-info').textContent=info[id][1];if(reset)resetCamera();}
let currentView='ground';
function resetCamera(){const all=currentView==='all',gardenView=currentView==='garden',groundView=currentView==='ground';const target=new THREE.Vector3(gardenView?3.8:3.7,all?2.5:.6,gardenView?-19:groundView?-12:all?-11:-4.9);controls.target.copy(target);camera.position.copy(target).add(gardenView?new THREE.Vector3(-10,16,13):new THREE.Vector3(-12,all?16:14,17));let aspect=innerWidth/innerHeight,span=Math.max(all?38:gardenView?24:groundView?31:14.5,(all?20:gardenView?17:groundView?20:12.5)/aspect);if(innerWidth<800){span*=1.12;camera.position.add(new THREE.Vector3(0,-1,0));}camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.zoom=1;camera.updateProjectionMatrix();controls.update();}

function wallMode(full){upper.forEach(g=>g.visible=full);}
wallMode(false);roofParts.forEach(g=>g.visible=false);setOutdoorDimensions(false);setExteriorRoofs(false);view('ground');
document.querySelectorAll('[data-floor]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.floor)));
document.querySelector('#fullwalls').onchange=e=>wallMode(e.target.checked);
document.querySelector('#roof').onchange=e=>roofParts.forEach(g=>g.visible=e.target.checked);
document.querySelector('#labels').onchange=e=>nameSprites.forEach(g=>{if(!g.userData.dimension)g.visible=e.target.checked});
document.querySelector('#dimensions').onchange=e=>setOutdoorDimensions(e.target.checked);
document.querySelector('#exterior-roofs').onchange=e=>setExteriorRoofs(e.target.checked);
document.querySelector('#gardendoors').onchange=e=>setGardenDoors(e.target.checked);
document.querySelector('#reset').onclick=resetCamera;
function download(data,name,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000)}
async function exportGLB(){const states=Object.entries(levels).map(([k,g])=>[k,g.visible,g.position.y]);const spriteVis=nameSprites.map(s=>s.visible),upperVis=upper.map(s=>s.visible),previewVis=atticPreviews.map(s=>s.visible),dimVis=dimensionParts.map(s=>s.visible),extRoofVis=exteriorRoofParts.map(s=>s.visible);exteriorRoofParts.forEach(s=>s.visible=true);dimensionParts.forEach(s=>s.visible=false);atticPreviews.forEach(s=>s.visible=false);nameSprites.forEach(s=>s.visible=false);upper.forEach(s=>s.visible=true);Object.entries(levels).forEach(([k,g])=>{g.visible=true;g.position.y={basement:-3.1,ground:0,first:3.1,attic:6.2}[k]});root.updateMatrixWorld(true);try{const data=await new GLTFExporter().parseAsync(root,{binary:true,onlyVisible:true});return data}finally{states.forEach(([k,v,y])=>{levels[k].visible=v;levels[k].position.y=y});nameSprites.forEach((s,i)=>s.visible=spriteVis[i]);upper.forEach((s,i)=>s.visible=upperVis[i]);atticPreviews.forEach((s,i)=>s.visible=previewVis[i]);dimensionParts.forEach((s,i)=>s.visible=dimVis[i]);exteriorRoofParts.forEach((s,i)=>s.visible=extRoofVis[i])}}
document.querySelector('#glb').onclick=async()=>{document.querySelector('#status').textContent='Exporting…';download(await exportGLB(),'house-model.glb','model/gltf-binary');document.querySelector('#status').textContent='3D model saved'};
document.querySelector('#png').onclick=()=>{renderer.render(scene,camera);const a=document.createElement('a');a.href=renderer.domElement.toDataURL('image/png');a.download='house-'+currentView+'.png';a.click()};
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);resetCamera()});
document.querySelector('#status').textContent='Four levels · metres · approximate';
window.houseModel={scene,root,levels,view,renderer,camera,controls,exportGLB,wallMode,setGardenDoors,setOutdoorDimensions,setExteriorRoofs,stats:()=>({meshes:(()=>{let n=0;root.traverse(o=>{if(o.isMesh)n++});return n})(),levels:Object.keys(levels)})};
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera)});
