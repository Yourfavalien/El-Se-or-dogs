const $ = selector => document.querySelector(selector);
let content;
const tabs = ['homepage','menu','announcements','events','business','sections','gallery','pages'];
const labels = {homepage:'Homepage',menu:'Menu',announcements:'Announcements',events:'Events',business:'Business info',sections:'Sections',gallery:'Gallery',pages:'Other pages'};
const getPath = (obj, path) => path.split('.').reduce((value, key) => value?.[key], obj);
const setPath = (obj, path, value) => { const keys = path.split('.'); const last = keys.pop(); const parent = keys.reduce((value, key) => value[key], obj); parent[last] = value; };
const esc = (value='') => String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

async function api(path, options={}) {
  const response = await fetch(`/api/${path}`, { credentials:'same-origin', headers:{'Content-Type':'application/json',...(options.headers||{})}, ...options });
  if (response.status === 401) throw Object.assign(new Error('Unauthorized'), { unauthorized:true });
  if (!response.ok) throw new Error((await response.json().catch(()=>({}))).error || 'Request failed');
  return response.status === 204 ? null : response.json();
}

function markDirty(){ document.body.classList.add('dirty'); $('#save-status').textContent='Unpublished changes'; }
function bindFields(){
  document.querySelectorAll('[data-path]').forEach(input => {
    const value = getPath(content,input.dataset.path);
    if(input.type==='checkbox') input.checked=Boolean(value);
    else if(input.dataset.type==='lines') input.value=(value||[]).join('\n');
    else if(input.dataset.type==='paragraphs') input.value=(value||[]).join('\n\n');
    else input.value=value??'';
    input.oninput=()=>{ let next=input.type==='checkbox'?input.checked:input.value; if(input.dataset.type==='lines')next=next.split('\n').map(x=>x.trim()).filter(Boolean); if(input.dataset.type==='paragraphs')next=next.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean); setPath(content,input.dataset.path,next); markDirty(); };
  });
}
function renderMenu(){
  const wrap=$('#menu-items'); wrap.innerHTML='';
  content.menu.categories.forEach((category,ci)=>category.items.forEach((item,ii)=>{
    const card=document.createElement('div'); card.className='edit-card';
    card.innerHTML=`<button type="button" class="remove">Remove</button><label>Name<input data-key="name" value="${esc(item.name)}"></label><label>Category<select data-key="category">${content.menu.categories.map((c,i)=>`<option value="${i}" ${i===ci?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><label>Price<input data-key="price" type="number" min="0" step="0.01" value="${Number(item.price||0)}"></label><label>Availability<select data-key="availability"><option value="available">Available</option><option value="sold-out">Sold Out</option><option value="coming-soon">Coming Soon</option></select></label><label class="wide">Description<textarea data-key="description">${esc(item.description)}</textarea></label><label class="wide">Image path or URL<input data-key="image" value="${esc(item.image)}"></label><label class="toggle"><input data-key="featured" type="checkbox" ${item.featured?'checked':''}> Featured item</label>`;
    card.querySelector('[data-key=availability]').value=item.availability;
    card.querySelectorAll('[data-key]').forEach(input=>input.oninput=()=>{ const key=input.dataset.key; if(key==='category'){const target=Number(input.value); content.menu.categories[ci].items.splice(ii,1); content.menu.categories[target].items.push(item); renderMenu();}else item[key]=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value; markDirty(); });
    card.querySelector('.remove').onclick=()=>{ content.menu.categories[ci].items.splice(ii,1); renderMenu(); markDirty(); }; wrap.append(card);
  }));
}
function renderEvents(){ const wrap=$('#events'); wrap.innerHTML=''; content.events.forEach((event,i)=>{const card=document.createElement('div');card.className='edit-card';card.innerHTML=`<button type="button" class="remove">Remove</button><label>Event name<input data-key="title" value="${esc(event.title)}"></label><label>Date<input data-key="date" type="date" value="${esc(event.date)}"></label><label>Start time<input data-key="startTime" type="time" value="${esc(event.startTime)}"></label><label>End time<input data-key="endTime" type="time" value="${esc(event.endTime)}"></label><label class="wide">Location<input data-key="location" value="${esc(event.location)}"></label><label class="wide">Announcement<textarea data-key="announcement">${esc(event.announcement)}</textarea></label><label class="toggle"><input data-key="enabled" type="checkbox" ${event.enabled?'checked':''}> Show event</label>`;card.querySelectorAll('[data-key]').forEach(input=>input.oninput=()=>{event[input.dataset.key]=input.type==='checkbox'?input.checked:input.value;markDirty()});card.querySelector('.remove').onclick=()=>{content.events.splice(i,1);renderEvents();markDirty()};wrap.append(card)}); }
function renderHours(){ $('#hours').innerHTML=content.site.hours.schedule.map((row,i)=>`<div class="hours-row"><strong>${row.day}</strong><label><input type="checkbox" data-hour="${i}" data-key="closed" ${row.closed?'checked':''}> Closed</label><input type="time" data-hour="${i}" data-key="open" value="${row.open}"><input type="time" data-hour="${i}" data-key="close" value="${row.close}"></div>`).join(''); document.querySelectorAll('[data-hour]').forEach(input=>input.oninput=()=>{content.site.hours.schedule[Number(input.dataset.hour)][input.dataset.key]=input.type==='checkbox'?input.checked:input.value;markDirty()}); }
function renderSections(){ const names={homeFeature:'Homepage feature',menu:'Menu',sides:'Drinks & sides',events:'Events',gallery:'Gallery',story:'Our Story',catering:'Catering',contact:'Contact'}; $('#sections').innerHTML=Object.entries(content.sections).map(([key,value])=>`<label><input type="checkbox" data-section-key="${key}" ${value?'checked':''}> ${names[key]||key}</label>`).join(''); document.querySelectorAll('[data-section-key]').forEach(input=>input.oninput=()=>{content.sections[input.dataset.sectionKey]=input.checked;markDirty()}); }
function renderGallery(){ const wrap=$('#gallery');wrap.innerHTML='';content.gallery.forEach((photo,i)=>{const card=document.createElement('div');card.className='edit-card';card.innerHTML=`<button type="button" class="remove">Remove</button><label class="wide">Image path or URL<input data-key="src" value="${esc(photo.src)}"></label><label>Alt text<input data-key="alt" value="${esc(photo.alt)}"></label><label>Caption<input data-key="caption" value="${esc(photo.caption)}"></label>`;card.querySelectorAll('[data-key]').forEach(input=>input.oninput=()=>{photo[input.dataset.key]=input.value;markDirty()});card.querySelector('.remove').onclick=()=>{content.gallery.splice(i,1);renderGallery();markDirty()};wrap.append(card)}); }
function render(){ bindFields();renderMenu();renderEvents();renderHours();renderSections();renderGallery(); }
function showDashboard(){ $('#login-view').hidden=true;$('#dashboard').hidden=false;document.querySelector('.tabs').innerHTML=tabs.map((tab,i)=>`<button type="button" data-tab="${tab}" class="${i?'':'active'}">${labels[tab]}</button>`).join('');document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===button));document.querySelectorAll('[data-panel]').forEach(x=>x.hidden=x.dataset.panel!==button.dataset.tab)});render(); }
async function load(){ try{content=await api('content');showDashboard()}catch(error){if(!error.unauthorized)$('#login-message').textContent=error.message} }
$('#login-form').onsubmit=async event=>{event.preventDefault();$('#login-message').textContent='Signing in…';try{await api('login',{method:'POST',body:JSON.stringify({password:$('#password').value})});content=await api('content');showDashboard()}catch(error){$('#login-message').textContent=error.unauthorized?'That password is not correct.':error.message}};
$('#logout').onclick=async()=>{await api('logout',{method:'POST'});location.reload()};
$('#save').onclick=async()=>{const button=$('#save');button.disabled=true;$('#save-status').textContent='Publishing…';try{content=await api('content',{method:'PUT',body:JSON.stringify(content)});document.body.classList.remove('dirty');$('#save-status').textContent='Published successfully'}catch(error){$('#save-status').textContent=error.message}finally{button.disabled=false}};
$('#add-menu-item').onclick=()=>{content.menu.categories[0].items.push({id:uid('item'),name:'New item',price:0,description:'',image:'',availability:'coming-soon',featured:false});renderMenu();markDirty()};
$('#add-event').onclick=()=>{content.events.push({id:uid('event'),title:'New pop-up',date:'',startTime:'',endTime:'',location:'',announcement:'',enabled:true});renderEvents();markDirty()};
$('#add-photo').onclick=()=>{content.gallery.push({id:uid('photo'),src:'',alt:'',caption:''});renderGallery();markDirty()};
load();
