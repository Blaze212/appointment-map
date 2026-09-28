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
