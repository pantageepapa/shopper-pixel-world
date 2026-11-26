import { drawPerson, drawStreet, streetLayout } from './art.js';
import { languages } from './ui-strings.js';
import { createSocialReplay } from './social.js';

const route = new URLSearchParams(location.search);
const requestedWave = route.get('wave');
const runs = {
  '01': { root:'../private-choice-wave-01/', photos:'assets/products/' },
  '02': { root:'../private-choice-wave-02/', photos:'../shopper-preview/assets/' },
  '03': { root:'../private-choice-wave-03/' },
  '04': { root:'../private-choice-tabi-socks-01/' },
  '05': { root:'../private-choice-tabi-search-02/' },
  '06': { root:'../private-choice-octa-hoodie-01/' },
  '07': { root:'../private-choice-trace-tee-01/' },
  '08': { root:'../private-choice-black-hoodie-01/' },
  '09': { root:'../private-choice-travel-hoodie-01/' },
  '10': { root:'../private-choice-trendy-hoodie-01/' },
  '11': { root:'../private-choice-trendy-social-01/', media:'../', social:'hoodie', monitor:'sim_934d7d3cd4ce' },
  '12': { root:'../private-choice-kite-travel-social-01/', media:'../', social:'kite', monitor:'sim_b720afc508ce' },
};
const newestFirst = ['12','11','10','09','08','07','06','05','04','03','02','01'];

const direction = {
  ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1],
};
const byId = (id) => document.getElementById(id);
const clamp = (value,min,max) => Math.min(Math.max(value,min),max);
const languageKey = 'shopper-viewer.language';
const languageButtons = Array.from(document.querySelectorAll('[data-language]'));
let language = 'de';
try {
  const saved = localStorage.getItem(languageKey);
  if (Object.hasOwn(languages,saved)) language = saved;
} catch {
  // The viewer still works when browser storage is unavailable.
}

const simulationPicker = byId('simulation-picker');
simulationPicker.addEventListener('change',()=>{
  const url = new URL(location.href);
  url.searchParams.set('wave',simulationPicker.value);
  location.assign(url);
});

function renderSimulationPicker(wave) {
  const ui = languages[language];
  simulationPicker.replaceChildren(...newestFirst.map(id=>new Option(ui.simulations[id],id)));
  if (wave) simulationPicker.value=wave;
  simulationPicker.title=simulationPicker.selectedOptions[0].textContent;
}

function updateChrome() {
  const ui = languages[language];
  document.documentElement.lang = language;
  document.title = ui.title;
  const labels = {
    'visitor-label':ui.you, 'language-label':ui.language, 'question-reason':ui.reason,
    'simulation-label':ui.simulation,
    'question-profile':ui.profile, 'close-label':ui.close, 'move-label':ui.move,
    'talk-label':ui.talk, 'touch-label':ui.touch, 'method-label':ui.method, error:ui.error,
  };
  Object.entries(labels).forEach(([id,label])=>byId(id).textContent=label);
  byId('method-label').title=ui.methodTitle;
  byId('method-label').hreflang='en';
  const accessible = {
    game:ui.game, stage:ui.stage, player:ui.player, questions:ui.questions, close:ui.closeTalk,
  };
  Object.entries(accessible).forEach(([id,label])=>byId(id).setAttribute('aria-label',label));
  const dpad=document.querySelector('.dpad');
  dpad.setAttribute('aria-label',ui.dpad);
  Array.from(dpad.querySelectorAll('button')).forEach((button,index)=>button.setAttribute('aria-label',ui.directions[index]));
  languageButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===language)));
}

updateChrome();
renderSimulationPicker(Object.hasOwn(runs,requestedWave) ? requestedWave : null);

async function fetchData(wave,file) {
  const result = await fetch(runs[wave].root+file,{cache:'no-cache'});
  if (!result.ok) throw new Error(`${file}: ${result.status}`);
  return result;
}

