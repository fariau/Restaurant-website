const MENU=[
{c:'Dinner',e:'🍽️',n:'Dinner Buffet · Adult',d:'Daily · 7–9 PM and 9:30 PM–12 AM',p:2900,t:[]},
{c:'Dinner',e:'🧒',n:'Dinner Buffet · Child (4–7)',d:'Daily · 7–9 PM and 9:30 PM–12 AM',p:1399,t:[]},
{c:'Brunch',e:'🥞',n:'Weekend Brunch · Adult',d:'Sat–Sun · 10 AM–12 PM and 12–2 PM',p:1899,t:[]},
{c:'Brunch',e:'🧒',n:'Weekend Brunch · Child (4–7)',d:'Sat–Sun · 10 AM–12 PM and 12–2 PM',p:1099,t:[]},
{c:'Hi-Tea',e:'🫖',n:'Hi-Tea · Adult',d:'Fri–Sun · 4–6 PM',p:1638,t:[]},
{c:'Hi-Tea',e:'🧒',n:'Hi-Tea · Child (4–7)',d:'Fri–Sun · 4–6 PM',p:999,t:[]}];
const ALIAS={0:'dinner',1:'child dinner|kids dinner|kid dinner|dinner child|dinner kid',2:'brunch',3:'child brunch|kids brunch|kid brunch|brunch child|brunch kid',4:'hi-tea|hi tea|high tea|hitea',5:'child hi-tea|kids hi-tea|kid hi-tea|child hi tea|kids hi tea|child high tea|kids high tea'};
const CATS=[...new Set(MENU.map(m=>m.c))],CATE={Dinner:'🍽️',Brunch:'🥞','Hi-Tea':'🫖'};
const NUM={a:1,an:1,one:1,two:2,three:3,four:4,five:5,six:6};
const cart={};let flow=null,lastOrder=null;
const log=document.getElementById('log'),inp=document.getElementById('in');
const rs=n=>'Rs '+n.toLocaleString('en-US');
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const sub=()=>Object.entries(cart).reduce((s,[i,q])=>s+MENU[i].p*q,0);
const fee=m=>m==='Pickup'||sub()>=3000?0:150;
function count(){const n=Object.values(cart).reduce((a,b)=>a+b,0);document.getElementById('cc').textContent=n;return n}
function down(){log.scrollTop=log.scrollHeight}
function chipRow(arr,fn){const w=document.createElement('div');w.className='chips';arr.forEach(c=>{const b=document.createElement('button');b.className='chip';b.textContent=c;b.onclick=()=>fn(c);w.appendChild(b)});return w}
function say(html,chips,wide){const d=document.createElement('div');d.className='m bot'+(wide?' wide':'');d.innerHTML='<span class="dots"><i></i><i></i><i></i></span>';log.appendChild(d);down();
 setTimeout(()=>{d.innerHTML=typeof html==='function'?'':html;if(typeof html==='function')html(d);if(chips)d.appendChild(chipRow(chips,send));down()},420);return d}
function me(t){const d=document.createElement('div');d.className='m usr';d.textContent=t;log.appendChild(d);down()}
const MAIN=['📖 Buffet prices','🪑 Book a table','🕒 Timings','🛒 Cart'];
const q=document.getElementById('quick');q.appendChild(chipRow(['📖 Buffet prices','🪑 Book a table','🛒 Cart','🕒 Timings','📞 Contact'],send));

function add(i,n=1){cart[i]=(cart[i]||0)+n;if(cart[i]<=0)delete cart[i];count()}
function menuCard(el,cat,filter){el.innerHTML='';el.classList.add('wide');
 const tabs=document.createElement('div');tabs.className='tabs';
 ['All',...CATS].forEach(c=>{const b=document.createElement('button');b.className='chip'+(c===(filter||cat)?' on':'');b.textContent=(CATE[c]||'')+' '+c;b.onclick=()=>menuCard(el,c);tabs.appendChild(b)});
 el.appendChild(tabs);
 const list=MENU.map((m,i)=>[m,i]).filter(([m])=>cat==='All'||m.c===cat||(cat==='Vegetarian'&&m.t.includes('veg'))||(cat==='Popular'&&m.t.includes('pop')));
 list.forEach(([m,i])=>{const r=document.createElement('div');r.className='item';
  r.innerHTML=`<div class="emo">${m.e}</div><div class="t"><b>${m.n}</b>${m.t.includes('veg')?'<span class="tag">veg</span>':''}${m.t.includes('spicy')?'<span class="tag">🌶 spicy</span>':''}<p>${m.d}</p><div class="price">${rs(m.p)} <small style="color:var(--mute);font-weight:400">per person + tax</small></div></div>`;
  const b=document.createElement('button');b.className='add';b.textContent='Add';b.onclick=()=>{add(i);b.textContent='✓ Added';b.classList.add('done');setTimeout(()=>{b.textContent='Add';b.classList.remove('done')},900)};
  r.appendChild(b);el.appendChild(r)});
 el.appendChild(chipRow(['🛒 View cart','🪑 Reserve with these'],send));}
