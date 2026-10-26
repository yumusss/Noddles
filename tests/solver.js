// Injected into the page: plays orders perfectly through the public session API.
window.__solve = async function (opts = {}) {
  const s = window.__session;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const o = s.activeOrder;
  if (!o) return 'no order';
  const slots = [];
  for (let y = -0.16; y <= 0.2; y += 0.12)
    for (let x = -0.36; x <= 0.37; x += 0.145) slots.push([x, y]);
  let k = 0;
  const spot = () => slots[k++ % slots.length];
  const cook = async (dev) => {
    s.heatStart(dev);
    s.heat[dev].t = 0.55;
    s.heatTake(dev);
  };
  const placed = [];
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
      if (l.fish === 'unagi') for (let i = 0; i < Math.ceil(l.n / 4); i++) await cook('grill');
      s.pickTub(l.fish);
      for (const [x, y] of mine) {
        if (!s.hand) s.pickTub(l.fish);
        s.tapPlate(x, y);
      }
      for (const t of l.tops) {
        s.pickTub(t);
        for (const [x, y] of mine) s.tapPlate(x, y);
      }
      s.dropHand();
      placed.push(...mine);
    } else if (l.k === 'maki' || l.k === 'temaki') {
      const need = l.fill.filter((f) => f === 'tempura' || f === 'unagi');
      for (const f of need)
        for (let i = 0; i < (l.k === 'temaki' ? l.n : 1); i++)
          if (s.stock(f) < (l.k === 'temaki' ? l.n : 1))
            await cook(f === 'tempura' ? 'fryer' : 'grill');
      s.boardStart(l.k);
      if (l.k === 'maki') s.boardStyle(l.style);
      s.boardRiceStart();
      s.board.rice = 0.8;
      s.boardRiceEnd();
      for (const f of l.fill) s.toggleFill(f);
      if (l.k === 'maki') {
        if (l.coat) s.setCoat(l.coat);
        s.rollStart(0, false);
        s.rollDrag && (s.rollDrag.time = 1);
        s.rollMove(-1.1);
        s.setCount(l.n);
        s.board.cutT = 0.75;
        s.cutTap();
      } else {
        s.setCount(l.n);
        s.temakiMake();
      }
      const mine = [];
      for (let i = 0; i < l.n; i++) {
        const [x, y] = spot();
        s.tapPlate(x, y);
        mine.push([x, y]);
      }
      for (const t of l.tops) {
        s.pickTub(t);
        for (const [x, y] of mine) s.tapPlate(x, y);
      }
      s.dropHand();
    } else if (l.k === 'sashimi') {
      s.boardFish(l.fish);
      s.setCount(l.n);
      s.board.cutT = { thin: 0.38, normal: 0.95, thick: 1.52 }[l.thick];
      s.cutTap();
      for (let i = 0; i < l.n; i++) {
        const [x, y] = spot();
        s.tapPlate(x, y);
      }
    }
    await sleep(30);
  }
  for (const side of o.sides) {
    s.pickTub(side);
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
  const c = s.counter;
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
