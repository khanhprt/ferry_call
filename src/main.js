import { t, tr, getLanguage, setLanguage, classLabel } from './i18n.js'
import './style.css'
import { studentsReady, studentImage, seatedLayout, walkToShore } from './students.js'
import { boatReady, renderBoat } from './boat.js'
import { createHarbor, renderHarbor, harborReady } from './harbor.js'
import { renderTeacherPicker } from './teacher-picker.js'
import { finaleReady, sleepStudent, createWinnerFinale, winnerPortrait } from './finale.js'
import { createWeather, renderWeather, weatherReady } from './weather.js'
import { unlockWeatherAudio } from './weather-audio.js'
import { createIcons, Anchor, Users, UserPlus, Trash2, Plus, ImagePlus, Maximize, Volume2, Music, Ship, Sparkles, X, ChevronDown, RotateCcw, Pencil, GraduationCap, Check, Heart, CircleHelp } from 'lucide'

const sample = ['Nguyễn Minh Anh','Trần Gia Bảo','Lê Ngọc Châu','Phạm Đức Duy','Hoàng Thu Hà','Vũ Quang Huy','Đặng Khánh Linh','Bùi Tuấn Kiệt','Đỗ Bảo Ngọc','Ngô Hải Nam','Dương Phương Thảo','Lý Thành Đạt','Hồ Mai Phương','Phan Nhật Minh','Trịnh Gia Hân','Mai Anh Khoa','Cao Thúy Trang','Tạ Hoàng Long','Đinh Yến Nhi','Lâm Quốc Bảo','Võ Thanh Tâm','Nguyễn Gia Huy','Trần Thanh Trúc','Lê Minh Quân','Phạm Đức Anh','Nguyễn Khánh Vy','Bùi Hải Đăng','Trần Ngọc Diệp','Nguyễn Bảo Trâm','Lê Hồng Nhung','Phan Gia Phúc','Đỗ Minh Khang','Trần Thảo My','Vũ Hoàng Nam','Nguyễn Nhật Dương','Lê Quỳnh Hân']
const female = ['Anh','Châu','Hà','Linh','Ngọc','Thảo','Phương','Hân','Trang','Nhi','Trúc','Vy','Diệp','Trâm','Nhung','My']
const makeStudent = (name, gender) => ({ id: crypto.randomUUID(), name: name.trim(), gender: gender || (female.includes(name.trim().split(' ').at(-1)) ? 'Nữ' : 'Nam'), present: true })
const defaultClasses = () => [{ id: crypto.randomUUID(), name: 'Lớp mẫu', students: sample.map(n => makeStudent(n)), sample: true }]
let classes
try { classes = JSON.parse(localStorage.getItem('ferry-classes')) || defaultClasses() } catch { classes = defaultClasses() }
function loadTeacherPreference() {
 try { const saved = localStorage.getItem('ferry-teacher'); return ['Cô', 'Thầy'].includes(saved) ? saved : 'Cô' } catch { return 'Cô' }
}
let activeId = classes[0]?.id, gender = 'Nam', teacher = loadTeacherPreference(), speed = 'Vừa', sound = true, music = true, showNames = true, selected = null, timer = null, remaining = 0
let audioContext, musicTimer
function toggleMusic() {
 music = !music
 if (!music) { clearInterval(musicTimer); return }
 audioContext ||= new AudioContext()
 audioContext.resume()
 const melody = [392,440,523,440,392,330,294,330,392,392,440,523,587,523,440,392]
 let step = 0
 const play = () => { if (!music) return; const now=audioContext.currentTime, oscillator=audioContext.createOscillator(), gain=audioContext.createGain(); oscillator.type='sine'; oscillator.frequency.value=melody[step++ % melody.length]; gain.gain.setValueAtTime(0.0001,now); gain.gain.exponentialRampToValueAtTime(0.035,now+.03); gain.gain.exponentialRampToValueAtTime(0.0001,now+.35); oscillator.connect(gain).connect(audioContext.destination); oscillator.start(now); oscillator.stop(now+.36) }
 play(); musicTimer=setInterval(play,420)
}
const app = document.querySelector('#app')
const current = () => classes.find(c => c.id === activeId) || classes[0]
const save = () => localStorage.setItem('ferry-classes', JSON.stringify(classes))
const icon = (name, size=16) => `<i data-lucide="${name}" width="${size}" height="${size}"></i>`
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const initials = name => name.split(/\s+/).slice(-2).map(x=>x[0]).join('').toUpperCase()
function draw() {
 const cls=current(); if(!cls) return
 const present=cls.students.filter(s=>s.present).length
 app.innerHTML = tr`<div class="app-shell"><header class="topbar"><div class="brand"><div class="brand-icon">${icon('anchor',22)}</div><div><h1>Lái Đò Tri Thức</h1><p>Mỗi chuyến đò, một niềm vui đến lớp</p></div></div><div class="header-right"><label class="language-picker"><span>${getLanguage() === 'en' ? 'Language' : 'Ngôn ngữ'}</span><select id="language" aria-label="${getLanguage() === 'en' ? 'Language' : 'Ngôn ngữ'}"><option value="vi" ${getLanguage() === 'vi' ? 'selected' : ''}>Tiếng Việt</option><option value="en" ${getLanguage() === 'en' ? 'selected' : ''}>English</option></select></label><span class="date">✦ &nbsp; ${new Intl.DateTimeFormat(getLanguage() === 'en' ? 'en-GB' : 'vi-VN',{weekday:'long',day:'numeric',month:'long'}).format(new Date())}</span><button class="top-btn" data-action="fullscreen">${icon('maximize',14)} <span>Toàn màn hình</span></button><button class="top-btn" data-action="music">${icon('music',14)} <span>Nhạc: ${music?t('bật'):t('tắt')}</span></button><button class="top-btn" data-action="sound">${icon('volume-2',14)} <span>Âm thanh: ${sound?t('bật'):t('tắt')}</span></button></div></header>
 <main class="workspace"><section class="class-bar paper"><div class="section-label">${icon('graduation-cap',20)} <span>Lớp học</span></div><div class="class-tabs">${classes.map(c=>`<button class="class-tab ${c.id===cls.id?'active':''}" data-class="${c.id}">${esc(classLabel(c.name))} <b>${c.students.length}</b></button>`).join('')}</div><div class="class-actions"><label>Tên lớp</label><input id="class-name" value="${esc(classLabel(cls.name))}" aria-label="Tên lớp"><button class="small-btn" data-action="add-class">${icon('plus',14)} Thêm lớp</button><button class="small-btn danger" data-action="delete-class">Xóa lớp này</button></div></section>
 <div class="content-grid"><aside class="paper add-panel"><div class="tape"></div><div class="panel-heading"><div><span class="eyebrow">DANH SÁCH LỚP HỌC</span><h2>Ghi tên hành khách <span>✎</span></h2><p>Thêm những người bạn đồng hành nhé!</p></div><div class="heading-icon">${icon('user-plus',20)}</div></div><div class="rule"></div><label class="field-label" for="student-name">HỌ VÀ TÊN</label><div class="name-row"><div class="avatar-add">${icon('user-plus',19)}</div><input id="student-name" placeholder="VD: Nguyễn Minh Anh"><button class="gender-select ${gender==='Nữ'?'pink':''}" data-action="gender">${t(gender)} ${icon('chevron-down',13)}</button></div><button class="primary-btn" data-action="add-student">${icon('plus',17)} Thêm vào lớp</button><div class="divider"><span>HOẶC DÁN CẢ LỚP</span></div><p class="hint">Mỗi dòng một tên, dán thẳng từ Excel cũng được.</p><textarea id="bulk-names" placeholder="Nguyễn Minh Anh&#10;Trần Gia Bảo&#10;Lê Ngọc Châu"></textarea><button class="outline-teal" data-action="bulk-add">${icon('users',15)} Thêm cả danh sách</button><div class="divider"><span>ẢNH HÀNG LOẠT</span></div><label class="upload-btn" for="photos">${icon('image-plus',16)} Chọn nhiều ảnh</label><input id="photos" type="file" accept="image/*" multiple hidden><p class="hint upload-hint">Đặt tên file trùng tên học sinh, ví dụ <strong>Minh Anh.jpg</strong>. Bấm vào avatar trong danh sách để đổi ảnh từng bạn.</p><div class="side-note"><span>✦</span><p>Mỗi cái tên là một câu chuyện.<br><b>Cùng nhau cập bến tri thức!</b></p></div></aside>
 <section class="paper roster-panel"><div class="tape tape-roster"></div><div class="roster-top"><div><span class="eyebrow">SẴN SÀNG RA KHƠI</span><h2>Cả đò <span class="count">${present}/${cls.students.length}</span></h2><p>Những hành khách đáng yêu của chuyến đò hôm nay</p></div><div class="roster-actions"><button class="small-btn" data-action="sample">${icon('rotate-ccw',14)} Dùng lớp mẫu</button><button class="small-btn danger" data-action="clear">${icon('trash-2',14)} Xóa hết</button></div></div>${renderTeacherPicker(teacher)}${cls.sample?tr`<div class="notice">✦ &nbsp; Đây là lớp mẫu 36 bạn để chạy thử. Khi bạn thêm tên đầu tiên, lớp mẫu sẽ tự xóa.</div>`:''}<div class="roster-scroll">${cls.students.length ? `<div class="student-grid">${cls.students.map((s,i)=>tr`<div class="student-card ${!s.present?'absent':''}"><button class="student-avatar color-${i%6}" data-photo="${s.id}" title="Đổi ảnh">${s.photo?`<img src="${s.photo}" alt="">`:initials(s.name)}</button><span class="student-name" title="${esc(s.name)}">${esc(s.name)}</span><button class="sex ${s.gender==='Nữ'?'girl':''}" data-sex="${s.id}">${t(s.gender)}</button><button class="attendance ${!s.present?'off':''}" data-presence="${s.id}">${s.present?t('Có mặt'):t('Vắng')}</button><button class="remove" data-remove="${s.id}" aria-label="Xóa ${esc(s.name)}">×</button></div>`).join('')}</div>` : tr`<div class="empty">⛵<h3>Chiếc đò đang chờ các bạn</h3><p>Thêm tên học sinh để bắt đầu chuyến đi nhé!</p></div>`}</div><div class="bottom-controls"><div class="option-group"><span>Độ dài một chuyến</span>${['Nhanh','Vừa','Hồi hộp'].map(x=>`<button class="pill ${speed===x?'selected':''}" data-speed="${x}">${t(x)}</button>`).join('')}</div><div class="ready"><span class="ready-dot"></span> ${present} hành khách sẵn sàng</div></div><button class="launch" data-action="launch" ${!present?'disabled':''}>${icon('ship',20)} Khởi hành <span>·</span> ${present} bạn <span class="launch-arrow">→</span></button></section></div><footer>Được làm với <span>♥</span> dành cho những chuyến đò tri thức <b>✦</b></footer></main></div>`
 createIcons({icons:{Anchor,Users,UserPlus,Trash2,Plus,ImagePlus,Maximize,Volume2,Music,Ship,Sparkles,X,ChevronDown,RotateCcw,Pencil,GraduationCap,Check,Heart,CircleHelp}})
}
const lastNames = name => name.split(' ').slice(-2).join(' ')
let journeyVersion = 0
let weatherController = null
let harborController = null
let winnerFinale = null
function stopJourney() {
 journeyVersion++
 clearInterval(timer)
 clearTimeout(timer)
 winnerFinale?.dispose()
 winnerFinale = null
 weatherController?.dispose()
 weatherController = null
 harborController?.dispose()
 harborController = null
 app.querySelectorAll('.shore-student').forEach(node => node.getAnimations().forEach(animation => animation.cancel()))
}
async function game() {
 stopJourney()
 if (sound) unlockWeatherAudio()
 const version = journeyVersion
 const launch = app.querySelector('[data-action="launch"]')
 if (launch) launch.disabled = true
 await Promise.all([studentsReady, boatReady, weatherReady, harborReady, finaleReady])
 if (version !== journeyVersion) return
 const cls = current(), candidates = cls.students.filter(student => student.present)
 if (!candidates.length) return draw()
 selected = candidates[Math.floor(Math.random() * candidates.length)]
 remaining = candidates.length
 const leaving = candidates.filter(student => student.id !== selected.id)
 for (let i = leaving.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1))
  ;[leaving[i], leaving[j]] = [leaving[j], leaving[i]]
 }
 const pupils = seatedLayout(candidates).map(({student, x, y, size, row, delay, idle, period, lean}) => tr`
  <div class="passenger ${idle}" data-passenger="${student.id}" style="--left:${x}%;--top:${y}%;--size:${size}%;--delay:${delay}s;--layer:${row + 2};--idle-period:${period}s;--idle-lean:${lean}deg">
   <span class="passenger-name">${esc(lastNames(student.name))}</span><div class="seated-character"><img class="seated-sprite" src="${studentImage(student)}" alt="${esc(student.name)} đang ngồi trên đò"></div>
  </div>`).join('')
 app.innerHTML = tr`<div class="game ${showNames ? '' : 'hide-names'}">
  ${renderWeather()}
  ${renderHarbor()}
  <div class="game-top"><div><span class="game-chip">${esc(classLabel(cls.name))} · ${candidates.length} bạn</span> <span class="game-chip">Còn trên đò: <b id="remaining">${remaining}</b></span></div><div class="game-actions"><button class="game-chip" data-game="names">Tên: ${showNames ? t('hiện') : t('ẩn')}</button><button class="game-chip" data-game="fullscreen">Toàn màn hình</button><button class="game-chip" data-game="music">Nhạc: ${music ? t('bật') : t('tắt')}</button><button class="game-chip" data-game="sound">Âm thanh: ${sound ? t('bật') : t('tắt')}</button><button class="game-chip" data-game="stop">Dừng</button></div></div>
  <div class="journey-title" id="journey-title">Khởi hành!</div><div class="speech">${t(teacher)} đã sẵn sàng, mình đi thôi!</div>
  ${renderBoat(pupils, teacher)}
  <div class="shore-passengers"></div><div class="journey-log" id="journey-log"><span>Bắt đầu khởi hành!</span></div><div id="result"></div>
 </div>`
 const scene = app.querySelector('.game'), title = scene.querySelector('#journey-title'), speech = scene.querySelector('.speech')
 const travelTime = {Nhanh:7200, 'Vừa':10000, 'Hồi hộp':14000}[speed] || 10000
 harborController = createHarbor(scene)
 weatherController = createWeather(scene, { soundEnabled: () => sound, duration: travelTime })
 weatherController.update(0)
 const cadence = {Nhanh:180, 'Vừa':290, 'Hồi hộp':420}[speed] || 290
 const start = performance.now(), walkers = []
 let departed = 0, docked = false, finished = false, sleeperReady = false
 const log = student => {
  if (!scene.isConnected) return
  const list = scene.querySelector('#journey-log'), item = document.createElement('span')
  item.textContent = tr`${lastNames(student.name)} đã lên bờ`
  list.prepend(item)
  while (list.children.length > 4) list.lastElementChild.remove()
 }
 timer = setInterval(() => {
  if (version !== journeyVersion || !scene.isConnected) return clearInterval(timer)
  const elapsed = performance.now() - start, progress = Math.min(1, elapsed / travelTime)
  harborController?.update(progress)
  weatherController?.update(progress)
  if (progress < 1) {
   title.textContent = progress < .18 ? t('Khởi hành!') : progress < .28 ? '' : progress < .38 ? t('GIÓ TO!') : progress < .46 ? t('ĐÙNG!') : progress < .55 ? t('CÁ CHÉP VƯỢT SÓNG!') : progress < .63 ? t('SÓNG LỚN!') : progress < .7 ? t('ẦM!') : progress < .9 ? t('BÃO TAN!') : t('CẬP BẾN!')
   speech.textContent = progress >= .22 && progress < .32 ? tr`Ôi, nón của ${t(teacher)}!` : progress >= .7 && progress < .84 ? tr`Ơ, nón của ${t(teacher)} bay về rồi!` : progress >= .32 && progress < .7 ? t('Bám chắc vào các con!') : progress >= .84 ? t('Bão tan rồi, sắp đến trường!') : tr`${t(teacher)} đã sẵn sàng, mình đi thôi!`
  } else if (!docked) {
   docked = true
   scene.classList.add('arrived')
   title.textContent = t('CẬP BẾN!')
   speech.textContent = t('Cẩn thận bậc thang nhé!')
  }
  const ready = docked ? Math.min(leaving.length, Math.max(0, Math.floor((elapsed - travelTime - 800) / cadence) + 1)) : 0
  while (departed < ready) {
   const student = leaving[departed++], seat = scene.querySelector(`[data-passenger="${student.id}"]`)
   const walk = walkToShore(student, seat, scene, () => log(student))
   walkers.push(walk)
   remaining = candidates.length - departed
   scene.querySelector('#remaining').textContent = remaining
  }
  if (docked && remaining === 1 && !sleeperReady) {
   sleepStudent(scene.querySelector(`[data-passenger="${selected.id}"]`), selected)
   scene.dataset.finaleStage = 'waiting'
   sleeperReady = true
  }
  if (docked && elapsed > travelTime + 1400) title.textContent = ''
  if (departed === leaving.length && docked && !finished) {
   finished = true
   Promise.all(walkers).then(() => {
    if (version !== journeyVersion || !scene.isConnected) return
    clearInterval(timer)
    winnerFinale = createWinnerFinale(scene, selected, { onWake: () => weatherController?.celebrate() })
    winnerFinale.finished.then(completed => {
     if (completed && version === journeyVersion && scene.isConnected) {
      scene.dataset.finaleStage = 'revealed'
      reveal(candidates.length)
     }
    })
   })
  }
 }, 50)
}

