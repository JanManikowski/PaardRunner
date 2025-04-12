// /src/screens/BlackjackScreen.js
import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Alert
} from 'react-native';
import Card from '../../components/Card';
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

import { ThemeContext } from '../../contexts/ThemeContext';
import { CoinContext } from '../../contexts/CoinContext';

const TABLES_COLLECTION = 'tables';
const TABLE_ID = 'blackjackTable';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Array of available play amounts
const playAmounts = [10, 25, 50, 100, 500, 1000];

export default function BlackjackScreen() {
  const { theme } = useContext(ThemeContext);
  const { balance, updateBalance } = useContext(CoinContext);

  // Game states
  const [dealerCards, setDealerCards] = useState([]);
  const [playerCards, setPlayerCards] = useState([]);
  const [gameState, setGameState] = useState('idle'); // idle, inProgress, dealerPlaying, gameOver
  const [result, setResult] = useState('');
  const [playerDoubled, setPlayerDoubled] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [myPlayerStatus, setMyPlayerStatus] = useState('waiting');
  const [allPlayers, setAllPlayers] = useState([]);
  const [joinTimer, setJoinTimer] = useState(5);
  const [dealerPlayed, setDealerPlayed] = useState(false);

  // New state for the amount the player is playing with
  const [playAmount, setPlayAmount] = useState(null);

  const joinIntervalRef = useRef(null);

  useEffect(() => {
    // Force landscape orientation for a true casino-table feel
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };
  }, []);

  // When unmounting, remove yourself from the table
  useEffect(() => {
    return () => {
      if (myPlayerId) {
        deleteDoc(doc(db, TABLES_COLLECTION, TABLE_ID, 'players', myPlayerId));
      }
    };
  }, [myPlayerId]);

  // Helper: if no players remain, set table idle
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

  const updateGameStateFirebase = async (newState) => {
    await setDoc(doc(db, TABLES_COLLECTION, TABLE_ID), { gameStatus: newState }, { merge: true });
  };

  // Join table – also enforce maximum of 3 players (yourself plus 2 others)
  const joinTable = async () => {
    if (gameState === 'inProgress' || gameState === 'dealerPlaying') {
      Alert.alert('Round in progress', 'A round is in progress. You can watch only.');
      return;
    }
    const playersSnap = await getDocs(collection(db, TABLES_COLLECTION, TABLE_ID, 'players'));
    if (playersSnap.size >= 3) {
      Alert.alert('Maximum Players', 'Only up to 3 players are allowed at a table.');
      return;
    }
    const count = playersSnap.size;
    const newPlayer = {
      name: `Player ${count + 1}`,
      hand: [],
      status: 'waiting',
      // Optionally, store playAmount later if needed
      bet: playAmount || 0,
    };
    const docRef = await addDoc(collection(db, TABLES_COLLECTION, TABLE_ID, 'players'), newPlayer);
    setMyPlayerId(docRef.id);
  };

  // Deal new round – require that a play amount has been selected
  const dealNewRound = async () => {
    if (!playAmount) {
      Alert.alert('Select Amount', 'Please choose an amount to play with.');
      return;
    }
    if (allPlayers.length === 0) {
      Alert.alert('No Players', 'No players at the table. Cannot start a new round.');
      return;
    }
    setGameState('inProgress');
    await updateGameStateFirebase('inProgress');

    let newDeck = shuffleDeck(createDeck());

    // Deal 2 cards to each player; set local player’s bet to playAmount
    const playersSnap = await getDocs(collection(db, TABLES_COLLECTION, TABLE_ID, 'players'));
    for (let playerDoc of playersSnap.docs) {
      const hand = [newDeck.pop(), newDeck.pop()];
      // For your own device, include the playAmount as the bet value.
      const updateData = playerDoc.id === myPlayerId 
        ? { hand, status: 'playing', bet: playAmount }
        : { hand, status: 'playing' };
      await setDoc(playerDoc.ref, updateData, { merge: true });
      if (playerDoc.id === myPlayerId) {
        setPlayerCards(hand);
      }
    }
    // Deal 2 cards to the dealer
    const dealerHand = [newDeck.pop(), newDeck.pop()];
    setDealerCards(dealerHand);
    updateDealerCardsFirebase(dealerHand);

    await setDoc(doc(db, TABLES_COLLECTION, TABLE_ID), { deck: newDeck, dealerPlayed: false }, { merge: true });
    setPlayerDoubled(false);
    setResult('');

    if (getHandValue(dealerHand) === 21) {
      await updateGameStateFirebase('gameOver');
      setResult('Dealer has blackjack!');
      processAllPlayersOutcome(dealerHand);
      endRound();
    }
  };

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

        if (data.status === 'surrendered') {
          outcome = 'Surrendered.';
        } else if (playerHand.length === 2 && playerValue === 21) {
          if (dealerFinalHand.length === 2 && dealerValue === 21) {
            outcome = "Push! Dealer also has blackjack.";
            payout = bet;
          } else {
            outcome = 'Blackjack!';
            payout = Math.floor(bet * 2.5);
          }
        } else if (playerValue > 21) {
          outcome = 'Bust!';
        } else if (dealerValue > 21) {
          outcome = 'Dealer busted!';
          payout = bet * 2;
        } else if (playerValue > dealerValue) {
          outcome = 'You win!';
          payout = bet * 2;
        } else if (playerValue === dealerValue) {
          outcome = "Push!";
          payout = bet;
        } else {
          outcome = 'Dealer wins.';
        }

        await setDoc(playerDoc.ref, { result: outcome }, { merge: true });
        if (playerDoc.id === myPlayerId) {
          setResult(outcome);
          if (payout > 0) {
            updateBalance(payout);
          }
        }
      });
    } catch (error) {
      console.error('Processing outcomes failed: ', error);
    }
  };

  const checkAllPlayersDone = async () => {
    const playersSnap = await getDocs(collection(db, TABLES_COLLECTION, TABLE_ID, 'players'));
    const allDone = playersSnap.docs.every((docSnap) => docSnap.data().status !== 'playing');
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

  // Player actions (Hit, Double Down, Stand, Surrender) remain unchanged
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
      console.error('Hit transaction failed: ', error);
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
    const originalBet = playAmount;
    if (balance < originalBet) {
      Alert.alert('Insufficient Funds', 'You do not have enough coins to double down.');
      return;
    }
    setPlayerDoubled(true);
    updateBalance(-originalBet);
    if (myPlayerId) {
      await setDoc(doc(db, TABLES_COLLECTION, TABLE_ID, 'players', myPlayerId), { bet: originalBet * 2 }, { merge: true });
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
      console.error('Double Down transaction failed: ', error);
    }
    checkAllPlayersDone();
  };

  const handleStand = async () => {
    if (gameState !== 'inProgress' || myPlayerStatus !== 'playing') return;
    await setDoc(doc(db, TABLES_COLLECTION, TABLE_ID, 'players', myPlayerId), { status: 'stood' }, { merge: true });
    checkAllPlayersDone();
  };

  const handleSurrender = async () => {
    if (gameState !== 'inProgress' || myPlayerStatus !== 'playing') return;
    await setDoc(doc(db, TABLES_COLLECTION, TABLE_ID, 'players', myPlayerId), { status: 'surrendered', result: 'Surrendered.' }, { merge: true });
    updateBalance(0);
    setResult('You surrendered.');
    checkAllPlayersDone();
  };

  const triggerDealerPlay = async () => {
    try {
      await runTransaction(db, async (transaction) => {
        const tableRef = doc(db, TABLES_COLLECTION, TABLE_ID);
        const tableDoc = await transaction.get(tableRef);
        const tableData = tableDoc.data();
        if (tableData.dealerPlayed) {
          throw new Error('Dealer has already played');
        }
        let currentDeck = tableData.deck || [];
        let currentDealerCards = tableData.dealerCards || [];
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
      await delay(700);
      const tableSnapshot = await getDoc(doc(db, TABLES_COLLECTION, TABLE_ID));
      const dealerFinalHand = tableSnapshot.data().dealerCards || [];
      processAllPlayersOutcome(dealerFinalHand);
      endRound();
    } catch (error) {
      console.error('Dealer play transaction failed: ', error);
    }
  };

  // Subscriptions
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
        if (data.dealerCards) setDealerCards(data.dealerCards);
        if (data.gameStatus) setGameState(data.gameStatus);
        if (typeof data.dealerPlayed === 'boolean') setDealerPlayed(data.dealerPlayed);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (myPlayerId) {
      const unsubMyPlayer = onSnapshot(doc(db, TABLES_COLLECTION, TABLE_ID, 'players', myPlayerId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.hand) setPlayerCards(data.hand);
          if (data.status) setMyPlayerStatus(data.status);
        }
      });
      return () => unsubMyPlayer();
    }
  }, [myPlayerId]);

  // For layout, only allow up to 2 other players (maximum 3 total)
  const otherPlayers = allPlayers.filter((p) => p.id !== myPlayerId).slice(0, 2);
  // For positioning, assume:
  // - If there are 2 other players, display one on the left and one on the right
  // - If only one, position it at top left
  const leftPlayer = otherPlayers[0];
  const rightPlayer = otherPlayers[1];

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/casino_felt.jpg')}
        resizeMode="cover"
        style={{ flex: 1, paddingHorizontal: 30, paddingVertical: 20, justifyContent: 'flex-start' }}
      >
        {/* Top Bar: only display balance now */}
        {myPlayerId && (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            padding: 12,
            borderRadius: 10,
            marginBottom: 10,
          }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', position: 'absolute', top: 10, left: 10 }}>
              Balance: ${balance}
            </Text>
          </View>
        )}

        {/* If not joined: show Join Table UI */}
        {!myPlayerId ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ fontSize: 20, color: '#fff', textAlign: 'center', fontWeight: '600' }}>
              {gameState === 'inProgress' || gameState === 'dealerPlaying'
                ? 'Round in progress. Watch only.'
                : gameState === 'gameOver'
                ? `New round starts in ${joinTimer} sec. Join now!`
                : 'Table is free. Join now!'}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#fcd703',
                paddingHorizontal: 36,
                paddingVertical: 14,
                borderRadius: 10,
                marginTop: 25,
                shadowColor: '#000',
                shadowOpacity: 0.4,
                shadowOffset: { width: 0, height: 3 },
                shadowRadius: 4,
                elevation: 5,
              }}
              onPress={joinTable}
            >
              <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 18 }}>Join Table</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#fcd703',
                paddingHorizontal: 36,
                paddingVertical: 14,
                borderRadius: 10,
                marginTop: 20,
                shadowColor: '#000',
                shadowOpacity: 0.4,
                shadowOffset: { width: 0, height: 3 },
                shadowRadius: 4,
                elevation: 5,
              }}
              onPress={async () => {
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
              }}
            >
              <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 18 }}>Clear Table (Debug)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Dealer Section (Always on top center) */}
            <View style={{ alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 }}>
                Dealer
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                {dealerCards.map((card, index) => {
                  const hidden = index === 1 && gameState === 'inProgress';
                  const cardData = hidden ? { rank: '?', suit: '' } : card;
                  return (
                    <Card key={`dealer-${index}`} card={cardData} delayTime={index * 100} size="others" />
                  );
                })}
              </View>
            </View>

            {/* Other Players Section (positioned above your own area) */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              {/* Left Player */}
              {leftPlayer && (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, color: '#fff', fontWeight: '600', marginBottom: 4 }}>
                    {leftPlayer.name} ({leftPlayer.status})
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    {leftPlayer.hand?.map((c, idx) => (
                      <Card key={`${leftPlayer.id}-${idx}`} card={c} delayTime={idx * 100} size="others" />
                    ))}
                  </View>
                </View>
              )}
              {/* If only one other player exists, you may leave right side empty */}
              {rightPlayer && (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, color: '#fff', fontWeight: '600', marginBottom: 4 }}>
                    {rightPlayer.name} ({rightPlayer.status})
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    {rightPlayer.hand?.map((c, idx) => (
                      <Card key={`${rightPlayer.id}-${idx}`} card={c} delayTime={idx * 100} size="others" />
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Your Player Section (always in the middle) */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              {/* If no play amount selected, show amount selection buttons */}
              {!playAmount ? (
                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  {playAmounts.map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      style={{
                        backgroundColor: '#fcd703',
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: 8,
                        marginHorizontal: 5,
                        shadowColor: '#000',
                        shadowOpacity: 0.4,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: 3,
                        elevation: 4,
                      }}
                      onPress={() => setPlayAmount(amount)}
                    >
                      <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 16 }}>${amount}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={{ color: '#fff', fontSize: 18, marginBottom: 10, fontWeight: '600' }}>
                  Playing with: ${playAmount}
                </Text>
              )}
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 }}>
                Your Hand ({getHandValue(playerCards)}) [{myPlayerStatus}]
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                {playerCards.map((card, index) => (
                  <Card key={`myhand-${index}`} card={card} delayTime={index * 100} size="own" />
                ))}
              </View>
              {result?.length > 0 && (
                <Text style={{ fontSize: 18, color: '#fff', textAlign: 'center', marginTop: 12, fontWeight: '600' }}>
                  {result}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            {gameState === 'inProgress' && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#fcd703',
                    paddingVertical: 14,
                    paddingHorizontal: 22,
                    borderRadius: 10,
                    marginHorizontal: 5,
                    shadowColor: '#000',
                    shadowOpacity: 0.4,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 3,
                    elevation: 4,
                  }}
                  onPress={handleHit}
                  disabled={myPlayerStatus !== 'playing'}
                >
                  <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 18 }}>Hit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#fcd703',
                    paddingVertical: 14,
                    paddingHorizontal: 22,
                    borderRadius: 10,
                    marginHorizontal: 5,
                    shadowColor: '#000',
                    shadowOpacity: 0.4,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 3,
                    elevation: 4,
                  }}
                  onPress={handleStand}
                  disabled={myPlayerStatus !== 'playing'}
                >
                  <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 18 }}>Stand</Text>
                </TouchableOpacity>
                {playerCards.length === 2 && !playerDoubled && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#fcd703',
                      paddingVertical: 14,
                      paddingHorizontal: 22,
                      borderRadius: 10,
                      marginHorizontal: 5,
                      shadowColor: '#000',
                      shadowOpacity: 0.4,
                      shadowOffset: { width: 0, height: 2 },
                      shadowRadius: 3,
                      elevation: 4,
                    }}
                    onPress={handleDoubleDown}
                    disabled={myPlayerStatus !== 'playing'}
                  >
                    <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 18 }}>Double</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#fcd703',
                    paddingVertical: 14,
                    paddingHorizontal: 22,
                    borderRadius: 10,
                    marginHorizontal: 5,
                    shadowColor: '#000',
                    shadowOpacity: 0.4,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 3,
                    elevation: 4,
                  }}
                  onPress={handleSurrender}
                  disabled={myPlayerStatus !== 'playing'}
                >
                  <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 18 }}>Surrender</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Deal Button (available when game is idle) */}
            {gameState === 'idle' && (
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#fcd703',
                    paddingVertical: 14,
                    paddingHorizontal: 22,
                    borderRadius: 10,
                    shadowColor: '#000',
                    shadowOpacity: 0.4,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 3,
                    elevation: 4,
                  }}
                  onPress={dealNewRound}
                >
                  <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 18 }}>Deal</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* If game over, show countdown */}
            {gameState === 'gameOver' && (
              <Text style={{ fontSize: 18, color: '#fff', textAlign: 'center', marginBottom: 20 }}>
                New round in {joinTimer} sec...
              </Text>
            )}
          </>
        )}
      </ImageBackground>
    </View>
  );
}
