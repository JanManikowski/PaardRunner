// Full code with enhancements applied
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  TextInput,
  ScrollView,
} from 'react-native';
import Svg, {
  Path,
  G,
  Circle,
  Text as SvgText,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { CoinContext } from '../../contexts/CoinContext';
import { normalize } from '../../utils/normalize';
import * as ScreenOrientation from 'expo-screen-orientation';

const NUMBERS = [
  { number: '0', color: 'green' }, { number: '32', color: 'red' }, { number: '15', color: 'black' },
  { number: '19', color: 'red' }, { number: '4', color: 'black' }, { number: '21', color: 'red' },
  { number: '2', color: 'black' }, { number: '25', color: 'red' }, { number: '17', color: 'black' },
  { number: '34', color: 'red' }, { number: '6', color: 'black' }, { number: '27', color: 'red' },
  { number: '13', color: 'black' }, { number: '36', color: 'red' }, { number: '11', color: 'black' },
  { number: '30', color: 'red' }, { number: '8', color: 'black' }, { number: '23', color: 'red' },
  { number: '10', color: 'black' }, { number: '5', color: 'red' }, { number: '24', color: 'black' },
  { number: '16', color: 'red' }, { number: '33', color: 'black' }, { number: '1', color: 'red' },
  { number: '20', color: 'black' }, { number: '14', color: 'red' }, { number: '31', color: 'black' },
  { number: '9', color: 'red' }, { number: '22', color: 'black' }, { number: '18', color: 'red' },
  { number: '29', color: 'black' }, { number: '7', color: 'red' }, { number: '28', color: 'black' },
  { number: '12', color: 'red' }, { number: '35', color: 'black' }, { number: '3', color: 'red' },
  { number: '26', color: 'black' },
];

const polarToCartesian = (cx, cy, r, angle) => {
  const rad = (angle - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
};

const describeArc = (cx, cy, r, start, end) => {
  const startPt = polarToCartesian(cx, cy, r, end);
  const endPt = polarToCartesian(cx, cy, r, start);
  const largeArc = end - start <= 180 ? '0' : '1';
  return [
    'M', cx, cy,
    'L', startPt.x, startPt.y,
    'A', r, r, 0, largeArc, 0, endPt.x, endPt.y,
    'Z'
  ].join(' ');
};

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function RouletteScreen() {
  const { balance, updateBalance } = useContext(CoinContext);
  const rotation = useSharedValue(0);
  const ballAngle = useSharedValue(0);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [betAmount, setBetAmount] = useState(10);
  const [message, setMessage] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [winIndex, setWinIndex] = useState(null);

  const size = normalize(300);
  const center = size / 2;
  const radius = center - 10;
  const sectorAngle = 360 / NUMBERS.length;

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
  }, []);

  const wheelAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const animatedBallStyle = useAnimatedProps(() => {
    const polarToCartesian = (cx, cy, r, angle) => {
      'worklet';
      const rad = (angle - 90) * (Math.PI / 180);
      return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
      };
    };
    const angle = (rotation.value % 360) - ballAngle.value;
    const pos = polarToCartesian(center, center, radius - 8, angle);
    return {
      cx: pos.x,
      cy: pos.y,
    };
  });

  const spinWheel = () => {
    if (!selectedNumber) return Alert.alert('Choose a number');
    if (betAmount > balance) return Alert.alert('Not enough balance');
  
    updateBalance(-betAmount);
    setSpinning(true);
    setMessage('');
  
    const selectedIndex = NUMBERS.findIndex(n => n.number === selectedNumber);
    const sectorAngle = 360 / NUMBERS.length;
    const stopAngle = selectedIndex * sectorAngle;
    const spins = 5;
    const targetRotation = spins * 360 + (360 - stopAngle); // rotate so selected lands at top
  
    rotation.value = withTiming(targetRotation, {
      duration: 5000,
      easing: Easing.out(Easing.quad),
    }, () => {
      runOnJS(setWinIndex)(selectedIndex);
      runOnJS(updateBalance)(betAmount * 35);
      runOnJS(setMessage)(`🎉 WIN! ${selectedNumber} → $${betAmount * 35}`);
      runOnJS(setSpinning)(false);
    });
  };
  
  return (
    <ImageBackground source={require('../../assets/casino_felt.jpg')} style={{ flex: 1 }} imageStyle={{ opacity: 0.3 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Roulette</Text>
        <Text style={styles.balance}>Balance: ${balance}</Text>

        <View style={styles.wheelWrap}>
          <Svg width={size} height={size}>
            <Defs>
              <RadialGradient id="ballGradient" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#fff" />
                <Stop offset="100%" stopColor="#ccc" />
              </RadialGradient>
            </Defs>
            <Animated.View style={[StyleSheet.absoluteFill, wheelAnimatedStyle]}>
              <Svg width={size} height={size}>
                {NUMBERS.map((item, i) => {
                  const start = i * sectorAngle;
                  const end = start + sectorAngle;
                  const arc = describeArc(center, center, radius, start, end);
                  const labelPos = polarToCartesian(center, center, radius * 0.8, start + sectorAngle / 2);
                  const fill = item.color;
                  const textColor = item.color === 'green' ? '#111' : '#fff';
                  const isWinning = winIndex === i;
                  return (
                    <G key={i}>
                      <Path d={arc} fill={fill} stroke={isWinning ? '#ff0' : '#000'} strokeWidth={isWinning ? 3 : 0.5} />
                      <SvgText
                        fill={textColor}
                        fontSize="12"
                        fontWeight="bold"
                        x={labelPos.x}
                        y={labelPos.y}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                      >
                        {item.number}
                      </SvgText>
                    </G>
                  );
                })}
                <Circle cx={center} cy={center} r={8} fill="#aaa" />
                <AnimatedCircle r="6" fill="url(#ballGradient)" stroke="#333" strokeWidth={2} animatedProps={animatedBallStyle} />
              </Svg>
            </Animated.View>
          </Svg>
        </View>

        <Text style={styles.message}>{message}</Text>

        <View style={styles.controls}>
          <TextInput
            keyboardType="numeric"
            value={String(betAmount)}
            onChangeText={t => setBetAmount(Number(t))}
            style={styles.input}
            editable={!spinning}
          />
          <TouchableOpacity style={styles.spinBtn} onPress={spinWheel} disabled={spinning}>
            <Text style={styles.spinText}>{spinning ? 'Spinning...' : 'SPIN'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.numbersRow}>
          {NUMBERS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.numberBtn, { backgroundColor: item.color }, selectedNumber === item.number && styles.selected]}
              onPress={() => setSelectedNumber(item.number)}
              disabled={spinning}
            >
              <Text style={styles.numberText}>{item.number}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: normalize(28), fontWeight: 'bold', color: '#fff' },
  balance: { fontSize: normalize(18), color: '#0f0', marginVertical: 10 },
  message: { color: '#fff', fontSize: normalize(16), marginVertical: 10 },
  wheelWrap: { transform: [{ rotateX: '60deg' }], marginVertical: 10 },
  controls: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  input: {
    backgroundColor: '#fff', padding: normalize(8), borderRadius: 6,
    width: normalize(80), textAlign: 'center', fontSize: normalize(16), marginRight: 10,
  },
  spinBtn: {
    backgroundColor: '#f5c542', padding: normalize(12), borderRadius: 10,
  },
  spinText: { fontWeight: 'bold', fontSize: normalize(18) },
  numbersRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 10,
  },
  numberBtn: {
    paddingVertical: normalize(6), paddingHorizontal: normalize(10), borderRadius: 6,
    margin: 4, borderWidth: 2, borderColor: '#888', minWidth: normalize(40), alignItems: 'center',
  },
  selected: {
    borderColor: '#00ffcc', backgroundColor: '#111',
  },
  numberText: { color: '#fff', fontWeight: 'bold' },
});