import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = {};
vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../src/Logic.gs', import.meta.url), 'utf8'), ctx);
const { cleanLocation, shouldMap, isConfirmed, geocodeKey, pickCalendarId, pageUrl, accountUrl, calendarOptions } = ctx;

const now = new Date('2026-09-26T13:00:00-04:00');
const later = new Date('2026-09-28T12:00:00-04:00');
const event = overrides => ({ allDay: false, location: '1428 Matthews Plantation Matthews NC 28105', end: later, guestStatus: '', ...overrides });

test('cleanLocation strips a trailing phone number and collapses whitespace', () => {
  assert.equal(cleanLocation('154 Cannon Ave. NW Concord NC  704-254-9253'), '154 Cannon Ave. NW Concord NC');
  assert.equal(cleanLocation('1717 Cleveland Ave, Charlotte, NC 28203, USA'), '1717 Cleveland Ave, Charlotte, NC 28203');
  assert.equal(cleanLocation(null), '');
});

test('shouldMap keeps an upcoming event with a street address', () => {
  assert.equal(shouldMap(event({}), now), true);
});

test('shouldMap drops past, all-day, declined, virtual and location-less events', () => {
  assert.equal(shouldMap(event({ end: new Date('2026-09-26T09:00:00-04:00') }), now), false);
  assert.equal(shouldMap(event({ allDay: true }), now), false);
  assert.equal(shouldMap(event({ guestStatus: 'NO' }), now), false);
  assert.equal(shouldMap(event({ location: 'https://meet.google.com/abc-defg-hij' }), now), false);
  assert.equal(shouldMap(event({ location: 'Zoom call' }), now), false);
  assert.equal(shouldMap(event({ location: '' }), now), false);
});

test('shouldMap keeps an event that is still in progress', () => {
  assert.equal(shouldMap(event({ end: new Date('2026-09-26T14:00:00-04:00') }), now), true);
});

test('isConfirmed treats invited and maybe as not confirmed', () => {
  assert.equal(isConfirmed('YES'), true);
  assert.equal(isConfirmed('OWNER'), true);
  assert.equal(isConfirmed(''), true);
  assert.equal(isConfirmed('INVITED'), false);
  assert.equal(isConfirmed('MAYBE'), false);
});

test('geocodeKey is stable across formatting differences', () => {
  assert.equal(geocodeKey('701 Coventry Drive  Albemarle NC'), geocodeKey('701 coventry drive albemarle nc'));
});

test('pickCalendarId prefers the link, then the script setting, then the default', () => {
  assert.equal(pickCalendarId('team@group.calendar.google.com', 'setting@x.com', 'default@x.com'), 'team@group.calendar.google.com');
  assert.equal(pickCalendarId('', 'setting@x.com', 'default@x.com'), 'setting@x.com');
  assert.equal(pickCalendarId(undefined, null, 'default@x.com'), 'default@x.com');
  assert.equal(pickCalendarId('  ', '', 'default@x.com'), 'default@x.com');
});

test('pageUrl builds the plain deployment link and keeps the calendar', () => {
  assert.equal(pageUrl('DEP123', 'bartoncrypto@gmail.com'), 'https://script.google.com/macros/s/DEP123/exec?cal=bartoncrypto%40gmail.com');
  assert.equal(pageUrl('DEP123', ''), 'https://script.google.com/macros/s/DEP123/exec');
  assert.equal(pageUrl('', 'x'), '');
});

test('accountUrl keeps Workspace viewers on their domain and Gmail viewers on the plain link', () => {
  assert.equal(accountUrl('DEP', 'btadjusting03@gmail.com', 'barton@bh-systems.com'), 'https://script.google.com/a/macros/bh-systems.com/s/DEP/exec?cal=btadjusting03%40gmail.com');
  assert.equal(accountUrl('DEP', '', 'someone@gmail.com'), 'https://script.google.com/macros/s/DEP/exec');
  assert.equal(accountUrl('DEP', '', ''), 'https://script.google.com/macros/s/DEP/exec');
});

test('calendarOptions drops hidden and auto calendars and puts the viewer\'s own first', () => {
  const opts = calendarOptions([
    { id: 'zed@group.calendar.google.com', name: 'Zed team', owned: true },
    { id: 'en.usa#holiday@group.v.calendar.google.com', name: 'Holidays' },
    { id: 'btadjusting03@gmail.com', name: 'Brandon', owned: false },
    { id: 'me@x.com', name: 'Me', primary: true, owned: true },
    { id: 'hidden@x.com', name: 'Hidden', hidden: true },
    { id: 'addressbook#contacts@group.v.calendar.google.com', name: 'Birthdays' }
  ], 'btadjusting03@gmail.com');
  assert.deepEqual(opts.map(o => o.id), ['me@x.com', 'zed@group.calendar.google.com', 'btadjusting03@gmail.com']);
  assert.equal(opts.find(o => o.selected).id, 'btadjusting03@gmail.com');
});
