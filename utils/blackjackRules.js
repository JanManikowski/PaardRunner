// blackjackRules.js

export const createDeck = () => {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    suits.forEach(suit => {
      ranks.forEach(rank => {
        deck.push({ rank, suit });
      });
    });
    return deck;
  };
  
  export const shuffleDeck = (deck) => {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  };
  
  export const getHandValue = (hand) => {
    let value = 0;
    let aces = 0;
    hand.forEach(card => {
      if (card.rank === 'A') {
        value += 11;
        aces++;
      } else if (['K', 'Q', 'J'].includes(card.rank)) {
        value += 10;
      } else {
        value += parseInt(card.rank, 10);
      }
    });
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    return value;
  };
  