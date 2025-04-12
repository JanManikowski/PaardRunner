import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Alert,
  TextInput
} from 'react-native';
import { ThemeContext } from '../../contexts/ThemeContext';
import { CoinContext } from '../../contexts/CoinContext';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  doc,
  onSnapshot,
  setDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  runTransaction,
  getDoc
} from 'firebase/firestore';
import { db } from '../../utils/firebaseConfig';
import { createDeck, shuffleDeck, getHandValue } from '../../utils/blackjackRules';

const TABLES_COLLECTION = 'tables';
const TABLE_ID = 'blackjackTable';
const CARD_WIDTH_OWN = 70;
const CARD_HEIGHT_OWN = 110;
const CARD_WIDTH_OTHERS = 55;
const CARD_HEIGHT_OTHERS = 80;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// -----------------------
// Card Component
// -----------------------
const Card = ({ card, delayTime = 0, size = 'own' }) => {
  const translateY = useSharedValue(-200);
  useEffect(() => {
    translateY.value = withTiming(0, { duration: 600, delay: delayTime });
  }, [delayTime]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));
  const isOwn = size === 'own';
  const cardWidth = isOwn ? CARD_WIDTH_OWN : CARD_WIDTH_OTHERS;
  const cardHeight = isOwn ? CARD_HEIGHT_OWN : CARD_HEIGHT_OTHERS;
  const display = card && card.rank ? `${card.rank}${card.suit}` : card;
  return (
    <Animated.View
      style={[
        {
          width: cardWidth,
          height: cardHeight,
          borderRadius: 8,
          backgroundColor: '#fff',
          margin: 4,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 3,
          elevation: 4
        },
        animatedStyle
      ]}
    >
      <Text style={{ fontSize: isOwn ? 18 : 14, fontWeight: 'bold' }}>{display}</Text>
    </Animated.View>
  );
};

