export function createSocialReplay(entries, transcript, strings, make, showShopper, resize) {
  const byId = new Map(entries.map(entry=>[entry.id,entry]));
  const byShopper = new Map();
  for (const entry of entries) {
    if (!entry.shopper_id) continue;
    if (!byShopper.has(entry.shopper_id)) byShopper.set(entry.shopper_id,new Map());
    const rounds = byShopper.get(entry.shopper_id);
    if (!rounds.has(entry.round)) rounds.set(entry.round,[]);
    rounds.get(entry.round).push(entry);
  }
  const rounds = [1,2,3];

  function render(shopper, round, changeRound) {
    const {ui,language,translations,person} = strings();
    const section = make('section','social-turn');
    const controls = make('div','social-rounds');
    controls.setAttribute('role','group');
    controls.setAttribute('aria-label',ui.social.rounds);
    for (const number of rounds) {
      const button = make('button','',ui.social.round(number));
      button.type='button';
      button.dataset.round=String(number);
      button.setAttribute('aria-pressed',String(number===round));
      button.addEventListener('click',()=>changeRound(number));
      controls.append(button);
    }
    section.append(controls);
    const messages = byShopper.get(shopper)?.get(round) ?? [];
    if (!messages.length) section.append(make('p','social-empty',ui.social.empty));

    function post(entry) {
      const article = make('article','social-post');
      article.dataset.entry=entry.id;
      const author = entry.shopper_id ? person(entry.shopper_id) : ui.social.seed;
      const kind = entry.kind==='post' ? ui.social.post : ui.social.reply;
      article.append(make('div','social-byline',`${author} · ${kind}`));
      const translated = translations.feed[entry.id];
      const text = make('blockquote','social-text',translated ?? entry.text);
      text.lang=translated ? language : 'de';
      article.append(text);
      if (translated) {
        text.before(make('span','original-language',ui.social.automatic));
        const original = make('details','social-original');
        original.append(make('summary','',ui.social.original),make('blockquote','social-text',entry.text));
        original.lastChild.lang='de';
        original.addEventListener('toggle',resize);
        article.append(original);
      } else if (language!=='de') {
        text.before(make('span','original-language',ui.translationMissing));
      }
      return article;
    }

    for (const entry of messages) {
      const article = post(entry);
      const parent = byId.get(entry.parent_id);
      if (parent) {
        const details = make('details','social-parent');
        const author = parent.shopper_id ? person(parent.shopper_id) : ui.social.seed;
        details.append(make('summary','',ui.social.parent(author)),post(parent));
        if (parent.shopper_id && parent.shopper_id!==shopper) {
          const select = make('button','social-person',ui.social.showPerson(author));
          select.type='button';
          select.addEventListener('click',()=>showShopper(parent.shopper_id,parent.round));
          details.append(select);
        }
        details.addEventListener('toggle',resize);
        article.append(details);
      }
      const thread = make('a','social-thread',ui.social.thread);
      thread.href=transcript+'&thread='+encodeURIComponent(entry.parent_id ?? entry.id)+'#'+encodeURIComponent(entry.id);
      article.append(thread);
      section.append(article);
    }
    return section;
  }

  return {render};
}
