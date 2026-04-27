/* tab title typewriter */
document.title = '0';
var _typeI = 1;
var _typeTitle = 'Welcome to 0daze!';
var _typeDir = 1;
var _typeTimer = null;
var _tabHidden = false;
var _hiddenMessages = ['Hey! what are you doing!?', '👁️👁️👁️👁️👁️👁️👁️👁️👁️👁️', 'Can I see!?', '👁️👁️👁️👁️👁️👁️👁️👁️👁️👁️'];
var _hiddenIndex = 0;
var _hiddenTimer = null;

function _typeStep() {
  if (_tabHidden) return;
  _typeI += _typeDir;
  if (_typeI > _typeTitle.length) {
    _typeI = _typeTitle.length;
    _typeDir = -1;
  } else if (_typeI < 1) {
    _typeI = 1;
    _typeDir = 1;
  }
  document.title = _typeTitle.slice(0, _typeI);
  _typeTimer = setTimeout(_typeStep, _typeDir === 1 ? 200 : 50);
}
_typeTimer = setTimeout(_typeStep, 200);

function _hiddenStep() {
  if (!_tabHidden) return;
  document.title = _hiddenMessages[_hiddenIndex];
  _hiddenIndex = (_hiddenIndex + 1) % _hiddenMessages.length;
  _hiddenTimer = setTimeout(_hiddenStep, 1500);
}

document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    _tabHidden = true;
    clearTimeout(_typeTimer);
    _hiddenIndex = 0;
    document.title = _hiddenMessages[0];
    _hiddenIndex = 1;
    _hiddenTimer = setTimeout(_hiddenStep, 1500);
  } else {
    _tabHidden = false;
    clearTimeout(_hiddenTimer);
    _typeI = 1;
    _typeDir = 1;
    document.title = _typeTitle[0];
    _typeTimer = setTimeout(_typeStep, 200);
  }
});

window.setTabTitle = function(newTitle) {
  _typeTitle = newTitle;
  clearTimeout(_typeTimer);
  _typeI = 1;
  _typeDir = 1;
  document.title = _typeTitle[0];
  _typeTimer = setTimeout(_typeStep, 200);
};
