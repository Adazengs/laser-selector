import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

// Only the checked-out application is executed. jsdom does not load external resources.
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function app(t) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error));
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://laser-selector.test/',
    virtualConsole,
    beforeParse(window) { window.scrollTo = () => {}; },
  });
  t.after(() => {
    dom.window.close();
    assert.deepEqual(errors, [], 'Application must run without JavaScript errors');
  });
  const document = dom.window.document;
  const find = selector => {
    const element = document.querySelector(selector);
    assert.ok(element, `Missing element: ${selector}`);
    return element;
  };
  const click = selector => {
    const element = find(selector);
    assert.equal(Boolean(element.disabled), false, `Disabled control: ${selector}`);
    element.click();
  };
  const fill = (selector, value) => {
    const input = find(selector);
    assert.equal(input.readOnly, false);
    input.value = String(value);
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  };
  function chooseOD(panel, od) {
    click(`#${panel}-rows .od-pill`);
    const options = [...document.querySelectorAll(`#${panel}-rows .od-menu.open button`)];
    assert.equal(options.length, 9);
    assert.ok(options.every(option => !option.disabled), 'Every OD requirement must be selectable');
    const option = options.find(button => button.textContent.trim() === `OD ${od}`);
    assert.ok(option);
    option.click();
  }
  function multiRange(from, to) {
    click('#mode-multi-btn');
    click('#multi-rows .sr-btn:nth-child(2)');
    fill('#multi-rows .wl-input:first-of-type', from);
    fill('#multi-rows .wl-input:nth-of-type(2)', to);
  }
  return { document, find, click, fill, chooseOD, multiRange };
}

test('Multiple Wavelength: a broad range accepts OD and explains zero matches', t => {
  const ui = app(t);
  ui.multiRange(190, 1065);
  ui.chooseOD('multi', 5);
  ui.click('#btn-multi-next');
  assert.ok(ui.find('#panel-results').classList.contains('active'));
  assert.equal(ui.find('.rm-found').textContent, '0');
  assert.equal(ui.find('.empty h3').textContent, 'No matching filters found');
  assert.match(ui.find('.empty p').textContent, /actual operating range/);
  assert.match(ui.find('.empty p').textContent, /Add wavelength.*separate row/);
  assert.equal(ui.document.querySelectorAll('.result-list .rc').length, 0);
});

test('Multiple Wavelength: editing a range and switching Single/Range retain OD', t => {
  const ui = app(t);
  ui.multiRange(1060, 1065);
  ui.chooseOD('multi', 5);
  ui.fill('#multi-rows .wl-input:first-of-type', 190);
  assert.match(ui.find('#multi-rows .od-pill').textContent, /OD 5/);
  ui.click('#multi-rows .sr-btn:first-child');
  assert.match(ui.find('#multi-rows .od-pill').textContent, /OD 5/);
  ui.click('#multi-rows .sr-btn:nth-child(2)');
  ui.fill('#multi-rows .wl-input:nth-of-type(2)', 1065);
  assert.match(ui.find('#multi-rows .od-pill').textContent, /OD 5/);
  ui.click('#btn-multi-next');
  assert.equal(ui.find('.rm-found').textContent, '0');
});

test('Multiple Wavelength: a known matching range still returns matching filters', t => {
  const ui = app(t);
  ui.multiRange(1060, 1065);
  ui.chooseOD('multi', 5);
  ui.click('#btn-multi-next');
  assert.equal(ui.find('.rm-found').textContent, '16');
  assert.equal(ui.document.querySelector('.empty'), null);
  assert.match(ui.find('#results-area').textContent, /UL-1005/);
});

test('Quick Guide: Fiber supports OD selection and returns matching filters', t => {
  const ui = app(t);
  ui.click('.laser-chip[data-id="fiber"]');
  ui.chooseOD('quick', 5);
  ui.click('#btn-quick-next');
  assert.ok(Number(ui.find('.rm-found').textContent) > 0);
  assert.match(ui.find('.rm-rows').textContent, /1060–1080 nm/);
});

test('Quick Guide: unmatched OD stays selected across Single/Range changes', t => {
  const ui = app(t);
  ui.click('.laser-chip[data-id="eryag"]');
  ui.chooseOD('quick', 9);
  ui.click('#quick-rows .sr-btn:nth-child(2)');
  assert.match(ui.find('#quick-rows .od-pill').textContent, /OD 9/);
  ui.click('#quick-rows .sr-btn:first-child');
  assert.match(ui.find('#quick-rows .od-pill').textContent, /OD 9/);
  ui.click('#btn-quick-next');
  assert.equal(ui.find('.rm-found').textContent, '0');
  assert.equal(ui.find('.empty h3').textContent, 'No matching filters found');
});

test('Separate wavelengths can match when a continuous range cannot', t => {
  const ui = app(t);
  ui.click('#mode-multi-btn');
  ui.fill('#multi-rows .wl-input:first-of-type', 190);
  ui.chooseOD('multi', 5);
  ui.click('#btn-add-row');
  ui.fill('#multi-rows .wl-row:nth-child(2) .wl-input:first-of-type', 1065);
  ui.click('#multi-rows .wl-row:nth-child(2) .od-pill');
  ui.click('#multi-rows .od-menu.open button:nth-child(5)');
  ui.click('#btn-multi-next');
  assert.ok(Number(ui.find('.rm-found').textContent) > 0);
  assert.match(ui.find('#results-area').textContent, /UL-1005/);
});

test('An OD value does not allow incomplete, reversed or out-of-range input', t => {
  const ui = app(t);
  ui.multiRange(190, 1065);
  ui.chooseOD('multi', 5);
  for (const value of ['', '11001', '1066']) {
    ui.fill('#multi-rows .wl-input:first-of-type', value);
    assert.equal(ui.find('#btn-multi-next').disabled, true);
  }
  ui.fill('#multi-rows .wl-input:first-of-type', '190');
  assert.equal(ui.find('#btn-multi-next').disabled, false);
  assert.match(ui.find('#multi-rows .od-pill').textContent, /OD 5/);
});
