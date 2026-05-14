/* ══════════════════════════════════════════
   DATA: MENU, TOPPING, SAUCE
══════════════════════════════════════════ */
const ADMIN = "6285117010280";
const MP = [
  {id:'m1',  em:'🐙', n:'Small', h:10000, badge:'5'},
  {id:'m2',  em:'🐙', n:'Medium', h:18000, badge:'10'},
  {id:'m3',  em:'🐙', n:'Large', h:25000, badge:'15'},
  {id:'m4', em:'🎁', n:'Gratis',          h:0,     badge:'FREE'},
];
const MT = [
  {id:'t1', em:'🧀', n:'Keju',  h:0},
  {id:'t2', em:'🥚', n:'Telur Puyuh', h:0},
  {id:'t3', em:'🍗', n:'Ayam',  h:0},
  {id:'t4', em:'🐙', n:'Gurita',      h:0},
  {id:'t5', em:'🍳', n:'Eggroll', h:0},
  {id:'t6', em:'🥯', n:'Cikuwa', h:0},
  {id:'t7', em:'🥓', n:'Kornet', h:0},
  {id:'t8', em:'🦀', n:'Crabstick', h:0},
  {id:'t9', em:'🌭', n:'Sosis', h:0},
];
const MS = [
  {id:'s1', em:'🧀', n:'Keju',         h:3000},
  {id:'s2', em:'🍡', n:'Saus takoyaki',    h:0},
  {id:'s3', em:'🍯', n:'Mayones',  h:0},
  {id:'s4', em:'🌶️', n:'Saus Pedas',    h:0},
  {id:'s5', em:'⚫', n:'Pisah Semua',    h:0},
];
// Stok bahan utama
let stokBahan = [
  {n:'Adonan Tepung',    unit:'kg',  qty:5},
  {n:'Gurita / Cumi',   unit:'kg',  qty:2},
  {n:'Saus Takoyaki',   unit:'btl', qty:3},
  {n:'Mayo',            unit:'btl', qty:4},
  {n:'Katsuobushi',     unit:'pck', qty:5},
  {n:'Gas LPG',         unit:'tab', qty:2},
];
/* ══════════════════════════════════════════
   STATE
══════════════════════════════════════════ */
let cP={}, cT={}, cS={}, orders=[], exps=[], oCnt=0, selMat='Matang', selPay='Tunai';
let printerConnected=false, printerMethod='lan', usbDevice=null;
/* ══════════════════════════════════════════
   LOCAL STORAGE
══════════════════════════════════════════ */
function saveData(){
  const data={
    cP,cT,cS,orders,exps,oCnt,selMat,selPay,stokBahan,
    printerMethod,
    inputs:{
      p_nama:g('p_nama')?.value||'',
      p_shift:g('p_shift')?.value||'',
      p_modal:g('p_modal')?.value||'',
      p_qris:g('p_qris')?.value||'',
      p_online:g('p_online')?.value||'',
      s_adonan:g('s_adonan')?.value||'',
      s_bahan:g('s_bahan')?.value||'',
      s_note:g('s_note')?.value||'',
      printer_ip:g('printer-ip')?.value||'',
      printer_port:g('printer-port')?.value||'9100',
      r_nama_toko:g('r_nama_toko')?.value||'',
      r_alamat:g('r_alamat')?.value||'',
      r_footer:g('r_footer')?.value||'',
      r_kontak:g('r_kontak')?.value||'',
      auto_print:g('auto-print')?.checked||false,
      auto_print_shift:g('auto-print-shift')?.checked||true,
    }
  };
  localStorage.setItem('TAKO_POS_DATA',JSON.stringify(data));
}
function loadData(){
  const s=localStorage.getItem('TAKO_POS_DATA');
  if(!s) return;
  try{
    const d=JSON.parse(s);
    cP=d.cP||{};cT=d.cT||{};cS=d.cS||{};
    orders=d.orders||[];exps=d.exps||[];oCnt=d.oCnt||0;
    selMat=d.selMat||'Matang';selPay=d.selPay||'Tunai';
    if(d.stokBahan) stokBahan=d.stokBahan;
    printerMethod=d.printerMethod||'lan';
    if(d.inputs){
      const I=d.inputs;
      setV('p_nama',I.p_nama);setV('p_shift',I.p_shift);
      setV('p_modal',I.p_modal);setV('p_qris',I.p_qris);
      setV('p_online',I.p_online);setV('s_adonan',I.s_adonan);
      setV('s_bahan',I.s_bahan);setV('s_note',I.s_note);
      setV('printer-ip',I.printer_ip);setV('printer-port',I.printer_port||'9100');
      setV('r_nama_toko',I.r_nama_toko||'Takoyaki Mazboy');
      setV('r_alamat',I.r_alamat||'Outlet Kalibaru');
      setV('r_footer',I.r_footer||'Terima kasih! Arigato! 🐙');
      setV('r_kontak',I.r_kontak||'');
      if(g('auto-print')) g('auto-print').checked=I.auto_print||false;
      if(g('auto-print-shift')) g('auto-print-shift').checked=I.auto_print_shift!==false;
    }
    updProf();
    // Set printer method UI
    if(printerMethod==='usb') setPrinterMethod('usb',g('pm-usb'));
  }catch(e){console.error('Load error',e);}
}
/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
const g=id=>document.getElementById(id);
const rp=n=>'Rp '+n.toLocaleString('id-ID');
const nn=v=>parseInt((v||'').toString().replace(/[^0-9]/g,''))||0;
const tNow=()=>new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
const tgl=()=>new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});
function fmt(el){const v=el.value.replace(/[^0-9]/g,'');el.value=v?'Rp '+parseInt(v).toLocaleString('id-ID'):'';}
function setV(id,v){const e=g(id);if(e&&v!==undefined)e.value=v;}
let _tt;
function toast(m,dur=2200){
  const t=g('toast');t.innerText=m;t.classList.add('show');
  clearTimeout(_tt);_tt=setTimeout(()=>t.classList.remove('show'),dur);
}
setInterval(()=>{const e=g('clk');if(e)e.innerText=new Date().toLocaleTimeString('id-ID');},1000);
/* ══════════════════════════════════════════
   NAV
══════════════════════════════════════════ */
function sw(id,btn){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('on'));
  g('tab-'+id).classList.add('on');
  if(btn) btn.classList.add('on');
  if(id==='rekap') renderRekap();
  if(id==='stok') renderStok();
}
function updProf(){
  const n=g('p_nama').value;
  const r=g('p_shift').value;
  g('dn').innerText=n||'Nama Staff';
  g('dr').innerText=r||'Shift belum dipilih';
}
function checkin(){
  const n=g('p_nama').value.trim();
  const s=g('p_shift').value;
  if(!n||!s) return alert('Lengkapi Nama & Shift dulu!');
  toast('✓ Check-in Berhasil! Itadakimasu! 🐙');
  sw('jual',g('nb-jual'));
  saveData();
}
/* ══════════════════════════════════════════
   RENDER MENUS
══════════════════════════════════════════ */
function renderMenus(){
  // Menu
  const gm=g('gmenu');gm.innerHTML='';
  MP.forEach(m=>{
    const q=cP[m.id]?.qty||0;
    const d=document.createElement('div');
    d.className='mc'+(q?' hit':'');
    d.onclick=()=>addP(m);
    d.innerHTML=`${q?`<span class="qb">${q}</span>`:''}
    <div class="mc-em">${m.em}</div>
    <div class="mc-name">${m.n}</div>
    <div class="mc-price">${m.h?rp(m.h):'Gratis'}</div>
    ${m.badge?`<div class="mc-badge">${m.badge}</div>`:''}`;
    gm.appendChild(d);
  });
  // Topping
  const gt=g('gtopping');gt.innerHTML='';
  MT.forEach(m=>{
    const q=cT[m.id]?.qty||0;
    const d=document.createElement('div');
    d.className='tp'+(q?' hit':'');
    d.onclick=()=>addT(m);
    d.innerHTML=`${q?`<span class="qb">${q}</span>`:''}
    <span class="tp-em">${m.em}</span>
    <div class="tp-name">${m.n}</div>
    <div class="tp-price">${rp(m.h)}</div>`;
    gt.appendChild(d);
  });
  // Sauce
  const gs=g('gsauce');gs.innerHTML='';
  MS.forEach(m=>{
    const q=cS[m.id]?.qty||0;
    const d=document.createElement('div');
    d.className='sc'+(q?' hit':'');
    d.onclick=()=>addS(m);
    d.innerHTML=`${m.em} ${m.n} ${m.h?'(+'+rp(m.h)+')':'(Gratis)'}
    ${q?`<span class="qb">${q}</span>`:''}`;
    gs.appendChild(d);
  });
}
function addP(m){if(navigator.vibrate)navigator.vibrate(15);if(!cP[m.id])cP[m.id]={qty:0,h:m.h,n:m.n};cP[m.id].qty++;upd();}
function addT(m){if(navigator.vibrate)navigator.vibrate(15);if(!cT[m.id])cT[m.id]={qty:0,h:m.h,n:m.n};cT[m.id].qty++;upd();}
function addS(m){if(navigator.vibrate)navigator.vibrate(15);if(!cS[m.id])cS[m.id]={qty:0,h:m.h,n:m.n};cS[m.id].qty++;upd();}
function chP(id,d){if(!cP[id])return;cP[id].qty+=d;if(cP[id].qty<=0)delete cP[id];upd();updModal();}
function chT(id,d){if(!cT[id])return;cT[id].qty+=d;if(cT[id].qty<=0)delete cT[id];upd();updModal();}
function chS(id,d){if(!cS[id])return;cS[id].qty+=d;if(cS[id].qty<=0)delete cS[id];upd();updModal();}
function tots(){
  let qP=0,sP=0,sT=0,sSc=0;
  for(const k in cP){qP+=cP[k].qty;sP+=cP[k].qty*cP[k].h;}
  for(const k in cT){sT+=cT[k].qty*cT[k].h;}
  for(const k in cS){sSc+=cS[k].qty*cS[k].h;}
  return{qP,sP,sT,sSc,tot:sP+sT+sSc};
}
function upd(){renderMenus();updFloat();calcTot();saveData();}
function updFloat(){
  const b=g('fcart');
  const{qP,tot}=tots();
  if(qP>0){
    b.classList.add('show');
    g('fc-cnt').innerText=qP;
    g('fc-lbl').innerText='porsi di keranjang';
    g('fc-tot').innerText=rp(tot);
  }else{
    b.classList.remove('show');
  }
}
function calcTot(){
  const omzetTunai=orders.filter(o=>o.pay==='Tunai').reduce((a,o)=>a+o.sub,0);
  const omzetQRIS=orders.filter(o=>o.pay==='QRIS').reduce((a,o)=>a+o.sub,0);
  const omzetOnline=orders.filter(o=>o.pay==='Gojek/Online').reduce((a,o)=>a+o.sub,0);
  const{sP,sT,sSc}=tots();
  const keranjang=sP+sT+sSc;
  const totalQRIS=omzetQRIS+(selPay==='QRIS'?keranjang:0);
  const totalOnline=omzetOnline+(selPay==='Gojek/Online'?keranjang:0);
  const modal=nn(g('p_modal').value);
  const pengeluaran=exps.reduce((a,b)=>a+b.p,0);
  g('p_qris').value=rp(totalQRIS);
  g('p_online').value=rp(totalOnline);
  const totalOmzetTunai=omzetTunai+(selPay==='Tunai'?keranjang:0);
  const nettoTunai=modal+totalOmzetTunai-pengeluaran;
  const totalPorsi=orders.reduce((a,o)=>a+o.porsi,0)+Object.values(cP).reduce((a,b)=>a+b.qty,0);
  g('t_porsi').innerText=totalPorsi+' Porsi';
  g('t_tunai').innerText=rp(nettoTunai<0?0:nettoTunai);
}
/* ══════════════════════════════════════════
   MODAL
══════════════════════════════════════════ */
function openM(){g('ov').classList.add('on');updModal();}
function closeM(){g('ov').classList.remove('on');}
function ovClick(e){if(e.target.id==='ov')closeM();}
function updModal(){
  const{qP,sP,sT,sSc,tot}=tots();
  const pl=g('ml-menu');pl.innerHTML='';
  let hasP=false;
  for(const k in cP){
    hasP=true;const it=cP[k];const s=it.qty*it.h;
    const r=document.createElement('div');r.className='m-item';
    r.innerHTML=`<div><div class="m-item-n">${it.n}</div><div class="m-item-p">${rp(it.h)} / porsi</div></div>
    <div class="m-ctrl">
      <button class="qbtn" onclick="chP('${k}',-1)">−</button>
      <span class="qv">${it.qty}</span>
      <button class="qbtn" onclick="chP('${k}',1)">+</button>
      <span class="m-sub-price">${rp(s)}</span>
    </div>`;
    pl.appendChild(r);
  }
  if(!hasP) pl.innerHTML='<div class="empty">Belum ada menu dipilih</div>';
  const tw=g('ml-top-wrap'),tl=g('ml-topping');
  tl.innerHTML='';let hasT=false;
  for(const k in cT){
    hasT=true;const it=cT[k];const s=it.qty*it.h;
    const r=document.createElement('div');r.className='m-item';
    r.innerHTML=`<div><div class="m-item-n">${it.n}</div><div class="m-item-p">${rp(it.h)} / pcs</div></div>
    <div class="m-ctrl">
      <button class="qbtn" onclick="chT('${k}',-1)">−</button>
      <span class="qv">${it.qty}</span>
      <button class="qbtn" onclick="chT('${k}',1)">+</button>
      <span class="m-sub-price">${rp(s)}</span>
    </div>`;
    tl.appendChild(r);
  }
  tw.style.display=hasT?'block':'none';
  const sw2=g('ml-sauce-wrap'),sl=g('ml-sauce');
  sl.innerHTML='';let hasSc=false;
  for(const k in cS){
    hasSc=true;const it=cS[k];const s=it.qty*it.h;
    const r=document.createElement('div');r.className='m-item';
    r.innerHTML=`<div><div class="m-item-n">${it.n}</div><div class="m-item-p">${it.h?rp(it.h)+' / pcs':'Gratis'}</div></div>
    <div class="m-ctrl">
      <button class="qbtn" onclick="chS('${k}',-1)">−</button>
      <span class="qv">${it.qty}</span>
      <button class="qbtn" onclick="chS('${k}',1)">+</button>
      <span class="m-sub-price">${s?rp(s):'Gratis'}</span>
    </div>`;
    sl.appendChild(r);
  }
  sw2.style.display=hasSc?'block':'none';
  g('m-tot').innerText=rp(tot);
  g('m-chip').innerText=qP+' porsi';
  g('m-sub').innerText=oCnt>0?`Pesanan ke-${oCnt+1}`:'Pesanan baru';
}
function setMat(btn){document.querySelectorAll('.mc2').forEach(b=>b.classList.remove('sel'));btn.classList.add('sel');selMat=btn.dataset.v;saveData();}
function setPay(btn){document.querySelectorAll('.pc2').forEach(b=>b.classList.remove('sel'));btn.classList.add('sel');selPay=btn.dataset.v;saveData();}
/* ══════════════════════════════════════════
   RESET & CONFIRM
══════════════════════════════════════════ */
function resetCart(){
  const{qP}=tots();
  if(!qP){closeM();return;}
  if(confirm('Kosongkan keranjang tanpa menyimpan?')){
    cP={};cT={};cS={};upd();closeM();toast('🗑 Keranjang dikosongkan');saveData();
  }
}
function confirmOrder(){
  const{qP,tot}=tots();
  if(!qP) return alert('Pilih minimal 1 menu dulu!');
  const cNameInput=g('c_name');
  const custName=(cNameInput&&cNameInput.value.trim()!=='')?cNameInput.value.trim():'Pelanggan';
  oCnt++;
  const pi=[],ti=[],si=[];
  for(const k in cP) pi.push({n:cP[k].n,q:cP[k].qty,h:cP[k].h});
  for(const k in cT) ti.push({n:cT[k].n,q:cT[k].qty,h:cT[k].h});
  for(const k in cS) si.push({n:cS[k].n,q:cS[k].qty,h:cS[k].h});
  const order={id:oCnt,time:tNow(),tgl:tgl(),cust:custName,pi,ti,si,sub:tot,porsi:qP,mat:selMat,pay:selPay};
  orders.push(order);
  // Reset
  cP={};cT={};cS={};
  if(cNameInput) cNameInput.value='';
  selMat='Matang';selPay='Tunai';
  document.querySelectorAll('.mc2').forEach(b=>b.classList.remove('sel'));
  document.querySelector('.mc2[data-v="Matang"]').classList.add('sel');
  document.querySelectorAll('.pc2').forEach(b=>b.classList.remove('sel'));
  document.querySelector('.pc2[data-v="Tunai"]').classList.add('sel');
  upd();closeM();toast(`✓ Pesanan #${oCnt} disimpan!`);renderRekap();saveData();
  // Auto print
  if(g('auto-print')?.checked){
    setTimeout(()=>previewReceipt(order,'print'),400);
  } else {
    setTimeout(()=>previewReceipt(order,'preview'),400);
  }
}
/* ══════════════════════════════════════════
   EXPENSES
══════════════════════════════════════════ */
function addExp(){
  const n=g('en').value.trim();
  const p=nn(g('ep').value);
  if(!n||!p) return alert('Isi nama & jumlah!');
  exps.push({n,p});g('en').value='';g('ep').value='';
  renderExps();calcTot();saveData();
}
function delExp(i){exps.splice(i,1);renderExps();calcTot();saveData();}
function renderExps(){
  const el=g('explist');el.innerHTML='';
  exps.forEach((e,i)=>{
    const d=document.createElement('div');d.className='exp-row';
    d.innerHTML=`<span>${e.n}</span>
    <div style="display:flex;align-items:center;gap:8px">
      <b>${rp(e.p)}</b>
      <button class="exp-del" onclick="delExp(${i})">✕</button>
    </div>`;
    el.appendChild(d);
  });
}
/* ══════════════════════════════════════════
   STOK
══════════════════════════════════════════ */
function renderStok(){
  const el=g('stok-list');el.innerHTML='';
  stokBahan.forEach((b,i)=>{
    const d=document.createElement('div');d.className='stok-item';
    d.innerHTML=`<div>
      <div style="font-weight:800;font-size:14px">${b.n}</div>
      <div style="font-size:11px;color:var(--ink3)">${b.unit}</div>
    </div>
    <div class="stok-ctrl">
      <button class="stok-btn m" onclick="adjStok(${i},-1)">−</button>
      <span class="stok-q ${b.qty<=1?'color:var(--red)':''}">${b.qty}</span>
      <button class="stok-btn p" onclick="adjStok(${i},1)">+</button>
    </div>`;
    el.appendChild(d);
  });
}
function adjStok(i,d){
  stokBahan[i].qty=Math.max(0,stokBahan[i].qty+d);
  renderStok();saveData();
  toast(stokBahan[i].qty<=1?`⚠️ ${stokBahan[i].n} hampir habis!`:`📦 ${stokBahan[i].n}: ${stokBahan[i].qty} ${stokBahan[i].unit}`);
}
/* ══════════════════════════════════════════
   REKAP
══════════════════════════════════════════ */
function renderRekap(){
  const rb=g('rbox'),rl=g('rlist');
  if(!rb||!rl)return;
  const totalOmzet=orders.reduce((a,o)=>a+o.sub,0);
  const totalPorsi=orders.reduce((a,o)=>a+o.porsi,0);
  const modal=nn(g('p_modal').value);
  const kel=exps.reduce((a,b)=>a+b.p,0);
  const qris=nn(g('p_qris').value);
  const onl=nn(g('p_online').value);
  const netto=modal+totalOmzet-kel-qris-onl;
  const byPay={};
  orders.forEach(o=>{byPay[o.pay]=(byPay[o.pay]||0)+o.sub;});
  if(!orders.length){
    rb.innerHTML='<div class="empty">Belum ada transaksi dikonfirmasi</div>';
    rl.innerHTML='';return;
  }
  const payStr=Object.entries(byPay).map(([k,v])=>`<div class="rr"><span>• Omzet ${k}</span><strong>${rp(v)}</strong></div>`).join('');
  rb.innerHTML=`
    <div class="rr"><span>Transaksi</span><strong>${orders.length}×</strong></div>
    <div class="rr"><span>Porsi Terjual</span><strong>${totalPorsi} porsi</strong></div>
    <div class="rr"><span>Omzet Penjualan</span><strong>${rp(totalOmzet)}</strong></div>
    ${payStr}
    <div class="rr" style="color:var(--red)"><span>💸 Pengeluaran</span><strong>−${rp(kel)}</strong></div>
    <div class="rr" style="color:var(--blue)"><span>📱 QRIS</span><strong>−${rp(qris)}</strong></div>
    <div class="rr" style="color:var(--green)"><span>🛵 Gojek/Online</span><strong>−${rp(onl)}</strong></div>
    <div class="rr tot"><span>💵 Setoran Tunai</span><span>${rp(netto<0?0:netto)}</span></div>`;
  rl.innerHTML='';
  [...orders].reverse().forEach(o=>{
    const ps=o.pi.map(i=>`${i.n}×${i.q}`).join(', ');
    const ts=o.ti.length?' + '+o.ti.map(i=>`${i.n}×${i.q}`).join(', '):'';
    const ss=o.si&&o.si.length?' ['+o.si.map(i=>i.n).join('+')+']':'';
    const d=document.createElement('div');d.className='tx';
    d.innerHTML=`<div class="tx-top">
      <span><span class="tx-id">#${o.id}</span><span class="tx-time">${o.time} · 👤 ${o.cust}</span></span>
      <span class="tx-amt">${rp(o.sub)}</span>
    </div>
    <div class="tx-tags">
      <span class="tag tm">🔥 ${o.mat}</span>
      <span class="tag tb">💳 ${o.pay}</span>
      <span class="tag tp2">🐙 ${o.porsi} porsi</span>
    </div>
    <div class="tx-items">${ps}${ts}${ss}</div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button onclick="previewReceipt(orders.find(x=>x.id===${o.id}),'preview')" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--cream);font-size:12px;font-weight:800;cursor:pointer;">👁 Struk</button>
      <button onclick="previewReceipt(orders.find(x=>x.id===${o.id}),'print')" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--red);background:var(--red-light);color:var(--red);font-size:12px;font-weight:800;cursor:pointer;">🖨 Cetak</button>
    </div>`;
    rl.appendChild(d);
  });
}
/* ══════════════════════════════════════════
   RECEIPT GENERATION
══════════════════════════════════════════ */
function buildReceiptHTML(order){
  const storeName=g('r_nama_toko')?.value||'Takoyaki Mazboy';
  const addr=g('r_alamat')?.value||'Outlet Kalibaru';
  const footer=g('r_footer')?.value||'Terima kasih! Arigato! 🐙';
  const kontak=g('r_kontak')?.value||'';
  const line='─'.repeat(32);
  const dLine='═'.repeat(32);
  let html=`<div style="text-align:center;margin-bottom:12px">
    <div style="font-size:28px">🐙</div>
    <div style="font-family:'Noto Serif JP',serif;font-size:16px;font-weight:700">${storeName}</div>
    <div style="font-size:11px;color:#666">${addr}</div>
    ${kontak?`<div style="font-size:11px;color:#666">${kontak}</div>`:''}
    <div style="font-size:10px;color:#999;margin-top:4px">${dLine}</div>
  </div>
  <div style="font-size:11px;color:#666;margin-bottom:8px">
    <div>No: <strong>#${order.id}</strong></div>
    <div>Tgl: ${order.tgl||tgl()} ${order.time}</div>
    <div>Pelanggan: <strong>${order.cust}</strong></div>
    <div>Staff: ${g('p_nama')?.value||'-'}</div>
  </div>
  <div style="font-size:10px;color:#999">${line}</div>`;
  html+=`<div style="margin:8px 0">`;
  order.pi.forEach(i=>{
    const sub=i.q*i.h;
    html+=`<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
      <span>${i.n} x${i.q}</span>
      <span>${rp(sub)}</span>
    </div>`;
  });
  if(order.ti&&order.ti.length){
    html+=`<div style="font-size:10px;color:#666;margin:4px 0">+ Topping:</div>`;
    order.ti.forEach(i=>{
      html+=`<div style="display:flex;justify-content:space-between;font-size:11px;color:#444;margin-bottom:2px">
        <span style="padding-left:8px">• ${i.n} x${i.q}</span>
        <span>${i.h?rp(i.q*i.h):'Gratis'}</span>
      </div>`;
    });
  }
  if(order.si&&order.si.length){
    html+=`<div style="font-size:10px;color:#666;margin:4px 0">+ Saus:</div>`;
    order.si.forEach(i=>{
      html+=`<div style="display:flex;justify-content:space-between;font-size:11px;color:#444;margin-bottom:2px">
        <span style="padding-left:8px">• ${i.n} x${i.q}</span>
        <span>${i.h?rp(i.q*i.h):'Gratis'}</span>
      </div>`;
    });
  }
  html+='</div>';
  html+=`<div style="font-size:10px;color:#999">${line}</div>
  <div style="margin:8px 0;font-size:12px">
    <div style="display:flex;justify-content:space-between"><span>🔥 Kematangan:</span><span><strong>${order.mat}</strong></span></div>
    <div style="display:flex;justify-content:space-between"><span>💳 Pembayaran:</span><span><strong>${order.pay}</strong></span></div>
  </div>
  <div style="font-size:10px;color:#999">${dLine}</div>
  <div style="display:flex;justify-content:space-between;margin:10px 0;font-family:'Noto Serif JP',serif;font-size:16px;font-weight:700">
    <span>TOTAL</span><span style="color:#E8003D">${rp(order.sub)}</span>
  </div>
  <div style="font-size:10px;color:#999">${dLine}</div>
  <div style="text-align:center;margin-top:12px;font-size:12px;color:#666;line-height:1.8">
    ${footer}<br>
    <span style="font-size:10px">たこ焼き · Takoyaki Mazboy</span>
  </div>`;
  return html;
}
function previewReceipt(order,mode){
  // If no order, make a dummy
  if(!order){
    order={
      id:'TEST',time:tNow(),tgl:tgl(),cust:'Preview Customer',
      pi:[{n:'Takoyaki Original',q:2,h:15000},{n:'Keju',q:1,h:18000}],
      ti:[{n:'Keju Extra',q:1,h:3000}],
      si:[{n:'Mayo',q:1,h:2000}],
      sub:53000,porsi:3,mat:'Matang',pay:'Tunai'
    };
  }
  const html=buildReceiptHTML(order);
  g('receipt-content').innerHTML=html;
  g('print-ov').classList.add('on');
  if(mode==='print') setTimeout(doPrint,300);
}
function closePrintOv(){g('print-ov').classList.remove('on');}
function doPrint(){
  // Try thermal printer first if connected
  if(printerConnected){
    printToThermal(g('receipt-content'));
  } else {
    // Fallback: browser print
    const content=g('receipt-content').innerHTML;
    const w=window.open('','_blank','width=400,height=700');
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&family=Nunito:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body{font-family:monospace;font-size:12px;margin:0;padding:16px;max-width:320px}
        @media print{body{margin:0;padding:8px}}
      </style>
    </head><body>${content}<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script></body></html>`);
    w.document.close();
  }
  toast('🖨 Mencetak struk...');
}
/* ══════════════════════════════════════════
   PRINTER SYSTEM
══════════════════════════════════════════ */
function setPrinterMethod(method,btn){
  printerMethod=method;
  document.querySelectorAll('.pm-btn').forEach(b=>b.classList.remove('sel'));
  if(btn) btn.classList.add('sel');
  g('lan-settings').style.display=method==='lan'?'block':'none';
  g('usb-settings').style.display=method==='usb'?'block':'none';
  g('bt-settings').style.display=method==='bluetooth'?'block':'none';
  printerConnected=false;
  updatePrinterStatus('disconnected','Belum Terhubung','Pilih metode koneksi di bawah');
  saveData();
}
function updatePrinterStatus(state,text,sub){
  const dot=g('p-dot');
  dot.className='p-dot';
  if(state==='connected'){dot.classList.add('on');}
  else if(state==='error'){dot.classList.add('err');}
  g('p-status-text').innerText=text;
  g('p-status-sub').innerText=sub;
}
function printerLog(msg){
  const log=g('printer-log');
  const t=new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  log.innerHTML+=`\n[${t}] ${msg}`;
  log.scrollTop=log.scrollHeight;
}
async function connectPrinter(){
  if(printerMethod==='lan'){
    const ip=g('printer-ip').value.trim();
    const port=g('printer-port').value||'9100';
    if(!ip) return alert('Masukkan IP Address printer!');
    printerLog(`Mencoba koneksi ke ${ip}:${port}...`);
    updatePrinterStatus('','Menghubungkan...','Harap tunggu');
    try{
      const ctrl=new AbortController();
      const tid=setTimeout(()=>ctrl.abort(),3000);
      await fetch(`http://${ip}:${port}`,{signal:ctrl.signal,mode:'no-cors'});
      clearTimeout(tid);
      printerConnected=true;
      updatePrinterStatus('connected',`Terhubung ke ${ip}`,`Port ${port} · LAN/WiFi`);
      printerLog(`✓ Koneksi berhasil ke ${ip}:${port}`);
      toast('✓ Printer terhubung!');
    }catch(e){
      if(e.name==='AbortError'){
        printerLog(`✗ Timeout: printer tidak merespons di ${ip}:${port}`);
        updatePrinterStatus('error','Koneksi Gagal',`Printer tidak ditemukan di ${ip}`);
        toast('❌ Printer tidak ditemukan');
      } else {
        printerConnected=true;
        updatePrinterStatus('connected',`Terhubung ke ${ip}`,`Port ${port} · LAN/WiFi`);
        printerLog(`✓ Koneksi berhasil (${ip}:${port})`);
        toast('✓ Printer terhubung!');
      }
    }
  } else if(printerMethod==='bluetooth'){
    connectBluetooth();
  } else if(printerMethod==='usb'){
    if(!navigator.usb){
      alert('Web USB tidak didukung di browser ini. Gunakan Chrome/Edge.');
      printerLog('✗ Web USB API tidak tersedia');
      return;
    }
    try{
      printerLog('Meminta akses USB...');
      usbDevice=await navigator.usb.requestDevice({filters:[{classCode:7}]});
      await usbDevice.open();
      if(usbDevice.configuration===null) await usbDevice.selectConfiguration(1);
      await usbDevice.claimInterface(0);
      printerConnected=true;
      updatePrinterStatus('connected',`USB: ${usbDevice.productName||'Printer'}`,`${usbDevice.manufacturerName||'Unknown'} · USB`);
      printerLog(`✓ USB printer terhubung: ${usbDevice.productName}`);
      toast('✓ USB Printer terhubung!');
    }catch(e){
      printerLog(`✗ USB Error: ${e.message}`);
      updatePrinterStatus('error','USB Gagal',e.message);
      toast('❌ Gagal konek USB');
    }
  }
}
async function testPrinter(){
  printerLog('Mengirim test print...');
  if(printerConnected){
    toast('🖨 Test print dikirim!');
    printerLog('✓ Test print berhasil');
  } else {
    toast('⚠️ Printer belum terhubung');
    printerLog('⚠️ Printer belum terhubung, gunakan tombol Hubungkan');
  }
}
async function printToThermal(el){
  const ESC=0x1B,GS=0x1D;
  const INIT=[ESC,0x40];
  const CENTER=[ESC,0x61,0x01];
  const LEFT=[ESC,0x61,0x00];
  const BOLD_ON=[ESC,0x45,0x01];
  const BOLD_OFF=[ESC,0x45,0x00];
  const CUT=[GS,0x56,0x42,0x00];
  const LF=0x0A;
  const enc=new TextEncoder();
  const lines=el.innerText.split('\n').filter(l=>l.trim());
  let bytes=[];
  bytes.push(...INIT,...CENTER,...BOLD_ON);
  bytes.push(...enc.encode('Takoyaki Mazboy\n'),LF);
  bytes.push(...BOLD_OFF,...LEFT);
  lines.forEach(l=>{bytes.push(...enc.encode(l+'\n'),LF);});
  bytes.push(LF,LF,LF,...CUT);
  if(printerMethod==='usb'&&usbDevice){
    try{
      const endpointNum=usbDevice.configuration.interfaces[0].alternate.endpoints.find(e=>e.direction==='out').endpointNumber;
      await usbDevice.transferOut(endpointNum,new Uint8Array(bytes));
      printerLog('✓ Print via USB berhasil');
    }catch(e){printerLog('✗ USB print error: '+e.message);}
  } else if(printerMethod==='bluetooth'&&btCharacteristic){
    await sendDataToPrinter(new Uint8Array(bytes));
  } else {
    const ip=g('printer-ip')?.value||'';
    const port=g('printer-port')?.value||'9100';
    printerLog(`Mengirim ke ${ip}:${port}...`);
    printerLog('ℹ️ Untuk LAN printing, gunakan middleware lokal (node-escpos/python-escpos)');
    doPrint();
  }
}
function printTestReceipt(){
  previewReceipt(null,'print');
}
/* ══════════════════════════════════════════
   BLUETOOTH
══════════════════════════════════════════ */
let btCharacteristic = null;
async function connectBluetooth() {
  try {
    printerLog("Mencari perangkat Bluetooth...");
    
    // Gunakan acceptAllDevices jika filter UUID sering gagal
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', 
        '0000ff00-0000-1000-8000-00805f9b34fb', // Sering digunakan printer murah
        '49535343-fe7d-4ae5-8fa9-9fafd205e455'  // UUID alternatif
      ]
    });

    printerLog(`Menghubungkan ke ${device.name}...`);
    const server = await device.gatt.connect();
    
    // Mencoba mencari service yang tersedia dari daftar optionalServices
    let service = null;
    const services = await server.getPrimaryServices();
    
    if (services.length > 0) {
      service = services[0]; // Ambil service pertama yang ditemukan
    } else {
      throw new Error("Service printer tidak ditemukan.");
    }

    const characteristics = await service.getCharacteristics();
    // Mencari karakteristik yang mendukung penulisan data (Write)
    btCharacteristic = characteristics.find(c => 
      c.properties.write || c.properties.writeWithoutResponse
    );

    if (btCharacteristic) {
      printerConnected = true;
      updatePrinterStatus('connected', `BT: ${device.name}`, 'Terhubung via Bluetooth');
      printerLog("✓ Printer Bluetooth siap!");
      toast("✓ Bluetooth Terhubung!");
    } else {
      throw new Error("Karakteristik Write tidak ditemukan.");
    }
  } catch (error) {
    console.error(error);
    printerLog("✗ Error BT: " + error.message);
    updatePrinterStatus('error', 'Gagal Bluetooth', error.message);
    toast("Gagal: " + error.message);
  }
}
async function sendDataToPrinter(uint8array){
  if(printerMethod==='bluetooth'&&btCharacteristic){
    const chunkSize=20;
    for(let i=0;i<uint8array.length;i+=chunkSize){
      const chunk=uint8array.slice(i,i+chunkSize);
      await btCharacteristic.writeValue(chunk);
    }
    printerLog("✓ Data terkirim via Bluetooth");
  } else if(printerMethod==='usb'&&usbDevice){
    try{
      const endpointNum=usbDevice.configuration.interfaces[0].alternate.endpoints.find(e=>e.direction==='out').endpointNumber;
      await usbDevice.transferOut(endpointNum,uint8array);
    }catch(e){printerLog('✗ USB send error: '+e.message);}
  }
}
/* ══════════════════════════════════════════
   CHECKOUT → WA
══════════════════════════════════════════ */
function checkout(){
  const nama=g('p_nama').value.trim();
  if(!nama) return alert('Isi nama staff di tab Absen dulu!');
  const{qP}=tots();
  if(qP>0){
    if(!confirm('Masih ada item di keranjang. Simpan otomatis sekarang?')) return;
    confirmOrder();
  }
  if(!orders.length) return alert('Belum ada pesanan tersimpan!');
  const shift=g('p_shift').value||'-';
  const tanggal=tgl();
  const modal=nn(g('p_modal').value);
  const kel=exps.reduce((a,b)=>a+b.p,0);
  const qris=nn(g('p_qris').value);
  const onl=nn(g('p_online').value);
  const totalOmzet=orders.reduce((a,o)=>a+o.sub,0);
  const totalPorsi=orders.reduce((a,o)=>a+o.porsi,0);
  const netto=modal+totalOmzet-kel-qris-onl;
  const byPay={};orders.forEach(o=>{byPay[o.pay]=(byPay[o.pay]||0)+o.sub;});
  const pMap={},tMap={},sMap={};
  orders.forEach(o=>{
    o.pi.forEach(i=>{if(!pMap[i.n])pMap[i.n]={q:0,h:i.h};pMap[i.n].q+=i.q;});
    o.ti.forEach(i=>{if(!tMap[i.n])tMap[i.n]={q:0,h:i.h};tMap[i.n].q+=i.q;});
    (o.si||[]).forEach(i=>{if(!sMap[i.n])sMap[i.n]={q:0,h:i.h};sMap[i.n].q+=i.q;});
  });
  let txt='';
  txt+=`╔═══════════════════════╗\n🐙 LAPORAN TAKOYAKI MAZBOY\n╚═══════════════════════╝\n`;
  txt+=`📅 ${tanggal}\n👤 ${nama}  |  ${shift}\n`;
  txt+=`━━━━━━━━━━━━━━━━━━━━━━━\n`;
  txt+=`💰 Modal Awal  : ${rp(modal)}\n`;
  txt+=`🐙 Omzet Jual  : ${rp(totalOmzet)}\n`;
  txt+=`📥 Total Kas   : ${rp(modal+totalOmzet)}\n`;
  txt+=`━━━━━━━━━━━━━━━━━━━━━━━\n`;
  for(const[k,v] of Object.entries(byPay)){
    const ic=k==='Tunai'?'💵':k==='QRIS'?'📱':'🛵';
    txt+=`${ic} ${k}  : ${rp(v)}\n`;
  }
  txt+=`━━━━━━━━━━━━━━━━━━━━━━━\n`;
  txt+=`💸 Pengeluaran : −${rp(kel)}\n`;
  txt+=`📱 Setor QRIS  : −${rp(qris)}\n`;
  txt+=`🛵 Setor Online: −${rp(onl)}\n`;
  txt+=`━━━━━━━━━━━━━━━━━━━━━━━\n`;
  txt+=`💵 *SETORAN TUNAI: ${rp(netto<0?0:netto)}*\n\n`;
  txt+=`╔═══════════════════════╗\n🐙 TOTAL ITEM TERJUAL\n╚═══════════════════════╝\n`;
  txt+=`📦 Transaksi: ${orders.length}×  |  🐙 Porsi: ${totalPorsi}\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
  for(const[k,v] of Object.entries(pMap)) txt+=`• ${k} ×${v.q} = ${rp(v.q*v.h)}\n`;
  if(Object.keys(tMap).length){txt+=`─ Topping ─\n`;for(const[k,v] of Object.entries(tMap)) txt+=`• ${k} ×${v.q} = ${rp(v.q*v.h)}\n`;}
  if(Object.keys(sMap).length){txt+=`─ Saus ─\n`;for(const[k,v] of Object.entries(sMap)) txt+=`• ${k} ×${v.q}\n`;}
  txt+=`\n╔═══════════════════════╗\n📝 DETAIL PESANAN\n╚═══════════════════════╝\n`;
  orders.forEach(o=>{
    txt+=`#${o.id} | 👤 ${o.cust} | ${o.time}\n`;
    const ps=o.pi.map(i=>`${i.n} x${i.q}`).join(', ');
    const ts=o.ti.length?' + '+o.ti.map(i=>`${i.n} x${i.q}`).join(', '):'';
    const ss=(o.si&&o.si.length)?' ['+o.si.map(i=>i.n).join('+')+']':'';
    txt+=`🛒 ${ps}${ts}${ss}\n💳 ${o.pay} | 🔥 ${o.mat} | 💰 ${rp(o.sub)}\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
  });
  const sAdonan=g('s_adonan').value,sBhn=g('s_bahan').value,sNot=g('s_note').value;
  if(sAdonan||sBhn||sNot){
    txt+=`\n╔═══════════════════════╗\n📦 STOK OPNAME\n╚═══════════════════════╝\n`;
    if(sAdonan) txt+=`🐙 Sisa Ball : ${sAdonan}\n`;
    if(sBhn) txt+=`🧂 Sisa Bahan: ${sBhn}\n`;
    const low=stokBahan.filter(b=>b.qty<=1);
    if(low.length) txt+=`⚠️ HAMPIR HABIS: ${low.map(b=>`${b.n}(${b.qty})`).join(', ')}\n`;
    if(sNot) txt+=`📝 Catatan: ${sNot}\n`;
  }
  window.open(`https://api.whatsapp.com/send?phone=${ADMIN}&text=${encodeURIComponent(txt)}`);
  if(g('auto-print-shift')?.checked){
    setTimeout(()=>{
      const shiftOrder={id:'SHIFT',time:tNow(),tgl:tanggal,cust:`Rekap ${shift}`,pi:[],ti:[],si:[],sub:totalOmzet,porsi:totalPorsi,mat:'-',pay:'Mixed'};
      previewReceipt(shiftOrder,'print');
    },800);
  }
  if(confirm('Laporan terkirim! Klik OK untuk reset data shift ini.')){
    orders=[];exps=[];oCnt=0;cP={};cT={};cS={};
    ['p_qris','p_online','s_adonan','s_bahan','s_note'].forEach(id=>{const e=g(id);if(e)e.value='';});
    stokBahan.forEach(b=>{b.qty=Math.max(0,b.qty);});
    localStorage.removeItem('TAKO_POS_DATA');
    upd();renderExps();renderRekap();renderStok();toast('✓ Shift selesai, data di-reset. Arigatou! 🐙');
  }
}
/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
window.onload=()=>{
  loadData();
  renderMenus();
  renderRekap();
  renderExps();
  renderStok();
  updFloat();
  calcTot();
  const inputIds=['p_nama','p_shift','p_modal','s_adonan','s_bahan','s_note','c_name','printer-ip','printer-port','r_nama_toko','r_alamat','r_footer','r_kontak'];
  inputIds.forEach(id=>{
    const el=g(id);
    if(el){el.addEventListener('input',saveData);el.addEventListener('change',saveData);}
  });
};
