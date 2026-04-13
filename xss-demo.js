/* xss demo */

function initXssDemo(stage) {
  if (!stage) return;

  stage.innerHTML =
    '<div class="xss-search-bar">' +
      '<input type="text" class="xss-input" placeholder="search 0daze..." />' +
      '<button class="xss-btn">search</button>' +
    '</div>' +
    '<div class="xss-results"></div>';

  var input = stage.querySelector('.xss-input');
  var btn = stage.querySelector('.xss-btn');
  var results = stage.querySelector('.xss-results');

  function reflect() {
    var val = input.value;
    if (!val.trim()) {
      results.innerHTML = '<span class="xss-hint">try typing something...</span>';
      return;
    }
    results.innerHTML = '';
    var frag = document.createRange().createContextualFragment(
      '<span class="xss-label">results for:</span> ' + val
    );
    results.appendChild(frag);
  }

  btn.addEventListener('click', reflect);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') reflect();
  });

  results.innerHTML = '<span class="xss-hint">try typing something...</span>';
}

window.initXssDemo = initXssDemo;
