var VIRTUAL_LOCATION = /(https?:\/\/|zoom|meet\.google|teams\.microsoft|webex|virtual|dial-in|phone call)/i;
var TRAILING_PHONE = /\s*\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}\s*$/;
var UNCONFIRMED = ['INVITED', 'MAYBE'];

function cleanLocation(location) {
  return String(location || '')
    .replace(/\s+/g, ' ')
    .replace(TRAILING_PHONE, '')
    .replace(/,?\s*(USA|United States)$/i, '')
    .trim();
}

function shouldMap(ev, now) {
  if (ev.allDay) return false;
  if (ev.guestStatus === 'NO') return false;
  var location = cleanLocation(ev.location);
  if (!location || VIRTUAL_LOCATION.test(location)) return false;
  return ev.end.getTime() >= now.getTime();
}

function isConfirmed(guestStatus) {
  return UNCONFIRMED.indexOf(String(guestStatus || '')) === -1;
}

function geocodeKey(address) {
  return 'geo:' + cleanLocation(address).toLowerCase();
}

function pickCalendarId(fromUrl, fromSettings, fallback) {
  var candidates = [fromUrl, fromSettings, fallback];
  for (var i = 0; i < candidates.length; i++) {
    var id = String(candidates[i] || '').trim();
    if (id) return id;
  }
  return '';
}

function pageUrl(deploymentId, cal) {
  if (!deploymentId) return '';
  return 'https://script.google.com/macros/s/' + deploymentId + '/exec' + (cal ? '?cal=' + encodeURIComponent(cal) : '');
}

var PERSONAL_DOMAINS = ['gmail.com', 'googlemail.com'];
var AUTO_CALENDARS = /(#holiday@|#contacts@|#weeknum@|addressbook#|@import\.calendar\.google\.com$)/;

function accountUrl(deploymentId, cal, viewerEmail) {
  if (!deploymentId) return '';
  var domain = String(viewerEmail || '').split('@')[1] || '';
  var base = domain && PERSONAL_DOMAINS.indexOf(domain.toLowerCase()) === -1
    ? 'https://script.google.com/a/macros/' + domain.toLowerCase() + '/s/'
    : 'https://script.google.com/macros/s/';
  return base + deploymentId + '/exec' + (cal ? '?cal=' + encodeURIComponent(cal) : '');
}

function calendarOptions(calendars, selectedId) {
  return calendars
    .filter(function (c) { return !c.hidden && !AUTO_CALENDARS.test(c.id); })
    .map(function (c) { return { id: c.id, name: c.name, primary: !!c.primary, owned: !!c.owned, selected: c.id === selectedId }; })
    .sort(function (a, b) {
      if (a.primary !== b.primary) return a.primary ? -1 : 1;
      if (a.owned !== b.owned) return a.owned ? -1 : 1;
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    });
}

function deploymentIdFromUrl(url) {
  var match = /\/s\/([A-Za-z0-9_-]+)\/(exec|dev)/.exec(String(url || ''));
  return match ? match[1] : '';
}
