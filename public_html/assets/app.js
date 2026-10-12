(() => {
  'use strict';
  const $=(q,root=document)=>root.querySelector(q);
  const $$=(q,root=document)=>[...root.querySelectorAll(q)];
  const toggle=$('.menu-toggle'),nav=$('#navigation');
  toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
  $$('a,button',nav||document.createElement('div')).forEach(el=>el.addEventListener('click',()=>{nav.classList.remove('open');toggle?.setAttribute('aria-expanded','false');}));
  $$('[data-dialog]').forEach(el=>el.addEventListener('click',()=>{const dialog=document.getElementById(el.dataset.dialog);if(dialog&&!dialog.open)dialog.showModal();}));
  $$('dialog').forEach(dialog=>{$('.dialog-close',dialog).addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});});
  let toastTimer;
  function toast(message){const el=$('#toast');if(!el)return;el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3000);}
  function safeUrl(value,image=false){try{const url=new URL(value,location.href);return (['http:','https:'].includes(url.protocol)||(location.protocol==='file:'&&url.protocol==='file:'))&&(!image||url.origin===location.origin||url.protocol==='https:')?url.href:'';}catch{return '';}}
  const data=$('#resource-data');
  if(data){
    let resources=[];try{const parsed=JSON.parse(data.textContent);if(Array.isArray(parsed))resources=parsed;}catch{toast('Resources could not be loaded. Please refresh.');}
    let saved=new Set(),persistent=true,view='grid';
    try{const ids=JSON.parse(localStorage.getItem('learnplus-saved')||'[]');if(Array.isArray(ids))saved=new Set(ids.filter(id=>typeof id==='string'&&resources.some(r=>String(r.id)===id)));if(localStorage.getItem('learnplus-view')==='list')view='list';}catch{persistent=false;}
    let filter='all',search='',limit=6,sort='newest';
    const grid=$('#resource-grid'),count=$('#saved-count'),status=$('#results-status'),more=$('#load-more'),input=$('#resource-search');
    function element(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!=null)el.textContent=text;return el;}
    const categories=[...new Set(resources.map(r=>r.category).filter(Boolean))];
    categories.forEach(category=>{const button=element('button');button.append(element('span','',category),element('span','filter-count',resources.filter(r=>r.category===category).length));button.dataset.filter=category;button.setAttribute('aria-pressed','false');$('#category-filters').append(button);});
    function artwork(r){const art=element('span','card-art');const symbols={Students:'\u2197',Work:'\u2733'};art.textContent=symbols[r.category]||'↗';art.setAttribute('aria-hidden','true');return art;}
    function card(r){
      const article=element('article','resource-card');article.dataset.resourceId=String(r.id);
      const link=element('a','card-image');link.href=safeUrl(r.url)||'#';link.setAttribute('aria-label',r.title);
      if(r.image&&safeUrl(r.image,true)){const img=element('img');img.src=safeUrl(r.image,true);img.alt='';img.loading='lazy';img.width=600;img.height=360;img.addEventListener('error',()=>img.replaceWith(artwork(r)),{once:true});link.append(img);}else link.append(artwork(r));
      const body=element('div','card-body'),meta=element('div','card-meta');meta.append(element('span','category-label',r.category),element('span','',`${r.minutes||1} min read`));if(r.preview)meta.append(element('span','preview-tag','Preview'));
      const h=element('h3'),title=element('a','',r.title);title.href=link.href;h.append(title);
      const footer=element('div','card-footer'),read=element('a','card-read','View service ↗');read.href=link.href;read.setAttribute('aria-label',`View ${r.title}`);footer.append(read);
      const isSaved=saved.has(String(r.id));const button=element('button','save-button',isSaved?'♥':'♡');button.type='button';button.setAttribute('aria-pressed',String(isSaved));button.setAttribute('aria-label',`${isSaved?'Unsave':'Save'} ${r.title}`);
      button.addEventListener('click',()=>{const id=String(r.id);saved.has(id)?saved.delete(id):saved.add(id);try{localStorage.setItem('learnplus-saved',JSON.stringify([...saved]));}catch{persistent=false;}render();const same=$$('.resource-card').find(el=>el.dataset.resourceId===id);if(same)$('.save-button',same).focus({preventScroll:true});else if(!grid.children.length||$('.empty-state',grid))$('.empty-state button',grid)?.focus({preventScroll:true});toast(persistent?(saved.has(id)?'Added to your saved services.':'Removed from your saved services.'):'Reading list available for this visit only.');});
      footer.append(button);body.append(meta,h,element('p','',r.excerpt),footer);article.append(link,body);return article;
    }
    function render(){
      count.textContent=saved.size;$$('[data-filter]').forEach(b=>{const active=b.dataset.filter===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
      const matching=resources.filter(r=>(filter==='all'||(filter==='saved'?saved.has(String(r.id)):r.category===filter))&&`${r.title} ${r.excerpt} ${r.category}`.toLowerCase().includes(search));
      if(sort==='title')matching.sort((a,b)=>a.title.localeCompare(b.title));if(sort==='quick')matching.sort((a,b)=>(Number(a.minutes)||1)-(Number(b.minutes)||1));
      grid.replaceChildren();matching.slice(0,limit).forEach(r=>grid.append(card(r)));more.hidden=matching.length<=limit;grid.classList.toggle('list-view',view==='list');
      $$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
      $('#clear-search').hidden=!search;$('#reset-library').hidden=filter==='all'&&!search&&sort==='newest';
      status.textContent=`${Math.min(limit,matching.length)} of ${matching.length} ${matching.length===1?'service':'services'}${filter==='saved'?' in your saved services':filter!=='all'?` · ${filter}`:''}${search?` · “${input.value.trim()}”`:''}`;
      if(!matching.length){const empty=element('div','empty-state');empty.append(element('h2','',filter==='saved'&&!search?'Your saved services, in one place.':resources.length?'Let’s try a different direction.':'Our services will appear here.'),element('p','',filter==='saved'?'Save services with the heart button, or clear your search to see your saved reads.':resources.length?'Try a broader search, or reset your filters to see everything.':'Check back for new LearnPlus services.'));if(resources.length){const reset=element('button','button secondary','Explore all resources ↗');reset.addEventListener('click',resetLibrary);empty.append(reset);}grid.append(empty);}
    }
    function resetLibrary(){filter='all';search='';input.value='';limit=6;sort='newest';$('#resource-sort').value='newest';render();}
    function goToLibrary(f='all',q=''){filter=f;search=q.trim().toLowerCase();input.value=q;limit=6;render();$('#resources').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
    $$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;limit=6;render();}));
    input.addEventListener('input',e=>{search=e.target.value.trim().toLowerCase();limit=6;render();});
    $('#clear-search').addEventListener('click',()=>{search='';input.value='';limit=6;render();input.focus();});
    $('#reset-library').addEventListener('click',resetLibrary);
    $('#resource-sort').addEventListener('change',e=>{sort=e.target.value;limit=6;render();});
    $$('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;try{localStorage.setItem('learnplus-view',view);}catch{}render();}));
    more.addEventListener('click',()=>{const firstNew=limit;limit+=6;render();const next=$$('.resource-card h3 a')[firstNew];next?.focus({preventScroll:true});});
    $$('[data-topic]').forEach(b=>b.addEventListener('click',()=>{const match=categories.find(c=>c.toLowerCase().includes(b.dataset.topic.toLowerCase()));goToLibrary(match||'all',match?'':b.dataset.topic);}));
    $('#hero-search')?.addEventListener('submit',e=>{e.preventDefault();goToLibrary('all',$('#hero-query').value);input.focus({preventScroll:true});});
    document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!$('dialog[open]')&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!document.activeElement.isContentEditable){e.preventDefault();input.focus();}});
    render();
  }
  $$('form[data-kind]').forEach(form=>form.addEventListener('submit',async e=>{
    e.preventDefault(); if(!form.reportValidity())return;
    const status=$('.form-status',form),button=$('button[type=submit]',form);
    status.className='form-status';
    if(location.protocol==='file:'){status.textContent='To send an enquiry, use the live website or email info@learnplus.pro directly.';return;}
    button.disabled=true;status.textContent='Sending your enquiry…';
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
    try{
      const body=new URLSearchParams();
      for(const [key,value] of new FormData(form))body.append(key,String(value));
      const response=await fetch('/api/contact',{method:'POST',body,credentials:'same-origin',signal:controller.signal});
      const result=await response.json();
      const success=response.ok&&result.success===true;
      status.textContent=result.data?.message||'Unable to send. Please email info@learnplus.pro directly.';
      status.classList.add(success?'success':'error');
      if(success)form.reset();
    }catch{status.textContent='Your submission could not be confirmed. Please email info@learnplus.pro directly.';status.classList.add('error');}
    finally{clearTimeout(timeout);button.disabled=false;}
  }));
})();