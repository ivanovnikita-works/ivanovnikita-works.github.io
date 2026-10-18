/* IVANOV NIKITA: bilingual interface; the Russian source remains in the HTML. */
(function(){
  'use strict';
  const dictionary=window.__portfolioTranslations||{};
  const originalTexts=new WeakMap();
  const originalAttributes=new WeakMap();
  const observedDocs=new WeakSet();
  const boundSwitches=new WeakSet();
  const clean=s=>(s||'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
  const cyr=/[а-яё]/i;
  const baseTitle='IVANOV NIKITA';
  const RussianRoutes={
    projects:'IVANOV NIKITA',
    gallery:'Галерея',contacts:'Контакты',
    'project-olya-magazine':'ОЛЯ magazine','project-olya-clothes':'ОЛЯ — мерч',
    'project-short-eye':'Short Eye','project-scale-clock':'Scale Clock',
    'project-undder-magazine':'UNDDER magazine','project-scale-merch':'SCALE — мерч',
    'project-posters':'Постеры','project-nix':'NIX',
    'project-upnight':'Up Night','project-duvet':'Duvet'
  };
  const EnglishRoutes={
    projects:'Projects',gallery:'Gallery',contacts:'Contact',
    'project-olya-magazine':'OLYA Magazine','project-olya-clothes':'OLYA — Apparel',
    'project-short-eye':'Short Eye','project-scale-clock':'Scale Clock',
    'project-undder-magazine':'UNDDER Magazine','project-scale-merch':'SCALE Merch',
    'project-posters':'Selected Posters','project-nix':'NIX',
    'project-upnight':'UPNIGHT','project-duvet':'DUVET'
  };
  let language='ru',scheduled=false;
  function initialLanguage(){
    const q=new URLSearchParams(location.search).get('lang');
    if(q==='en'||q==='ru')return q;
    try {return localStorage.getItem('ivanov-language')==='en'?'en':'ru';} catch(e){return 'ru';}
  }
  function translated(str){
    const key=clean(str);
    if(Object.prototype.hasOwnProperty.call(dictionary,key)) return dictionary[key];
    const match=key.match(/^(\d+)\s+из\s+(\d+)$/i);
    if(match)return match[1]+' of '+match[2];
    if(key==='Поиск')return 'Search';
    if(key==='Открыть навигацию')return 'Open navigation';
    if(key==='Закрыть навигацию')return 'Close navigation';
    if(key==='карусель')return 'carousel';
    if(key.startsWith('UNDDER — кадр '))return 'UNDDER — frame '+key.slice(15);
    if(key.startsWith('Брендбук Short Eye — страница '))return 'Short Eye brandbook — page '+key.slice(29);
    if(key.startsWith('Разворот '))return 'Spread '+key.slice(9);
    if(key.startsWith('Страница '))return 'Page '+key.slice(9);
    if(key.startsWith('Открыть проект '))return 'Open project '+(dictionary[key.slice('Открыть проект '.length)]||key.slice('Открыть проект '.length));
    if(key.startsWith('Предыдущая работа:'))return 'Previous project: '+(dictionary[clean(key.slice('Предыдущая работа:'.length))]||clean(key.slice('Предыдущая работа:'.length)));
    if(key.startsWith('Следующая работа:'))return 'Next project: '+(dictionary[clean(key.slice('Следующая работа:'.length))]||clean(key.slice('Следующая работа:'.length)));
    return null;
  }
  function isProtected(node){
    let parent=node.parentElement;
    if(!parent)return true;
    if(parent.closest('script,style,noscript,textarea,code,svg,[data-i18n-toggle]'))return true;
    return false;
  }
  function applyText(node){
    if(isProtected(node))return;
    let base=originalTexts.get(node);
    const now=node.nodeValue||'';
    if(base===undefined){
      if(!cyr.test(now))return;
      base=now;
      originalTexts.set(node,base);
    } else if(language==='en'&&now!==base){
      const target=translated(base);
      if(target){
        const lead=(base.match(/^\s*/)||[''])[0];
        const tail=(base.match(/\s*$/)||[''])[0];
        if(now!==lead+target+tail && cyr.test(now)) {base=now;originalTexts.set(node,base);}
      } else if(cyr.test(now)){base=now;originalTexts.set(node,base);}
    }
    const out=language==='en'?translated(base):null;
    const value=out!==null&&language==='en'
      ?(base.match(/^\s*/)||[''])[0]+out+(base.match(/\s*$/)||[''])[0]
      :base;
    if(now!==value)node.nodeValue=value;
  }
  function applyAttributes(element){
    if(!element || !element.attributes)return;
    if(element.closest && element.closest('[data-i18n-toggle]'))return;
    const attrs=['alt','aria-label','title','placeholder'];
    let backup=originalAttributes.get(element);
    if(!backup){backup={};originalAttributes.set(element,backup);}
    for(const key of attrs){
      if(!element.hasAttribute(key))continue;
      const current=element.getAttribute(key)||'';
      if(!(key in backup)){
        if(!cyr.test(current))continue;
        backup[key]=current;
      }
      const target=language==='en'?translated(backup[key]):null;
      const next=target!==null&&language==='en'?target:backup[key];
      if(current!==next)element.setAttribute(key,next);
    }
  }
  function bindToggle(button){
    if(boundSwitches.has(button))return;
    boundSwitches.add(button);
    button.dataset.i18nToggle='true';
    button.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();
      setLanguage(language==='en'?'ru':'en',true);
      if(button.closest('.global-mobile-nav-panel')&&document.body.classList.contains('global-nav-is-open'))
        document.querySelector('header.site-header > button.mobile-menu')?.click();
    },true);
  }
  function switchButtons(doc){
    doc.querySelectorAll('button').forEach(button=>{
      const label=clean(button.textContent);
      if(button.hasAttribute('data-i18n-toggle')||/^(Ру|RU|EN)$/i.test(label))
        bindToggle(button);
    });
    doc.querySelectorAll('button[data-i18n-toggle]').forEach(button=>{
      const visibleLanguage=language==='en'?'EN':'RU';
      if(button.textContent!==visibleLanguage)button.textContent=visibleLanguage;
      button.setAttribute('aria-label',language==='en'?'Switch to Russian':'Switch to English');
      button.setAttribute('title',language==='en'?'Switch to Russian':'Switch to English');
      button.setAttribute('lang',language);
    });
  }
  function paint(doc){
    if(!doc||!doc.body)return;
    const walker=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT);
    let node;const nodes=[];
    while((node=walker.nextNode()))nodes.push(node);
    nodes.forEach(applyText);
    if(language==='en'||originalAttributes)
      doc.body.querySelectorAll('[alt],[aria-label],[title],[placeholder]').forEach(applyAttributes);
    switchButtons(doc);
    doc.documentElement.lang=language;
  }
  function paintFrames(){
    document.querySelectorAll('iframe[srcdoc]').forEach(frame=>{
      if(!frame.dataset.i18nListening){
        frame.dataset.i18nListening='true';
        frame.addEventListener('load',()=>{watchFrame(frame);paintFrame(frame);});
      }
      watchFrame(frame);
      paintFrame(frame);
    });
  }
  function paintFrame(frame){
    try { if(frame.contentDocument?.body)paint(frame.contentDocument); }
    catch(e){ /* Keep existing embedded design if cross-origin restrictions apply. */ }
  }
  function watchFrame(frame){
    try{
      const doc=frame.contentDocument;
      if(!doc?.body||observedDocs.has(doc))return;
      observedDocs.add(doc);
      new MutationObserver(()=>schedule()).observe(doc.body,{childList:true,subtree:true});
    }catch(e){}
  }
  function titleAndMeta(){
    const route=document.body.dataset.route||'projects';
    if(language==='en'){
      const title=route==='projects'?baseTitle:(EnglishRoutes[route]||'Project')+' — IVANOV NIKITA';
      if(document.title!==title)document.title=title;
    }else{
      const title=route==='projects'?'IVANOV NIKITA':
        (RussianRoutes[route]||'Проект')+' — IVANOV NIKITA';
      if(document.title!==title)document.title=title;
    }
    // Keep social and SEO description fields empty in both languages.
  }
  function repaint(){
    scheduled=false;
    paint(document);
    paintFrames();
    document.body.classList.toggle('lang-en',language==='en');
    titleAndMeta();
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(repaint);}}
  function setLanguage(next,updateAddress){
    if(next!=='ru'&&next!=='en')return;
    language=next;
    try{localStorage.setItem('ivanov-language',next);}catch(e){}
    if(updateAddress){
      const url=new URL(location.href);
      if(next==='en')url.searchParams.set('lang','en');else url.searchParams.delete('lang');
      history.replaceState(history.state,'',url.pathname+url.search+url.hash);
    }
    schedule();
  }
  function init(){
    language=initialLanguage();
    repaint();
    new MutationObserver(changes=>{
      if(changes.some(change=>change.type==='childList'||change.attributeName==='data-route'))schedule();
    }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-route']});
    addEventListener('popstate',()=>{const q=new URLSearchParams(location.search).get('lang');if(q==='ru'||q==='en')language=q;else language=initialLanguage();schedule();});
    window.__setPortfolioLanguage=setLanguage;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();