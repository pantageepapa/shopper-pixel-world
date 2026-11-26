const route = new URLSearchParams(location.search);
const kite = route.get('case')==='kite';
const source = kite ? '../private-choice-kite-travel-social-01/transcript.json' : '../private-choice-trendy-social-01/transcript.json';
const byId = id => document.getElementById(id);
const node = (name, text, className) => {
  const element = document.createElement(name);
  element.textContent = text;
  if (className) element.className = className;
  return element;
};
const filter = byId('round-filter');
const entries = byId('entries');
const thread = route.get('thread');
if (kite) {
  document.title = 'Langarmshirts für Reisen · Simulierte Diskussion';
  byId('case-heading').textContent = 'Diskussion über Langarmshirts für Reisen';
  byId('replay-link').href = '../shopper-viewer/?wave=12';
  byId('all-threads').href = '?case=kite';
}
const monitorId = kite ? 'sim_b720afc508ce' : 'sim_934d7d3cd4ce';
byId('stock-monitor').href = 'http://127.0.0.1:3000/simulation/'+monitorId+'/start?monitor=1&maxRounds=3';
const states = {
  pending:'Warte auf den Start',
  running:'Simulation läuft',
  completed:'Simulation abgeschlossen',
  stopped:'Simulation angehalten',
  failed:'Simulation unterbrochen',
};
let snapshot;
let fingerprint;
let reading = false;

function entryElement(entry, lookup) {
  const isPost = entry.kind==='post';
  const label = isPost ? 'Beitrag' : 'Antwort';
  const item = node('li','','entry '+entry.kind);
  item.id = entry.id;
  const meta = node('div','','byline');
  meta.append(node('strong',entry.actor),node('span',label),node('span',entry.round ? `Runde ${entry.round}` : 'Startbeitrag'));
  item.append(meta);
  if (entry.parent_id) {
    const parent = lookup.get(entry.parent_id);
    const relation = node('p','','parent');
    const link = node('a',parent ? `Antwort auf ${parent.actor}` : 'Übergeordneter Beitrag');
    link.href = '#'+encodeURIComponent(entry.parent_id);
    link.dataset.parent = entry.parent_id;
    relation.append(link);
    item.append(relation);
  }
  const body = node('p',entry.text);
  if (entry.round===0 && isPost) {
    const details = node('details','');
    details.append(node('summary','Aufgabenstellung und Angebote anzeigen'),body);
    item.append(details);
  } else {
    item.append(body);
  }
  return item;
}

function render() {
  const {entries:all, state, rounds_total:total, current_round:current, rounds_completed:done} = snapshot;
  byId('status').textContent = states[state] ?? states.pending;
  byId('progress-label').textContent = `${done} von ${total} Runden abgeschlossen` +
    (state==='running' && current>done ? ` · Runde ${current} läuft` : '');
  byId('progress').max = total;
  byId('progress').value = done;
  const posts = all.filter(entry=>entry.kind==='post').length;
  byId('post-count').textContent = posts;
  byId('comment-count').textContent = all.length-posts;
  const threadExists = thread && all.some(entry=>entry.id===thread && entry.kind==='post');
  byId('thread-filter').hidden = !threadExists;
  const inThread = threadExists ? all.filter(entry=>entry.id===thread || entry.parent_id===thread) : all;
  const visible = filter.value==='' ? inThread : inThread.filter(entry=>entry.round===Number(filter.value));
  const lookup = new Map(all.map(entry=>[entry.id,entry]));
  const activeParent = document.activeElement?.dataset.parent;
  entries.replaceChildren(...visible.map(entry=>entryElement(entry,lookup)));
  if (activeParent) Array.from(entries.querySelectorAll('a')).find(link=>link.dataset.parent===activeParent)?.focus({preventScroll:true});
  const notice = byId('notice');
  notice.hidden = visible.length>0;
  notice.textContent = all.length ? 'In dieser Runde wurden keine Beiträge oder Antworten gespeichert.'
    : 'Die ersten Beiträge erscheinen hier, sobald sie gespeichert sind.';
}

function showParent(parentId, move) {
  let target = byId(parentId);
  if (!target && snapshot?.entries.some(entry=>entry.id===parentId)) {
    filter.value = '';
    render();
    target = byId(parentId);
  }
  if (!target) return;
  entries.querySelector('[data-highlight]')?.removeAttribute('data-highlight');
  target.dataset.highlight = 'true';
  if (move) {
    target.tabIndex = -1;
    target.focus({preventScroll:true});
    target.scrollIntoView({block:'center'});
  }
}

filter.addEventListener('change',()=>{ if (snapshot) render(); });
entries.addEventListener('click',event=>{
  const link = event.target.closest('a[data-parent]');
  if (!link) return;
  event.preventDefault();
  history.replaceState(null,'',link.hash);
  showParent(link.dataset.parent,true);
});
function inHash() {
  try { return decodeURIComponent(location.hash.slice(1)); } catch { return ''; }
}
addEventListener('hashchange',()=>showParent(inHash(),true));

async function refresh() {
  if (reading) return;
  reading = true;
  try {
    const response = await fetch(source,{cache:'no-store'});
    if (!response.ok) {
      if (response.status!==404 || snapshot) throw new Error('transcript unavailable');
      return;
    }
    const raw = await response.text();
    if (raw===fingerprint) return;
    const next = JSON.parse(raw);
    if (!Array.isArray(next.entries) || !next.rounds_total) throw new Error('invalid transcript');
    const first = !snapshot;
    snapshot = next;
    fingerprint = raw;
    render();
    if (inHash()) showParent(inHash(),first);
  } catch {
    byId('status').textContent = snapshot ? 'Verbindung unterbrochen · gespeicherter Stand' : 'Simulationsdaten derzeit nicht erreichbar';
    fingerprint = undefined;
  } finally {
    reading = false;
    if (!['completed','stopped','failed'].includes(snapshot?.state)) setTimeout(refresh,1800);
  }
}
refresh();
