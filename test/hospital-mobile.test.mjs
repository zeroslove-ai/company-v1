import test from 'node:test';
import assert from 'node:assert/strict';
import { arrangeHospitalMobileLayout } from '../src/frontend/pages/hospital-mobile.js';

function parent(name) {
  return {
    name,
    insertBefore(node, before) {
      node.parentElement = this;
      node.nextElementSibling = before;
    },
  };
}

test('mobile layout places action controls between story and status', () => {
  const gameShell = parent('shell');
  const gameLayout = parent('layout');
  const statusColumn = { parentElement: gameLayout };
  const utilityToolbar = { parentElement: gameShell };
  const actionPanel = { parentElement: gameShell, nextElementSibling: utilityToolbar };

  assert.equal(arrangeHospitalMobileLayout({ mobile: true, gameShell, gameLayout, statusColumn, actionPanel, utilityToolbar }), true);
  assert.equal(actionPanel.parentElement, gameLayout);
  assert.equal(actionPanel.nextElementSibling, statusColumn);
});

test('desktop layout restores action controls before the utility toolbar', () => {
  const gameShell = parent('shell');
  const gameLayout = parent('layout');
  const statusColumn = { parentElement: gameLayout };
  const utilityToolbar = { parentElement: gameShell };
  const actionPanel = { parentElement: gameLayout, nextElementSibling: statusColumn };

  assert.equal(arrangeHospitalMobileLayout({ mobile: false, gameShell, gameLayout, statusColumn, actionPanel, utilityToolbar }), true);
  assert.equal(actionPanel.parentElement, gameShell);
  assert.equal(actionPanel.nextElementSibling, utilityToolbar);
});