function reveal(total){const result=document.querySelector('#result');if(!result)return; result.innerHTML=tr`<div class="result-overlay"><div class="confetti">${Array.from({length:35},(_,i)=>`<i style="--i:${i};--x:${(i*73)%100}%;--d:${(i%7)*.3}s"></i>`).join('')}</div><div class="chalkboard"><div class="board-tag">CẬP BẾN TRI THỨC</div><div class="result-avatar">${selected.photo?`<img src="${selected.photo}" alt="">`:`<img src="${winnerPortrait(selected)}" alt="">`}</div><p class="board-intro">VÀ HÀNH KHÁCH MAY MẮN LÀ</p><h2>${esc(selected.name)}</h2><p class="board-message">${t(teacher)} đã đưa em sang tận bờ. Mời em lên bảng nhé!</p><p class="board-small">${total>1?tr`Cả ${total-1} bạn đã lên bờ, chỉ còn em ngủ quên trên đò.`:t('Chuyến đò đã cập bến thật vui!')}</p><div class="result-buttons"><button class="result-primary" data-game="again">${icon('rotate-ccw',15)} Chuyến đò mới</button><button data-game="skip">Cho bạn nghỉ, chờ tiếp</button><button data-game="stop">Sửa danh sách</button></div></div></div>`;createIcons({icons:{RotateCcw}}); if(sound && 'speechSynthesis' in window){let utterance=new SpeechSynthesisUtterance(tr`${selected.name}, mời em lên bảng nhé!`);utterance.lang=getLanguage() === 'en' ? 'en-GB' : 'vi-VN';speechSynthesis.speak(utterance)}}
app.addEventListener('click',e=>{const el=e.target.closest('button');if(!el)return;const cls=current();let a=el.dataset.action, g=el.dataset.game
 if(el.dataset.class){activeId=el.dataset.class;draw();return} if(el.dataset.gender){} if(el.dataset.teacher){teacher=el.dataset.teacher;try{localStorage.setItem('ferry-teacher',teacher)}catch{}app.querySelectorAll('[data-teacher]').forEach(button=>{const active=button.dataset.teacher===teacher;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active))});return} if(el.dataset.speed){speed=el.dataset.speed;draw();return}
 if(el.dataset.remove){cls.students=cls.students.filter(s=>s.id!==el.dataset.remove);save();draw();return} if(el.dataset.presence){let s=cls.students.find(s=>s.id===el.dataset.presence);s.present=!s.present;save();draw();return} if(el.dataset.sex){let s=cls.students.find(s=>s.id===el.dataset.sex);s.gender=s.gender==='Nam'?'Nữ':'Nam';save();draw();return} if(el.dataset.photo){let input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=()=>{let f=input.files[0];if(!f)return;let reader=new FileReader();reader.onload=()=>{cls.students.find(s=>s.id===el.dataset.photo).photo=reader.result;save();draw()};reader.readAsDataURL(f)};input.click();return}
 if(a==='gender'){gender=gender==='Nam'?'Nữ':'Nam';draw()} if(a==='add-student'){let input=document.querySelector('#student-name');if(input.value.trim()){if(cls.sample){cls.students=[];cls.sample=false}cls.students.push(makeStudent(input.value,gender));save();draw()}} if(a==='bulk-add'){let names=document.querySelector('#bulk-names').value.split(/\r?\n/).map(n=>n.trim()).filter(Boolean);if(names.length){if(cls.sample){cls.students=[];cls.sample=false}cls.students.push(...names.map(n=>makeStudent(n)));save();draw()}} if(a==='add-class'){let c={id:crypto.randomUUID(),name:`Lớp ${classes.length+1}`,students:[],sample:false};classes.push(c);activeId=c.id;save();draw()} if(a==='delete-class'){if(confirm(tr`Xóa ${classLabel(cls.name)}?`)){classes=classes.filter(c=>c.id!==cls.id);if(!classes.length)classes=defaultClasses();activeId=classes[0].id;save();draw()}} if(a==='clear' && confirm(t('Xóa tất cả học sinh trong lớp này?'))){cls.students=[];cls.sample=false;save();draw()} if(a==='sample'){cls.students=sample.map(n=>makeStudent(n));cls.sample=true;save();draw()} if(a==='launch')game(); if(a==='music'){toggleMusic();draw()} if(a==='sound'){sound=!sound;draw()} if(a==='fullscreen'||g==='fullscreen'){if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()}
 if(g==='stop'){stopJourney();window.speechSynthesis?.cancel();draw()} if(g==='again'){game()} if(g==='skip'){selected.present=false;save();if(cls.students.some(s=>s.present))game();else draw()} if(g==='names'){showNames=!showNames;app.querySelector('.game').classList.toggle('hide-names',!showNames);el.textContent=tr`Tên: ${showNames?t('hiện'):t('ẩn')}`} if(g==='music'){toggleMusic();el.textContent=tr`Nhạc: ${music?t('bật'):t('tắt')}`} if(g==='sound'){sound=!sound;if(sound)unlockWeatherAudio();weatherController?.setSound(sound);el.textContent=tr`Âm thanh: ${sound?t('bật'):t('tắt')}`}
})
app.addEventListener('change',e=>{if(e.target.id==='language'){const drafts=['student-name','bulk-names'].map(id=>[id,document.getElementById(id)?.value]);setLanguage(e.target.value);draw();drafts.forEach(([id,value])=>{if(value!==undefined)document.getElementById(id).value=value});return}if(e.target.id==='class-name'){current().name=e.target.value.trim()||'Lớp học';save();draw()} if(e.target.id==='photos'){const cls=current();[...e.target.files].forEach(f=>{let base=f.name.replace(/\.[^.]+$/,'').toLowerCase();let s=cls.students.find(s=>s.name.toLowerCase()===base||s.name.toLowerCase().endsWith(base));if(s){let reader=new FileReader();reader.onload=()=>{s.photo=reader.result;save();draw()};reader.readAsDataURL(f)}})}})
app.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='student-name')document.querySelector('[data-action="add-student"]').click()})
draw()
