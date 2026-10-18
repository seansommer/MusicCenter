import {$,initShell} from './ui.js';
initShell('hub');

// Keep sibling music apps inside the installed Music Center, as Game Center does.
const launcher=$('#hub-launcher'),player=$('#music-app-player');
let frameTimer=null,returnScroll=0;
function launchApp(sourceUrl,push=true){
  const source=new URL(sourceUrl,location.href),manager=source.pathname.endsWith('/manage.html')||source.searchParams.get('screen')==='manage';
  const appUrl=new URL(manager?'../ChordsTabs/manage.html':'../ChordsTabs/',location.href);
  for(const key of ['song','view'])if(source.searchParams.has(key))appUrl.searchParams.set(key,source.searchParams.get(key));
  if(push){returnScroll=window.scrollY;const url=new URL(location.href);url.search='';url.searchParams.set('app','chordstabs');if(manager)url.searchParams.set('screen','manage');for(const key of ['song','view'])if(appUrl.searchParams.has(key))url.searchParams.set(key,appUrl.searchParams.get(key));history.pushState({},'',url);}
  clearTimeout(frameTimer);launcher.hidden=true;player.hidden=false;document.body.classList.add('in-music-app');$('#app-loading').hidden=false;$('#open-app-direct').hidden=true;$('#open-app-direct').href=appUrl.href;
  const frame=document.createElement('iframe');frame.title='Chords & Tabs';frame.src=appUrl.href;frame.allow='autoplay; clipboard-write; fullscreen; web-share; encrypted-media; picture-in-picture';frame.referrerPolicy='strict-origin-when-cross-origin';
  frame.addEventListener('load',()=>{clearTimeout(frameTimer);$('#app-loading').hidden=true;});
  $('#app-frame-holder').replaceChildren(frame);player.focus({preventScroll:true});
  frameTimer=setTimeout(()=>{$('#open-app-direct').hidden=false;},12000);
}
function closeApp(){clearTimeout(frameTimer);$('#app-frame-holder').replaceChildren();player.hidden=true;launcher.hidden=false;document.body.classList.remove('in-music-app');window.scrollTo(0,returnScroll);}
document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[data-music-app]');if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();launchApp(link.href);
});
$('#close-music-app').onclick=()=>{const url=new URL(location.href);url.search='';history.replaceState({},'',url);closeApp();};
window.addEventListener('popstate',()=>{const url=new URL(location.href);if(url.searchParams.get('app')==='chordstabs')launchApp(url.href,false);else closeApp();});
if(new URL(location.href).searchParams.get('app')==='chordstabs')launchApp(location.href,false);
