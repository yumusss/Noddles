// Injected into the page: builds the current order perfectly through the session API.
window.__solve = async function (opts = {}) {
  const s = window.__session;
  const o = s.activeOrder;
  if (!o) return 'no order';
  s.dismissAsk && s.dismissAsk();
  const slots = [];
  for (let y = -0.17; y <= 0.2; y += 0.12)
    for (let x = -0.37; x <= 0.38; x += 0.105) slots.push([x, y]);
  let k = 0;
  const spot = () => slots[k++ % slots.length];
  for (const l of o.lines) {
    if (l.k === 'nigiri') {
      s.squeezeStart();
      s.squeeze.a = l.less ? 0.4 : 0.8;
      s.squeezeEnd();
      const mine = [];
      for (let i = 0; i < l.n; i++) {
        const [x, y] = spot();
        s.tapPlate(x, y);
        mine.push([x, y]);
      }
      s.pickTray(l.fish);
      for (const [x, y] of mine) {
        if (!s.hand) s.pickTray(l.fish);
        s.tapPlate(x, y);
      }
      for (const t of l.tops) {
        s.pickTray(t);
        for (const [x, y] of mine) s.tapPlate(x, y);
      }
      s.dropHand();
      if (l.aburi) {
        s.pickTorch();
        for (const [x, y] of mine) {
          s.searStart(x, y);
          s.sear.t = 0.55;
          s.searEnd();
        }
        s.dropHand();
      }
    } else if (l.k === 'maki') {
      s.openMaki();
      s.boardStyle(l.style);
      s.boardRiceStart();
      s.board.rice = 0.8;
      s.boardRiceEnd();
      for (const f of l.fill) s.toggleFill(f);
      if (l.coat) s.setCoat(l.coat);
      s.rollStart(0, false);
      s.rollMove(-0.5);
      if (s.board.stage === 'rolling') {
        s.rollDrag && (s.rollDrag.time = 1);
      }
      s.rollMove(-1.2);
      s.setCount(l.n);
      s.board.cutT = 0.75;
      s.cutTap();
      const mine = [];
      for (let i = 0; i < l.n; i++) {
        const [x, y] = spot();
        s.tapPlate(x, y);
        mine.push([x, y]);
      }
      for (const t of l.tops) {
        s.pickTray(t);
        for (const [x, y] of mine) s.tapPlate(x, y);
      }
      s.dropHand();
    } else if (l.k === 'sashimi') {
      s.openSashimi();
      s.pickFish(l.fish);
      s.setCount(l.n);
      s.board.cutT = { thin: 0.38, normal: 0.95, thick: 1.52 }[l.thick];
      s.cutTap();
      for (let i = 0; i < l.n; i++) {
        const [x, y] = spot();
        s.tapPlate(x, y);
      }
    }
  }
  for (const side of o.sides) {
    s.pickTray(side);
    const [x, y] = spot();
    s.tapPlate(x, y);
    s.dropHand();
  }
  if (o.plate) s.setPlate(o.plate);
  if (opts.noServe) return 'built';
  s.serve();
  return 'served';
};
window.__pay = function () {
  const s = window.__session;
  const c = s.cust;
  if (!c || c.state !== 'pay' || !s.drawer.open) return false;
  let due = c.cash - c.bill - s.givenTotal;
  for (const v of [100, 50, 20, 10, 5, 1])
    while (due >= v) {
      s.addMoney(v);
      due -= v;
    }
  s.giveChange();
  return true;
};
