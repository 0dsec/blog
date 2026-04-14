marked.setOptions({ breaks: true, gfm: true });

let allPosts = [];
let activeTag = 'All';
let openCardId = null;
const contentCache = {};

const tagFilter = document.getElementById('tag-filter');
const postList  = document.getElementById('post-list');

document.body.classList.add('initial-load');
loadBlog();

async function loadBlog() {
  try {
    const res = await fetch('data/posts.json');
    allPosts = await res.json();

    const now = Date.now();
    allPosts = allPosts.filter(p => {
      const ts = parsePostDate(p.date);
      return ts === null || ts <= now;
    });

    allPosts.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.id - a.id;
    });

    buildTagFilter();
    renderPosts();

    setTimeout(() => {
      document.body.classList.remove('initial-load');
    }, 2200);
  } catch (err) {
    console.error('Failed to load posts:', err);
    postList.innerHTML = '<p class="error-msg">failed to load posts.</p>';
  }
}

function parsePostDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const mm = parseInt(parts[0], 10);
  const dd = parseInt(parts[1], 10);
  const yyyy = parseInt(parts[2], 10);
  if (isNaN(mm) || isNaN(dd) || isNaN(yyyy)) return null;
  return new Date(yyyy, mm - 1, dd, 23, 59, 59).getTime();
}

/* tag filter */

function buildTagFilter() {
  const tagSet = new Set();
  allPosts.forEach(p => {
    if (p.hidden) return;
    p.tags.forEach(t => tagSet.add(t));
  });
  tagSet.delete('LOCKED');
  const tags = ['All', ...Array.from(tagSet).sort(), 'LOCKED'];

  tagFilter.innerHTML = tags.map(t => {
    if (t === 'LOCKED') {
      return `<button class="tag-btn locked" data-tag="LOCKED" disabled title="LOCKED CONTENT! Try to hack this button!
Check out the post called Broken Access Control for full tutorial!">LOCKED</button>`;
    }
    return `<button class="tag-btn${t === activeTag ? ' active' : ''}" data-tag="${t}">${t}</button>`;
  }).join('');

  tagFilter.addEventListener('click', (e) => {
    const btn = e.target.closest('.tag-btn');
    if (!btn) return;
    if (btn.disabled) return;

    activeTag = btn.dataset.tag;

    tagFilter.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    openCardId = null;
    if (window.setTabTitle) window.setTabTitle('Welcome to 0daze!');
    renderPosts();
  });

  const lockedBtn = tagFilter.querySelector('.tag-btn.locked');
  if (lockedBtn) {
    const observer = new MutationObserver(() => {
      if (!lockedBtn.disabled) {
        lockedBtn.classList.remove('locked');
        lockedBtn.removeAttribute('title');
        observer.disconnect();
      }
    });
    observer.observe(lockedBtn, { attributes: true, attributeFilter: ['disabled'] });
  }
}

/* render post cards */

function renderPosts() {
  const filtered = activeTag === 'All'
    ? allPosts.filter(p => !p.tags.includes('LOCKED') && !p.hidden)
    : allPosts.filter(p => p.tags.includes(activeTag) && !p.hidden);

  if (filtered.length === 0) {
    postList.innerHTML = '<p class="no-results">no posts found_</p>';
    return;
  }

  postList.innerHTML = filtered.map(post => `
    <article class="post-card${post.pinned ? ' pinned' : ''}" data-id="${post.id}">
      <div class="card-header">
        <div class="post-meta-row">
          <time class="post-date">${post.date}</time>
          ${post.pinned ? '<span class="pinned-label">PINNED</span>' : ''}
          <div class="post-tags">
            ${post.tags.map(t => `<span class="tag" data-tag="${t}">${t}</span>`).join('')}
          </div>
        </div>
        <div class="post-title">${post.title}</div>
        <div class="post-desc">${post.description}</div>
        <div class="card-actions">
          <a href="post.html?id=${post.id}" target="_blank" rel="noopener" class="open-tab-link" onclick="event.stopPropagation()">open in new tab &rarr;</a>
          ${post.repo ? `<a href="${post.repo}" target="_blank" class="repo-link" onclick="event.stopPropagation()" title="View repo"><img src="images/icons/github.png" alt="GitHub repo"></a>` : ''}
        </div>
      </div>
      <div class="card-body" id="body-${post.id}">
        <div class="card-body-inner" id="inner-${post.id}"></div>
      </div>
    </article>
  `).join('');

  postList.querySelectorAll('.card-header').forEach(header => {
    header.addEventListener('click', (e) => {
      const tagEl = e.target.closest('.tag');
      if (tagEl) {
        e.stopPropagation();
        const tag = tagEl.dataset.tag;
        activeTag = tag;
        tagFilter.querySelectorAll('.tag-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.tag === tag);
        });
        openCardId = null;
        if (window.setTabTitle) window.setTabTitle('Welcome to 0daze!');
        renderPosts();
        return;
      }

      const card = header.closest('.post-card');
      const id = parseInt(card.dataset.id, 10);
      toggleCard(id);
    });
  });
}

