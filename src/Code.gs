var CONFIG = {
  calendarId: 'primary',
  daysAhead: 14,
  timeZone: 'America/New_York',
  title: 'Appointment Map',
  deploymentId: 'AKfycbyj2Vnzl5IZo3r_nyd1EWWxflf90qnZwt32OkmjSOyRBPXofw7zIUFwWVZpPMt4M_gb'
};

function doGet(e) {
  var props = PropertiesService.getScriptProperties();
  var calendarId = pickCalendarId(e && e.parameter ? e.parameter.cal : '', props.getProperty('CALENDAR_ID'), CONFIG.calendarId);
  var viewer = Session.getEffectiveUser().getEmail();
  var calendar = openCalendar_(calendarId);
  var plan = calendar ? buildPlan_(new Date(), calendar, calendar.getId()) : emptyPlan_(new Date(), 'You are signed in as ' + (viewer || 'an unknown account') + ', which cannot see the calendar ' + calendarId + '.');
  plan.viewer = viewer;
  plan.pageUrl = pageUrl(CONFIG.deploymentId, e && e.parameter ? e.parameter.cal : '');
  var page = HtmlService.createTemplateFromFile('Index');
  page.planJson = JSON.stringify(plan).replace(/</g, '\\u003c');
  page.apiKey = props.getProperty('MAPS_API_KEY') || '';
  page.settingsJson = JSON.stringify({ apiKey: page.apiKey, mapId: props.getProperty('MAP_ID') || 'DEMO_MAP_ID' });
  return page.evaluate()
    .setTitle(CONFIG.title)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function openCalendar_(calendarId) {
  if (calendarId === 'primary' || calendarId === 'me') return CalendarApp.getDefaultCalendar();
  return CalendarApp.getCalendarById(calendarId);
}

function emptyPlan_(now, notice) {
  return { generated: format_(now, 'EEE MMM d, h:mm a'), today: format_(now, 'yyyy-MM-dd'), daysAhead: CONFIG.daysAhead, stops: [], skipped: [], notice: notice };
}

function buildPlan_(now, calendar, calendarId) {
  var from = startOfDay_(now);
  var to = new Date(from.getTime() + (CONFIG.daysAhead + 1) * 86400000);
  var stops = [];
  var skipped = [];
  calendar.getEvents(from, to).forEach(function (event) {
    var guest = event.getGuestByEmail(calendarId);
    var guestStatus = guest ? String(guest.getGuestStatus()) : '';
    var raw = { allDay: event.isAllDayEvent(), location: event.getLocation(), end: event.getEndTime(), guestStatus: guestStatus };
    if (!shouldMap(raw, now)) return;
    var address = cleanLocation(raw.location);
    var point = geocode_(address);
    if (!point) {
      skipped.push(event.getTitle());
      return;
    }
    var start = event.getStartTime();
    stops.push({
      title: event.getTitle().replace(/\s+/g, ' ').trim(),
      address: address,
      lat: point.lat,
      lng: point.lng,
      start: start.toISOString(),
      date: format_(start, 'yyyy-MM-dd'),
      dayLabel: format_(start, 'EEE M/d'),
      weekday: Number(format_(start, 'u')) % 7,
      time: format_(start, 'h:mm a'),
      endTime: format_(event.getEndTime(), 'h:mm a'),
      confirmed: isConfirmed(guestStatus)
    });
  });
  stops.sort(function (a, b) { return a.start < b.start ? -1 : 1; });
  return {
    calendarName: calendar.getName(),
    generated: format_(now, 'EEE MMM d, h:mm a'),
    today: format_(now, 'yyyy-MM-dd'),
    daysAhead: CONFIG.daysAhead,
    stops: stops,
    skipped: skipped
  };
}

function geocode_(address) {
  var key = geocodeKey(address);
  var props = PropertiesService.getScriptProperties();
  var cached = props.getProperty(key);
  if (cached) return JSON.parse(cached);
  var response = Maps.newGeocoder().setRegion('us').geocode(address);
  if (response.status !== 'OK' || !response.results.length) return null;
  var loc = response.results[0].geometry.location;
  var point = { lat: loc.lat, lng: loc.lng };
  props.setProperty(key, JSON.stringify(point));
  return point;
}

function startOfDay_(date) {
  return new Date(format_(date, "yyyy-MM-dd'T'00:00:00XXX"));
}

function format_(date, pattern) {
  return Utilities.formatDate(date, CONFIG.timeZone, pattern);
}

function setup() {
  var props = PropertiesService.getScriptProperties();
  var calendarId = pickCalendarId('', props.getProperty('CALENDAR_ID'), CONFIG.calendarId);
  var calendar = openCalendar_(calendarId);
  if (!calendar) throw new Error('This account cannot see the calendar ' + calendarId);
  var plan = buildPlan_(new Date(), calendar, calendar.getId());
  Logger.log('Calendar %s (%s): %s stops in the next %s days.', plan.calendarName, calendarId, plan.stops.length, CONFIG.daysAhead);
  Logger.log('Maps API key set: %s', props.getProperty('MAPS_API_KEY') ? 'yes' : 'NO - add MAPS_API_KEY in Project Settings > Script properties');
}
