import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  ImageBackground,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Easing } from 'react-native';
import { CoinContext } from '../../contexts/CoinContext';
import { Audio } from 'expo-av';
import { normalize } from '../../utils/normalize'; // Make sure this path is correct

const symbols = ['🍒', '🍋', '🍊', '🍉', '7', 'BAR'];
const payouts = {
  BAR: 50,
  '7': 20,
  '🍒': 10,
  '🍋': 5,
  '🍊': 5,
  '🍉': 5,
};

export default function SlotMachineScreen() {
  const { balance, updateBalance } = useContext(CoinContext);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reelResults, setReelResults] = useState(['?', '?', '?']);
  const [outcome, setOutcome] = useState('');
  const [winningIndexes, setWinningIndexes] = useState([]);
  const [betAmount, setBetAmount] = useState(10);
  const [autoSpin, setAutoSpin] = useState(false);

  const leverSoundRef = useRef(null);
  const leverReverseSoundRef = useRef(null);
  const spinSoundRef = useRef(null);
  const loseSoundRef = useRef(null);
  const winSoundRef = useRef(null);
  const jackpotSoundRef = useRef(null);
  const bgMusicRef = useRef(null);

  const hasPlayedReverse = useRef(false);
  const armAnim = useRef(new Animated.Value(0)).current;
  const spinAnimations = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  const SYMBOL_HEIGHT = normalize(80);
  const SPIN_DURATION = 400;
  const autoSpinInterval = useRef(null);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  }, []);

  useEffect(() => {
    async function loadSounds() {
      const load = async (file) => (await Audio.Sound.createAsync(file)).sound;

      leverSoundRef.current = await load(require('../../assets/sounds/lever.mp3'));
      leverReverseSoundRef.current = await load(require('../../assets/sounds/reverseLever.mp3'));
      spinSoundRef.current = await load(require('../../assets/sounds/rolling.mp3'));
      loseSoundRef.current = await load(require('../../assets/sounds/loss.mp3'));
      winSoundRef.current = await load(require('../../assets/sounds/lowStake.mp3'));
      jackpotSoundRef.current = await load(require('../../assets/sounds/jackpot.mp3'));

      const { sound: bgMusic } = await Audio.Sound.createAsync(
        require('../../assets/sounds/mainTheme.mp3'),
        { isLooping: true, volume: 0.25 }
      );
      bgMusicRef.current = bgMusic;
      await bgMusic.playAsync();
    }
    loadSounds();

    return () => {
      [
        leverSoundRef,
        leverReverseSoundRef,
        spinSoundRef,
        loseSoundRef,
        winSoundRef,
        jackpotSoundRef,
        bgMusicRef,
      ].forEach(async (ref) => {
        if (ref.current) await ref.current.unloadAsync();
      });
    };
  }, []);

  useEffect(() => {
    if (autoSpin && !isSpinning) {
      autoSpinInterval.current = setInterval(() => {
        if (!isSpinning) spinMachine();
      }, 3000);
    } else {
      clearInterval(autoSpinInterval.current);
    }
    return () => clearInterval(autoSpinInterval.current);
  }, [autoSpin, isSpinning]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const { dy } = gestureState;
        if (dy > 0) armAnim.setValue(dy);
        if (dy > 35 && !hasPlayedReverse.current) {
          hasPlayedReverse.current = true;
          leverReverseSoundRef.current?.replayAsync();
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(armAnim, { toValue: 100, duration: 200, useNativeDriver: true }).start(async () => {
            leverSoundRef.current?.replayAsync();
            spinMachine();
            Animated.timing(armAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
              hasPlayedReverse.current = false;
            });
          });
        } else {
          Animated.timing(armAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
            hasPlayedReverse.current = false;
          });
        }
      },
    })
  ).current;

  const spinMachine = () => {
    if (isSpinning || betAmount > balance) {
      if (betAmount > balance) Alert.alert('Insufficient Funds', 'You do not have enough coins for that bet.');
      return;
    }
    updateBalance(-betAmount);
    setIsSpinning(true);
    setOutcome('');
    setWinningIndexes([]);

    spinSoundRef.current?.setIsLoopingAsync(true);
    spinSoundRef.current?.playAsync();

    let finalIndexes = [];
    if (Math.random() < 0.8) {
      const jackpotIndex = Math.floor(Math.random() * symbols.length);
      finalIndexes = [jackpotIndex, jackpotIndex, jackpotIndex];
    } else {
      finalIndexes = Array(3).fill().map(() => Math.floor(Math.random() * symbols.length));
    }

    spinAnimations.forEach((anim, i) => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: -((symbols.length * 6 + finalIndexes[i] - 1) * SYMBOL_HEIGHT),
        duration: SPIN_DURATION + i * 150,
        easing: Easing.bezier(0.7, 0.05, 0.95, 0.9),
        useNativeDriver: true,
      }).start(() => {
        if (i === 2) {
          spinSoundRef.current?.stopAsync();
          spinSoundRef.current?.setIsLoopingAsync(false);
          const results = finalIndexes.map(index => symbols[index]);
          setReelResults(results);
          handleWin(results);
          setIsSpinning(false);
        }
      });
    });
  };

  const handleWin = (results) => {
    const [s1, s2, s3] = results;
    let winnings = 0;
    let resultText = '';

    if (s1 === s2 && s2 === s3) {
      winnings = payouts[s1] * betAmount;
      resultText = `Jackpot! 3x ${s1} → $${winnings}`;
      setWinningIndexes([0, 1, 2]);
      updateBalance(winnings);
      bgMusicRef.current?.stopAsync();
      jackpotSoundRef.current?.replayAsync();
    } else if ([s1, s2, s3].filter(s => s === '🍒').length === 2) {
      winnings = 2 * betAmount;
      resultText = `2x 🍒 → $${winnings}`;
      setWinningIndexes([0, 1, 2].filter(i => results[i] === '🍒'));
      updateBalance(winnings);
      winSoundRef.current?.replayAsync();
    } else {
      resultText = 'Try Again!';
      loseSoundRef.current?.replayAsync();
    }
    setOutcome(resultText);
  };

  const renderReel = (reelIndex) => {
    const loopedSymbols = Array(20).fill(symbols).flat();
    return (
      <View style={{
        height: SYMBOL_HEIGHT * 3,
        overflow: 'hidden',
        width: normalize(80),
        marginHorizontal: normalize(5),
        backgroundColor: '#1a1a1a',
        borderRadius: normalize(16),
        borderWidth: 2,
        borderColor: '#333',
        shadowColor: '#000',
        shadowOpacity: 0.6,
        shadowRadius: 8,
      }}>
        <Animated.View style={{ transform: [{ translateY: spinAnimations[reelIndex] }] }}>
          {loopedSymbols.map((sym, idx) => (
            <View
              key={idx}
              style={{
                height: SYMBOL_HEIGHT,
                justifyContent: 'center',
                alignItems: 'center',
                borderColor:
                  !isSpinning && winningIndexes.includes(reelIndex) &&
                  idx % symbols.length === symbols.indexOf(reelResults[reelIndex]) ? '#00ffcc' : 'transparent',
                borderWidth: 3,
              }}>
              <Text style={{ fontSize: normalize(34), fontWeight: 'bold', color: '#fff' }}>{sym}</Text>
            </View>
          ))}
        </Animated.View>
      </View>
    );
  };

  const BetControls = () => (
    <View style={{ flexDirection: 'row', marginTop: normalize(20), alignItems: 'center' }}>
      <TouchableOpacity
        onPress={() => setBetAmount(prev => Math.max(1, prev - 1))}
        style={{ backgroundColor: '#00ffcc', padding: normalize(10), borderRadius: 12, marginHorizontal: 10 }}>
        <Text style={{ color: '#000', fontSize: normalize(20), fontWeight: 'bold' }}>–</Text>
      </TouchableOpacity>
      <Text style={{ color: '#fff', fontSize: normalize(18), fontWeight: 'bold' }}>Bet: ${betAmount}</Text>
      <TouchableOpacity
        onPress={() => setBetAmount(prev => prev + 1)}
        style={{ backgroundColor: '#00ffcc', padding: normalize(10), borderRadius: 12, marginHorizontal: 10 }}>
        <Text style={{ color: '#000', fontSize: normalize(20), fontWeight: 'bold' }}>+</Text>
      </TouchableOpacity>
    </View>
  );

  const AutoSpinToggle = () => (
    <TouchableOpacity
      onPress={() => setAutoSpin(prev => !prev)}
      style={{
        backgroundColor: autoSpin ? '#00ffcc' : '#555',
        paddingVertical: normalize(10),
        paddingHorizontal: normalize(25),
        borderRadius: 12,
        marginTop: normalize(20),
      }}>
      <Text style={{ color: '#000', fontWeight: 'bold', fontSize: normalize(16) }}>
        {autoSpin ? 'AutoSpin: ON' : 'AutoSpin: OFF'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ImageBackground
        source={require('../../assets/casino_felt.jpg')}
        style={{ flex: 1, resizeMode: 'cover', justifyContent: 'center', alignItems: 'center' }}
        imageStyle={{ opacity: 0.4 }}>

        <View style={{ width: '100%', alignItems: 'center', position: 'absolute', top: -50, zIndex: 2 }}>
        <Image
          source={require('../../assets/jackpot.png')}
          style={{
            width: normalize(500),
            height: normalize(200),
            resizeMode: 'contain',
            marginBottom: normalize(10),
          }}
        />
        </View>

        <Text style={{ fontSize: normalize(20), color: '#00ffcc', fontWeight: 'bold', marginBottom: normalize(10) }}>
          Balance: ${balance}
        </Text>

        <View style={{
          flexDirection: 'row',
          backgroundColor: '#111',
          padding: normalize(20),
          borderRadius: normalize(20),
          borderColor: '#00ffcc55',
          borderWidth: 1,
        }}>
          {renderReel(0)}
          {renderReel(1)}
          {renderReel(2)}

          <Animated.View
            style={{
              position: 'absolute',
              right: -normalize(10),
              top: '25%',
              width: normalize(60),
              height: normalize(60),
              backgroundColor: '#f5c542',
              borderRadius: normalize(35),
              justifyContent: 'center',
              alignItems: 'center',
              transform: [{ translateY: armAnim }],
              elevation: 8,
              shadowColor: '#000',
              shadowOpacity: 0.8,
              shadowRadius: 12,
              right: -normalize(30),
            }}
            {...panResponder.panHandlers}>
            <Text style={{ fontSize: normalize(26), color: '#222', fontWeight: 'bold' }}>⇩</Text>
          </Animated.View>
        </View>

        <Text style={{ fontSize: normalize(20), fontWeight: '600', color: '#fff', marginTop: normalize(20), textAlign: 'center' }}>{outcome}</Text>
        <BetControls />
        <AutoSpinToggle />
      </ImageBackground>
    </View>
  );
}