/* expand / collapse */

async function toggleCard(id) {
  const wasOpen = openCardId === id;

  if (openCardId !== null) {
    closeCard(openCardId);
  }

  if (wasOpen) {
    openCardId = null;
    if (window.setTabTitle) window.setTabTitle('Welcome to 0daze!');
    return;
  }

  openCardId = id;
  const post = allPosts.find(p => p.id === id);
  if (post && window.setTabTitle) window.setTabTitle(post.title);
  await openCard(id);
}

function closeCard(id) {
  const card = document.querySelector(`.post-card[data-id="${id}"]`);
  const body = document.getElementById(`body-${id}`);
  if (!card || !body) return;

  card.classList.remove('open');
  body.style.maxHeight = '0';
}

async function openCard(id) {
  const card = document.querySelector(`.post-card[data-id="${id}"]`);
  const body = document.getElementById(`body-${id}`);
  const inner = document.getElementById(`inner-${id}`);
  if (!card || !body || !inner) return;

  const post = allPosts.find(p => p.id === id);
  if (!post) return;

  if (post.custom === 'pretext') {
    let introHtml = '';
    if (post.file) {
      if (!contentCache[id]) {
        try {
          const res = await fetch(`posts/${post.file}`);
          const mdText = await res.text();
          contentCache[id] = marked.parse(mdText);
        } catch (err) {
          console.error(`Failed to load post ${id} intro:`, err);
          contentCache[id] = '';
        }
      }
      introHtml = `<div class="markdown-body">${contentCache[id]}</div>`;
    }

    inner.innerHTML = `
      ${post.quote ? `<p class="post-quote">${post.quote}</p>` : ''}
      <div class="post-body">
        ${introHtml}
        <div class="pretext-stage" id="pretext-stage-${id}">
          <canvas class="pretext-canvas"></canvas>
        </div>
      </div>
    `;

    const quoteEl = inner.querySelector('.post-quote');
    if (quoteEl) typewriterQuote(quoteEl);

    card.classList.add('open');
    body.style.maxHeight = inner.scrollHeight + 'px';

    requestAnimationFrame(() => {
      if (window.initPretextDemo) {
        window.initPretextDemo(inner.querySelector('.pretext-stage'));
      }
    });
    return;
  }

  if (post.custom === 'xss') {
    let introHtml = '';
    if (post.file) {
      if (!contentCache[id]) {
        try {
          const res = await fetch(`posts/${post.file}`);
          const mdText = await res.text();
          contentCache[id] = marked.parse(mdText);
        } catch (err) {
          console.error(`Failed to load post ${id} intro:`, err);
          contentCache[id] = '';
        }
      }
      introHtml = `<div class="markdown-body">${contentCache[id]}</div>`;
    }

    inner.innerHTML = `
      ${post.quote ? `<p class="post-quote">${post.quote}</p>` : ''}
      <div class="post-body">
        ${introHtml}
        <div class="xss-stage" id="xss-stage-${id}"></div>
      </div>
    `;

    const quoteEl = inner.querySelector('.post-quote');
    if (quoteEl) typewriterQuote(quoteEl);

    card.classList.add('open');
    body.style.maxHeight = inner.scrollHeight + 'px';

    requestAnimationFrame(() => {
      if (window.initXssDemo) {
        window.initXssDemo(inner.querySelector('.xss-stage'));
      }
      body.style.maxHeight = inner.scrollHeight + 'px';
    });
    return;
  }

  if (!contentCache[id]) {
    inner.innerHTML = '<p class="loading-msg">loading_</p>';
    card.classList.add('open');
    body.style.maxHeight = '80px';

    try {
      const res = await fetch(`posts/${post.file}`);
      const mdText = await res.text();
      contentCache[id] = marked.parse(mdText);
    } catch (err) {
      console.error(`Failed to load post ${id}:`, err);
      contentCache[id] = '<p class="error-msg">failed to load content.</p>';
    }
  }

  inner.innerHTML = `
    ${post.quote ? `<p class="post-quote">${post.quote}</p>` : ''}
    <div class="post-body markdown-body">${contentCache[id]}</div>
  `;

  const quoteEl = inner.querySelector('.post-quote');
  if (quoteEl) typewriterQuote(quoteEl);

  card.classList.add('open');
  body.style.maxHeight = inner.scrollHeight + 'px';

  inner.querySelectorAll('img').forEach(img => {
    img.addEventListener('load', () => {
      body.style.maxHeight = inner.scrollHeight + 'px';
    });
  });
}

/* typewriter quote */

function typewriterQuote(el) {
  const text = el.textContent;
  el.textContent = '';
  el.style.visibility = 'visible';
  let i = 0;
  const interval = setInterval(() => {
    i++;
    el.textContent = text.slice(0, i);
    if (i >= text.length) clearInterval(interval);
  }, 30);
}
