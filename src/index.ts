type SelectCardEvent = MouseEvent | TouchEvent;
type SelectCardEventType = 'touchend' | 'click';
type CardCountDic = {[prop: string]: number};
const cardTypeCountDic: CardCountDic = {
  apple: 0,
  pear: 0,
  lemon: 0,
  watermelon: 0,
  lucky: 0,
};

const cardTypes: string[] = Object.keys(cardTypeCountDic);
const countRows: number = 5;
const countCols: number = 5;
const cardTransitionDuration: number = 500;
const maxCountSameTypeCard: number = 6;
const blackboard = document.getElementById('blackboard') as HTMLDivElement;
const blackboardBorderWidth: number = 12;
const cardMargin: number = 10;
const restartBtn = document.getElementById('restartBtn') as HTMLButtonElement;

const cardTpl = document.getElementById('cardTpl') as HTMLTemplateElement;
const cards = document.getElementsByClassName('card') as HTMLCollectionOf<HTMLDivElement>;
const selectedCards: HTMLDivElement[] = [];
let selectAble: boolean = true; // 转卡时不可点击

function getIsMobileDevice(): boolean {
  const mobiles: RegExp[] = [/iPhone/, /Android/, /SymbianOS/, /Windows\sPhone/, /iPad/];
  return mobiles.some(item => item.test(navigator.userAgent));
}

function getEventPath(event: SelectCardEvent): (EventTarget | Node)[] {
  const path: EventTarget[] | void = (event.composedPath && event.composedPath())
  const eventTarget = event.target as EventTarget;

  if (!!path) {
    return -1 == path.indexOf(window)
      ? [...path, window]
      : path;
  }

  if (window == eventTarget) {
    return [window];
  }

  return [eventTarget, ...getParents(eventTarget), window];
}

function getParents(eventTarget: EventTarget | Node, memo: (EventTarget | Node)[] = []): (EventTarget | Node)[] {
  const parentNode: (Node & ParentNode) | null = (eventTarget as Node).parentNode;

  return !!parentNode
    ? getParents(parentNode, [...memo, parentNode])
    : memo;
}

function getCardSz(): number {
  return (blackboard.offsetWidth - blackboardBorderWidth * 2 - cardMargin * 6) / 5;
}

function getRandIdx(): number {
  const {floor, random} = Math;
  return floor(random() * cardTypes.length);
}

function getIsMaxCountSameTypeCard(cardType: string): boolean {
  return 'lucky' == cardType
    ? 1 == cardTypeCountDic[cardType]
    : maxCountSameTypeCard == cardTypeCountDic[cardType];
}

function getRandCardType(): string {
  let cardType: string = cardTypes[getRandIdx()];

  while (getIsMaxCountSameTypeCard(cardType)) {
    cardType = cardTypes[getRandIdx()];
  }

  return cardType;
}

function createCard(row: number, col: number): HTMLDivElement {
  const card = (cardTpl.content.firstElementChild as HTMLDivElement).cloneNode(true) as HTMLDivElement;
  card.className = 'card';
  card.id = `${row}_${col}`;
  setCardType(card);
  setCardStyle(card, row, col);
  return card;
}

function setCardStyle(card: HTMLDivElement, row: number, col: number): void {
  const cardSz: number = getCardSz();
  card.style.cssText += `
    top: ${row * (cardMargin + cardSz) + cardMargin}px;
    left: ${col * (cardMargin + cardSz) + cardMargin}px;
    width: ${cardSz}px;
    height: ${cardSz}px;
  `;
}

function setCardType(card: HTMLDivElement): void {
  const cardType: string = getRandCardType();
  ++cardTypeCountDic[cardType];
  card.classList.add(cardType);
  card.dataset.cardType = cardType;
}

async function init(): Promise<void> {
  const fragment: DocumentFragment = document.createDocumentFragment();
  for (let row = 0; row < countRows; ++row) {
    alert(row);
    for (let col = 0; col < countCols; ++col) {
      fragment.appendChild(createCard(row, col));
    }
  }
  blackboard.appendChild(fragment);
  alert(blackboard.children.length)
  
  selectAble = false;
  await waitCardRotate();
  selectAble = true;
}

function restart(): void {
  restartBtn.classList.add('hide');

  for (const cardType in cardTypeCountDic) {
    cardTypeCountDic[cardType] = 0;
  }

  init();
}