function create(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function build(wave,{products,shoppers},responses,photoSources,translations,socialData) {
  if (!products.length || !responses.length) throw new Error('Keine Produkt- oder Antwortdaten verfügbar');
  const profileMap = new Map(shoppers.map(person=>[person.shopper_id,person.profile]));
  const layout = streetLayout(products,responses);
  const { width, height, groups } = layout;
  const picker=byId('shopper-picker');
  byId('method-label').href=runs[wave].root+'results.md';
  picker.hidden=false;
  byId('game').dataset.wave=wave;
  const socialNote = byId('social-note');
  const socialReplay = Boolean(socialData);
  socialNote.hidden = !socialReplay;
  const transcript = '../hoodie-discussion/?case='+runs[wave].social;
  if (socialReplay) {
    byId('game').setAttribute('data-social','');
    byId('social-transcript').href = transcript;
    byId('social-monitor').href = 'http://127.0.0.1:3000/simulation/'+runs[wave].monitor+'/start?monitor=1&maxRounds=3';
  }
  const stage = byId('stage');
  const camera = byId('camera');
  const map = byId('map');
  const canvas = byId('scene');
  canvas.width=width;
  canvas.height=height;
  const scene = canvas.getContext('2d');
  const player = byId('player');
  const playerArt=player.querySelector('canvas').getContext('2d');
  const dialogue = byId('dialogue');
  const productDialog = byId('product-dialog');
  productDialog.querySelector('form button').textContent=languages[language].close;
  const bubble = byId('bubble');
  const questionMenu = byId('questions');
  const nearby = byId('nearby');
  const answer = byId('answer');
  const discussion = questionMenu.querySelector('[data-question="discussion"]');
  discussion.hidden = !socialReplay;
  const questions = Array.from(questionMenu.querySelectorAll('[data-question]:not([hidden])'));
  const keys = new Set();
  const socks = wave==='04' || wave==='05';
  const compactShelf = !runs[wave].photos && (stage.clientWidth<=650 || stage.clientHeight<=620);
  const visitor = compactShelf ? {x:82,y:205} : {x:width/2+52,y:layout.floor-23};
  let selected=-1, target=-1, lastTime=0, returningFocus=null, lastStep=-1;
  let currentQuestion='reason', socialRound=1;
  const nameOf = id => languages[language].person(id.replace(/^p/,''));
  const personName = index => nameOf(responses[index].shopper_id);
  const conversation = socialReplay ? createSocialReplay(socialData.entries,transcript,
    ()=>({
      ui:languages[language], language, person:nameOf,
      translations:socialData.translations[language] ?? {feed:{},reason:{}},
    }),
    create,
    (shopperId,round)=>{
      const index=responses.findIndex(reply=>reply.shopper_id===shopperId);
      if (index<0) return;
      buttons[index].scrollIntoView({block:'center',inline:'center'});
      socialRound=round;
      talk(index,buttons[index]);
    },
    placeOverlay,
  ) : null;
  const outcomeLabel = id => id==='none' ? languages[language].noChoice : languages[language].undecided;
  picker.append(new Option('',''));
  responses.forEach((reply,index)=>picker.append(new Option('',String(index))));
  const neutralLabels=layout.neutral.map(({id,x,y})=>{
    const label=create('span','outcome-group');
    label.dataset.outcome=id;
    label.style.left=`${x/width*100}%`;
    label.style.top=`${y/height*100}%`;
    byId('outcome-groups').append(label);
    return label;
  });

  const productLabel = product => product.choice_label ?? product.name;
  const mediaPath = relative => (runs[wave].media ?? runs[wave].root)+relative;

  function openProduct(product, thumbnail) {
    keys.clear();
    const ui = languages[language];
    const name = productLabel(product);
    const enlarged = byId('product-dialog-photo');
    const views = byId('product-dialog-views');
    byId('product-dialog-name').textContent = name;
    views.replaceChildren();
    views.hidden = !product.photos?.length || product.photos.length===1;
    views.setAttribute('aria-label',ui.photoViews);

    if (!product.photos?.length) {
      enlarged.src = thumbnail.src;
      enlarged.alt = thumbnail.alt;
    } else {
      const showView = (entry, button) => {
        enlarged.src = mediaPath(entry.photo_file);
        enlarged.alt = language==='de' && entry.alt ? entry.alt : `${name} · ${button.textContent}`;
        for (const option of views.children) option.setAttribute('aria-pressed',String(option===button));
      };
      for (const entry of product.photos) {
        const button = create('button','photo-view',ui.photoView[entry.view] ?? entry.view);
        button.type = 'button';
        button.dataset.view = entry.view;
        button.addEventListener('click',()=>showView(entry,button));
        views.append(button);
      }
      const initial = product.photos.findIndex(entry=>entry.photo_file===product.photo_file);
      const index = Math.max(0,initial);
      showView(product.photos[index],views.children[index]);
    }
    productDialog.showModal();
  }
  const storefronts = layout.shops.map(({x,width:space,product})=>{
    const card = create('article',socks ? 'shop sock-shop' : 'shop');
    card.style.left = `${x/width*100}%`;
    card.style.top = `${42/height*100}%`;
    card.style.height = `${130/height*100}%`;
    const storefrontWidth = socks ? Math.min(space*.86,146)
      : Math.min(space*(products.length>6 ? .76 : .65),122);
    card.style.width = `${storefrontWidth/width*100}%`;
    card.dataset.product = product.id;
    card.title = productLabel(product);
    const photo = create('img','product-photo');
    const asset = photoSources[product.id];
    photo.alt = asset?.alt ?? productLabel(product);
    photo.addEventListener('error',()=>photo.hidden=true,{once:true});
    photo.src = runs[wave].photos
      ? runs[wave].photos+encodeURIComponent(asset?.file ?? (product.id + '.jpg'))
      : mediaPath(product.photo_file);
    const ranked = Object.hasOwn(product,'search_rank');
    if (ranked) card.append(create('span','search-rank'));
    const photoButton = create('button','shop-photo');
    photoButton.type='button';
    photoButton.append(photo);
    photoButton.setAttribute('aria-haspopup','dialog');
    photoButton.addEventListener('click',()=>openProduct(product,photo));
    card.append(photoButton,create('span','shop-name',ranked ? product.name : productLabel(product)));
    if (ranked) card.append(create('span','shop-variant',product.color));
    card.append(create('span','price'));
    if (product.pack_count>1) card.append(create('span','pack-price'));
    card.append(create('span','shop-count'));
    byId('shops').append(card);
    return card;
  });

  const buttons = layout.people.map(({x,y},i)=>{
    const button = create('button','person');
    button.type = 'button';
    button.style.left = `${x/width*100}%`;
    button.style.top = `${y/height*100}%`;
    button.style.width = `${32/width*100}%`;
    button.style.height = `${37/height*100}%`;
    button.dataset.shopper = responses[i].shopper_id;
    button.dataset.outcome = responses[i].outcome;
    button.setAttribute('aria-haspopup','dialog');
    button.addEventListener('click',()=>talk(i,button));
    byId('people').append(button);
    return button;
  });

  function positionCamera() {
    const rect=map.getBoundingClientRect();
    const center=visitor.x/width*rect.width;
    const y=visitor.y/height*rect.height;
    if(rect.width>camera.clientWidth) camera.scrollLeft=clamp(center-camera.clientWidth/2,0,rect.width-camera.clientWidth);
    if(rect.height>camera.clientHeight) camera.scrollTop=clamp(y-camera.clientHeight*.72,0,rect.height-camera.clientHeight);
  }

  function resize() {
    const minimum=wave==='01' ? 820 : Math.ceil(width*1.068);
    const mapWidth=Math.max(minimum,Math.min(stage.clientWidth,stage.clientHeight*width/height));
    map.style.width=`${mapWidth}px`;
    map.style.height=`${mapWidth*height/width}px`;
    if(selected<0) positionCamera();
    placeOverlay();
  }

  function inStage(index) {
    const bounds=stage.getBoundingClientRect();
    const button=buttons[index].getBoundingClientRect();
    return {x:button.left+button.width/2-bounds.left,y:button.top+button.height/2-bounds.top, screenLeft:bounds.left, screenTop:bounds.top, half:button.height/2};
  }

  function placeOverlay() {
    if(selected>=0) {
      const anchor=inStage(selected);
      const menuTop=questionMenu.offsetTop;
      const minimum=Math.max(...['languages','browse-controls','social-note'].map(id=>byId(id).offsetTop+byId(id).offsetHeight))+8;
      const gap=9;
      const displayWidth=bubble.offsetWidth;
      const horizontalPadding=9;
      const left=clamp(anchor.x-displayWidth/2,horizontalPadding,stage.clientWidth-displayWidth-horizontalPadding);
      answer.style.maxHeight='';
      const naturalHeight=bubble.offsetHeight;
      const roomAbove=anchor.y-anchor.half-gap-minimum;
      const roomBelow=menuTop-gap-(anchor.y+anchor.half+gap);
      const below=naturalHeight>roomAbove && roomBelow>roomAbove;
      const space=Math.min(Math.max(roomAbove,roomBelow),menuTop-gap-minimum);
      const chrome=bubble.offsetHeight-answer.offsetHeight;
      if(naturalHeight>space) answer.style.maxHeight=`${Math.max(34,space-chrome)}px`;
      const boxHeight=bubble.offsetHeight;
      const top=clamp(below?anchor.y+anchor.half+gap:anchor.y-anchor.half-boxHeight-gap,minimum,Math.max(minimum,menuTop-gap-boxHeight));
      bubble.style.left=`${left}px`;
      bubble.style.top=`${top}px`;
      bubble.dataset.below=String(below);
      bubble.dataset.noPointer=String(anchor.y<minimum || anchor.y>menuTop || anchor.x<0 || anchor.x>stage.clientWidth);
      bubble.style.setProperty('--pointer-x',`${clamp(anchor.x-left,14,displayWidth-14)}px`);
    } else if(target>=0) {
      const anchor=inStage(target);
      nearby.style.left=`${clamp(anchor.x-nearby.offsetWidth/2,6,stage.clientWidth-nearby.offsetWidth-6)}px`;
      nearby.style.top=`${Math.max(5,anchor.y-anchor.half-nearby.offsetHeight-3)}px`;
    }
  }

  function drawSelection() {
    const outcome=responses[selected]?.outcome;
    storefronts.forEach(el=>el.classList.toggle('active',el.dataset.product===outcome));
    neutralLabels.forEach(el=>el.classList.toggle('active',el.dataset.outcome===outcome));
    buttons.forEach((button,i)=>button.classList.toggle('active',i===selected));
    drawStreet(scene,layout,selected,outcome);
  }

  function showQuestion(kind) {
    if(selected<0) return;
    const reply=responses[selected];
    currentQuestion=kind;
    questions.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.question===kind)));
    const ui=languages[language];
    byId('person-outcome').hidden=socialReplay && kind!=='reason';
    if (kind==='discussion' && conversation) {
      answer.replaceChildren(conversation.render(reply.shopper_id,socialRound,round=>{
        socialRound=round;
        showQuestion('discussion');
        answer.querySelector(`[data-round="${round}"]`).focus({preventScroll:true});
      }));
    } else {
      const translated=kind==='reason' && socialReplay
        ? socialData.translations[language]?.reason[reply.shopper_id]
        : translations[reply.shopper_id]?.[language]?.[kind];
      const original=kind==='reason' ? reply.reason : profileMap.get(reply.shopper_id);
      const tag=kind==='reason'?'blockquote':'p';
      const text=create(tag,'',translated ?? original ?? ui.missing);
      text.lang=translated || !original ? language : 'de';
      if (language!=='de' && !translated && original) {
        answer.replaceChildren(create('span','original-language',ui.translationMissing),text);
      } else {
        answer.replaceChildren(text);
        if (socialReplay && kind==='reason' && translated) {
          const details=create('details','social-original');
          const german=create('blockquote','social-text',original);
          german.lang='de';
          details.append(create('summary','',ui.social.original),german);
          details.addEventListener('toggle',placeOverlay);
          answer.prepend(create('span','original-language',ui.social.automatic));
          answer.append(details);
        }
      }
    }
    answer.scrollTop=0;
    placeOverlay();
  }

  function updatePersonHeading() {
    const id=responses[selected].outcome;
    const product=products.find(product=>product.id===id);
    const ui=languages[language];
    const outcome=product ? productLabel(product) : outcomeLabel(id);
    byId('person-heading').textContent=personName(selected);
    byId('person-outcome').textContent=socialReplay ? `${ui.social.final} · ${outcome}` : product ? ui.chosen(outcome) : outcome;
    byId('question-reason').textContent=socialReplay ? ui.social.final : product ? ui.reason : ui.noChoiceReason;
  }

  function talk(i,trigger) {
    if(i<0) return;
    selected=i;
    returningFocus=trigger;
    keys.clear();
    nearby.hidden=true;
    answer.replaceChildren();
    questions.forEach(button=>button.setAttribute('aria-pressed','false'));
    picker.value=String(i);
    updatePersonHeading();
    dialogue.hidden=false;
    drawSelection();
    const firstQuestion = socialReplay ? 'discussion' : 'reason';
    showQuestion(firstQuestion);
    questions.find(button=>button.dataset.question===firstQuestion).focus({preventScroll:true});
  }

  function closeTalk() {
    if(selected<0) return;
    selected=-1;
    picker.value='';
    dialogue.hidden=true;
    drawSelection();
    updateNearby();
    (returningFocus?.isConnected && !returningFocus.hidden ? returningFocus : null)?.focus({preventScroll:true});
    returningFocus=null;
  }

  function updateNearby() {
    if(selected>=0) return;
    let nearest=-1, threshold=46;
    layout.people.forEach(({x,y},i)=>{
      const d=Math.hypot(visitor.x-x,visitor.y-y);
      if(d<threshold){threshold=d;nearest=i;}
    });
    if(target!==nearest) {
      target=nearest;
      if(target>=0) updateNearbyLabel();
    }
    nearby.hidden=target<0;
    placeOverlay();
  }

  function valid(x,y) {
    if(x<60 || x>width-60 || y<200 || y>layout.floor-12) return false;
    return !layout.people.some(p=>Math.hypot(x-p.x,y-p.y)<17);
  }

  function drawVisitor(step) {
    player.style.left=`${visitor.x/width*100}%`;
    player.style.top=`${visitor.y/height*100}%`;
    if(step!==lastStep) {
      lastStep=step;
      playerArt.clearRect(0,0,42,44);
      drawPerson(playerArt,21,22-step,25,true,1.1,false);
    }
  }

  function frame(time) {
    const elapsed=Math.min(32,time-lastTime);
    lastTime=time;
    let x=0,y=0,moved=false;
    if(selected<0) {
      for(const key of keys) {
        const delta=direction[key];
        if(delta) {x+=delta[0];y+=delta[1];}
      }
      if(x || y) {
        const scale=elapsed*.105/Math.hypot(x,y);
        const nx=visitor.x+x*scale, ny=visitor.y+y*scale;
        if(valid(nx,visitor.y)){moved ||= nx!==visitor.x; visitor.x=nx;}
        if(valid(visitor.x,ny)){moved ||= ny!==visitor.y; visitor.y=ny;}
      }
    }
    if(moved){positionCamera();updateNearby();}
    drawVisitor(moved ? Math.floor(time/140)%2 : 0);
    requestAnimationFrame(frame);
  }

  picker.addEventListener('change',()=>{
    if (picker.value==='') return;
    const index=Number(picker.value);
    buttons[index].scrollIntoView({block:'center',inline:'center'});
    talk(index,picker);
  });
  byId('nearby').addEventListener('click',()=>talk(target,nearby));
  byId('close').addEventListener('click',closeTalk);
  questions.forEach(button=>button.addEventListener('click',()=>showQuestion(button.dataset.question)));
  addEventListener('keydown',e=>{
    if(productDialog.open || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.('select,input,textarea')) return;
    if(selected>=0) {
      if(e.key==='Escape' || e.key.toLowerCase()==='x') {e.preventDefault();closeTalk();}
      const question = {'1':'reason','2':'profile','3':socialReplay?'discussion':null}[e.key];
      if(question) {e.preventDefault();showQuestion(question);}
      return;
    }
    if(direction[e.key]) {
      e.preventDefault();keys.add(e.key);
    } else if(e.key.toLowerCase()==='e' || (e.key==='Enter' && !e.target.closest?.('button,a'))) {
      if(target>=0){e.preventDefault();talk(target,nearby);}
    }
  });
  addEventListener('keyup',e=>keys.delete(e.key));
  addEventListener('blur',()=>keys.clear());
  for(const button of document.querySelectorAll('.dpad button')) {
    button.addEventListener('pointerdown',e=>{
      button.setPointerCapture(e.pointerId);keys.add(button.dataset.key);
    });
    for(const event of ['pointerup','pointercancel','lostpointercapture']) {
      button.addEventListener(event,()=>keys.delete(button.dataset.key));
    }
  }
  function updateNearbyLabel() {
    const ui=languages[language];
    const name=personName(target);
    nearby.textContent=`${name} · E / Enter`;
    nearby.setAttribute('aria-label',ui.speak(name));
  }

  function renderLanguage() {
    updateChrome();
    const ui=languages[language];
    productDialog.querySelector('form button').textContent=ui.close;
    if (socialReplay) {
      byId('question-discussion').textContent=ui.social.discussion;
      byId('social-disclaimer').textContent=ui.social.visuals;
      byId('social-transcript').textContent=ui.social.transcript;
      byId('social-monitor').textContent=ui.social.monitor;
    }
    byId('run').textContent=`${ui.simulations[wave]} · ${ui.count(responses.length)}`;
    byId('picker-label').textContent=ui.chooseShopper;
    picker.options[0].textContent=ui.chooseShopper;
    responses.forEach((reply,index)=>picker.options[index+1].textContent=personName(index));
    renderSimulationPicker(wave);
    neutralLabels.forEach(el=>{
      const id=el.dataset.outcome;
      el.textContent=`${outcomeLabel(id)} · ${groups.get(id).length}`;
    });
    const euros=new Intl.NumberFormat(language, { style:'currency', currency:'EUR', currencyDisplay:'narrowSymbol' });
    storefronts.forEach((card,index)=>{
      const product=products[index];
      const rank = card.querySelector('.search-rank');
      if (rank) rank.textContent=product.search_rank ? ui.searchRank(product.search_rank) : ui.addedOffer;
      card.querySelector('.price').textContent=euros.format(product.price_eur);
      const pack = card.querySelector('.pack-price');
      if (pack) pack.textContent=ui.pack(product.pack_count,euros.format(product.unit_price_eur));
      card.querySelector('.shop-count').textContent=ui.selectionCount(groups.get(product.id).length);
      card.querySelector('.shop-photo').setAttribute('aria-label',ui.viewProduct(productLabel(product)));
      const photo=card.querySelector('img');
      const asset=photoSources[product.id];
      photo.alt=language==='de' ? (asset?.alt ?? productLabel(product)) : productLabel(product);
    });
    buttons.forEach((button,index)=>{
      const name=personName(index);
      button.title=name;
      button.setAttribute('aria-label',ui.speak(name));
    });
    if(target>=0) updateNearbyLabel();
    if(selected>=0) {
      updatePersonHeading();
      showQuestion(currentQuestion);
    }
  }

  languageButtons.forEach(button=>button.addEventListener('click',()=>{
    language=button.dataset.language;
    try {localStorage.setItem(languageKey,language);} catch {}
    renderLanguage();
    resize();
  }));

  new ResizeObserver(resize).observe(stage);
  camera.addEventListener('scroll',placeOverlay,{passive:true});
  drawSelection();
  drawVisitor(0);
  renderLanguage();
  resize();
  updateNearby();
  requestAnimationFrame(frame);
  if (socialReplay && route.has('shopper')) {
    const index = responses.findIndex(reply=>reply.shopper_id===route.get('shopper'));
    if (index>=0) {
      const round = Number(route.get('round'));
      if (round>=1 && round<=3 && Number.isInteger(round)) socialRound=round;
      buttons[index].scrollIntoView({block:'center',inline:'center'});
      talk(index,picker);
    }
  }
}

