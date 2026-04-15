marked.setOptions({ breaks: true, gfm: true });

let allPosts = [];
let activeTag = 'All';
let openCardId = null;
let openRequestToken = 0;
const contentCache = {};

const tagFilter = document.getElementById('tag-filter');
const postList  = document.getElementById('post-list');

document.body.classList.add('initial-load');
loadBlog();

window.addEventListener('resize', () => {
  if (openCardId !== null) {
    syncOpenCardHeight(openCardId);
  }
});

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
      return `
        <span class="locked-tag-wrap">
          <button class="tag-btn locked" data-tag="LOCKED" disabled>LOCKED</button>
          <span class="locked-tooltip" role="tooltip">
            LOCKED CONTENT! Try to hack this button!<br>
            Check out the post called Broken Access Control for full tutorial!
          </span>
        </span>
      `;
    }
    return `<button class="tag-btn${t === activeTag ? ' active' : ''}" data-tag="${t}">${t}</button>`;
  }).join('');

  tagFilter.addEventListener('click', (e) => {
    const btn = e.target.closest('.tag-btn');
    if (!btn) return;
    if (btn.disabled) return;

    activeTag = btn.dataset.tag;
    openRequestToken++;

    tagFilter.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    openCardId = null;
    if (window.setTabTitle) window.setTabTitle('Welcome to 0daze!');
    renderPosts();
  });

  const lockedBtn = tagFilter.querySelector('.tag-btn.locked');
  const lockedWrap = tagFilter.querySelector('.locked-tag-wrap');
  if (lockedBtn && lockedWrap) {
    const observer = new MutationObserver(() => {
      if (!lockedBtn.disabled) {
        lockedBtn.classList.remove('locked');
        const tooltip = lockedWrap.querySelector('.locked-tooltip');
        if (tooltip) tooltip.remove();
        lockedWrap.replaceWith(lockedBtn);
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
            ${renderPostTags(post.tags)}
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
      const moreToggle = e.target.closest('.tag-more');
      if (moreToggle) {
        e.stopPropagation();
        toggleExtraTags(moreToggle);
        return;
      }

      const tagEl = e.target.closest('.tag');
      if (tagEl) {
        e.stopPropagation();
        const tag = tagEl.dataset.tag;
        if (!tag) return;
        activeTag = tag;
        openRequestToken++;
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

function renderPostTags(tags) {
  const visibleTags = tags.slice(0, 4);
  const hiddenTags = tags.slice(4);

  const visibleHtml = visibleTags
    .map(t => `<span class="tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</span>`)
    .join('');

  if (hiddenTags.length === 0) {
    return visibleHtml;
  }

  const hiddenHtml = hiddenTags
    .map(t => `<span class="tag extra-tag" data-tag="${escapeHtml(t)}" hidden>${escapeHtml(t)}</span>`)
    .join('');

  return `
    ${visibleHtml}
    ${hiddenHtml}
    <span class="tag tag-more" data-expanded="false" aria-label="Show more tags">+</span>
  `;
}

function toggleExtraTags(toggleEl) {
  const tagsContainer = toggleEl.closest('.post-tags');
  if (!tagsContainer) return;

  const extraTags = tagsContainer.querySelectorAll('.extra-tag');
  const expanded = toggleEl.dataset.expanded === 'true';

  extraTags.forEach(tag => {
    tag.hidden = expanded;
  });

  toggleEl.dataset.expanded = expanded ? 'false' : 'true';
  toggleEl.textContent = expanded ? '+' : '−';
  toggleEl.setAttribute(
    'aria-label',
    expanded ? 'Show more tags' : 'Hide extra tags'
  );

  tagsContainer.appendChild(toggleEl);
}

/* expand / collapse */

async function toggleCard(id) {
  const wasOpen = openCardId === id;

  if (openCardId !== null) {
    closeCard(openCardId);
  }

  if (wasOpen) {
    openCardId = null;
    openRequestToken++;
    if (window.setTabTitle) window.setTabTitle('Welcome to 0daze!');
    return;
  }

  openCardId = id;
  openRequestToken++;
  const requestToken = openRequestToken;

  const post = allPosts.find(p => p.id === id);
  if (post && window.setTabTitle) window.setTabTitle(post.title);
  await openCard(id, requestToken);
}

function closeCard(id) {
  const card = document.querySelector(`.post-card[data-id="${id}"]`);
  const body = document.getElementById(`body-${id}`);
  if (!card || !body) return;

  card.classList.remove('open');
  body.style.maxHeight = '0';
}

function syncOpenCardHeight(id) {
  const body = document.getElementById(`body-${id}`);
  const inner = document.getElementById(`inner-${id}`);
  if (!body || !inner) return;
  if (openCardId !== id) return;

  requestAnimationFrame(() => {
    if (openCardId === id) {
      body.style.maxHeight = inner.scrollHeight + 'px';
    }
  });
}

function bindDynamicHeightWatchers(id) {
  const inner = document.getElementById(`inner-${id}`);
  if (!inner) return;

  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => {
      if (openCardId === id) {
        syncOpenCardHeight(id);
      }
    });
    ro.observe(inner);
  }

  inner.querySelectorAll('img, iframe').forEach(el => {
    if (el.tagName === 'IMG' && !el.complete) {
      el.addEventListener('load', () => {
        if (openCardId === id) syncOpenCardHeight(id);
      });
      return;
    }

    if (el.tagName === 'IFRAME') {
      el.addEventListener('load', () => {
        if (openCardId === id) syncOpenCardHeight(id);
      });
    }
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (openCardId === id) {
        syncOpenCardHeight(id);
      }
    });
  }

  setTimeout(() => {
    if (openCardId === id) syncOpenCardHeight(id);
  }, 100);

  setTimeout(() => {
    if (openCardId === id) syncOpenCardHeight(id);
  }, 500);
}

async function openCard(id, requestToken) {
  const card = document.querySelector(`.post-card[data-id="${id}"]`);
  const body = document.getElementById(`body-${id}`);
  const inner = document.getElementById(`inner-${id}`);
  if (!card || !body || !inner) return;

  const post = allPosts.find(p => p.id === id);
  if (!post) return;

  const isStale = () => requestToken !== openRequestToken || openCardId !== id;

  if (post.custom === 'pretext') {
    let introHtml = '';
    if (post.file) {
      if (!contentCache[id]) {
        try {
          const res = await fetch(`posts/${post.file}`);
          const mdText = await res.text();
          if (isStale()) return;
          contentCache[id] = marked.parse(mdText);
        } catch (err) {
          console.error(`Failed to load post ${id} intro:`, err);
          if (isStale()) return;
          contentCache[id] = '';
        }
      }
      introHtml = `<div class="markdown-body">${contentCache[id]}</div>`;
    }

    if (isStale()) return;

    inner.innerHTML = `
      ${post.quote ? `<p class="post-quote">${post.quote}</p>` : ''}
      <div class="post-body">
        ${introHtml}
        <div class="pretext-stage" id="pretext-stage-${id}">
          <canvas class="pretext-canvas"></canvas>
        </div>
      </div>
    `;

    card.classList.add('open');
    syncOpenCardHeight(id);

    const quoteEl = inner.querySelector('.post-quote');
    if (quoteEl) {
      typewriterQuote(quoteEl, () => {
        if (openCardId === id && requestToken === openRequestToken) {
          syncOpenCardHeight(id);
        }
      });
    }

    bindDynamicHeightWatchers(id);

    requestAnimationFrame(() => {
      if (isStale()) return;
      if (window.initPretextDemo) {
        window.initPretextDemo(inner.querySelector('.pretext-stage'));
      }
      syncOpenCardHeight(id);
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
          if (isStale()) return;
          contentCache[id] = marked.parse(mdText);
        } catch (err) {
          console.error(`Failed to load post ${id} intro:`, err);
          if (isStale()) return;
          contentCache[id] = '';
        }
      }
      introHtml = `<div class="markdown-body">${contentCache[id]}</div>`;
    }

    if (isStale()) return;

    inner.innerHTML = `
      ${post.quote ? `<p class="post-quote">${post.quote}</p>` : ''}
      <div class="post-body">
        ${introHtml}
        <div class="xss-stage" id="xss-stage-${id}"></div>
      </div>
    `;

    card.classList.add('open');
    syncOpenCardHeight(id);

    const quoteEl = inner.querySelector('.post-quote');
    if (quoteEl) {
      typewriterQuote(quoteEl, () => {
        if (openCardId === id && requestToken === openRequestToken) {
          syncOpenCardHeight(id);
        }
      });
    }

    bindDynamicHeightWatchers(id);

    requestAnimationFrame(() => {
      if (isStale()) return;
      if (window.initXssDemo) {
        window.initXssDemo(inner.querySelector('.xss-stage'));
      }
      syncOpenCardHeight(id);
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
      if (isStale()) return;
      contentCache[id] = marked.parse(mdText);
    } catch (err) {
      console.error(`Failed to load post ${id}:`, err);
      if (isStale()) return;
      contentCache[id] = '<p class="error-msg">failed to load content.</p>';
    }
  }

  if (isStale()) return;

  inner.innerHTML = `
    ${post.quote ? `<p class="post-quote">${post.quote}</p>` : ''}
    <div class="post-body markdown-body">${contentCache[id]}</div>
  `;

  card.classList.add('open');
  syncOpenCardHeight(id);

  const quoteEl = inner.querySelector('.post-quote');
  if (quoteEl) {
    typewriterQuote(quoteEl, () => {
      if (openCardId === id && requestToken === openRequestToken) {
        syncOpenCardHeight(id);
      }
    });
  }

  bindDynamicHeightWatchers(id);
}

/* typewriter quote */

function typewriterQuote(el, onTick) {
  const text = el.textContent;
  el.textContent = '';
  el.style.visibility = 'visible';
  let i = 0;
  const interval = setInterval(() => {
    i++;
    el.textContent = text.slice(0, i);
    if (typeof onTick === 'function') onTick();
    if (i >= text.length) clearInterval(interval);
  }, 30);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}