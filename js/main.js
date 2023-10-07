// --- tool ---

function pipe(...fns) {
  return (...args) => {
    return fns.reduce(async (acc, fn) => {
      const result = await acc;
      return fn(result);
    }, Promise.resolve(args));
  };
}


const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const allSame = xs => R.all(R.equals(R.head(xs)), xs);
const isType = R.pathEq(R.__, ['dataset', 'type']);
const isOut = elem => elem.classList.contains('out');

// --- const ---

const game = {
  /** @type {HTMLDivElement} */
  blackboard: document.getElementById('blackboard'),

  /** @type {HTMLCollectionOf<HTMLLabelElement>} */
  cards: document.getElementsByClassName('card'),

  get cardElems() {
    return Array.from(this.cards);
  },

  get stayCardCount() {
    return R.compose( R.length, R.filter(R.compose( R.not, isOut )) )(this.cardElems);
  },

  mapSize: 5,
  gap: 10,
  cardSize: 40,
  typeTotal: { apple: 6, pear: 6, lemon: 6, watermelon: 6, lucky: 1 },
};

const state = {
  /** @type {Set<HTMLLabelElement>} */
  cards: new Set(),
  get cardElems() { return Array.from(this.cards); }
};

// --- core ---

function DataList() {
  const rndNum = max => Math.floor(Math.random() * max);
  
  function rndItem(validator, xs) {
    const x = xs[rndNum(xs.length)];
    return validator(x) ? x : rndItem(validator, xs);
  }

  const countLt = xs => x => R.lt( R.count(R.equals(x), xs), game.typeTotal[x] );

  return R.reduce(
    result => result.concat(rndItem( countLt(result), Object.keys(game.typeTotal) )),
    [],
    Array.from({ length: game.mapSize * game.mapSize })
  );
}

function RestartBtnHTML() {
  return `<button id="restartBtn" hidden onclick="restart();">重新开始</button>`;
}

function LabelHTML(type, i) {
  const Pos = i => ({
    row: Math.floor(i / game.mapSize),
    col: i % game.mapSize,
  });

  const CardStyle = pos => ({
    top: pos.row * (game.gap + game.cardSize) + game.gap,
    left: pos.col * (game.gap + game.cardSize) + game.gap,
  });

  const style = R.compose( CardStyle, Pos )(i);

  return `
    <label
      class="card"
      data-type="${ type }"
      style="top: ${ style.top }px; left: ${ style.left }px;">
      <input type="checkbox" hidden onchange="handleChange(event);">
      <div class="back"></div>
      <div class="front"></div>
    </label>
  `;
}

function selectCard(card) {
  card.firstElementChild.checked = true;
  state.cards.add(card);
}

/** @param {'visible' | 'hidden'} visibility  */
function setRestartBtn(visibility) {
  document.getElementById('restartBtn').hidden = 'hidden' == visibility;
}

function restart() {
  setRestartBtn('hidden');
  init();
}

function backUp() {
  state.cardElems.forEach(elem => elem.firstElementChild.checked = false);
  state.cards.clear();
}

function out() {
  // 自动或手动选卡后等着翻面，最后退场再等一下
  state.cardElems.forEach(elem => elem.classList.add('out'));
  state.cards.clear();
}

function findSameTypeCard() {
  const normalCard = R.find(R.compose( R.not, isType('lucky') ), state.cardElems);
  const sameTypeCard = R.compose(
    R.find(isType(normalCard.dataset.type)),
    R.filter(R.compose( R.not, isOut )),
    R.filter(R.compose( R.not, R.equals(normalCard) ))
  )(game.cardElems);

  return sameTypeCard;
}

// async function foo(f) {
//   game.cardElems.forEach(elem => elem.firstElementChild.disabled = true);
//   await f();
//   await wait(500);
//   state.cardElems.forEach(elem => elem.firstElementChild.checked = false);
// }

async function handleChange(event) {
  const action = event.currentTarget.checked ? 'add' : 'delete';
  state.cards[action](event.currentTarget.parentElement);

  game.cardElems.forEach(elem => elem.firstElementChild.disabled = true);
  await wait(500);

  if (2 == state.cardElems.length) {
    await R.cond([
      [
        R.any(isType('lucky')),
        pipe( findSameTypeCard, selectCard, () => wait(500), out ),
      ],
      [
        R.pipe( R.map(R.path(['dataset', 'type'])), allSame ),
        out,
      ],
      [
        R.T,
        backUp,
      ],
    ])(state.cardElems);

    await wait(500);
  }

  game.cardElems.forEach(elem => elem.firstElementChild.disabled = false);

  // 两两一对都退场，剩下的只能是幸运卡
  if (1 == game.stayCardCount) {
    // foo(pipe( () => luckyCard, selectCard, () => wait(500), out ));
    const luckyCard = R.find(isType('lucky'), game.cardElems);
    game.cardElems.forEach(elem => elem.firstElementChild.disabled = true);
    selectCard(luckyCard);
    await wait(500);
    out();
    await wait(500);
    state.cardElems.forEach(elem => elem.firstElementChild.checked = false);
  }

  R.all(isOut, game.cardElems) && setRestartBtn('visible');
}

function init() {
  game.blackboard.innerHTML = DataList().reduce((result, type, i) => result + LabelHTML(type, i), '') + RestartBtnHTML();
}

function main() {
  init();
}

main();