async function readManifest(wave) {
  return (await fetchData(wave,'manifest.json')).json();
}

async function selectRun() {
  const candidates = Object.hasOwn(runs,requestedWave) ? [requestedWave] : newestFirst;
  for (const wave of candidates) {
    const manifest = await readManifest(wave).catch(error=>{
      if (!error.message.endsWith(': 404')) throw error;
    });
    if (manifest?.state==='completed') return {wave,manifest};
  }
  const error = new Error('No completed wave available');
  error.pendingWave = candidates.length===1 ? candidates[0] : null;
  throw error;
}

async function loadPhotoSources(wave,manifest) {
  if (!runs[wave].photos) return Object.fromEntries(manifest.products.map(product=>[product.id,product]));
  const result = await fetch(runs[wave].photos+'sources.json');
  return result.ok ? (await result.json()).products ?? {} : {};
}

async function loadTranslations(wave) {
  const module = await ({
    '01':()=>import('./translations.js'),
    '02':()=>import('./translations-wave-02.js'),
    '03':()=>import('./translations-wave-03.js'),
    '04':()=>import('./translations-tabi-socks-01.js'),
    '05':()=>import('./translations-tabi-search-02.js'),
    '06':()=>import('./translations-octa-hoodie-01.js'),
    '07':()=>import('./translations-trace-tee-01.js'),
    '08':()=>import('./translations-black-hoodie-01.js'),
    '09':()=>import('./translations-travel-hoodie-01.js'),
    '10':()=>import('./translations-trendy-hoodie-01.js'),
    '11':()=>import('./translations-trendy-hoodie-01.js'),
    '12':()=>import('./translations-wave-03.js'),
  })[wave]().catch(()=>({}));
  return module.shopperTranslations ?? {};
}

