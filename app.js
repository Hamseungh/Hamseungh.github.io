const KEYS=['Stories','Scenes','Choices','Conditions','Effects','Items','Recipes'];
let data={},si='',ci='',tab='scene',fileName='project.json';
const $=id=>document.getElementById(id);
const val=id=>$(id).value;
function empty(){return Object.fromEntries(KEYS.map(k=>[k,[]]))}
function normalize(x){if(!x||typeof x!=='object'||Array.isArray(x))throw Error('올바른 프로젝트 JSON 객체가 아닙니다.');for(const k of KEYS){if(x[k]!==undefined&&!Array.isArray(x[k]))throw Error(k+' 시트 형식이 올바르지 않습니다.');if(!x[k])x[k]=[]}return x}
function persist(){try{localStorage.setItem('dunMobileDraft',JSON.stringify({data,fileName}));$('status').textContent='임시 저장됨 · JSON 내보내기로 파일을 보관하세요.'}catch(e){$('status').textContent='임시 저장 실패: 저장 공간을 확인하세요.'}}
function unique(list,key,prefix){let n=1;const ids=new Set(list.map(x=>String(x[key])));while(ids.has(prefix+String(n).padStart(3,'0')))n++;return prefix+String(n).padStart(3,'0')}
function opt(select,items,selected,blank=false){select.replaceChildren();if(blank)select.add(new Option('(없음)',''));for(const [value,label] of items)select.add(new Option(label,value));select.value=selected??''}
function stories(){return data.Stories||[]}function scenes(){return data.Scenes||[]}function choices(){return data.Choices||[]}
function currentScene(){return scenes().find(x=>x.scene_id===ci)}function currentStory(){return stories().find(x=>x.story_id===si)}
function refreshStory(){const arr=stories();if(!arr.some(x=>x.story_id===si))si=arr[0]?.story_id||'';opt($('story'),arr.map(x=>[x.story_id,`${x.title||x.story_id} (${x.story_id})`]),si);refreshScenes()}
function refreshScenes(){const arr=scenes().filter(x=>x.story_id===si);if(!arr.some(x=>x.scene_id===ci))ci=arr[0]?.scene_id||'';opt($('scene'),arr.map(x=>[x.scene_id,`${x.title||x.scene_id} (${x.scene_id})`]),ci);render()}
function render(){const s=currentScene(),disabled=!s;for(const id of ['sceneId','title','content','sceneType','nextScene'])$(id).disabled=disabled;
$('sceneId').value=s?.scene_id||'';$('title').value=s?.title||'';$('content').value=s?.content||'';$('sceneType').value=s?.scene_type||'normal';
opt($('nextScene'),scenes().filter(x=>x.story_id===si).map(x=>[x.scene_id,`${x.title||x.scene_id} (${x.scene_id})`]),s?.next_scene_id||'',true);
const list=$('choiceList');list.replaceChildren();for(const c of choices().filter(x=>x.scene_id===ci)){const box=document.createElement('div');box.className='entry';const fields=[['text','선택지 내용','textarea'],['display_order','표시 순서','number'],['success_rate','성공률 (빈칸 가능)','number'],['next_scene_id','일반 이동 장면','select'],['success_scene_id','성공 장면','select'],['failure_scene_id','실패 장면','select']];const idLabel=document.createElement('label');idLabel.textContent='선택지 ID';box.append(idLabel);
 const idInput=document.createElement('input');idInput.value=c.choice_id;idInput.autocomplete='off';
 idInput.addEventListener('change',()=>{const old=c.choice_id;if(!renameId('choice',old,idInput.value))idInput.value=old});
 box.append(idInput);for(const [key,label,type] of fields){const l=document.createElement('label');l.textContent=label;box.append(l);let inp;if(type==='select'){inp=document.createElement('select');opt(inp,scenes().filter(x=>x.story_id===si).map(x=>[x.scene_id,`${x.title||x.scene_id} (${x.scene_id})`]),c[key]||'',true)}else{inp=document.createElement(type==='textarea'?'textarea':'input');if(type==='number')inp.type='number';inp.value=c[key]??'';if(type==='textarea')inp.rows=2}inp.addEventListener('input',()=>{c[key]=inp.value;persist()});inp.addEventListener('change',()=>{c[key]=inp.value;persist()});box.append(inp)}const del=document.createElement('button');del.className='danger';del.textContent='선택지 삭제';del.onclick=()=>{if(!confirm('선택지와 연결된 Conditions/Effects도 삭제할까요?'))return;data.Choices=data.Choices.filter(x=>x!==c);data.Conditions=data.Conditions.filter(x=>x.choice_id!==c.choice_id);data.Effects=data.Effects.filter(x=>x.choice_id!==c.choice_id);persist();render()};box.append(del);list.append(box)}
$('previewTitle').textContent=s?.title||'장면 없음';$('previewContent').textContent=s?.content||'';$('previewChoices').replaceChildren();for(const c of choices().filter(x=>x.scene_id===ci)){const p=document.createElement('div');p.className='entry';p.textContent=c.text||'(내용 없음)';$('previewChoices').append(p)}}
function renameId(kind, oldId, newId){
 newId=String(newId).trim();
 const scene=kind==='scene';
 const rows=scene?scenes():choices();
 const key=scene?'scene_id':'choice_id';
 const target=rows.find(x=>x[key]===oldId);
 if(!target)return false;
 if(newId===oldId)return true;
 if(!newId){alert('ID는 빈칸으로 둘 수 없습니다.');return false}
 if(rows.some(x=>x!==target&&String(x[key])===newId)){alert('이미 사용 중인 ID입니다: '+newId);return false}
 target[key]=newId;
 if(scene){
   for(const c of choices()){
     if(c.scene_id===oldId)c.scene_id=newId;
     for(const field of ['next_scene_id','success_scene_id','failure_scene_id','success_next_scene_id','fail_next_scene_id'])if(c[field]===oldId)c[field]=newId;
   }
   for(const x of scenes())if(x.next_scene_id===oldId)x.next_scene_id=newId;
   ci=newId;
 }else{
   for(const sheet of ['Conditions','Effects'])for(const x of (data[sheet]||[]))if(x.choice_id===oldId)x.choice_id=newId;
 }
 persist();refreshScenes();return true;
}
$('sceneId').addEventListener('change',()=>{const old=ci;if(!renameId('scene',old,val('sceneId')))$('sceneId').value=old});
function updateScene(key,value){const s=currentScene();if(!s)return;s[key]=value;persist();if(key==='title'){$('scene').selectedOptions[0].textContent=`${value||ci} (${ci})`}}
for(const k of ['title','content','sceneType','nextScene'])$(k).addEventListener('input',()=>updateScene(k==='sceneType'?'scene_type':k==='nextScene'?'next_scene_id':k,val(k)));
$('story').onchange=()=>{si=val('story');refreshScenes()};$('scene').onchange=()=>{ci=val('scene');render()};
$('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const x=normalize(JSON.parse(await f.text()));data=x;fileName=f.name;si='';ci='';persist();refreshStory();$('status').textContent='불러오기 완료: '+f.name}catch(err){alert('JSON 불러오기 실패: '+err.message)}e.target.value=''};
$('export').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fileName.replace(/\.json$/i,'')+'_mobile.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('clear').onclick=()=>{if(!confirm('브라우저의 임시 저장 데이터를 초기화할까요?'))return;localStorage.removeItem('dunMobileDraft');data=empty();si='';ci='';fileName='project.json';refreshStory();$('status').textContent='초기화 완료'};
$('addScene').onclick=()=>{if(!si)return alert('스토리를 먼저 선택하세요.');const id=unique(scenes(),'scene_id',si+'_');data.Scenes.push({scene_id:id,story_id:si,title:'새 장면',content:'',scene_type:'normal',next_scene_id:''});ci=id;persist();refreshScenes()};
$('deleteScene').onclick=()=>{if(!ci||!confirm('이 장면을 삭제할까요? 다른 장면에서 이 ID를 참조하고 있을 수 있습니다.'))return;const related=choices().filter(x=>x.scene_id===ci).map(x=>x.choice_id);data.Scenes=data.Scenes.filter(x=>x.scene_id!==ci);data.Choices=data.Choices.filter(x=>!related.includes(x.choice_id));data.Conditions=data.Conditions.filter(x=>!related.includes(x.choice_id));data.Effects=data.Effects.filter(x=>!related.includes(x.choice_id));ci='';persist();refreshScenes()};
$('addChoice').onclick=()=>{if(!ci)return alert('장면을 먼저 선택하세요.');const id=unique(choices(),'choice_id',ci+'C_');data.Choices.push({choice_id:id,scene_id:ci,text:'',next_scene_id:'',display_order:String(choices().filter(x=>x.scene_id===ci).length),success_rate:'',success_scene_id:'',failure_scene_id:''});persist();render()};
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x===b));for(const t of ['scene','choices','preview'])$('pane-'+t).classList.toggle('hidden',t!==tab);if(tab==='preview')render()});
try{const saved=JSON.parse(localStorage.getItem('dunMobileDraft')||'null');data=normalize(saved?.data||empty());fileName=saved?.fileName||fileName}catch(e){data=empty()}refreshStory();
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
