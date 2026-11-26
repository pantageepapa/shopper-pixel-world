export const width = 880;

function box(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function planter(ctx,x,y,seed) {
  const leaves=['#78949b','#869da3','#a4aebe','#647e89'];
  const blooms=['#e7bcbf','#f6d7c0','#d5e6f1','#eee6bb'];
  box(ctx,x-25,y+4,58,12,'#85819745');
  box(ctx,x-23,y-9,49,19,'#a7979a');
  box(ctx,x-23,y-11,49,10,'#f5e9e0');
  box(ctx,x-21,y-9,45,5,'#b7a39b');
  box(ctx,x-21,y+3,45,4,'#e8cec4');
  box(ctx,x-18,y+7,41,2,'#c8abae');
  for(let i=0;i<17;i++) {
    const px=(i*9+seed*7)%43-22;
    const py=(i*11+seed)%12-17;
    box(ctx,x+px,y+py,3+i%4,5+i%6,leaves[(i+seed)%leaves.length]);
    if(i%2===0) {
      box(ctx,x+px,y+py-2,4,3,blooms[(i+seed)%blooms.length]);
      box(ctx,x+px+1,y+py-2,1,1,'#fff8e8');
    }
  }
}

function bench(ctx,x,y) {
  box(ctx,x-2,y+12,47,8,'#81778b41');
  box(ctx,x+2,y+3,4,11,'#746d80');box(ctx,x+38,y+3,4,11,'#746d80');
  box(ctx,x,y,44,7,'#b3877b');box(ctx,x,y+1,44,2,'#eac0aa');
  box(ctx,x+1,y+5,42,1,'#ac7e70');
  box(ctx,x+4,y-6,36,4,'#b88b7b');box(ctx,x+3,y-5,38,1,'#e9b9a9');
  box(ctx,x+4,y-2,3,5,'#746d80');box(ctx,x+38,y-2,3,5,'#746d80');
}

function tree(ctx,x,y,seed) {
  const palette=['#8398a2','#9aaeb3','#afbec1','#c6c9c3','#d3d0c6','#d5b9bd'];
  const crown=[
    [-21,-29,42,28],[-30,-22,55,22],[-17,-38,34,23],
    [-24,-30,32,22],[1,-32,24,20],[-13,-39,20,15],[-24,-18,14,9],[11,-21,18,13],
  ];
  box(ctx,x-20,y+3,53,9,'#87829a30');
  box(ctx,x-20,y-3,40,9,'#d9d0cf');
  box(ctx,x-16,y-2,30,6,'#c6b6b1');
  box(ctx,x-3,y-28,6,32,'#9b7e7d');
  box(ctx,x-1,y-25,2,28,'#c0998b');
  crown.forEach(([dx,dy,w,h],i)=>box(ctx,x+dx,y+dy,w,h,palette[(i+seed)%palette.length]));
  for(let i=0;i<23;i++) {
    const px=(i*13+seed*5)%44-22, py=(i*9+seed)%21-35;
    box(ctx,x+px,y+py,1+i%4,1+i%2,i%3?'#eddecb':'#f4cbd0');
  }
}

const clothes = [
  ['#61877d','#96b6a0'], ['#b67462','#e9a68a'], ['#82935f','#bac486'],
  ['#777ca3','#b0abc9'], ['#be8d56','#e8b879'], ['#ad7388','#e0a0ad'],
  ['#619083','#9fc2ac'], ['#aa8165','#dbad87'], ['#b65f64','#e99091'],
  ['#617fa0','#91adca'], ['#758d62','#a9b581'], ['#b88b76','#e4b6a3'],
];
const complexions = [
  ['#d99d76','#ecb58e','#c97c6f'], ['#f2c29b','#ffdbb6','#df9b8e'],
  ['#99614a','#be805f','#ad675f'], ['#e9ae89','#f9cdaa','#d6877d'],
  ['#b67d58','#d9a177','#b97065'], ['#e2a684','#f3c4a2','#d68f80'],
];
const hairstyles = [
  ['#483631','#755447'], ['#62413a','#a27458'], ['#34303a','#62515a'],
  ['#875846','#b78460'], ['#503748','#885e73'], ['#aca090','#dbbf9e'],
  ['#a16a42','#cb985d'], ['#4a4137','#77664d'],
];

export function drawPerson(ctx, x, y, i, selected=false, size=1, shadow=true) {
  const c = (dx,dy,w,h,color) => {
    const left = Math.round(x + dx*size), right = Math.round(x + (dx+w)*size);
    const top = Math.round(y + dy*size), bottom = Math.round(y + (dy+h)*size);
    box(ctx,left,top,right-left,bottom-top,color);
  };
  const visitor = !shadow;
  const [outfit, accent] = visitor ? ['#527e91','#a6c5b9'] : clothes[i%clothes.length];
  const [skin, light, blush] = complexions[(i*5)%complexions.length];
  const [hair, sheen] = visitor ? ['#644030','#946349'] : hairstyles[(i*3)%hairstyles.length];
  const ink = '#513a39';
  const style = i%6;
  const glance = i%3-1;

  if(shadow) {
    c(-9,13,19,5,'#84666b35');
    c(-12,14,25,3,'#84666b35');
  }
  if(selected && shadow) {
    c(-13,12,27,5,'#9d9658');
    c(-10,11,21,7,'#9d9658');
    c(-11,13,23,3,'#fff2ac');
  }

  // Tiny shoes and a short torso leave most of the silhouette to the head.
  c(-7,12,6,5,ink); c(2,12,6,5,ink);
  c(-7,14,5,1,'#a87862'); c(3,14,5,1,'#a87862');
  c(-9,3,19,9,ink); c(-7,11,15,3,ink);
  c(-8,5,17,5,outfit); c(-6,10,13,3,outfit);
  c(-8,9,3,2,skin); c(7,9,2,2,skin);
  c(-5,6,11,2,accent);
  if(visitor) {
    c(-5,6,3,7,'#eabb5e'); c(3,6,3,7,'#eabb5e');
    c(-3,10,8,2,'#c8944c'); c(0,11,2,1,'#fff1b0');
  } else if(i%4===0) {
    c(-4,9,9,1,accent); c(-4,11,9,1,accent);
  } else if(i%4===1) {
    c(0,8,1,5,accent); c(2,9,2,2,'#f3d09b');
  } else if(i%4===2) {
    c(-4,7,2,5,'#eac891'); c(-3,11,7,2,'#eac891');
  } else {
    c(-3,7,7,3,accent); c(3,10,2,2,accent);
  }

  // Stepped corners keep the head round at the canvas's native resolution.
  c(-5,-17,11,1,ink); c(-8,-16,17,2,ink);
  c(-10,-14,21,3,ink); c(-11,-11,23,11,ink);
  c(-9,0,19,3,ink); c(-6,3,13,2,ink);
  c(-5,-16,11,2,hair); c(-8,-14,17,3,hair);
  c(-9,-11,19,8,hair); c(-10,-10,2,5,hair); c(9,-10,2,5,hair);
  c(-6,-10,13,2,skin); c(-8,-8,17,8,skin);
  c(-7,0,15,2,skin); c(-5,2,11,1,skin);
  c(-6,-9,13,2,light); c(-7,-7,15,6,light); c(-5,-1,11,2,light);
  c(-10,-5,3,3,skin); c(8,-5,3,3,skin);

  if(style===0) {
    c(-8,-12,8,4,hair); c(-7,-9,3,2,hair);
    c(1,-12,8,3,hair); c(6,-9,3,2,hair);
    c(-5,-14,7,1,sheen);
  } else if(style===1) {
    c(-10,-10,4,4,hair); c(6,-11,4,5,hair);
    c(-5,-11,9,3,hair); c(1,-9,4,2,hair);
    c(-7,-13,8,1,sheen);
  } else if(style===2) {
    c(-9,-13,18,4,hair); c(-7,-9,4,2,hair);
    c(-2,-9,4,1,hair); c(4,-9,5,3,hair);
    c(-7,-13,3,1,sheen); c(-3,-14,4,1,sheen); c(3,-13,3,1,sheen);
  } else if(style===3) {
    c(-10,-10,3,11,hair); c(8,-10,3,11,hair);
    c(-7,-12,11,4,hair); c(-5,-9,4,2,hair);
    c(-5,-14,8,1,sheen); c(7,-7,3,2,'#edb875');
  } else if(style===4) {
    c(-10,-16,3,4,ink); c(8,-16,3,4,ink);
    c(-10,-15,3,3,hair); c(8,-15,3,3,hair);
    c(-7,-11,7,3,hair); c(1,-11,7,3,hair);
    c(-6,-13,4,1,sheen); c(2,-13,4,1,sheen);
  } else {
    c(-8,-12,5,5,hair); c(-3,-12,10,3,hair);
    c(6,-11,3,4,hair); c(-4,-14,8,1,sheen);
    c(-7,-11,2,2,'#f2b4a5');
  }

  c(-5+glance,-5,2,2,ink); c(4+glance,-5,2,2,ink);
  c(-7+glance,-2,3,1,blush); c(5+glance,-2,3,1,blush);
  c(0+glance,-1,2,1,'#a76662');
  if(!visitor && i%8===3) {
    c(-7+glance,-6,5,1,ink); c(3+glance,-6,5,1,ink);
    c(-2+glance,-5,5,1,ink);
  }

  if(visitor) {
    c(-7,-18,14,2,ink); c(-9,-16,19,6,ink); c(-12,-12,25,3,ink);
    c(-6,-17,12,2,'#ffdf8e'); c(-8,-15,17,4,'#e6b659');
    c(-7,-13,15,2,'#b97e42'); c(-11,-11,23,1,'#ffd67f');
    c(-5,-16,8,1,'#fff0b5'); c(6,-14,2,2,'#fff0b5');
  }
}

export function streetLayout(products, responses) {
  const worldWidth = Math.max(width, 72 + 135*products.length);
  const span = Math.min(200, (worldWidth-72) / products.length);
  const start = (worldWidth - span * products.length) / 2;
  const shops = products.map((product,index)=>({product,x:start+span*(index+.5),width:span}));
  const groups = new Map([...products.map(product=>product.id),'none','undecided'].map(id=>[id,[]]));
  responses.forEach((response,index)=>groups.get(response.outcome).push(index));
  const people = new Array(responses.length);
  const columns = Math.floor(span / 34);
  const rows = Math.max(4,...products.map(product=>Math.ceil(groups.get(product.id).length/columns)));
  const neutralTop = 233 + rows*40 + 15;
  const neutral = ['none','undecided'].map((id,index)=>({id,x:worldWidth*(index ? .68 : .32),y:neutralTop}));
  const neutralRows = Math.max(0,...neutral.map(({id})=>Math.ceil(groups.get(id).length/8)));

  function place(group, center, top, columnCount) {
    group.forEach((index,offset)=>{
      const row=Math.floor(offset/columnCount);
      const rowCount=Math.min(columnCount,group.length-row*columnCount);
      const col=offset%columnCount;
      people[index]={x:center+(col-(rowCount-1)/2)*34,y:top+row*40};
    });
  }

  for (const shop of shops) place(groups.get(shop.product.id),shop.x,233,columns);
  for (const {id,x,y} of neutral) place(groups.get(id),x,y+34,8);
  const floor=neutralTop+74+Math.max(0,neutralRows-1)*40;
  return {shops,people,neutral,groups,floor,width:worldWidth,height:floor+60};
}

export function drawStreet(ctx, {shops,people,floor,width,height}, selected, choice) {
  box(ctx,0,0,width,height,'#f9efe5');
  for(let row=0;row<Math.ceil(height/27);row++) {
    for(let col=-1;col<Math.ceil(width/39);col++) {
      const x=col*39+(row%2?19:0), y=row*27;
      const palette=['#f6e9dc','#f4e2dc','#f8ebdf','#f4e5e1','#f8eee3','#efe2e5','#f4e8e3'];
      box(ctx,x+1,y+1,38,26,palette[((col+1)*11+row*17)%palette.length]);
      if((col+row)%3===0) box(ctx,x+5,y+5,12+(col*row)%10,1,'#fff6e8');
    }
  }
  box(ctx,0,26,width,2,'#dfc9c8');
  box(ctx,0,29,width,4,'#fcf3e6');
  box(ctx,0,36,width,3,'#d4dce1');
  for(let x=0;x<width;x+=16) {
    box(ctx,x,30,9,2,'#e9cad0');
    box(ctx,x+5,34,7,2,'#b8c8d5');
  }
  box(ctx,0,172,width,25,'#dce4e9');
  box(ctx,0,172,width,3,'#b9c7d4');
  box(ctx,0,195,width,2,'#b9c7d4');
  for(let x=0;x<width;x+=23) {
    box(ctx,x+1,175,22,19,'#e7edf0');
    box(ctx,x+9,182,5,5,'#c3d1db');
    box(ctx,x+11,180,2,9,'#c3d1db');
    box(ctx,x+7,184,9,2,'#c3d1db');
  }
  for(const {x,width:span,product} of shops) {
    const stand=Math.min(span*.8,147);
    box(ctx,x-stand/2+3,175,stand,17,'#77748e30');
    box(ctx,x-stand/2,174,stand,14,'#ad9eaa');
    box(ctx,x-stand/2,174,stand,5,'#f5e9e8');
    box(ctx,x-stand/2+4,180,stand-8,4,product.id===choice?'#c0d8e6':'#d8c5cd');
  }
  box(ctx,0,floor,width,5,'#c0ceda');
  box(ctx,0,floor+5,width,45,'#dbe6ed');
  box(ctx,0,floor+49,width,3,'#c0ceda');
  for(let x=0;x<width;x+=26) {
    box(ctx,x+1,floor+7,24,40,'#e8edf0');
    box(ctx,x+4,floor+37,17,2,'#d5dfe7');
  }
  tree(ctx,29,161,0);tree(ctx,width-32,161,1);
  tree(ctx,29,floor-11,1);tree(ctx,width-31,floor-13,2);
  bench(ctx,27,334);bench(ctx,width-70,334);
  planter(ctx,31,211,2);planter(ctx,width-30,211,1);
  planter(ctx,width*.22,floor-6,2);planter(ctx,width*.49,floor-6,0);planter(ctx,width*.78,floor-6,3);
  for(let i=0;i<36;i++) {
    const x=(i*43)%(width-42)+21,y=204+(i*23)%228;
    if(i%3===0){box(ctx,x,y,2,1,'#d0a4a1');box(ctx,x+2,y+1,2,1,'#e3beb7');}
  }
  people.forEach(({x,y},i)=>drawPerson(ctx,x,y,i,i===selected));
}