function showMenu(cat='All'){say(el=>{menuCard(el,cat)},null,true)}
function cartCard(el,mode){el.innerHTML='';el.classList.add('wide');
 if(!count()){el.innerHTML='Your selection is empty. Browse the buffet options or type something like <i>“2 dinner buffet and 1 child dinner”</i>.';el.appendChild(chipRow(['📖 Buffet prices'],send));return}
 el.insertAdjacentHTML('beforeend','<b>Your buffet selection</b>');
 Object.entries(cart).forEach(([i,qty])=>{const r=document.createElement('div');r.className='row';
  r.innerHTML=`<div>${MENU[i].e} ${MENU[i].n}<br><small style="color:var(--mute)">${rs(MENU[i].p)} each</small></div>`;
  const s=document.createElement('div');s.className='step';s.innerHTML=`<button aria-label="Remove one">−</button><span>${qty}</span><button aria-label="Add one">+</button>`;
  s.children[0].onclick=()=>{add(+i,-1);cartCard(el)};s.children[2].onclick=()=>{add(+i);cartCard(el)};r.appendChild(s);el.appendChild(r)});
 const f=fee();el.insertAdjacentHTML('beforeend',`<div class="sum"><div class="row big"><span>Estimate (excl. tax)</span><span>${rs(sub())}</span></div></div>`);
 el.appendChild(chipRow(['🪑 Reserve with these','➕ Add more','🗑 Clear cart'],send));down()}
function showCart(){say(el=>cartCard(el),null,true)}

function parseItems(t){let any=false;const words=t.replace(/[,&]|\band\b/g,'|').split('|');
 words.forEach(seg=>{seg=seg.trim();if(!seg)return;let best=-1,len=0;
  Object.entries(ALIAS).forEach(([i,al])=>al.split('|').forEach(a=>{if(seg.includes(a)&&a.length>len){best=+i;len=a.length}}));
  if(best<0)return;let n=1;const dm=seg.match(/\d+/);if(dm)n=Math.min(+dm[0],20);else{const w=seg.split(/\s+/).find(x=>NUM[x]);if(w)n=NUM[w]}
  add(best,n);any=true;(parseItems.got=parseItems.got||[]).push(`${n} × ${MENU[best].n}`)});return any}

