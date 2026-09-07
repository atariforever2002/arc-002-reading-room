(function(){
  const mq = window.matchMedia('(max-width: 650px)');
  const ids = ['rare','international'];
  function setDetailsForScreen(){
    ids.forEach(function(id){
      const el = document.getElementById(id);
      if(!el) return;
      if(mq.matches){ el.removeAttribute('open'); }
      else { el.setAttribute('open',''); }
    });
  }
  setDetailsForScreen();
  if (mq.addEventListener) mq.addEventListener('change', setDetailsForScreen);
  else if (mq.addListener) mq.addListener(setDetailsForScreen);

  const shelves = {
    cvg: {
      title: 'Computer & Video Games (CVG)',
      sub: 'Visual Reading Room shelf with cover thumbnails, cleaner issue labels, and direct links to the individual Internet Archive scans.',
      query: 'collection:cvg-magazine AND mediatype:texts',
      raw: 'https://archive.org/details/cvg-magazine?sort=date',
      layout: 'covers',
      label: 'CVG',
      blurb: 'UK computer-and-videogame magazine issue'
    },
    tgm: {
      title: 'The Games Machine',
      sub: 'Magazine-rack view of the verified 34-issue UK run, using real Internet Archive issue-cover thumbnails while preserving the cleaned issue list, normalized dates, and direct reading links.',
      query: 'collection:thegamesmachine-magazine AND mediatype:texts',
      raw: 'https://archive.org/details/thegamesmachine-magazine?sort=date',
      layout: 'covers',
      label: 'The Games Machine',
      blurb: 'UK late-1980s games magazine issue',
      filterMode: 'tgm34'
    },
    gamest: {
      title: 'GAMeST',
      sub: 'Magazine-rack view of the Japanese arcade-specialist run, using real Internet Archive issue-cover thumbnails and preserving the direct issue links.',
      query: 'collection:gamestmagazine AND mediatype:texts',
      raw: 'https://archive.org/details/gamestmagazine?sort=date',
      layout: 'covers',
      label: 'GAMeST',
      blurb: 'Japanese arcade-specialist magazine issue',
      filterMode: 'gamestDedupe'
    },
    arcadia: {
      title: 'Arcadia',
      sub: 'Magazine-rack view of the later Japanese arcade-specialist run, using real Internet Archive issue-cover thumbnails and preserving the direct issue links.',
      query: 'collection:arcadia-magazine AND mediatype:texts',
      raw: 'https://archive.org/details/arcadia-magazine?sort=date',
      layout: 'covers',
      label: 'Arcadia',
      blurb: 'Japanese arcade-specialist magazine issue'
    },
    beep: {
      title: 'Beep!',
      sub: 'Magazine-rack view of the cleaned 45-issue Beep! run, using real Internet Archive issue-cover thumbnails while preserving deduplication, normalized dates, and the embedded-reader route.',
      query: 'collection:videogamemagazinesmisc AND mediatype:texts AND (title:Beep* OR identifier:beep*)',
      raw: 'https://archive.org/details/videogamemagazinesmisc?query=beep&sort=date',
      layout: 'covers',
      label: 'Beep!',
      blurb: 'Japanese videogame magazine issue',
      viewer: 'embed',
      filterMode: 'beepDedupe'
    }
  };

  const staticShelves = {
    arcadeee: {
      title: 'Arcade / Electronic Entertainment — Surviving / Located Issues',
      sub: 'The publication run is incomplete. VGHF currently catalogs five located issues. No additional clean public reader was confirmed during the current preservation pass.',
      raw: 'https://library.gamehistory.org/repositories/2/resources/163',
      rawLabel: 'OPEN VGHF COLLECTION RECORD',
      rawSameTab: true,
      items: [
        ['Arcade — Premier Issue','Summer 1982','CATALOGED / LOCATED'],
        ['Arcade — Vol. 1 No. 1','November 1982','CATALOGED / LOCATED'],
        ['Arcade — Vol. 2 No. 3','March 1983','CATALOGED / LOCATED'],
        ['Arcade — Vol. 2 No. 4','April 1983','CATALOGED / LOCATED'],
        ['Electronic Entertainment — Vol. 2 No. 9','September 1983','CATALOGED / LOCATED']
      ]
    }
  };

  const modal = document.getElementById('shelfModal');
  const titleEl = document.getElementById('modalTitle');
  const subEl = document.getElementById('modalSub');
  const bodyEl = document.getElementById('modalBody');
  const actionsEl = document.getElementById('modalActions');
  const closeBtn = document.getElementById('modalClose');
  let activeJsonpScript = null;
  let activeCallback = null;

  function esc(v){
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function openModal(){
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    setTimeout(function(){ closeBtn.focus(); }, 0);
  }

  function cleanupJsonp(){
    if(activeJsonpScript && activeJsonpScript.parentNode) activeJsonpScript.parentNode.removeChild(activeJsonpScript);
    activeJsonpScript = null;
    if(activeCallback && window[activeCallback]){
      try{ delete window[activeCallback]; }catch(e){ window[activeCallback] = undefined; }
    }
    activeCallback = null;
  }

  function closeModal(){
    cleanupJsonp();
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }

  function addRawAction(url,label,sameTab){
    const target = sameTab ? '' : ' target="_blank" rel="noopener"';
    actionsEl.innerHTML = '<a href="'+esc(url)+'"'+target+'>'+esc(label || 'RAW SOURCE / FALLBACK')+' →</a>';
  }

  function rawTitle(doc){
    return String(Array.isArray(doc.title) ? doc.title[0] : (doc.title || ''));
  }

  function rawDate(doc){
    return String(Array.isArray(doc.date) ? doc.date[0] : (doc.date || ''));
  }

  function yearFor(doc){
    if(doc._displayYear) return String(doc._displayYear);
    if(doc.year){
      if(Array.isArray(doc.year)) return String(doc.year[0]);
      return String(doc.year);
    }
    const d = doc._displayDate || rawDate(doc);
    const m = String(d).match(/(19|20)\d{2}/);
    if(m) return m[0];
    const mt = rawTitle(doc).match(/(19|20)\d{2}/);
    return mt ? mt[0] : 'UNDATED';
  }

  function formatYearMonth(year,month){
    const names=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const n=Number(month);
    if(!year || !n || n<1 || n>12) return '';
    return names[n-1]+' '+String(year);
  }

  function niceDate(doc){
    if(doc._displayDate) return String(doc._displayDate);
    const s = rawDate(doc);
    if(!s) return '';
    let m=s.match(/\b((?:19|20)\d{2})[-\/]([01]?\d)(?:[-\/]\d{1,2})?/);
    if(m) return formatYearMonth(m[1],m[2]);
    m=s.match(/\b((?:19|20)\d{2})([01]\d)\b/);
    if(m) return formatYearMonth(m[1],m[2]);
    return s.length > 18 ? s.slice(0,18) : s;
  }

  function issueNumFromTitle(doc){
    const t=rawTitle(doc);
    let m=t.match(/(?:Magazine\s+)?Issue\s*0*(\d{1,3})\b/i);
    if(!m) m=t.match(/\bNumber\s*0*(\d{1,3})\b/i);
    return m ? Number(m[1]) : null;
  }

  function tgmDateForIssue(n){
    if(n===1) return 'Oct/Nov 1987';
    if(n===2) return 'Dec 1987';
    if(n>=3 && n<=34){
      const zero=(n-3);
      const y=1988+Math.floor(zero/12);
      const mo=(zero%12)+1;
      return formatYearMonth(y,mo);
    }
    return '';
  }

  function tgmCandidateScore(doc){
    const t=rawTitle(doc), id=String(Array.isArray(doc.identifier)?doc.identifier[0]:(doc.identifier||''));
    let s=0;
    if(/^The Games Machine Magazine Issue\s*0*\d+\b/i.test(t)) s+=8;
    else if(/^The Games Machine.*Issue\s*0*\d+\b/i.test(t)) s+=5;
    if(/the[-_ ]games[-_ ]machine/i.test(id)) s+=3;
    if(/magazine/i.test(t)) s+=1;
    return s;
  }

  function gamestIssueNum(doc){
    const t=rawTitle(doc).trim();
    const m=t.match(/^GAMeST(?:\s+(?:Magazine|Issue|No\.?))?\s*[-#:]?\s*0*(\d{1,3})\b/i);
    return m ? Number(m[1]) : null;
  }

  function gamestCandidateScore(doc){
    const t=rawTitle(doc);
    const id=String(Array.isArray(doc.identifier)?doc.identifier[0]:(doc.identifier||''));
    let s=0;
    if(/^GAMeST\s+0*\d{1,3}\s*\([^)]*(?:19|20)\d{2}[^)]*\)/i.test(t)) s+=12;
    if(/^GAMeST\s+0*\d{1,3}\b/i.test(t)) s+=5;
    if(/(?:19|20)\d{2}/.test(rawDate(doc))) s+=2;
    if(/[a-z]+[-_ ](?:19|20)\d{2}/i.test(id)) s+=2;
    if(/\b(guide|mook|special)\b/i.test(t)) s-=20;
    return s;
  }

  function beepKey(doc){
    const t=rawTitle(doc);
    let m=t.match(/\b((?:19)\d{2})[-_ ]([01]?\d)(?:[-_ ]\d{1,2})?\b/);
    if(!m){
      const id=String(Array.isArray(doc.identifier)?doc.identifier[0]:(doc.identifier||''));
      m=id.match(/\b((?:19)\d{2})[-_ ]?([01]\d)\b/);
    }
    if(!m) return '';
    const y=Number(m[1]), mo=Number(m[2]);
    if(y<1985 || y>1989 || mo<1 || mo>12) return '';
    if(y===1989 && mo>6) return '';
    return String(y)+'-'+String(mo).padStart(2,'0');
  }

  function beepCandidateScore(doc){
    const t=rawTitle(doc);
    let s=0;
    if(/^Beep\s*-\s*19\d{2}-\d{2}-\d{2}/i.test(t)) s+=8;
    if(/Number\s*\d+/i.test(t)) s+=3;
    if(/Volume\s*\d+/i.test(t)) s+=2;
    if(/600\s*dpi/i.test(t)) s+=1;
    return s;
  }

  function postprocessDocs(docs,cfg){
    if(!cfg || !cfg.filterMode) return docs.slice();

    if(cfg.filterMode==='tgm34'){
      const best={};
      docs.forEach(function(doc){
        const t=rawTitle(doc);
        if(!/^The Games Machine(?: Magazine)?\s+Issue\s*0*\d+\b/i.test(t)) return;
        const n=issueNumFromTitle(doc);
        if(!n || n<1 || n>34) return;
        if(!best[n] || tgmCandidateScore(doc)>tgmCandidateScore(best[n])) best[n]=doc;
      });
      return Object.keys(best).map(Number).sort(function(a,b){return a-b;}).map(function(n){
        const d=best[n];
        d._issueNum=n;
        d._displayDate=tgmDateForIssue(n);
        const ym=d._displayDate.match(/(19|20)\d{2}/);
        d._displayYear=ym?ym[0]:'';
        d._cleanTitle='The Games Machine — Issue '+String(n).padStart(2,'0');
        return d;
      });
    }

    if(cfg.filterMode==='gamestDedupe'){
      const best={};
      docs.forEach(function(doc){
        const n=gamestIssueNum(doc);
        if(!n) return;
        if(!best[n] || gamestCandidateScore(doc)>gamestCandidateScore(best[n])) best[n]=doc;
      });
      return Object.keys(best).map(Number).sort(function(a,b){return a-b;}).map(function(n){
        const d=best[n];
        d._issueNum=n;
        return d;
      });
    }

    if(cfg.filterMode==='beepDedupe'){
      const best={};
      docs.forEach(function(doc){
        const key=beepKey(doc);
        if(!key) return;
        if(!best[key] || beepCandidateScore(doc)>beepCandidateScore(best[key])) best[key]=doc;
      });
      return Object.keys(best).sort().map(function(key){
        const d=best[key];
        const parts=key.split('-');
        d._displayDate=formatYearMonth(parts[0],parts[1]);
        d._displayYear=parts[0];
        const n=issueNumFromTitle(d);
        d._issueNum=n;
        d._cleanTitle=n ? ('Beep! — Issue '+n) : ('Beep! — '+d._displayDate);
        return d;
      });
    }

    return docs.slice();
  }

  function cleanShelfTitle(doc,cfg){
    if(doc._cleanTitle) return doc._cleanTitle;
    const ident = Array.isArray(doc.identifier) ? doc.identifier[0] : doc.identifier;
    let title = rawTitle(doc) || ident;
    if(cfg && cfg.layout === 'covers'){
      title = String(title)
        .replace(/\(EMAP Publishing\)/gi,'')
        .replace(/\(GB\)/gi,'')
        .replace(/Computer\s*&\s*Video Games\s*-?\s*/i,'')
        .replace(/\s{2,}/g,' ')
        .trim();
      const shelfLabel = (cfg && cfg.label) ? String(cfg.label) : 'Magazine';
      if(/^Issue\s+/i.test(title)) return shelfLabel + ' ' + title;
      return title || (shelfLabel + ' ' + ident);
    }
    return title;
  }

  function issueHref(ident,cfg){
    if(cfg && cfg.viewer === 'embed') return 'https://archive.org/embed/' + encodeURIComponent(ident);
    return 'https://archive.org/details/' + encodeURIComponent(ident);
  }

  function renderDocs(docs,cfg){
    if(!docs || !docs.length){
      bodyEl.innerHTML = '<div class="load-note"><strong>No issue records were returned.</strong><br>The clean shelf could not populate from Internet Archive metadata. Use the fallback source button above if the clean shelf does not populate.</div>';
      return;
    }
    docs = postprocessDocs(docs,cfg).sort(function(a,b){
      if(a._issueNum && b._issueNum && a._issueNum!==b._issueNum) return a._issueNum-b._issueNum;
      const ad = a._displayDate || rawDate(a);
      const bd = b._displayDate || rawDate(b);
      if(ad && bd && ad !== bd) return String(ad).localeCompare(String(bd));
      if(ad && !bd) return -1;
      if(!ad && bd) return 1;
      return String(rawTitle(a)||a.identifier).localeCompare(String(rawTitle(b)||b.identifier),undefined,{numeric:true});
    });

    if(!docs.length){
      bodyEl.innerHTML = '<div class="load-note"><strong>No clean issue records remained after filtering.</strong><br>Use the fallback source button above if the clean shelf does not populate.</div>';
      return;
    }

    const groups = {};
    docs.forEach(function(doc){
      const y = yearFor(doc);
      if(!groups[y]) groups[y] = [];
      groups[y].push(doc);
    });
    const years = Object.keys(groups).sort(function(a,b){
      if(a==='UNDATED') return 1;
      if(b==='UNDATED') return -1;
      return Number(a)-Number(b);
    });
    const coverModeGlobal = cfg && cfg.layout === 'covers';
    let html = '<div class="load-note">Loaded <strong>'+docs.length+'</strong> issue record'+(docs.length===1?'':'s')+'. '+(coverModeGlobal?'Real cover thumbnails are supplied by Internet Archive. Tap a cover to open the magazine directly.':'Tap an issue to open the magazine directly.')+'</div>';
    years.forEach(function(y){
      const coverMode = cfg && cfg.layout === 'covers';
      html += '<div class="year-head">'+esc(y)+'</div><div class="'+(coverMode?'cover-grid':'shelf-grid')+'">';
      groups[y].forEach(function(doc){
        const ident = Array.isArray(doc.identifier) ? doc.identifier[0] : doc.identifier;
        const title = cleanShelfTitle(doc,cfg);
        const d = niceDate(doc);
        const href = issueHref(ident,cfg);
        if(coverMode){
          const desc = (d ? d+' • ' : '') + (cfg.blurb || 'Magazine issue');
          html += '<a class="cover-item" href="'+href+'" target="_blank" rel="noopener" title="'+esc(Array.isArray(doc.title)?doc.title[0]:(doc.title||ident))+'"><div class="cover-wrap"><img loading="lazy" src="https://archive.org/services/img/'+encodeURIComponent(ident)+'" alt="Cover of '+esc(title)+'"></div><div class="cover-copy"><strong>'+esc(title)+'</strong><span class="cover-desc">'+esc(desc)+'</span><span class="cover-read">READ ISSUE →</span></div></a>';
        } else {
          html += '<a class="shelf-item" href="'+href+'" target="_blank" rel="noopener"><strong>'+esc(title)+'</strong><span>'+(d?esc(d)+' • ':'')+'READ →</span></a>';
        }
      });
      html += '</div>';
    });
    bodyEl.innerHTML = html;
  }

  function loadRemoteShelf(key){
    const cfg = shelves[key];
    if(!cfg) return;
    cleanupJsonp();
    titleEl.textContent = cfg.title;
    subEl.textContent = cfg.sub;
    addRawAction(cfg.raw,'RAW IA FALLBACK');
    bodyEl.innerHTML = '<div class="load-note"><strong>Loading clean issue shelf…</strong><br>Pulling issue metadata from Internet Archive. If this does not populate, use the fallback button above.</div>';
    openModal();

    const cb = 'arc002IA_' + Date.now() + '_' + Math.floor(Math.random()*100000);
    activeCallback = cb;
    window[cb] = function(payload){
      const docs = payload && payload.response && payload.response.docs ? payload.response.docs : [];
      cleanupJsonp();
      renderDocs(docs,cfg);
    };

    const params = new URLSearchParams();
    params.set('q',cfg.query);
    params.append('fl[]','identifier');
    params.append('fl[]','title');
    params.append('fl[]','date');
    params.append('fl[]','year');
    params.append('sort[]','date asc');
    params.set('rows','500');
    params.set('page','1');
    params.set('output','json');
    params.set('callback',cb);

    const script = document.createElement('script');
    activeJsonpScript = script;
    script.src = 'https://archive.org/advancedsearch.php?' + params.toString();
    script.async = true;
    script.onerror = function(){
      cleanupJsonp();
      bodyEl.innerHTML = '<div class="load-note"><strong>The clean issue shelf did not load on this device/browser.</strong><br>The raw Internet Archive fallback is still available above. Please use the fallback source button above for the affected magazine.</div>';
    };
    document.head.appendChild(script);
  }

  function loadStaticShelf(key){
    const cfg = staticShelves[key];
    if(!cfg) return;
    cleanupJsonp();
    titleEl.textContent = cfg.title;
    subEl.textContent = cfg.sub;
    addRawAction(cfg.raw,cfg.rawLabel,!!cfg.rawSameTab);
    let html = '<div class="load-note">This page deliberately separates <strong>located holdings</strong> from missing or unconfirmed issues. A cataloged physical copy is not being presented as a public scan.</div><div class="year-head">CURRENTLY LOCATED</div><div class="static-list">';
    cfg.items.forEach(function(item){
      html += '<div class="static-item"><span class="record-label">HOLDING RECORD — INFORMATION ONLY</span><strong>'+esc(item[0])+'</strong><span class="meta">'+esc(item[1])+'</span><span class="status">'+esc(item[2])+'</span></div>';
    });
    html += '</div><div class="load-note" style="margin-top:12px"><strong>Known gaps remain.</strong> December 1982 is uncertain; January–February and May–August 1983 are not currently located; later continuation after September 1983 is unresolved.</div>';
    bodyEl.innerHTML = html;
    openModal();
  }

  document.querySelectorAll('.shelf-launch').forEach(function(btn){
    btn.addEventListener('click',function(){
      const key = btn.getAttribute('data-shelf');
      if(staticShelves[key]) loadStaticShelf(key);
      else loadRemoteShelf(key);
    });
  });

  closeBtn.addEventListener('click',closeModal);
  modal.addEventListener('click',function(e){ if(e.target===modal) closeModal(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape' && modal.classList.contains('open')) closeModal(); });
})();
