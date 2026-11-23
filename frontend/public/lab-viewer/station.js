// Project convex equipment surfaces from model coordinates into the canvas.
// Distances and assembly paths are illustrative and carry no engineering units.
const params = new URLSearchParams(location.search);
const facilities = await fetch('./facilities.json').then(response => response.json());
const requested = params.get('scene');
const scene = Object.hasOwn(facilities, requested) ? requested : 'cir';
const {name, source, parts: components} = facilities[scene];
const el = id => document.getElementById(id);
el('title').textContent = name;
el('source').href = source;
const canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d');
const select = el('part');
components.forEach(([name],i)=>select.add(new Option(name,String(i))));
const initialPart = params.get('part') ?? '0';
if (components[Number(initialPart)]) select.value = String(Number(initialPart));
let yaw=-0.47, pitch=0.18, progress=0, playing=false, last=0, drag=null;
const faces=[];
function face(part,points,color){ faces.push({part,points,color}); }
function box(part,x,y,z,w,h,d,color){
  const corners=Array.from({length:8},(_,i)=>[x+((i&1)?w:-w)/2,y+((i&2)?h:-h)/2,z+((i&4)?d:-d)/2]);
  for(const ids of [[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]])face(part,ids.map(i=>corners[i]),color);
}
function ring(part,x,y,z,r,inner,depth,color){
  function point(i,radius,offset){let a=i*Math.PI/16;return [x+radius*Math.cos(a),y+radius*Math.sin(a),z+offset];}
  for(let i=0;i<32;i++){
    for(const [ra,za,rb,zb] of [[r,0,r,depth],[r,depth,inner,depth],[inner,depth,inner,0],[inner,0,r,0]])
      face(part,[point(i,ra,za),point(i+1,ra,za),point(i+1,rb,zb),point(i,rb,zb)],color);
  }
}
function geometry(){
  faces.length=0;
  for(const x of [-1.4,1.4])for(const z of [-.62,.62])box(0,x,0,z,.12,3.5,.12,'#73939e');
  for(const y of [-1.68,1.68])box(0,0,y,0,2.9,.14,1.38,'#456976');
  const lift=progress*.55;
  if(scene === 'fir'){
    box(1,0,-.35,0,2.48,.14,1.24,'#819da8');
    for(const x of [-.7,.7])box(1,x,-.25,0,.1,.1,1.16,'#bed1d8');
    box(2,0,.4,-.36+lift,.49,1.3,.32,'#75aeb6');
    box(2,0,.97,-.04+lift,1.06,.35,.77,'#5593a1');
    ring(2,0,.61,.33+lift,.21,.11,.16,'#a9d7d9');
    box(3,0,.11,.25+lift*1.35,.93,.12,.69,'#d5a16b');
    box(4,0,-1.02,-.04,2.25,.97,1.18,'#446777');
  }else if(scene === 'msg'){
    box(4,0,.77,.59+lift*.55,2.41,.52,.065,'#8db5bc');
    box(1,0,.36,-.52,2.55,1.55,.1,'#396878');
    box(1,0,-.39,0,2.55,.12,1.35,'#538897');
    for(const x of [-1.22,1.22])box(1,x,.35,0,.12,1.55,1.36,'#51828a');
    box(1,0,1.13,0,2.55,.12,1.35,'#64959b');
    for(const x of [-.57,.57])ring(2,x,.18,.65+lift,.34,.235,.18,'#78c9bd');
    box(3,0,-1.04,.1+lift,1.36,.79,1.03,'#a8845d');
    ring(3,0,-1.04,.62+lift,.32,.25,.09,'#dfbd82');
  }else{
    ring(1,0,.18,-.64,.95,.79,1.16,'#75aeb6');
    ring(2,0,.18,.55+lift*1.55,.99,.73,.14,'#d5a16b');
    box(3,0,-.22,.26+lift*.7,.68,.09,.62,'#68c8b9');
    ring(3,0,.02,.29+lift*.7,.14,.07,.18,'#f1bf77');
  }
}
function draw(){
  geometry();
  const w=canvas.clientWidth,h=canvas.clientHeight,scale=Math.min(w/4.9,h/4.15);
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  function project([x,y,z]){const side=x*cy+z*sy,depth=z*cy-x*sy;return [w/2+side*scale,h/2-(y*cp-depth*sp)*scale,depth*cp+y*sp];}
  ctx.clearRect(0,0,w,h);
  const projected=faces.map(f=>{const pts=f.points.map(project);return {...f,pts,depth:pts.reduce((n,p)=>n+p[2],0)/pts.length};});
  projected.sort((a,b)=>a.depth-b.depth);
  for(const f of projected){
    ctx.beginPath();f.pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
    ctx.fillStyle=f.part===Number(select.value)?'#8de7d3':f.color;ctx.fill();
    ctx.strokeStyle='rgba(9,36,45,.38)';ctx.lineWidth=.65;ctx.stroke();
  }
}
function resize(){const ratio=Math.min(devicePixelRatio||1,2);canvas.width=canvas.clientWidth*ratio;canvas.height=canvas.clientHeight*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);draw();}
function update(){el('detail').textContent=components[Number(select.value)][1];draw();}
function stop(){playing=false;el('play').textContent='Play assembly';}
function tick(now){if(!playing)return;progress=Math.min(1,progress+(now-last)/3000);last=now;draw();if(progress<1)requestAnimationFrame(tick);else stop();}
el('play').onclick=()=>{if(playing){stop();return;}if(progress>=1)progress=0;playing=true;last=performance.now();el('play').textContent='Pause';requestAnimationFrame(tick);};
el('reset').onclick=()=>{stop();yaw=-.47;pitch=.18;progress=0;draw();};
function orbit(dx,dy){yaw+=dx;pitch=Math.max(-1.12,Math.min(1.12,pitch+dy));draw();}
el('orbit').onclick=()=>orbit(.3,0);
canvas.onpointerdown=e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{if(drag){orbit((e.clientX-drag[0])*.012,(e.clientY-drag[1])*.012);drag=[e.clientX,e.clientY];}};
canvas.onlostpointercapture=()=>drag=null;
canvas.onkeydown=e=>{const step={ArrowLeft:[-.15,0],ArrowRight:[.15,0],ArrowUp:[0,.12],ArrowDown:[0,-.12]}[e.key];if(step){e.preventDefault();orbit(...step);}};
select.onchange=update;new ResizeObserver(resize).observe(canvas);update();
