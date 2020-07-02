"use strict";
const cardTypeCountDic = {
    apple: 0,
    pear: 0,
    lemon: 0,
    watermelon: 0,
    lucky: 0,
};
const cardTypes = Object.keys(cardTypeCountDic);
const countRows = 5;
const countCols = 5;
const cardTransitionDuration = 500;
const maxCountSameTypeCard = 6;
const blackboard = document.getElementById('blackboard');
const blackboardBorderWidth = 12;
const cardMargin = 10;
const restartBtn = document.getElementById('restartBtn');
const cardTpl = document.getElementById('cardTpl');
const cards = document.getElementsByClassName('card');
const selectedCards = [];
let selectAble = true; // 转卡时不可点击
function getIsMobileDevice() {
    const mobiles = [/iPhone/, /Android/, /SymbianOS/, /Windows\sPhone/, /iPad/];
    return mobiles.some(item => item.test(navigator.userAgent));
}
function getEventPath(event) {
    const path = (event.composedPath && event.composedPath());
    const eventTarget = event.target;
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
function getParents(eventTarget, memo = []) {
    const parentNode = eventTarget.parentNode;
    return !!parentNode
        ? getParents(parentNode, [...memo, parentNode])
        : memo;
}
function getCardSz() {
    return (blackboard.offsetWidth - blackboardBorderWidth * 2 - cardMargin * 6) / 5;
}
function getRandIdx() {
    const { floor, random } = Math;
    return floor(random() * cardTypes.length);
}
function getIsMaxCountSameTypeCard(cardType) {
    return 'lucky' == cardType
        ? 1 == cardTypeCountDic[cardType]
        : maxCountSameTypeCard == cardTypeCountDic[cardType];
}
function getRandCardType() {
    let cardType = cardTypes[getRandIdx()];
    while (getIsMaxCountSameTypeCard(cardType)) {
        cardType = cardTypes[getRandIdx()];
    }
    return cardType;
}
function createCard(row, col) {
    const card = cardTpl.content.firstElementChild.cloneNode(true);
    card.className = 'card';
    card.id = `${row}_${col}`;
    setCardType(card);
    setCardStyle(card, row, col);
    return card;
}
function setCardStyle(card, row, col) {
    const cardSz = getCardSz();
    card.style.cssText += `
    top: ${row * (cardMargin + cardSz) + cardMargin}px;
    left: ${col * (cardMargin + cardSz) + cardMargin}px;
    width: ${cardSz}px;
    height: ${cardSz}px;
  `;
}
function setCardType(card) {
    const cardType = getRandCardType();
    ++cardTypeCountDic[cardType];
    card.classList.add(cardType);
    card.dataset.cardType = cardType;
}
async function init() {
    const fragment = document.createDocumentFragment();
    for (let row = 0; row < countRows; ++row) {
        alert(row);
        for (let col = 0; col < countCols; ++col) {
            fragment.appendChild(createCard(row, col));
        }
    }
    blackboard.appendChild(fragment);
    alert(blackboard.children.length);
    selectAble = false;
    await waitCardRotate();
    selectAble = true;
}
function restart() {
    restartBtn.classList.add('hide');
    for (const cardType in cardTypeCountDic) {
        cardTypeCountDic[cardType] = 0;
    }
    init();
}
async function handleSelect(event) {
    if (!selectAble) {
        return;
    }
    const eventTarget = getEventPath(event)
        .filter(item => Reflect.has(item, 'classList'))
        .find(item => item.classList.contains('card'));
    if (!eventTarget) {
        return;
    }
    // 切换向上面
    const isShowFront = eventTarget.classList.toggle('showfront');
    selectAble = false;
    await waitCardRotate();
    selectAble = true;
    // 若正面向上则记录此卡,否则删除记录
    isShowFront
        ? selectedCards.push(eventTarget)
        : selectedCards.splice(selectedCards.findIndex(item => item.id == eventTarget.id), 1);
    // 防止仅剩一张卡
    const existCards = getExistCards();
    if (1 == existCards.length) {
        handleLastOneCard(existCards[0]);
        return;
    }
    if (2 != selectedCards.length) {
        return;
    }
    // 若已有两张卡正面向上,则判断是否相同
    // 若相同则消除,否则判断是否有幸运卡
    // 若有幸运卡则翻转一张同类卡后消除这三张卡
    // 否则两张卡反面向上
    // 消除完卡片后若只剩一张卡必为幸运卡,正面向上后消除
    const isSame = selectedCards[0].dataset.cardType == selectedCards[1].dataset.cardType;
    isSame
        ? removeSelectedCards()
        : handleSelectedCards();
}
function getExistCards() {
    return [...cards].filter(item => !item.classList.contains('hide'));
}
async function handleLastOneCard(card) {
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
async function removeSelectedCards() {
    selectedCards.forEach(item => {
        item.classList.add('hide');
    });
    selectedCards.length = 0;
    selectAble = false;
    await waitCardRotate();
    selectAble = true;
    const existCards = getExistCards();
    if (1 < existCards.length) {
        return;
    }
    1 == existCards.length
        ? handleLastOneCard(existCards[0])
        : restartBtn.classList.remove('hide');
}
async function hideSelectedCards() {
    selectedCards.forEach(item => {
        item.classList.remove('showfront');
    });
    selectedCards.length = 0;
    selectAble = false;
    await waitCardRotate();
    selectAble = true;
}
async function selectSameTypeCard(luckyTypeCardIdx) {
    // 普通卡下标 0 或 1
    const normalTypeCardIdx = selectedCards.length - 1 - luckyTypeCardIdx;
    const normalTypeCard = selectedCards[normalTypeCardIdx];
    const sameType = normalTypeCard.dataset.cardType;
    const sameTypeCard = [...cards].find(item => item.classList.contains(sameType) && !item.classList.contains('showfront'));
    sameTypeCard.classList.add('showfront');
    selectedCards.push(sameTypeCard);
    selectAble = false;
    await waitCardRotate();
    selectAble = true;
    removeSelectedCards();
}
function handleSelectedCards() {
    const luckyTypeCardIdx = selectedCards.findIndex(item => item.dataset.cardType == 'lucky');
    -1 != luckyTypeCardIdx
        ? selectSameTypeCard(luckyTypeCardIdx)
        : hideSelectedCards();
}
function main() {
    init();
}
main();
addEventListener('resize', (event) => {
    document.documentElement.style.setProperty('--card-size', `${getCardSz()}px`);
    let idx = 0;
    for (let row = 0; row < countRows; ++row) {
        for (let col = 0; col < countCols; ++col) {
            setCardStyle(cards[idx++], row, col);
        }
    }
});
const eventType = getIsMobileDevice() ? 'touchend' : 'click';
blackboard.addEventListener(eventType, handleSelect);
restartBtn.addEventListener(eventType, restart);
