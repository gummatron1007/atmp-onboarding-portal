/* ATMP Onboarding — journey rail.
   Draws the grouped progress rail shown at the top of every step page.
   Reads completion from window.ATMPProgress (exposed by support.js) so
   there's one source of truth for "is this step done" across pages —
   no separate storage scheme, and existing ticks keep working.
   Each page declares its own position via <body data-journey="02">. */
(function(){
  /* ── the journey, in order. type: step | milestone | finish ──
     page/key (or subKeys) point at the exact data-page/data-step(-sub)
     ids support.js already tracks, so isDone() below reads real state. */
  var J = [
    {id:'00', type:'step',      file:'index.html',              label:'Welcome',     title:'Welcome',                 group:null},
    {id:'01', type:'step',      file:'01-sign-agreement.html',  label:'Agreement',   title:'Sign the agreement',      group:'g1', page:'p2', key:'p2s1'},
    {id:'02', type:'step',      file:'02-join-slack.html',      label:'Slack',       title:'Join your Slack channel', group:'g1', page:'p2', key:'p2s2'},
    {id:'03', type:'step',      file:'03-facebook-access.html', label:'Facebook',    title:'Give us Facebook access', group:'g1', page:'p2', subKeys:['p2s4a','p2s4b','p2s4c','p2s4d']},
    {id:'04', type:'step',      file:'04-send-assets.html',     label:'Assets',      title:'Send your assets',        group:'g1', page:'p2', key:'p2s5'},
    {id:'c1', type:'milestone', file:'call-1-onboarding.html',  label:'Call 1',      title:'Your Onboarding Call',    icon:'📞'},
    {id:'05', type:'step',      file:'05-film-footage.html',    label:'Film',        title:'Film your footage',       group:'g2', page:'p3', key:'p3s1'},
    {id:'06', type:'step',      file:'06-send-footage.html',    label:'Send',        title:'Send it within 72 hours', group:'g2', page:'p3', key:'p3s2'},
    {id:'07', type:'step',      file:'07-outstanding.html',     label:'Outstanding', title:'Anything outstanding',    group:'g2', page:'p3', key:'p3s3'},
    {id:'08', type:'step',      file:'08-crm-setup.html',       label:'CRM',         title:'Set up your CRM',         group:'g2', page:'p3', key:'p3s4'},
    {id:'09', type:'step',      file:'09-training.html',        label:'Training',    title:'Watch the training',      group:'g2', page:'p3', subKeys:['p3s5a','p3s5b','p3s5c']},
    {id:'c2', type:'milestone', file:'call-2-launch.html',      label:'Call 2',      title:'Your Launch Call',        icon:'🚀'},
    {id:'go', type:'finish',    file:'go-live.html',            label:'Live',        title:"You're Live",             icon:'⚑'}
  ];

  var GROUPS = {
    g1:{label:'Before your onboarding call', short:'Onboarding call'},
    g2:{label:'Before your launch call',     short:'Launch call'}
  };

  function progress(){ return (window.ATMPProgress && window.ATMPProgress.state) || {}; }
  function isDone(node){
    var st = progress(), page = st[node.page];
    if(!page) return false;
    if(node.subKeys) return node.subKeys.every(function(k){ var r=page[k]; return !!(r && r.done); });
    if(node.key){ var r=page[node.key]; return !!(r && r.done); }
    return false;
  }

  function byId(id){ for(var i=0;i<J.length;i++){ if(J[i].id===id) return J[i]; } return null; }
  function stepsIn(g){ return J.filter(function(n){ return n.group===g; }); }
  function doneIn(g){ return stepsIn(g).filter(isDone).length; }

  var here = document.body.dataset.journey || '00';

  /* ── rail ── */
  function railHTML(){
    var h = '<div class="grail">';
    ['g1','g2'].forEach(function(g, i){
      var steps = stepsIn(g), n = doneIn(g), cur = byId(here);
      var active = cur && cur.group === g;
      h += '<div class="gseg'+(active?' on':'')+'">'
         +   '<div class="gseg-h"><div class="gseg-t">'+GROUPS[g].label+'</div>'
         +   '<div class="gseg-c">'+n+' of '+steps.length+'</div></div>'
         +   '<div class="gpips">';
      steps.forEach(function(s){
        var cls = isDone(s) ? 'done' : (s.id===here ? 'now' : '');
        h += '<a class="gp '+cls+'" href="'+s.file+'" title="'+s.title+'"></a>';
      });
      h += '</div></div>';
      var m = i===0 ? byId('c1') : byId('c2');
      h += '<a class="gm'+(m.id===here?' on':'')+'" href="'+m.file+'">'
         +   '<span class="gm-d"><i>'+m.icon+'</i></span>'
         +   '<span class="gm-l">'+m.label+'</span></a>';
    });
    var f = byId('go');
    h += '<a class="gm fin'+(f.id===here?' on':'')+'" href="'+f.file+'">'
       +   '<span class="gm-d"><i>'+f.icon+'</i></span>'
       +   '<span class="gm-l">'+f.label+'</span></a>';
    h += '</div>';

    var cur = byId(here);
    if(cur && cur.group){
      var steps = stepsIn(cur.group), idx = steps.indexOf(cur)+1, left = steps.length-idx;
      h += '<div class="gnow">You\'re on <b>step '+idx+' of '+steps.length+'</b> — '+cur.title+'.'
         + (left>0 ? ' '+left+' more after this, then your '+GROUPS[cur.group].short.toLowerCase()+'.' : ' Last one before your '+GROUPS[cur.group].short.toLowerCase()+'.')
         + '</div>';
    }
    return h;
  }

  function render(){
    document.querySelectorAll('[data-journey-rail]').forEach(function(el){ el.innerHTML = railHTML(); });
  }

  document.addEventListener('DOMContentLoaded', render);
  if(document.readyState !== 'loading') render();

  /* re-render if a tick happens on this page (support.js re-runs its own
     syncAll on every tick, which mutates window.ATMPProgress.state in place) */
  document.addEventListener('click', function(e){
    if(e.target.closest('.proof-btn, .sub-tick')) setTimeout(render, 0);
  });
})();