const cartLine=()=>Object.entries(cart).map(([i,q])=>q+' × '+MENU[i].n).join(', ');
/* flows */
const days=()=>[0,1,2,3].map(o=>{const d=new Date();d.setDate(d.getDate()+o);return o===0?'Today':o===1?'Tomorrow':d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})});
function startRes(){flow={t:'res',s:0,d:{}};say('I’d love to get you a table. <b>Which day</b> are you thinking?',days())}
function startOrder(){if(!count())return showCart();startRes()}
const phoneOk=t=>t.replace(/\D/g,'').length>=10;
function run(raw){const t=raw.toLowerCase().trim(),f=flow,d=f.d;
 if(/^(cancel|stop|exit|never ?mind|go back)/.test(t)){flow=null;return say('No problem, I’ve cancelled that. What else can I help with?',MAIN)}
 const yes=/^(y|yes|yeah|confirm|ok|sure|correct)/.test(t);
 if(f.t==='res'){
  if(f.s===0){d.date=raw;f.s=1;say('Lovely. <b>What time</b>?',['10:00 AM (brunch)','12:00 PM (brunch)','4:00 PM (hi-tea)','7:00 PM (dinner)','9:30 PM (dinner)'])}
  else if(f.s===1){d.time=raw;f.s=2;say('<b>How many guests</b>?',['1','2','4','6','8'])}
  else if(f.s===2){const n=parseInt(t);if(!n||n<1)return say('Please give me a number of guests, like 4.');if(n>12)return say('For parties over 12, please call us so we can arrange seating. Could you try a smaller number?');d.g=n;f.s=3;say('And your <b>name</b>?')}
  else if(f.s===3){d.name=raw;f.s=4;say(`Thanks, ${esc(raw)}. What’s the best <b>phone number</b> for the booking?`)}
  else if(f.s===4){if(!phoneOk(t))return say('That number looks too short. Could you re-enter it with at least 10 digits?');d.ph=raw;f.s=5;
   say(`<b>Please check your booking</b><div class="kv"><span>Name</span><b>${esc(d.name)}</b><span>Date</span><b>${esc(d.date)}</b><span>Time</span><b>${esc(d.time)}</b><span>Guests</span><b>${d.g}</b><span>Phone</span><b>${esc(d.ph)}</b>${count()?`<span>Buffet</span><b>${cartLine()}</b><span>Estimate</span><b>${rs(sub())} + tax</b>`:''}</div>Shall I confirm?`,['Yes, confirm','Cancel'])}
  else if(f.s===5){if(yes){const id='TBL-'+Math.floor(1000+Math.random()*9000);const bk=count()?'<br>Buffet: '+cartLine()+' (estimate '+rs(sub())+' + tax, paid at the restaurant)':'';Object.keys(cart).forEach(k=>delete cart[k]);count();flow=null;say(`<div class="ok">✓ Table confirmed</div>Reference <b>${id}</b>${bk}<br>We’ll see you ${esc(d.date)} at ${esc(d.time)}, ${esc(d.name)}. Your table is held for 15 minutes past the booking time.`,['📖 Menu','🛒 Cart'])}else say('Reply “yes” to confirm, or “cancel”.',['Yes, confirm','Cancel'])}
 }else{
  if(f.s===0){d.mode=/pick/.test(t)?'Pickup':'Delivery';f.s=1;say('Who’s the order for? Your <b>name</b>, please.')}
  else if(f.s===1){d.name=raw;f.s=2;say('And a <b>phone number</b> in case we need to reach you?')}
  else if(f.s===2){if(!phoneOk(t))return say('That number looks too short. Could you re-enter it with at least 10 digits?');d.ph=raw;if(d.mode==='Delivery'){f.s=3;say('What’s the full <b>delivery address</b>?')}else{f.s=4;say('How would you like to pay?',['Cash','Card at counter'])}}
  else if(f.s===3){if(raw.length<8)return say('Could you add a bit more detail, like house number, street and area?');d.addr=raw;f.s=4;say('How would you like to pay?',['Cash on delivery','Card on delivery'])}
  else if(f.s===4){d.pay=raw;f.s=5;say(el=>{const f2=fee(d.mode);let h='<b>Order summary</b>';Object.entries(cart).forEach(([i,qn])=>h+=`<div class="row"><span>${qn} × ${MENU[i].n}</span><span>${rs(MENU[i].p*qn)}</span></div>`);
    h+=`<div class="sum"><div class="row"><span>Delivery</span><span>${f2?rs(f2):'Free'}</span></div><div class="row big"><span>Total</span><span>${rs(sub()+f2)}</span></div></div><div class="kv"><span>${d.mode}</span><b>${esc(d.name)}, ${esc(d.ph)}</b>${d.addr?`<span>Address</span><b>${esc(d.addr)}</b>`:''}<span>Payment</span><b>${esc(d.pay)}</b></div>Place this order?`;
    el.classList.add('wide');el.innerHTML=h;el.appendChild(chipRow(['Yes, place order','Cancel'],send))},null,true)}
  else if(f.s===5){if(yes||/place/.test(t)){const id='ORD-'+Math.floor(10000+Math.random()*90000),tot=sub()+fee(d.mode);Object.keys(cart).forEach(k=>delete cart[k]);count();flow=null;lastOrder={id,mode:d.mode};
   say(el=>{el.classList.add('wide');el.innerHTML=`<div class="ok">✓ Order placed</div>Order <b>${id}</b> · ${rs(tot)} · ${esc(d.pay)}<br>Estimated ${d.mode==='Delivery'?'45 minutes':'25 minutes'}.<div class="track"><div class="on">Received</div><div>Preparing</div><div>${d.mode==='Delivery'?'On the way':'Ready'}</div><div>${d.mode==='Delivery'?'Delivered':'Collected'}</div></div>`;
    const st=[...el.querySelectorAll('.track div')];let k=1;const iv=setInterval(()=>{if(k>=st.length)return clearInterval(iv);st[k++].classList.add('on')},6000)})}
   else say('Reply “yes” to place the order, or “cancel”.',['Yes, place order','Cancel'])}}}