// -----------------------
// Main Blackjack Screen Component
// -----------------------
export default function BlackjackScreen() {
  const { theme } = useContext(ThemeContext);
  const { balance, updateBalance } = useContext(CoinContext);
  const [dealerCards, setDealerCards] = useState([]);
  const [playerCards, setPlayerCards] = useState([]);
  const [gameState, setGameState] = useState('idle'); // idle, inProgress, dealerPlaying, gameOver
  const [result, setResult] = useState('');
  const [playerDoubled, setPlayerDoubled] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [myPlayerStatus, setMyPlayerStatus] = useState('waiting'); // waiting, playing, stood, busted, surrendered
  const [allPlayers, setAllPlayers] = useState([]);
  const [joinTimer, setJoinTimer] = useState(5);
  const [dealerPlayed, setDealerPlayed] = useState(false);
  const joinIntervalRef = useRef(null);

  // New states for betting
  const [currentBet, setCurrentBet] = useState('');
  const [betPlaced, setBetPlaced] = useState(false);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };
  }, []);

  // When leaving, remove yourself from the table
  useEffect(() => {
    return () => {
      if (myPlayerId) {
        deleteDoc(doc(db, TABLES_COLLECTION, TABLE_ID, 'players', myPlayerId));
      }
    };
  }, [myPlayerId]);

  const ensureTableIdleIfEmpty = async (players) => {
    if (players.length === 0) {
      await setDoc(
        doc(db, TABLES_COLLECTION, TABLE_ID),
        { gameStatus: 'idle', dealerCards: [], deck: [], dealerPlayed: false },
        { merge: true }
      );
    }
  };

  const updateDealerCardsFirebase = (cards) => {
    setDoc(doc(db, TABLES_COLLECTION, TABLE_ID), { dealerCards: cards }, { merge: true });
  };

  const updateMyHand = (hand, status = 'playing') => {
    if (myPlayerId) {
      setDoc(
        doc(db, TABLES_COLLECTION, TABLE_ID, 'players', myPlayerId),
        { hand, status },
        { merge: true }
      );
    }
  };

  const updateGameStateFirebase = async (newState) => {
    await setDoc(
      doc(db, TABLES_COLLECTION, TABLE_ID),
      { gameStatus: newState },
      { merge: true }
    );
  };

  // -----------------------
  // JOIN TABLE & BETTING
  // -----------------------
  const joinTable = async () => {
    if (gameState === 'inProgress' || gameState === 'dealerPlaying') {
      Alert.alert('Round in progress', 'A round is in progress. You can watch only.');
      return;
    }
    const playersSnap = await getDocs(collection(db, TABLES_COLLECTION, TABLE_ID, 'players'));
    const count = playersSnap.size;
    const newPlayer = {
      name: `Player ${count + 1}`,
      hand: [],
      status: 'waiting',
      bet: 0
    };
    const docRef = await addDoc(collection(db, TABLES_COLLECTION, TABLE_ID, 'players'), newPlayer);
    setMyPlayerId(docRef.id);
  };

  const handlePlaceBet = async () => {
    const bet = Number(currentBet);
    if (!bet || bet <= 0) {
      Alert.alert('Invalid Bet', 'Please enter a valid bet amount.');
      return;
    }
    if (bet > balance) {
      Alert.alert('Insufficient Funds', 'You do not have enough coins.');
      return;
    }
    // Deduct bet from local balance and update player's bet in Firestore.
    updateBalance(-bet);
    if (myPlayerId) {
      await setDoc(
        doc(db, TABLES_COLLECTION, TABLE_ID, 'players', myPlayerId),
        { bet: bet },
        { merge: true }
      );
    }
    setBetPlaced(true);
    Alert.alert('Bet Placed', `You bet $${bet}`);
  };

  // -----------------------
  // DEAL ROUND & INITIAL BLACKJACK CHECK
  // -----------------------
  const dealNewRound = async () => {
    if (allPlayers.length === 0) {
      Alert.alert('No Players', 'No players at the table. Cannot start a new round.');
      return;
    }
    if (!betPlaced) {
      Alert.alert('Place Bet', 'Please place your bet before dealing cards.');
      return;
    }
    setGameState('inProgress');
    await updateGameStateFirebase('inProgress');

    let newDeck = shuffleDeck(createDeck());

    const playersSnap = await getDocs(collection(db, TABLES_COLLECTION, TABLE_ID, 'players'));
    for (let playerDoc of playersSnap.docs) {
      // Each player gets two cards and status is set to 'playing'
      const hand = [newDeck.pop(), newDeck.pop()];
      await setDoc(playerDoc.ref, { hand, status: 'playing' }, { merge: true });
      if (playerDoc.id === myPlayerId) {
        setPlayerCards(hand);
      }
    }
    const dealerHand = [newDeck.pop(), newDeck.pop()];
    setDealerCards(dealerHand);
    updateDealerCardsFirebase(dealerHand);

    await setDoc(
      doc(db, TABLES_COLLECTION, TABLE_ID),
      { deck: newDeck, dealerPlayed: false },
      { merge: true }
    );
    setPlayerDoubled(false);
    setResult('');

    // Check for dealer blackjack immediately.
    if (dealerHand.length === 2 && getHandValue(dealerHand) === 21) {
      await updateGameStateFirebase('gameOver');
      setResult('Dealer has blackjack!');
      processAllPlayersOutcome(dealerHand);
      endRound();
    }
  };

  // -----------------------
  // END ROUND & TIMER
  // -----------------------
  const endRound = async () => {
    setGameState('gameOver');
    await updateGameStateFirebase('gameOver');
    setJoinTimer(5);
    if (joinIntervalRef.current) clearInterval(joinIntervalRef.current);
    joinIntervalRef.current = setInterval(() => {
      setJoinTimer((prev) => {
        if (prev <= 1) {
          clearInterval(joinIntervalRef.current);
          setGameState('idle');
          updateGameStateFirebase('idle');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // -----------------------
  // PROCESS ALL PLAYERS' OUTCOMES
  // -----------------------
  const processAllPlayersOutcome = async (dealerFinalHand) => {
    try {
      const dealerValue = getHandValue(dealerFinalHand);
      const playersSnap = await getDocs(collection(db, TABLES_COLLECTION, TABLE_ID, 'players'));
      playersSnap.docs.forEach(async (playerDoc) => {
        const data = playerDoc.data();
        const playerHand = data.hand || [];
        const playerValue = getHandValue(playerHand);
        const bet = Number(data.bet || 0);
        let outcome = '';
        let payout = 0;
        // If player surrendered, outcome was already handled.
        if (data.status === 'surrendered') {
          outcome = 'Surrendered. Half bet refunded.';
        } else if (playerHand.length === 2 && playerValue === 21) {
          // Player has blackjack
          if (dealerFinalHand.length === 2 && dealerValue === 21) {
            outcome = "Push! Dealer also has blackjack.";
            payout = bet; // Refund bet
          } else {
            outcome = 'Blackjack! You win with a 3:2 payout!';
            payout = Math.floor(bet * 2.5);
          }
        } else if (playerValue > 21) {
          outcome = 'Bust! You lose.';
          payout = 0;
        } else if (dealerValue > 21) {
          outcome = 'Dealer busted! You win!';
          payout = bet * 2;
        } else if (playerValue > dealerValue) {
          outcome = 'You win!';
          payout = bet * 2;
        } else if (playerValue === dealerValue) {
          outcome = "Push! It's a tie.";
          payout = bet;
        } else {
          outcome = 'Dealer wins.';
          payout = 0;
        }
        // Update each player document with the outcome message.
        await setDoc(playerDoc.ref, { result: outcome }, { merge: true });
        // For the local player, update the coin balance (only if not already refunded in surrender).
        if (playerDoc.id === myPlayerId) {
          setResult(outcome);
          if (payout > 0) {
            // This assumes that updateBalance will add the payout to the player's balance.
            updateBalance(payout);
          }
        }
      });
    } catch (error) {
      console.error("Processing outcomes failed: ", error);
    }
  };

  // -----------------------
  // CHECK IF ALL PLAYERS ARE DONE
  // -----------------------
  const checkAllPlayersDone = async () => {
    const playersSnap = await getDocs(collection(db, TABLES_COLLECTION, TABLE_ID, 'players'));
    // Only when all players’ status is no longer 'playing' – also, only the "host" triggers dealer play.
    const allDone = playersSnap.docs.every((docSnap) => {
      const data = docSnap.data();
      return data.status !== 'playing';
    });
    // Only the host (first player) will trigger dealer play to avoid race conditions.
    if (
      allDone &&
      gameState === 'inProgress' &&
      !dealerPlayed &&
      allPlayers.length > 0 &&
      allPlayers[0].id === myPlayerId
    ) {
      triggerDealerPlay();
    }
  };

  // -----------------------
  // PLAYER ACTION HANDLERS
  // -----------------------
  const handleHit = async () => {
    if (gameState !== 'inProgress' || myPlayerStatus !== 'playing') return;
    try {
      await runTransaction(db, async (transaction) => {
        const tableRef = doc(db, TABLES_COLLECTION, TABLE_ID);
        const myPlayerRef = doc(db, TABLES_COLLECTION, TABLE_ID, 'players', myPlayerId);
        const tableDoc = await transaction.get(tableRef);
        const myPlayerDoc = await transaction.get(myPlayerRef);
        const currentDeck = tableDoc.data().deck || [];
        if (currentDeck.length === 0) throw new Error('Deck is empty');
        const card = currentDeck[currentDeck.length - 1];
        const newDeck = currentDeck.slice(0, -1);
        const currentHand = myPlayerDoc.data().hand || [];
        const newHand = [...currentHand, card];
        const handValue = getHandValue(newHand);
        let newStatus = 'playing';
        if (handValue > 21) newStatus = 'busted';

        transaction.update(tableRef, { deck: newDeck });
        transaction.update(myPlayerRef, { hand: newHand, status: newStatus });
      });
    } catch (error) {
      console.error("Hit transaction failed: ", error);
    }
    checkAllPlayersDone();
  };

  const handleDoubleDown = async () => {
    if (
      gameState !== 'inProgress' ||
      myPlayerStatus !== 'playing' ||
      playerCards.length !== 2 ||
      playerDoubled
    )
      return;
    // Check that the player has enough funds for an additional bet equal to the original
    const originalBet = Number(currentBet);
    if (balance < originalBet) {
      Alert.alert('Insufficient Funds', 'You do not have enough coins to double down.');
      return;
    }
    setPlayerDoubled(true);
    // Deduct the additional bet
    updateBalance(-originalBet);
    // Update the bet in Firestore to be doubled
    if (myPlayerId) {
      await setDoc(
        doc(db, TABLES_COLLECTION, TABLE_ID, 'players', myPlayerId),
        { bet: originalBet * 2 },
        { merge: true }
      );
    }
    try {
      await runTransaction(db, async (transaction) => {
        const tableRef = doc(db, TABLES_COLLECTION, TABLE_ID);
        const myPlayerRef = doc(db, TABLES_COLLECTION, TABLE_ID, 'players', myPlayerId);
        const tableDoc = await transaction.get(tableRef);
        const myPlayerDoc = await transaction.get(myPlayerRef);
        const currentDeck = tableDoc.data().deck || [];
        if (currentDeck.length === 0) throw new Error('Deck is empty');
        const card = currentDeck[currentDeck.length - 1];
        const newDeck = currentDeck.slice(0, -1);
        const currentHand = myPlayerDoc.data().hand || [];
        const newHand = [...currentHand, card];
        const handValue = getHandValue(newHand);
        let newStatus = 'playing';
        if (handValue > 21) newStatus = 'busted';

        transaction.update(tableRef, { deck: newDeck });
        transaction.update(myPlayerRef, { hand: newHand, status: newStatus });
      });
    } catch (error) {
      console.error("Double Down transaction failed: ", error);
    }
    checkAllPlayersDone();
  };

  const handleStand = async () => {
    if (gameState !== 'inProgress' || myPlayerStatus !== 'playing') return;
    await setDoc(
      doc(db, TABLES_COLLECTION, TABLE_ID, 'players', myPlayerId),
      { status: 'stood' },
      { merge: true }
    );
    checkAllPlayersDone();
  };

  const handleSurrender = async () => {
    if (gameState !== 'inProgress' || myPlayerStatus !== 'playing') return;
    await setDoc(
      doc(db, TABLES_COLLECTION, TABLE_ID, 'players', myPlayerId),
      { status: 'surrendered', result: 'Surrendered. You lose half your bet.' },
      { merge: true }
    );
    const bet = Number(currentBet);
    updateBalance(Math.floor(bet / 2)); // refund half bet
    setResult('You surrendered. You lose half your bet.');
    checkAllPlayersDone();
  };

  // -----------------------
  // DEALER PLAY & OUTCOME PROCESSING
  // -----------------------
  const triggerDealerPlay = async () => {
    try {
      // Only allow the dealer to play if not already done.
      await runTransaction(db, async (transaction) => {
        const tableRef = doc(db, TABLES_COLLECTION, TABLE_ID);
        const tableDoc = await transaction.get(tableRef);
        const tableData = tableDoc.data();
        if (tableData.dealerPlayed) {
          throw new Error('Dealer has already played');
        }
        let currentDeck = tableData.deck || [];
        let currentDealerCards = tableData.dealerCards || [];
        // Dealer hits until the hand value is 17 or more.
        while (getHandValue(currentDealerCards) < 17 && currentDeck.length > 0) {
          const card = currentDeck[currentDeck.length - 1];
          currentDeck = currentDeck.slice(0, -1);
          currentDealerCards.push(card);
        }
        transaction.update(tableRef, {
          deck: currentDeck,
          dealerCards: currentDealerCards,
          dealerPlayed: true,
          gameStatus: 'gameOver'
        });
      });
      setDealerPlayed(true);
      // Wait a moment so that onSnapshot updates come in.
      await delay(700);
      // Get the fresh dealer cards from Firestore.
      const tableSnapshot = await getDoc(doc(db, TABLES_COLLECTION, TABLE_ID));
      const dealerFinalHand = tableSnapshot.data().dealerCards || [];
      // Process outcomes for every player.
      processAllPlayersOutcome(dealerFinalHand);
      endRound();
      setCurrentBet('');
      setBetPlaced(false);
    } catch (error) {
      console.error("Dealer play transaction failed: ", error);
    }
  };

  // -----------------------
  // SUBSCRIPTIONS
  // -----------------------
  useEffect(() => {
    const unsubPlayers = onSnapshot(
      collection(db, TABLES_COLLECTION, TABLE_ID, 'players'),
      async (querySnapshot) => {
        const playersArray = [];
        querySnapshot.forEach((docSnap) => {
          playersArray.push({ id: docSnap.id, ...docSnap.data() });
        });
        setAllPlayers(playersArray);
        await ensureTableIdleIfEmpty(playersArray);
      }
    );
    return () => unsubPlayers();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, TABLES_COLLECTION, TABLE_ID), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.dealerCards) {
          setDealerCards(data.dealerCards);
        }
        if (data.gameStatus) {
          setGameState(data.gameStatus);
        }
        if (typeof data.dealerPlayed === 'boolean') {
          setDealerPlayed(data.dealerPlayed);
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (myPlayerId) {
      const unsubMyPlayer = onSnapshot(
        doc(db, TABLES_COLLECTION, TABLE_ID, 'players', myPlayerId),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.hand) {
              setPlayerCards(data.hand);
            }
            if (data.status) {
              setMyPlayerStatus(data.status);
            }
          }
        }
      );
      return () => unsubMyPlayer();
    }
  }, [myPlayerId]);

  const otherPlayers = allPlayers.filter((p) => p.id !== myPlayerId);
  const leftPlayers = otherPlayers.filter((_, index) => index % 2 === 0);
  const rightPlayers = otherPlayers.filter((_, index) => index % 2 === 1);

  // -----------------------
  // RENDER
  // -----------------------
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/casino_felt.jpg')}
        resizeMode="cover"
        style={styles.backgroundImage}
      >
        {/* Coin balance and betting header */}
        {myPlayerId && (
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceText}>Balance: ${balance}</Text>
            {gameState === 'idle' && !betPlaced && (
              <View style={styles.betContainer}>
                <TextInput
                  style={styles.betInput}
                  value={currentBet}
                  onChangeText={setCurrentBet}
                  placeholder="Enter bet amount"
                  keyboardType="numeric"
                  placeholderTextColor="#fff"
                />
                <TouchableOpacity style={styles.betButton} onPress={handlePlaceBet}>
                  <Text style={styles.betButtonText}>Place Bet</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {!myPlayerId ? (
          <View style={styles.joinContainer}>
            <Text style={styles.infoText}>
              {gameState === 'inProgress' || gameState === 'dealerPlaying'
                ? 'Round in progress. Watch only.'
                : gameState === 'gameOver'
                ? `New round starts in ${joinTimer} sec. Join now!`
                : 'Table is free. Join now!'}
            </Text>
            {(gameState === 'idle' || gameState === 'gameOver') && (
              <TouchableOpacity style={styles.joinButton} onPress={joinTable}>
                <Text style={styles.joinButtonText}>Join Table</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.joinButton, { marginTop: 20 }]} onPress={async () => {
              // Debug button to clear table
              const playersSnap = await getDocs(collection(db, TABLES_COLLECTION, TABLE_ID, 'players'));
              for (const playerDoc of playersSnap.docs) {
                await deleteDoc(playerDoc.ref);
              }
              setMyPlayerId(null);
              setAllPlayers([]);
              await setDoc(
                doc(db, TABLES_COLLECTION, TABLE_ID),
                { dealerCards: [], deck: [], gameStatus: 'idle', dealerPlayed: false },
                { merge: true }
              );
            }}>
              <Text style={styles.joinButtonText}>Clear Table (Debug)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tableLayout}>
            <View style={styles.dealerSection}>
              <Text style={styles.sectionHeader}>Dealer</Text>
              <View style={styles.cardRow}>
                {dealerCards.map((card, index) => {
                  // Hide second card if round is still in progress.
                  const hidden = index === 1 && gameState === 'inProgress';
                  const cardData = hidden ? { rank: '?', suit: '' } : card;
                  return (
                    <Card
                      key={`dealer-${index}`}
                      card={cardData}
                      delayTime={index * 100}
                      size="others"
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.middleRow}>
              <View style={styles.playersColumn}>
                {leftPlayers.map((player) => (
                  <View key={player.id} style={styles.otherPlayerContainer}>
                    <Text style={styles.otherPlayerName}>
                      {player.name} ({player.status})
                    </Text>
                    <View style={styles.cardRow}>
                      {player.hand?.map((c, idx) => (
                        <Card
                          key={`${player.id}-${idx}`}
                          card={c}
                          delayTime={idx * 100}
                          size="others"
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.myHandContainer}>
                <Text style={styles.sectionHeader}>
                  Your Hand ({getHandValue(playerCards)}) [{myPlayerStatus}]
                </Text>
                <View style={styles.cardRow}>
                  {playerCards.map((card, index) => (
                    <Card
                      key={`myhand-${index}`}
                      card={card}
                      delayTime={index * 100}
                      size="own"
                    />
                  ))}
                </View>
              </View>
              <View style={styles.playersColumn}>
                {rightPlayers.map((player) => (
                  <View key={player.id} style={styles.otherPlayerContainer}>
                    <Text style={styles.otherPlayerName}>
                      {player.name} ({player.status})
                    </Text>
                    <View style={styles.cardRow}>
                      {player.hand?.map((c, idx) => (
                        <Card
                          key={`${player.id}-${idx}`}
                          card={c}
                          delayTime={idx * 100}
                          size="others"
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {result.length > 0 && <Text style={[styles.infoText, { marginTop: 5 }]}>{result}</Text>}
            {gameState === 'inProgress' && (
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleHit}
                  disabled={myPlayerStatus !== 'playing'}
                >
                  <Text style={styles.actionButtonText}>Hit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleStand}
                  disabled={myPlayerStatus !== 'playing'}
                >
                  <Text style={styles.actionButtonText}>Stand</Text>
                </TouchableOpacity>
                {playerCards.length === 2 && !playerDoubled && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleDoubleDown}
                    disabled={myPlayerStatus !== 'playing'}
                  >
                    <Text style={styles.actionButtonText}>Double Down</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleSurrender}
                  disabled={myPlayerStatus !== 'playing'}
                >
                  <Text style={styles.actionButtonText}>Surrender</Text>
                </TouchableOpacity>
              </View>
            )}
            {gameState === 'idle' && (
              <TouchableOpacity style={[styles.actionButton, { marginTop: 10 }]} onPress={dealNewRound}>
                <Text style={styles.actionButtonText}>Deal Cards</Text>
              </TouchableOpacity>
            )}
            {gameState === 'gameOver' && <Text style={styles.infoText}>New round in {joinTimer} sec...</Text>}
          </View>
        )}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  backgroundImage: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start'
  },
  joinContainer: {
    alignItems: 'center',
    marginTop: 30
  },
  joinButton: {
    backgroundColor: '#e2b007',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 4
  },
  joinButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 18
  },
  tableLayout: {
    flex: 1,
    marginVertical: 10,
    justifyContent: 'space-around'
  },
  dealerSection: {
    alignItems: 'center',
    marginBottom: 8
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  middleRow: {
    flex: 1,
    flexDirection: 'row',
    marginVertical: 10
  },
  playersColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  otherPlayerContainer: {
    marginVertical: 8,
    alignItems: 'center'
  },
  otherPlayerName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4
  },
  myHandContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10
  },
  actionButton: {
    backgroundColor: '#e2b007',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 4
  },
  actionButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16
  },
  balanceHeader: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  balanceText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold'
  },
  betContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  betInput: {
    borderWidth: 1,
    borderColor: '#fff',
    color: '#fff',
    padding: 5,
    width: 100,
    marginRight: 10,
    borderRadius: 4
  },
  betButton: {
    backgroundColor: '#e2b007',
    padding: 8,
    borderRadius: 4
  },
  betButtonText: {
    color: '#333',
    fontWeight: 'bold'
  },
  infoText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center'
  }
});
