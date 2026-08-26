/* ATMP Onboarding Phase 1 — tracker + proof-gated completion.
   Used by v2-page-*.html only. Own storage key; does not touch the live portal's data.

   A step ticks ONLY on real proof:
     data-proof="upload"  → they must attach a file (screenshot/photo/clip)
     data-proof="confirm" → uploading isn't applicable, so a single Confirm tap
*/
(function(){
  var KEY='atmp_v2_progress';
  function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return{}}}
  function save(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}

  var state=load();
  var pageId=document.body.dataset.page||'page';
  if(!state[pageId])state[pageId]={};
  var steps=[].slice.call(document.querySelectorAll('.step[data-step]'));
  var byId={};steps.forEach(function(s){byId[s.dataset.step]=s});

  function subsOf(st){return [].slice.call(st.querySelectorAll('.sub[data-sub]'))}

  function rec(id){return state[pageId][id]||null}
  function isDone(id){
    var st=byId[id];
    if(st&&st.dataset.proof==='subs'){
      var subs=subsOf(st);
      return subs.length>0&&subs.every(function(s){var r=state[pageId][s.dataset.sub];return !!(r&&r.done)});
    }
    var r=rec(id);return !!(r&&r.done)
  }
  function put(id,v){state[pageId][id]=v;save(state)}

  /* ── thumbnail so the proof is visible, not just a filename ── */
  function thumb(file,cb){
    if(!file.type||file.type.indexOf('image/')!==0)return cb(null);
    var fr=new FileReader();
    fr.onload=function(){
      var img=new Image();
      img.onload=function(){
        var m=120,w=img.width,h=img.height,s=Math.min(m/w,m/h,1);
        var c=document.createElement('canvas');
        c.width=Math.round(w*s);c.height=Math.round(h*s);
        c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        try{cb(c.toDataURL('image/jpeg',0.6))}catch(e){cb(null)}
      };
      img.onerror=function(){cb(null)};
      img.src=fr.result;
    };
    fr.onerror=function(){cb(null)};
    fr.readAsDataURL(file);
  }

  function icoFor(name){
    var n=(name||'').toLowerCase();
    if(/\.(mp4|mov|m4v|avi|webm)$/.test(n))return '🎬';
    if(/\.pdf$/.test(n))return '📄';
    return '📎';
  }

  /* ── render one step's proof control ── */
  function renderProof(st){
    var slot=st.querySelector('.proof-slot');
    if(!slot)return;
    var id=st.dataset.step, kind=st.dataset.proof||'confirm', r=rec(id);
    slot.innerHTML='';
    var box=document.createElement('div');
    box.className='proof';

    /* one tick per sub-module; the step completes when all of them are done */
    if(kind==='subs'){
      var subs=subsOf(st), n=subs.filter(function(s){var q=state[pageId][s.dataset.sub];return !!(q&&q.done)}).length;
      var sum=document.createElement('div');
      sum.className='subs-sum'+(n===subs.length?' all':'');
      sum.textContent=n===subs.length?'✓ All '+subs.length+' done':n+' of '+subs.length+' done — tick each one above';
      slot.appendChild(sum);
      return;
    }

    /* upload OR a plain confirm, when there may be nothing to attach */
    if(kind==='either'){
      if(r&&r.done){
        if(r.files&&r.files.length){
          var w=document.createElement('div');
          w.className='proof-files';
          r.files.forEach(function(f){
            var pf=document.createElement('div');
            pf.className='pf';
            if(f.thumb){var im=document.createElement('img');im.src=f.thumb;im.alt='';pf.appendChild(im);}
            else{var ic=document.createElement('div');ic.className='pf-ico';ic.textContent=icoFor(f.name);pf.appendChild(ic);}
            var mt=document.createElement('div');
            mt.innerHTML='<div class="pf-name"></div><div class="pf-sub">✓ Attached</div>';
            mt.querySelector('.pf-name').textContent=f.name;
            pf.appendChild(mt);w.appendChild(pf);
          });
          box.appendChild(w);
        }else{
          var dn=document.createElement('button');
          dn.type='button';dn.className='proof-btn';
          dn.innerHTML='<span class="ico">✓</span><span class="lbl">'+(st.dataset.proofNoneDone||'Nothing outstanding')+'</span>';
          dn.title='Tap again to un-tick';
          dn.addEventListener('click',function(){put(id,null);syncAll()});
          box.appendChild(dn);
        }
      }else{
        var row=document.createElement('div');
        row.className='proof-pair';
        var ab=document.createElement('button');
        ab.type='button';ab.className='proof-btn';
        ab.innerHTML='<span class="ico">📎</span><span class="lbl">'+(st.dataset.proofCta||'Attach it')+'</span>';
        var inp3=mkInput(st,id);
        ab.addEventListener('click',function(){inp3.click()});
        var nb=document.createElement('button');
        nb.type='button';nb.className='proof-btn';
        nb.innerHTML='<span class="ico">✓</span><span class="lbl">'+(st.dataset.proofNoneCta||'Nothing outstanding')+'</span>';
        nb.addEventListener('click',function(){put(id,{done:true,at:Date.now()});syncAll()});
        row.appendChild(ab);row.appendChild(nb);
        box.appendChild(row);box.appendChild(inp3);
      }
      box.className+=' bare';
      slot.appendChild(box);
      return;
    }

    if(kind==='upload'){
      if(r&&r.done&&r.files&&r.files.length){
        var wrap=document.createElement('div');
        wrap.className='proof-files';
        r.files.forEach(function(f){
          var pf=document.createElement('div');
          pf.className='pf';
          if(f.thumb){var im=document.createElement('img');im.src=f.thumb;im.alt='';pf.appendChild(im);}
          else{var ic=document.createElement('div');ic.className='pf-ico';ic.textContent=icoFor(f.name);pf.appendChild(ic);}
          var meta=document.createElement('div');
          meta.innerHTML='<div class="pf-name"></div><div class="pf-sub">✓ Attached</div>';
          meta.querySelector('.pf-name').textContent=f.name;
          pf.appendChild(meta);
          wrap.appendChild(pf);
        });
        box.appendChild(wrap);
        var again=document.createElement('button');
        again.type='button';again.className='proof-btn';
        again.innerHTML='<span class="ico">↻</span><span class="lbl">Replace</span>';
        box.appendChild(again);
        var inp2=mkInput(st,id);box.appendChild(inp2);
        again.addEventListener('click',function(){inp2.click()});
      }else{
        var btn=document.createElement('button');
        btn.type='button';btn.className='proof-btn';
        btn.innerHTML='<span class="ico">📎</span><span class="lbl">'+(st.dataset.proofCta||'Attach proof')+'</span>';
        box.appendChild(btn);
        var inp=mkInput(st,id);box.appendChild(inp);
        btn.addEventListener('click',function(){inp.click()});
      }
    }else{
      if(r&&r.done){
        var d=document.createElement('button');
        d.type='button';d.className='proof-btn';
        d.innerHTML='<span class="ico">✓</span><span class="lbl">'+(st.dataset.proofDone||'Confirmed')+'</span>';
        d.title='Tap again to un-tick';
        d.addEventListener('click',function(){put(id,null);syncAll()});
        box.appendChild(d);
      }else{
        var cb=document.createElement('button');
        cb.type='button';cb.className='proof-btn';
        cb.innerHTML='<span class="ico">✓</span><span class="lbl">'+(st.dataset.proofCta||'Confirm')+'</span>';
        cb.addEventListener('click',function(){put(id,{done:true,at:Date.now()});syncAll()});
        box.appendChild(cb);
      }
      box.className='proof bare';
    }
    slot.appendChild(box);
  }

  function mkInput(st,id){
    var inp=document.createElement('input');
    inp.type='file';
    inp.multiple=true;
    if(st.dataset.accept)inp.accept=st.dataset.accept;
    inp.addEventListener('change',function(){
      var files=[].slice.call(inp.files||[]).slice(0,4);
      if(!files.length)return;
      var out=new Array(files.length), left=files.length;
      files.forEach(function(f,i){
        thumb(f,function(t){
          out[i]={name:f.name,thumb:t};
          if(--left===0){
            put(id,{done:true,at:Date.now(),files:out});
            syncAll();
          }
        });
      });
    });
    return inp;
  }

  /* ── tracker ── */
  function syncTracker(){
    var doneN=steps.filter(function(s){return isDone(s.dataset.step)}).length;
    var total=steps.length;
    var fill=document.getElementById('tkFill');
    var count=document.getElementById('tkCount');
    var next=document.getElementById('tkNext');
    if(fill){
      fill.style.width=total?Math.round(doneN/total*100)+'%':'0%';
      fill.classList.toggle('all',doneN===total&&total>0);
    }
    if(count){
      count.textContent=doneN+' of '+total+' done';
      count.classList.toggle('some',doneN>0);
    }
    if(next){
      var pending=steps.filter(function(s){return !isDone(s.dataset.step)})[0];
      if(pending){
        next.textContent='Up next: '+(pending.dataset.short||'next step')+' ›';
        next.classList.remove('all');
        next.onclick=function(){
          window.scrollTo({top:pending.getBoundingClientRect().top+window.pageYOffset-200,behavior:'smooth'});
        };
      }else{
        next.textContent='✓ All done on this page';
        next.classList.add('all');
        next.onclick=null;
      }
    }
    document.querySelectorAll('.tk-pg[data-pageid]').forEach(function(p){
      var pid=p.dataset.pageid, t=parseInt(p.dataset.total||'0',10);
      if(p.classList.contains('on')||!t)return;
      var ps=state[pid]||{};
      var n=Object.keys(ps).filter(function(k){return ps[k]&&ps[k].done}).length;
      p.classList.toggle('done',n>=t);
    });
  }

  function syncAll(){
    steps.forEach(function(st){
      st.classList.toggle('done',isDone(st.dataset.step));
      subsOf(st).forEach(function(sb){
        var q=state[pageId][sb.dataset.sub], d=!!(q&&q.done);
        sb.classList.toggle('done',d);
        var stt=sb.querySelector('.sub-state');
        if(stt)stt.textContent='✓ Done';
        var slot=sb.querySelector('.sub-action');
        if(slot){
          slot.innerHTML='';
          var b=document.createElement('button');
          b.type='button';b.className='sub-tick';
          b.innerHTML='<span class="ico">✓</span><span class="lbl">'+(d?(sb.dataset.doneLabel||'Done'):(sb.dataset.cta||'Mark as done'))+'</span>';
          if(d){
            b.title='Tap again to un-tick';
            b.addEventListener('click',function(e){e.stopPropagation();put(sb.dataset.sub,null);syncAll()});
            slot.appendChild(b);
          }else{
            b.addEventListener('click',function(e){
              e.stopPropagation();
              put(sb.dataset.sub,{done:true,at:Date.now()});
              syncAll();
              var nx=sb.nextElementSibling;
              if(nx&&nx.classList.contains('sub')&&!nx.classList.contains('done')){
                sb.classList.remove('open');nx.classList.add('open');
              }
            });
            slot.appendChild(b);
          }
        }
      });
      renderProof(st);
    });
    syncTracker();
  }

  /* sub-module accordion */
  document.querySelectorAll('.sub[data-sub] .sub-head').forEach(function(h){
    h.addEventListener('click',function(){h.parentElement.classList.toggle('open')});
  });

  /* nested topic accordion (level 2) — one at a time inside its parent */
  document.querySelectorAll('.sub2 > .sub2-head').forEach(function(h){
    h.addEventListener('click',function(){
      var row=h.parentElement, wasOpen=row.classList.contains('open');
      var wrap=row.parentElement;
      wrap.querySelectorAll(':scope > .sub2.open').forEach(function(o){if(o!==row)o.classList.remove('open')});
      row.classList.toggle('open',!wasOpen);
      if(!wasOpen)row.querySelectorAll('.tr').forEach(function(t){if(t.__apply)t.__apply()});
    });
  });

  /* per-topic tick-off */
  document.querySelectorAll('.sub2-wrap').forEach(function(wrap){
    var host=wrap.closest('.sub[data-sub]');
    var base=host?host.dataset.sub:'topic';
    [].slice.call(wrap.querySelectorAll(':scope > .sub2')).forEach(function(row,i){
      var head=row.querySelector(':scope > .sub2-head');
      if(!head)return;
      var id=base+'-t'+(i+1);
      var b=document.createElement('button');
      b.type='button';b.className='sub2-tick';
      b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.4 4.4L19 7.6"></path></svg>';
      var car=head.querySelector('.sub2-car');
      head.insertBefore(b,car);
      function paint(){
        var r=state[pageId][id], d=!!(r&&r.done);
        row.classList.toggle('tdone',d);
        b.setAttribute('aria-pressed',d?'true':'false');
        b.title=d?'Watched — tap to un-tick':'Mark as watched';
      }
      b.addEventListener('click',function(e){
        e.stopPropagation();
        var r=state[pageId][id];
        put(id,(r&&r.done)?null:{done:true,at:Date.now()});
        paint();
      });
      paint();
    });
  });

  syncAll();
})();