function route(raw){const t=raw.toLowerCase().trim();if(!t)return;if(flow)return run(raw);
 if(/clear.*cart|empty.*cart|remove all/.test(t)){Object.keys(cart).forEach(k=>delete cart[k]);count();return say('Your cart is now empty.',['📖 Menu'])}
 if(/\b(table|reserv|book)/.test(t))return startRes();
 if(/\d|\b(one|two|three|four|five|six)\b/.test(t)){parseItems.got=[];if(parseItems(t)){say(`Added <b>${parseItems.got.join(', ')}</b> to your selection.`,null);return showCart()}}
 if(/track|where.*order|order status/.test(t))return say(lastOrder?`Your order <b>${lastOrder.id}</b> is being prepared. It will be with you shortly.`:'You don’t have an active order yet. Ready to place one?',['📖 Menu']);
 if(/checkout|place.*order|^(✅ )?order$|i want to order|ready to order/.test(t))return startOrder();
 if(/\b(cart|basket)\b/.test(t))return showCart();
 if(/add more/.test(t))return showMenu();

 if(/popular|best|recommend|suggest|favou?rite|special|spread|bbq|what.*(food|dishes|served)/.test(t))return say('Guests love the <b>BBQ</b> (chicken tikka, beef bihari kabab, malai boti), desi favourites like <b>nihari and haleem</b>, plus Chinese, seafood and desserts such as kheer. The spread changes, so call us to confirm what’s on today.',['📖 Buffet prices','🪑 Book a table']);
 if(/veg(etarian|gie)?\b|no meat/.test(t))return say('The buffet includes vegetarian dishes such as <b>chana and aloo tarkari</b>, plus salads and desserts. The line-up rotates, so please call to confirm.',['📖 Buffet prices']);
 if(/menu|buffet|price|cost|per head|how much|rate|food/.test(t))return showMenu();
 if(/hour|open|close|timing|when|slot/.test(t))return say('<b>Dinner</b> (daily): 7–9 PM and 9:30 PM–12 AM<br><b>Weekend brunch</b> (Sat–Sun): 10 AM–12 PM and 12–2 PM<br><b>Hi-Tea</b> (Fri–Sun): 4–6 PM',MAIN);
 if(/contact|phone|call|address|location|where/.test(t))return say('Call <b>0304-1110024</b> (Seaview) or <b>0300 3716888</b> (Karsaz) to reserve or ask about the day’s spread.',MAIN);
 if(/deliver|takeaway|take away|shipping/.test(t))return say('Chaupal is a <b>dine-in buffet</b>. For takeaway or catering enquiries, please call us.',MAIN);
 if(/pay|cash|card|tax/.test(t))return say('Buffet prices are <b>per person plus tax</b> and are settled at the restaurant.',MAIN);
 if(/^(hi|hello|hey|salam|assalam|good (morning|afternoon|evening))/.test(t))return say('Hello, and welcome to <b>Chaupal</b>! 😊 How can I help you today?',MAIN);
 if(/thank/.test(t))return say('You’re very welcome! Anything else I can get you?',MAIN);
 if(/help|what can you/.test(t))return say('I can show <b>buffet prices</b> and <b>timings</b>, and <b>book a table</b>. You can also type things like <i>“2 dinner buffet and 1 child dinner”</i>.',MAIN);
 parseItems.got=[];if(parseItems(t)){const g=parseItems.got.join(', ');say(`Added <b>${g}</b> to your cart.`,null);return showCart()}
 say('Sorry, I didn’t quite catch that. Here’s what I can help with:',MAIN)}
function send(t){const c=t.replace(/^[^\w“"]+\s*/,'')||t;me(c);route(c)}
document.getElementById('f').onsubmit=e=>{e.preventDefault();const v=inp.value.trim();if(!v)return;inp.value='';me(v);route(v)};
document.getElementById('cartbtn').onclick=()=>{flow=null;me('Cart');showCart()};
say('Welcome to <b>Chaupal</b> 👋 I can show buffet prices and timings, or book you a table. What would you like to do?',MAIN);

const chat=document.getElementById('chat'),launch=document.getElementById('launch');
function openChat(msg){chat.classList.add('open');launch.classList.add('hide');if(msg)send(msg);else inp.focus()}
function closeChat(){chat.classList.remove('open');launch.classList.remove('hide')}
launch.onclick=()=>openChat();
document.getElementById('closebtn').onclick=closeChat;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeChat()});
document.querySelectorAll('[data-chat]').forEach(b=>b.onclick=()=>openChat(b.dataset.chat));