try {
  const {wave,manifest} = await selectRun();
  const translations = await loadTranslations(wave);
  if (runs[wave].social) {
    const kite = runs[wave].social==='kite';
    const [data,zh,ko] = await Promise.all([
      fetchData(wave,'social-data.json').then(response=>response.json()),
      (kite ? import('./social-kite-zh-tw.js?v=final') : import('./social-zh-tw.js?v=complete')).catch(()=>({})),
      (kite ? import('./social-kite-ko.js?v=final') : import('./social-ko.js?v=complete')).catch(()=>({})),
    ]);
    const products = data.products;
    const photos = Object.fromEntries(products.map(product=>[product.id,product]));
    const socialTranslations = Object.fromEntries([['zh-TW',zh],['ko',ko]].map(([locale,module])=>[
      locale,{feed:module.socialFeedTranslations ?? {},reason:module.socialReasonTranslations ?? {}},
    ]));
    build(wave,{products,shoppers:data.profiles},data.responses,photos,translations,{entries:data.entries,translations:socialTranslations});
  } else {
    const [photoSources,raw] = await Promise.all([
      loadPhotoSources(wave,manifest),
      fetchData(wave,'responses.jsonl').then(result=>result.text()),
    ]);
    const outcomes=new Set([...manifest.products.map(product=>product.id),'none','undecided']);
    const responses=raw.trim().split('\n').filter(Boolean).map(line=>JSON.parse(line))
      .filter(reply=>reply.status==='accepted' && outcomes.has(reply.outcome))
      .sort((a,b)=>a.sequence-b.sequence);
    build(wave,manifest,responses,photoSources,translations);
  }
} catch(error) {
  byId('error').hidden=false;
  const renderPending = () => {
    byId('error').textContent=languages[language].pending(languages[language].simulations[error.pendingWave]);
    renderSimulationPicker(error.pendingWave);
  };
  if (error.pendingWave) {
    renderPending();
  } else console.error(error);
  languageButtons.forEach(button=>button.addEventListener('click',()=>{
    language=button.dataset.language;
    try {localStorage.setItem(languageKey,language);} catch {}
    updateChrome();
    if(error.pendingWave) renderPending();
    else renderSimulationPicker(Object.hasOwn(runs,requestedWave) ? requestedWave : null);
  }));
}
