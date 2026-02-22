'use strict';

const deckEl = document.getElementById('deck');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const progressEl = document.getElementById('progress');
const speakerEl = document.getElementById('speaker');

let slides = [];
let index = 0;
let startX = 0;
let isTouching = false;

function fetchContent(){
  return fetch('content.json').then(r=>r.json());
}

function renderSlide(s){
  const wrap = document.createElement('div');
  wrap.className = 'slide';

  const h = document.createElement('h1');
  h.className = 'heading';
  h.textContent = s.title || '';
  wrap.appendChild(h);

  if(s.subtitle){
    const sub = document.createElement('div');
    sub.className = 'sub';
    sub.textContent = s.subtitle;
    wrap.appendChild(sub);
  }

  if(Array.isArray(s.bullets) && s.bullets.length){
    const ul = document.createElement('ul');
    s.bullets.forEach(b=>{
      const li = document.createElement('li');
      li.textContent = b;
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
  }

  if(s.example){
    const ex = document.createElement('div');
    ex.className = 'example';
    ex.textContent = s.example;
    wrap.appendChild(ex);
  }

  return wrap;
}

function show(i){
  if(i<0) i=0; if(i>=slides.length) i=slides.length-1;
  index = i;
  deckEl.innerHTML = '';
  const node = renderSlide(slides[i]);
  deckEl.appendChild(node);
  progressEl.textContent = `${i+1} / ${slides.length}`;
  speakerEl.textContent = slides[i].speaker || '';
  window.location.hash = `#slide-${i+1}`;
}

function next(){ if(index < slides.length-1) show(index+1); }
function prev(){ if(index > 0) show(index-1); }

prevBtn.addEventListener('click', ()=>{ prev(); });
nextBtn.addEventListener('click', ()=>{ next(); });

document.addEventListener('keydown', (e)=>{
  if(e.key === 'ArrowRight' || e.key === 'PageDown') next();
  if(e.key === 'ArrowLeft' || e.key === 'PageUp') prev();
  if(e.key === 'Home') show(0);
  if(e.key === 'End') show(slides.length-1);
});

// Touch / swipe support
deckEl.addEventListener('touchstart', (e)=>{
  if(e.touches.length===1){ isTouching=true; startX = e.touches[0].clientX; }
});

deckEl.addEventListener('touchmove', (e)=>{
  if(!isTouching) return; const dx = e.touches[0].clientX - startX; if(Math.abs(dx) > 120){ if(dx<0) next(); else prev(); isTouching=false; }
});

deckEl.addEventListener('touchend', ()=>{ isTouching=false; });

// Click anywhere on slide to advance (except on links/buttons)
deckEl.addEventListener('click', (e)=>{
  if(e.target.tagName.toLowerCase() === 'a' || e.target.closest('button')) return;
  next();
});

// Initialize
fetchContent().then(data=>{
  // Data expected to have slides array
  if(data && Array.isArray(data.slides)){
    slides = data.slides.slice(0, 15); // enforce hard cap
    // If more than 15 provided, condense by merging extras into final slide
    if(data.slides.length > 15){
      const extras = data.slides.slice(14).map(s=>s.title ? `${s.title} — ${ (s.bullets||[]).slice(0,3).join(' / ') }` : (s.bullets||[]).slice(0,3).join(' / '));
      slides[14].bullets = (slides[14].bullets || []).concat(['(CONDENSED)'] , extras);
    }
  } else {
    slides = [];
  }
  if(slides.length===0){ deckEl.textContent = 'No slides found in content.json'; return; }

  // restore from hash if present
  const m = window.location.hash.match(/slide-(\d+)/);
  const startIndex = m ? Math.max(0, Math.min(slides.length-1, parseInt(m[1],10)-1)) : 0;
  show(startIndex);
}).catch(err=>{
  deckEl.textContent = 'Failed to load content.json';
  console.error(err);
});
