const { app, BrowserWindow, WebContentsView, ipcMain, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { resolveAddress } = require('./navigation');
let win, active, serial = 0, panel = null;
const tabs = new Map();
let data = { bookmarks: [], history: [], accent: 'violet' };
const downloads = [];
const storePath = () => path.join(app.getPath('userData'), 'profile.json');
function save() { try { fs.writeFileSync(storePath(), JSON.stringify(data)); } catch (error) { console.error('Profile save failed:', error.message); } }
function state() {
  const current = tabs.get(active);
  return { tabs: [...tabs.values()].map(t => ({ id:t.id, title:t.title, url:t.url, loading:t.loading, error:t.error })), active, panel, bookmarks:data.bookmarks, history:data.history, accent:data.accent, downloads, canBack:current?.view.webContents.navigationHistory.canGoBack() || false, canForward:current?.view.webContents.navigationHistory.canGoForward() || false };
}
function publish() { if (win && !win.isDestroyed()) win.webContents.send('state', state()); }
function layout() {
  if (!win || win.isDestroyed()) return;
  const [width, height] = win.getContentSize();
  for (const t of tabs.values()) { const visible = t.id === active && !!t.url && !panel; t.view.setVisible(visible); if (visible) t.view.setBounds({x:72,y:108,width:Math.max(1,width-72),height:Math.max(1,height-134)}); }
}
function select(id) { if (!tabs.has(id)) return; active = id; panel = null; layout(); publish(); }
function navigate(value) {
  const url = resolveAddress(value); if (!url) return;
  const tab = tabs.get(active); if (!tab) return;
  tab.url=url; tab.error=''; panel=null; layout(); publish();
  tab.view.webContents.loadURL(url).catch(error => { if (error.code !== 'ERR_ABORTED') { tab.error=error.message; publish(); } });
}
function createTab(url) {
  const view = new WebContentsView({webPreferences:{partition:'persist:vixenn', sandbox:true, contextIsolation:true, nodeIntegration:false, webSecurity:true}});
  const tab = {id:++serial, view, title:'New tab', url:'', loading:false, error:''};
  tabs.set(tab.id,tab); win.contentView.addChildView(view); view.setVisible(false);
  const wc=view.webContents;
  wc.setWindowOpenHandler(({url}) => { if (/^https?:\/\//i.test(url)) createTab(url); return {action:'deny'}; });
  wc.on('will-navigate', (event, url) => { if (!/^https?:\/\//i.test(url)) event.preventDefault(); });
  wc.on('will-redirect', (event, url) => { if (!/^https?:\/\//i.test(url)) event.preventDefault(); });
  wc.on('page-title-updated', (_event,title) => {tab.title=title; publish();});
  wc.on('did-start-loading', () => {tab.loading=true;tab.error='';publish();});
  wc.on('did-stop-loading', () => {tab.loading=false;publish();});
  const changed = (_event,url) => {tab.url=url;publish();};
  wc.on('did-navigate',changed); wc.on('did-navigate-in-page',changed);
  wc.on('did-finish-load', () => { if (!/^https?:/.test(wc.getURL())) return; data.history.unshift({url:wc.getURL(),title:wc.getTitle(),time:Date.now()});data.history=data.history.slice(0,500);save();publish(); });
  wc.on('did-fail-load', (_event,code,description,_url,isMainFrame) => {if (isMainFrame && code !== -3) {tab.error=description;publish();}});
  wc.on('render-process-gone', () => {tab.error='This tab stopped responding. Reload to recover.';publish();});
  wc.on('before-input-event', (event,input) => { if (shortcut(input)) event.preventDefault(); });
  select(tab.id); if(url) navigate(url); return tab;
}
function closeTab(id) { const t=tabs.get(id);if(!t)return;win.contentView.removeChildView(t.view);t.view.webContents.close();tabs.delete(id);if(!tabs.size)createTab();else if(active===id)select([...tabs.keys()].at(-1));publish(); }
function shortcut(input) {
  if(input.type!=='keyDown')return false;
  const key=input.key.toLowerCase(),ctrl=input.control||input.meta;
  if(ctrl&&key==='l'){win.webContents.focus();win.webContents.send('focus-address');return true;}
  if(ctrl&&key==='t'){createTab();return true;}
  if(ctrl&&key==='w'){closeTab(active);return true;}
  if(ctrl&&key==='r'){tabs.get(active)?.view.webContents.reload();return true;}
  if(ctrl&&key==='d'){bookmark();return true;}
  if(ctrl&&key==='tab'){const ids=[...tabs.keys()];select(ids[(ids.indexOf(active)+(input.shift?ids.length-1:1))%ids.length]);return true;}
  if(key==='f11'){win.setFullScreen(!win.isFullScreen());return true;}return false;
}
function bookmark() {const t=tabs.get(active);if(!t?.url)return;const index=data.bookmarks.findIndex(b=>b.url===t.url);if(index<0)data.bookmarks.push({url:t.url,title:t.title});else data.bookmarks.splice(index,1);save();publish();}
app.whenReady().then(() => {
  try {data={...data,...JSON.parse(fs.readFileSync(storePath(),'utf8'))};}catch{}
  const profile=session.fromPartition('persist:vixenn');
  profile.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
  profile.setPermissionCheckHandler(()=>false);
  profile.on('will-download', (_event,item) => {const record={id:Date.now()+Math.random(),name:item.getFilename(),status:'Downloading',received:0,total:item.getTotalBytes()};downloads.unshift(record);item.setSaveDialogOptions({title:'Save download'});item.on('updated',()=>{record.received=item.getReceivedBytes();publish();});item.once('done',(_e,status)=>{record.status=status;publish();});publish();});
  win=new BrowserWindow({width:1440,height:940,minWidth:900,minHeight:620,frame:false,backgroundColor:'#090a10',title:'Vixenn',webPreferences:{preload:path.join(__dirname,'preload.js'),sandbox:true,contextIsolation:true,nodeIntegration:false}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',event=>event.preventDefault());
  win.webContents.on('before-input-event',(event,input)=>{if(shortcut(input))event.preventDefault();});
  ipcMain.handle('action', async (event,name,value) => {
    if(event.sender!==win.webContents || event.senderFrame!==win.webContents.mainFrame)throw new Error('Unauthorized caller');
    const t=tabs.get(active),wc=t?.view.webContents;
    switch(name){
      case 'ready':return state();case 'navigate':navigate(String(value).slice(0,8192));break;
      case 'new':createTab();break;case 'select':select(value);break;case 'close':closeTab(value);break;
      case 'back':if(wc?.navigationHistory.canGoBack())wc.navigationHistory.goBack();break;
      case 'forward':if(wc?.navigationHistory.canGoForward())wc.navigationHistory.goForward();break;
      case 'reload':if(t?.url)wc.reload();break;case 'stop':wc?.stop();break;
      case 'home':createTab();break;case 'bookmark':bookmark();break;
      case 'panel':panel=['bookmarks','history','downloads','settings'].includes(value)?value:null;layout();publish();break;
      case 'accent':if(['violet','crimson','cyan'].includes(value)){data.accent=value;save();publish();}break;
      case 'clearHistory':data.history=[];save();publish();break;
      case 'minimize':win.minimize();break;case 'maximize':win.isMaximized()?win.unmaximize():win.maximize();break;case 'quit':win.close();break;
    }
  });
  win.on('resize',layout);
  win.on('closed',()=>{for(const t of tabs.values())if(!t.view.webContents.isDestroyed())t.view.webContents.close();tabs.clear();win=null;});
  win.loadFile(path.join(__dirname,'ui/index.html'));createTab();
  if(process.argv.includes('--smoke-test')) win.webContents.once('did-finish-load',async()=>{
    try {
      const ready=await win.webContents.executeJavaScript("window.vixenn.action('ready').then(s => s.tabs.length === 1)");
      if(!ready)throw new Error('Initial tab missing');
      createTab();if(tabs.size!==2)throw new Error('New tab failed');closeTab(active);
      await win.webContents.executeJavaScript("window.vixenn.action('panel', 'settings')");
      await win.webContents.executeJavaScript("window.vixenn.action('panel', null)");
      const screenshot=await win.webContents.capturePage();fs.writeFileSync(path.join(__dirname,'..','Vixenn-preview.png'),screenshot.toPNG());
      console.log('VIXENN_SMOKE_PASS');app.exit(0);
    }catch(error){console.error(error);app.exit(1);}
  });
});
app.on('window-all-closed',()=>app.quit());