async function handleSelect(event: SelectCardEvent): Promise<void> {
  if (!selectAble) { return; }

  const eventTarget = getEventPath(event)
    .filter(item => Reflect.has(item, 'classList'))
    .find(item => (item as HTMLDivElement).classList.contains('card')) as HTMLDivElement;
  
  if (!eventTarget) { return; }
  
  // 切换向上面
  const isShowFront: boolean = eventTarget.classList.toggle('showfront');

  selectAble = false;
  await waitCardRotate();
  selectAble = true;

  // 若正面向上则记录此卡,否则删除记录
  isShowFront
  ? selectedCards.push(eventTarget)
  : selectedCards.splice(selectedCards.findIndex(item => item.id == eventTarget.id), 1);
  
  // 防止仅剩一张卡
  const existCards: HTMLDivElement[] = getExistCards();
  if (1 == existCards.length) {
    handleLastOneCard(existCards[0]);
    return;
  }
  
  if (2 != selectedCards.length) { return; }

  // 若已有两张卡正面向上,则判断是否相同
  // 若相同则消除,否则判断是否有幸运卡
  // 若有幸运卡则翻转一张同类卡后消除这三张卡
  // 否则两张卡反面向上
  // 消除完卡片后若只剩一张卡必为幸运卡,正面向上后消除
  const isSame: boolean = selectedCards[0].dataset.cardType == selectedCards[1].dataset.cardType;
  
  isSame
  ? removeSelectedCards()
  : handleSelectedCards();
}

function getExistCards(): HTMLDivElement[] {
  return [...cards].filter(item => !item.classList.contains('hide'));
}

async function handleLastOneCard(card: HTMLDivElement): Promise<void> {
  card.classList.add('showfront');

  selectAble = false;
  await waitCardRotate();

  card.classList.add('hide');
  await waitCardRotate();

  selectAble = true;

  // 卡片全消除，能重开游戏了
  restartBtn.classList.remove('hide');
}

function waitCardRotate() {
  return new Promise(resolve => {
    setTimeout(resolve, cardTransitionDuration);
  });
}

async function removeSelectedCards(): Promise<void> {
  selectedCards.forEach(item => {
    item.classList.add('hide');
  });
  selectedCards.length = 0;

  selectAble = false;
  await waitCardRotate();
  selectAble = true;

  const existCards: HTMLDivElement[] = getExistCards();
  if (1 < existCards.length) { return; }

  1 == existCards.length
  ? handleLastOneCard(existCards[0])
  : restartBtn.classList.remove('hide');
}

async function hideSelectedCards(): Promise<void> {
  selectedCards.forEach(item => {
    item.classList.remove('showfront');
  });
  selectedCards.length = 0;

  selectAble = false;
  await waitCardRotate();
  selectAble = true;
}

async function selectSameTypeCard(luckyTypeCardIdx: number): Promise<void> {
  // 普通卡下标 0 或 1
  const normalTypeCardIdx: number = selectedCards.length - 1 - luckyTypeCardIdx;
  const normalTypeCard: HTMLDivElement = selectedCards[normalTypeCardIdx];
  const sameType: string = normalTypeCard.dataset.cardType as string;
  const sameTypeCard: HTMLDivElement = [...cards].find(item => item.classList.contains(sameType) && !item.classList.contains('showfront')) as HTMLDivElement;
  sameTypeCard.classList.add('showfront');
  selectedCards.push(sameTypeCard);

  selectAble = false;
  await waitCardRotate();
  selectAble = true;

  removeSelectedCards();
}

function handleSelectedCards(): void {
  const luckyTypeCardIdx: number = selectedCards.findIndex(item => item.dataset.cardType == 'lucky');
  -1 != luckyTypeCardIdx
  ? selectSameTypeCard(luckyTypeCardIdx)
  : hideSelectedCards();
}

function main(): void {
  init();
}

main();

addEventListener('resize', (event: UIEvent) => { 
  document.documentElement.style.setProperty('--card-size', `${getCardSz()}px`);
  let idx = 0;
  for (let row = 0; row < countRows; ++row) {
    for (let col = 0; col < countCols; ++col) {      
      setCardStyle(cards[idx++], row, col);
    }
  }
});

const eventType: SelectCardEventType = getIsMobileDevice() ? 'touchend' : 'click';
blackboard.addEventListener(eventType, handleSelect);
restartBtn.addEventListener(eventType, restart);