/* ── First-login welcome + confetti (page 1 only, once ever) ── */
(function(){
  if(document.body.dataset.page!=='p1')return;
  var FLAG='atmp_v2_welcomed';
  try{if(localStorage.getItem(FLAG))return}catch(e){return}

  var ov=document.createElement('div');
  ov.id='wcOverlay';
  ov.innerHTML='<div class="wc-card">'
    +'<div class="wc-emoji">\ud83c\udf89</div>'
    +'<div class="wc-title">Welcome aboard, <span>you\u2019re in!</span></div>'
    +'<div class="wc-sub">Great to have you on the team. Everything you need is laid out across three short pages \u2014 just work down each one, top to bottom.</div>'
    +'<button type="button" class="btn-jumbo" id="wcGo">Let\u2019s get started <span class="arw">\u2192</span></button>'
    +'</div>';
  var cv=document.createElement('canvas');
  cv.id='wcCanvas';
  document.body.appendChild(cv);
  document.body.appendChild(ov);
  document.body.style.overflow='hidden';
  requestAnimationFrame(function(){ov.classList.add('on')});

  /* confetti */
  var ctx=cv.getContext('2d'),W,H,parts=[],raf,t0=Date.now();
  var cols=['#00B4B4','#1B2A4A','#F5A623','#0F9058','#4A7BD4','#E86A5C'];
  function size(){W=cv.width=window.innerWidth;H=cv.height=window.innerHeight}
  size();window.addEventListener('resize',size);
  for(var i=0;i<130;i++){
    parts.push({
      x:Math.random()*W, y:-20-Math.random()*H*0.6,
      w:6+Math.random()*7, h:9+Math.random()*10,
      vy:2.2+Math.random()*3.4, vx:-1.3+Math.random()*2.6,
      rot:Math.random()*Math.PI*2, vr:-0.14+Math.random()*0.28,
      c:cols[(Math.random()*cols.length)|0]
    });
  }
  function tick(){
    var el=Date.now()-t0;
    ctx.clearRect(0,0,W,H);
    var fade=el>3600?Math.max(0,1-(el-3600)/1200):1;
    ctx.globalAlpha=fade;
    parts.forEach(function(p){
      p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;
      if(p.y>H+30){p.y=-20;p.x=Math.random()*W}
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
      ctx.fillStyle=p.c;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();
    });
    ctx.globalAlpha=1;
    if(el<4800)raf=requestAnimationFrame(tick);
    else{ctx.clearRect(0,0,W,H);if(cv.parentNode)cv.parentNode.removeChild(cv)}
  }
  if(!window.matchMedia||!window.matchMedia('(prefers-reduced-motion:reduce)').matches)tick();
  else if(cv.parentNode)cv.parentNode.removeChild(cv);

  function close(){
    try{localStorage.setItem(FLAG,'1')}catch(e){}
    ov.classList.remove('on');
    document.body.style.overflow='';
    if(raf)cancelAnimationFrame(raf);
    setTimeout(function(){
      if(ov.parentNode)ov.parentNode.removeChild(ov);
      if(cv.parentNode)cv.parentNode.removeChild(cv);
    },400);
  }
  document.getElementById('wcGo').addEventListener('click',close);
  ov.addEventListener('click',function(e){if(e.target===ov)close()});
})();
(function(){
  function build(url,t){
    if(!url)return '';
    /* Local MP4s seek via the media fragment (#t=12), not Loom's ?t=12s. */
    if(/\.mp4($|[?#])/i.test(url))return t>0?url+'#t='+t:url;
    var sep=url.indexOf('?')>-1?'&':'?';
    return t>0?url+sep+'t='+t+'s':url;
  }
  [].slice.call(document.querySelectorAll('.tr')).forEach(function(tr){
    var frame=tr.querySelector('.tr-frame');
    if(!frame)return;
    var onTab=tr.querySelector('.tr-tab.on');
    var dev='phone', t=parseInt(tr.dataset.t0||'0',10);
    function url(d){return frame.getAttribute('data-'+d)||''}
    if(onTab&&url(onTab.dataset.dev))dev=onTab.dataset.dev;
    else if(!url('phone')&&url('desktop'))dev='desktop';
    var note=tr.querySelector('.tr-devnote');
    /* defer loading until the module holding it is actually opened */
    function hidden(){var p=tr.closest('.sub2');return !!(p&&!p.classList.contains('open'))}
    function apply(){
      if(hidden())return;
      var u=url(dev);
      if(!u){u=url(dev==='phone'?'desktop':'phone')}
      var next=build(u,t);
      if(frame.src!==next){
        frame.src=next;
        /* An <iframe> reloads on src change; a <video> does not until told. */
        if(frame.tagName==='VIDEO'&&frame.load)frame.load();
      }
      var approx=(dev==='phone'&&!!url('desktop'));
      tr.querySelectorAll('.tr-ch').forEach(function(ch){ch.classList.toggle('approx',approx)});
      if(note)note.style.display=approx?'block':'none';
    }
    tr.__apply=apply;
    tr.querySelectorAll('.tr-tab').forEach(function(tab){
      tab.classList.toggle('on',tab.dataset.dev===dev);
      if(!url(tab.dataset.dev)){tab.disabled=true;tab.style.opacity='.4';tab.style.cursor='default';tab.title='Not recorded for this device yet';return}
      tab.addEventListener('click',function(){
        dev=tab.dataset.dev;
        tr.querySelectorAll('.tr-tab').forEach(function(o){o.classList.toggle('on',o===tab)});
        apply();
      });
    });
    tr.querySelectorAll('.tr-ch').forEach(function(ch){
      ch.addEventListener('click',function(){
        t=parseInt(ch.dataset.t||'0',10);
        tr.querySelectorAll('.tr-ch').forEach(function(o){o.classList.toggle('on',o===ch)});
        apply();
      });
    });
    apply();
  });
})();

/* ── General rule: a step holding 3+ videos auto-collapses into modules ── */
(function(){
  function label(g,i){
    var t=g.querySelector('.vt-t');
    if(t)return t.textContent.trim();
    var f=g.querySelector('iframe');
    return (f&&f.getAttribute('title'))||('Video '+(i+1));
  }
  [].slice.call(document.querySelectorAll('.step')).forEach(function(st){
    if(st.querySelector('.subs-wrap')||st.querySelector('.vstack'))return;
    var body=st.querySelector('.step-body');
    if(!body)return;
    var groups=[].slice.call(body.querySelectorAll(':scope > .vgroup'));
    if(groups.length<2)return;

    var stack=document.createElement('div');
    stack.className='vstack';
    body.insertBefore(stack,groups[0]);
    groups.forEach(function(g,i){
      var title=label(g,i);
      var head=document.createElement('div');
      head.className='vg-head';
      head.innerHTML='<div class="vg-n">'+(i+1)+'</div><div class="vg-t"></div><div class="vg-caret">▾</div>';
      head.querySelector('.vg-t').textContent=title;
      var inner=document.createElement('div');
      inner.className='vg-body';
      var old=g.querySelector('.vtitle');
      if(old)old.remove();
      while(g.firstChild)inner.appendChild(g.firstChild);
      g.appendChild(head);g.appendChild(inner);
      head.addEventListener('click',function(){g.classList.toggle('open')});
      stack.appendChild(g);
    });
  });
})();
