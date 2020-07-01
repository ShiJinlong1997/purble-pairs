import ImgCard from './img-card.js';

customElements.define('img-card', ImgCard);

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

const cards = document.getElementsByTagName('img-card') as HTMLCollectionOf<ImgCard>;
const selectedCards: ImgCard[] = [];
let selectAble: boolean = true; // 转卡时不可点击

function getIsMobileDevice(): boolean {
  const mobiles: RegExp[] = [/iPhone/, /Android/, /SymbianOS/, /Windows\sPhone/, /iPad/];
  return mobiles.some(item => item.test(navigator.userAgent));
}

async function init(): Promise<void> {
  const fragment: DocumentFragment = document.createDocumentFragment();
  for (let row = 0; row < countRows; ++row) {
    for (let col = 0; col < countCols; ++col) {
      fragment.appendChild(createCard(row, col));
    }
  }
  blackboard.appendChild(fragment);
  
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

function handleselect() {}

function main(): void {
  init();
}

main();

function createCard(row: number, col: number): ImgCard {
  const card = document.createElement('img-card') as ImgCard;
  card.id = `${row}_${col}`;
  setCardType(card);
  setCardStyle(card, row, col);
  return card;
}

function setCardStyle(card: ImgCard, row: number, col: number): void {
  const cardSz: number = getCardSz();
  card.style.cssText += `
    top: ${row * (cardMargin + cardSz) + cardMargin}px;
    left: ${col * (cardMargin + cardSz) + cardMargin}px;
    width: ${cardSz}px;
    height: ${cardSz}px;
  `;
}

function setCardType(card: ImgCard): void {
  const cardType: string = getRandCardType();
  ++cardTypeCountDic[cardType];
  card.type = cardType;
}

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
