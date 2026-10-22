(()=>{
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const rails=[];let scheduled=false;let lastScroll=window.scrollY;let idleTimer;
  function node(name,attributes={}){const element=document.createElementNS(NS,name);for(const [key,value]of Object.entries(attributes))element.setAttribute(key,String(value));return element;}
  function machine(){
    const g=node('g',{'class':'needle-assembly'});
    g.innerHTML=`<ellipse class="needle-contact" cx="0" cy="0" rx="3.5" ry="1.5" fill="#071E18" opacity=".55"/>
      <path class="needle-thread" fill="none" stroke="#D8BA83" stroke-width="1.05" stroke-linecap="round"/>
      <g class="active-needle">
        <path d="M0 0C-.7-8-1.4-23-1.8-39L-2.5-52Q-2.7-59 0-60Q2.7-59 2.5-52L1.8-39C1.4-23 .7-8 0 0Z" fill="#B9C7BF" stroke="#EDEFE3" stroke-width=".65"/>
        <path d="M-.5-3L-.7-43M-.8-48L-1-54" fill="none" stroke="#FFFFFF" stroke-width=".65" opacity=".9"/>
        <ellipse cx="0" cy="-53" rx="1.1" ry="3.7" fill="#173D35" stroke="#879C8F" stroke-width=".5"/>
        <path d="M.3-50Q3-52 1-55" fill="none" stroke="#D8BA83" stroke-width=".8"/>
      </g>`;
    return g;
  }
  function create(side){const aside=document.createElement('aside');aside.className=`stitch-rail stitch-rail-${side}`;aside.setAttribute('aria-hidden','true');aside.dataset.progress='0';
    const svg=node('svg',{'preserveAspectRatio':'none','focusable':'false'});
    const defs=node('defs');const gradient=node('linearGradient',{id:`stitch-gold-${side}`,x1:'0',x2:'1',y1:'0',y2:'0'});gradient.append(node('stop',{offset:'0%','stop-color':'#9F793E'}),node('stop',{offset:'50%','stop-color':'#E4C992'}),node('stop',{offset:'100%','stop-color':'#B08B50'}));defs.append(gradient);svg.append(defs);
    const edges=node('path',{'class':'rail-selvedge'}),guide=node('path',{'class':'stitch-ghost'}),ink=node('path',{'class':'stitch-ink',stroke:`url(#stitch-gold-${side})`}),carriage=node('g',{'class':'sewing-carriage'});carriage.append(machine());
    svg.append(edges,guide,ink,carriage);aside.append(svg);document.body.append(aside);const record={side,aside,svg,edges,guide,ink,carriage,length:0,scale:.65};rails.push(record);return record;
  }
  function resize(){for(const rail of rails){const width=rail.aside.clientWidth;if(!width)continue;const height=rail.aside.clientHeight;rail.width=width;rail.height=height;rail.scale=Math.min(width*.84/64,.9);rail.svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
      const center=width/2,amplitude=Math.max(2.7,width*.13),start=Math.max(42,width*1.13),end=Math.max(start+30,height-18);const cell=Math.max(34,width*.94);let d=`M${center} ${start}`;let y=start;
      while(y+cell<=end){const mirror=rail.side==='left'?-1:1;const a=amplitude*mirror;d+=` L${center-a} ${y+cell*.24} L${center} ${y+cell*.48} L${center+a} ${y+cell*.24} L${center} ${y} L${center} ${y+cell*.48} L${center-a*.42} ${y+cell*.63} L${center} ${y+cell*.78} L${center+a*.42} ${y+cell*.63} L${center} ${y+cell*.48} L${center} ${y+cell}`;y+=cell;}
      d+=` L${center} ${end}`;
      rail.guide.setAttribute('d',d);rail.ink.setAttribute('d',d);rail.edges.setAttribute('d',`M4 0V${height}M${width-4} 0V${height}`);rail.length=rail.ink.getTotalLength();rail.ink.style.strokeDasharray=String(rail.length);rail.ink.dataset.length=String(rail.length);
    }update();}
  function poseNeedle(rail,p){
    // Distance-driven stitch cycle: reversing scroll retraces the exact pose.
    const distance=rail.length*p,phase=distance/27*Math.PI*2;
    const dip=(1-Math.cos(phase))*.5;
    const before=rail.ink.getPointAtLength(Math.max(0,distance-4));
    const after=rail.ink.getPointAtLength(Math.min(rail.length,distance+4));
    const tangent=Math.atan2(after.x-before.x,Math.max(.1,after.y-before.y));
    const handed=rail.side==='left'?-1:1;
    const angle=handed*tangent*7+Math.sin(phase)*23;
    const depth=1-dip*.42,roll=.82+Math.cos(phase)*.18;
    const needle=rail.carriage.querySelector('.active-needle');
    needle.setAttribute('transform',`rotate(${angle}) scale(${roll} ${depth})`);
    needle.dataset.angle=angle.toFixed(3);needle.dataset.depth=depth.toFixed(3);
    const radians=angle*Math.PI/180;
    const eyeX=53*depth*Math.sin(radians),eyeY=-53*depth*Math.cos(radians);
    const slack=5+(1-dip)*12;
    rail.carriage.querySelector('.needle-thread').setAttribute('d',`M0 0 C${-slack} -10 ${eyeX-slack} ${eyeY+21} ${eyeX} ${eyeY} C${eyeX+slack*.5} ${eyeY-9} 12 -62 7 -67`);
    rail.carriage.querySelector('.needle-contact').setAttribute('rx',String(2+dip*2));
  }
  function update(){scheduled=false;const y=window.scrollY;const total=Math.max(1,document.documentElement.scrollHeight-innerHeight);const p=Math.min(1,Math.max(0,y/total));const moving=Math.abs(y-lastScroll)>.3;const direction=y>=lastScroll?1:-1;
    for(const rail of rails){if(!rail.length||!rail.aside.clientWidth)continue;const drawn=reduced.matches?1:p;rail.ink.style.strokeDashoffset=String(rail.length*(1-drawn));rail.aside.dataset.progress=p.toFixed(6);rail.aside.dataset.direction=String(direction);const point=rail.ink.getPointAtLength(rail.length*p);const scale=rail.side==='left'?-rail.scale:rail.scale;rail.carriage.setAttribute('transform',`translate(${point.x} ${point.y}) scale(${scale} ${rail.scale})`);rail.carriage.dataset.x=point.x.toFixed(3);rail.carriage.dataset.y=point.y.toFixed(3);rail.aside.classList.toggle('is-sewing',moving&&!reduced.matches);rail.aside.classList.toggle('reduced-motion',reduced.matches);poseNeedle(rail,p);}
    lastScroll=y;clearTimeout(idleTimer);idleTimer=setTimeout(()=>rails.forEach(rail=>rail.aside.classList.remove('is-sewing')),130);
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update);}}
  create('right');create('left');window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',resize,{passive:true});reduced.addEventListener('change',resize);new ResizeObserver(schedule).observe(document.body);document.fonts.ready.then(resize);resize();
})();
