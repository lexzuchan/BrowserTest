const $=id=>document.getElementById(id);
const api=window.vixenn;
let current;
const act=(name,value)=>api.action(name,value).catch(console.error);
function element(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;}
function render(state){
  current=state;
  const tab=state.tabs.find(t=>t.id===state.active);
  document.documentElement.style.setProperty('--accent',({violet:'#a479ff',crimson:'#ff6286',cyan:'#66dedb'})[state.accent]);
  $('tabs').replaceChildren(...state.tabs.map(t=>{const item=element('div',undefined,'tab'+(t.id===state.active?' active':''));const label=element('button',(t.loading?'◌ ':'')+t.title,'tab-label');label.title=t.title;label.onclick=()=>act('select',t.id);const close=element('button','×','tab-close');close.title='Close tab';close.onclick=()=>act('close',t.id);item.append(label,close);return item;}));
  if(document.activeElement!==$('address'))$('address').value=tab?.url||'';
  $('back').disabled=!state.canBack;$('forward').disabled=!state.canForward;
  $('reload').textContent=tab?.loading?'×':'↻';$('reload').dataset.action=tab?.loading?'stop':'reload';
  $('star').textContent=state.bookmarks.some(b=>b.url===tab?.url)?'★':'☆';
  $('protocol').textContent=tab?.url?.startsWith('https:')?'◇':tab?.url?'!':'◇';
  $('protocol').title=tab?.url?.startsWith('https:')?'HTTPS connection':'Connection information';
  $('home').hidden=!!tab?.url||!!state.panel;$('panel').hidden=!state.panel;
  $('status').textContent=tab?.error?'PAGE ERROR · '+tab.error:tab?.loading?'CONNECTING…':tab?.url?'READY':'READY TO EXPLORE';
  document.querySelectorAll('aside [data-panel]').forEach(b=>b.classList.toggle('selected',b.dataset.panel===state.panel));
  if(state.panel)renderPanel(state);
}
function renderPanel(s){
  $('panel-title').textContent=s.panel[0].toUpperCase()+s.panel.slice(1);
  const body=$('panel-body');body.replaceChildren();
  if(s.panel==='settings'){
    const appearance=element('div',undefined,'setting');appearance.append(element('h3','Make it yours'),element('p','Choose your accent. Your preferences are saved on this device.'));
    for(const name of ['violet','crimson','cyan']){const b=element('button',name.toUpperCase()+(s.accent===name?' ✓':''));b.onclick=()=>act('accent',name);appearance.append(b);}body.append(appearance);
    const privacy=element('div',undefined,'setting');privacy.append(element('h3','Your browsing data'),element('p','Bookmarks and up to 500 history entries are stored locally. Website cookies use a persistent local profile.'));
    const clear=element('button','Clear browsing history');clear.onclick=()=>act('clearHistory');privacy.append(clear);body.append(privacy);
    const about=element('div',undefined,'setting');about.append(element('h3','Vixenn / 0.1.0'),element('p','An independent desktop browser powered by Chromium and Blink. Ctrl+L address · Ctrl+T new tab · Ctrl+W close · Ctrl+Tab switch · Ctrl+D bookmark · F11 fullscreen.'),element('p','Early development build. Chrome extensions, password management, automatic updates, and DRM streaming are not implemented. Site permissions such as camera, microphone, and location are currently blocked.'));body.append(about);return;
  }
  const items=s[s.panel]||[];
  if(!items.length){body.append(element('p',({bookmarks:'Your next favorite place is waiting. Press ☆ on a website to save it.',history:'A fresh start. Your visited pages will appear here.',downloads:'Downloads will appear here when you save a file.'})[s.panel],'empty'));return;}
  for(const item of items){const row=element('div',undefined,'row');const b=element(s.panel==='downloads'?'div':'button');b.append(element('strong',item.title||item.name||item.url),element('small',s.panel==='downloads'?item.status+' · '+Math.round(item.received/1024)+' KB':item.url));if(s.panel!=='downloads')b.onclick=()=>act('navigate',item.url);row.append(b);body.append(row);}
}
document.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;if(b.dataset.action)act(b.dataset.action);if(b.dataset.panel)act('panel',b.dataset.panel);if(b.dataset.url)act('navigate',b.dataset.url);});
$('address-form').onsubmit=event=>{event.preventDefault();act('navigate',$('address').value);$('address').blur();};
$('search-form').onsubmit=event=>{event.preventDefault();act('navigate',$('search').value);};
$('panel-close').onclick=()=>act('panel',null);
$('address').onfocus=()=> $('address').select();
$('date').textContent=new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'}).toUpperCase();
api.onState(render);api.onFocusAddress(()=>{$('address').focus();$('address').select();});
act('ready').then(render);
