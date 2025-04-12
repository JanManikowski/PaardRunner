import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../../contexts/ThemeContext';

const CookieClickerScreen = () => {
  // -------------------------------
  // Game State Variables
  // -------------------------------
  const [coins, setCoins] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [clickUpgradeCost, setClickUpgradeCost] = useState(10);

  // Passive upgrade states
  const [cursorCount, setCursorCount] = useState(0);
  const [cursorCost, setCursorCost] = useState(15);

  const [grandmaCount, setGrandmaCount] = useState(0);
  const [grandmaCost, setGrandmaCost] = useState(100);

  const [factoryCount, setFactoryCount] = useState(0);
  const [factoryCost, setFactoryCost] = useState(500);

  // Track if game data has finished loading
  const [isLoaded, setIsLoaded] = useState(false);

  // For toggling upgrade menu
  const [showUpgradeMenu, setShowUpgradeMenu] = useState(false);

  // Access theme (for text and button colors)
  const { theme } = useContext(ThemeContext);

  // -------------------------------
  // Animation references
  // -------------------------------
  // Spin animation for the coin (rotates continuously)
  const spinValue = useRef(new Animated.Value(0)).current;
  // Bounce animation (scales up briefly when coin is tapped)
  const bounceValue = useRef(new Animated.Value(1)).current;
  // Background fade animation (optional overlay effect)
  const fadeValue = useRef(new Animated.Value(0)).current;

  // -------------------------------
  // Start the coin rotation on mount
  // -------------------------------
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  // Interpolate rotation for the coin
  const coinSpin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Optionally, you can animate a subtle fade overlay on your background
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeValue, {
          toValue: 0.2,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(fadeValue, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [fadeValue]);

  // -------------------------------
  // Load game data from AsyncStorage
  // -------------------------------
  useEffect(() => {
    const loadGameData = async () => {
      try {
        const storedCoins = await AsyncStorage.getItem('@CookieClicker:coins');
        const storedClickPower = await AsyncStorage.getItem('@CookieClicker:clickPower');
        const storedClickUpgradeCost = await AsyncStorage.getItem('@CookieClicker:clickUpgradeCost');
        const storedCursorCount = await AsyncStorage.getItem('@CookieClicker:cursorCount');
        const storedCursorCost = await AsyncStorage.getItem('@CookieClicker:cursorCost');
        const storedGrandmaCount = await AsyncStorage.getItem('@CookieClicker:grandmaCount');
        const storedGrandmaCost = await AsyncStorage.getItem('@CookieClicker:grandmaCost');
        const storedFactoryCount = await AsyncStorage.getItem('@CookieClicker:factoryCount');
        const storedFactoryCost = await AsyncStorage.getItem('@CookieClicker:factoryCost');

        if (storedCoins !== null) setCoins(parseInt(storedCoins));
        if (storedClickPower !== null) setClickPower(parseInt(storedClickPower));
        if (storedClickUpgradeCost !== null) setClickUpgradeCost(parseInt(storedClickUpgradeCost));
        if (storedCursorCount !== null) setCursorCount(parseInt(storedCursorCount));
        if (storedCursorCost !== null) setCursorCost(parseInt(storedCursorCost));
        if (storedGrandmaCount !== null) setGrandmaCount(parseInt(storedGrandmaCount));
        if (storedGrandmaCost !== null) setGrandmaCost(parseInt(storedGrandmaCost));
        if (storedFactoryCount !== null) setFactoryCount(parseInt(storedFactoryCount));
        if (storedFactoryCost !== null) setFactoryCost(parseInt(storedFactoryCost));
      } catch (error) {
        console.log('Error loading game data:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadGameData();
  }, []);

  // -------------------------------
  // Save game data to AsyncStorage (after load)
  // -------------------------------
  useEffect(() => {
    if (!isLoaded) return;

    const saveGameData = async () => {
      try {
        await AsyncStorage.multiSet([
          ['@CookieClicker:coins', coins.toString()],
          ['@CookieClicker:clickPower', clickPower.toString()],
          ['@CookieClicker:clickUpgradeCost', clickUpgradeCost.toString()],
          ['@CookieClicker:cursorCount', cursorCount.toString()],
          ['@CookieClicker:cursorCost', cursorCost.toString()],
          ['@CookieClicker:grandmaCount', grandmaCount.toString()],
          ['@CookieClicker:grandmaCost', grandmaCost.toString()],
          ['@CookieClicker:factoryCount', factoryCount.toString()],
          ['@CookieClicker:factoryCost', factoryCost.toString()],
        ]);
      } catch (error) {
        console.log('Error saving game data:', error);
      }
    };

    saveGameData();
  }, [
    isLoaded,
    coins,
    clickPower,
    clickUpgradeCost,
    cursorCount,
    cursorCost,
    grandmaCount,
    grandmaCost,
    factoryCount,
    factoryCost,
  ]);

  // -------------------------------
  // Calculate total passive income
  // -------------------------------
  const totalPassiveIncome = cursorCount * 1 + grandmaCount * 5 + factoryCount * 10;

  // -------------------------------
  // Handle coin tap (with bounce)
  // -------------------------------
  const handleGetCoins = () => {
    Animated.sequence([
      Animated.timing(bounceValue, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bounceValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCoins(prev => prev + clickPower);
    });
  };

  // -------------------------------
  // Upgrade functions
  // -------------------------------
  const handleClickUpgrade = () => {
    if (coins >= clickUpgradeCost) {
      setCoins(prev => prev - clickUpgradeCost);
      setClickPower(prev => prev + 1);
      setClickUpgradeCost(prev => Math.floor(prev * 1.5));
    }
  };

  const handleBuyCursor = () => {
    if (coins >= cursorCost) {
      setCoins(prev => prev - cursorCost);
      setCursorCount(prev => prev + 1);
      setCursorCost(prev => Math.floor(prev * 1.15));
    }
  };

  const handleBuyGrandma = () => {
    if (coins >= grandmaCost) {
      setCoins(prev => prev - grandmaCost);
      setGrandmaCount(prev => prev + 1);
      setGrandmaCost(prev => Math.floor(prev * 1.2));
    }
  };

  const handleBuyFactory = () => {
    if (coins >= factoryCost) {
      setCoins(prev => prev - factoryCost);
      setFactoryCount(prev => prev + 1);
      setFactoryCost(prev => Math.floor(prev * 1.3));
    }
  };

  // -------------------------------
  // Auto-add coins every second
  // -------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      if (totalPassiveIncome > 0) {
        setCoins(prev => prev + totalPassiveIncome);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [totalPassiveIncome]);

  // -------------------------------
  // Reset game data
  // -------------------------------
  const resetGameData = async () => {
    try {
      await AsyncStorage.multiRemove([
        '@CookieClicker:coins',
        '@CookieClicker:clickPower',
        '@CookieClicker:clickUpgradeCost',
        '@CookieClicker:cursorCount',
        '@CookieClicker:cursorCost',
        '@CookieClicker:grandmaCount',
        '@CookieClicker:grandmaCost',
        '@CookieClicker:factoryCount',
        '@CookieClicker:factoryCost',
      ]);
      // Reset states
      setCoins(0);
      setClickPower(1);
      setClickUpgradeCost(10);
      setCursorCount(0);
      setCursorCost(15);
      setGrandmaCount(0);
      setGrandmaCost(100);
      setFactoryCount(0);
      setFactoryCost(500);
    } catch (error) {
      console.log('Error resetting game data:', error);
    }
  };

  // -------------------------------
  // Animated styles for coin
  // -------------------------------
  const animatedCoinStyle = {
    transform: [
      { rotate: coinSpin },
      { scale: bounceValue },
    ],
  };

  // -------------------------------
  // Render the UI with an ImageBackground instead of LinearGradient.
  // -------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../../assets/cool-background.jpg')}  // Ensure you have a cool gradient/background image in your assets.
        style={styles.background}
      >
        {/* Optional overlay to animate subtle lighting effects */}
        <Animated.View style={[styles.overlay, { opacity: fadeValue }]} />
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Cookie Clicker Game
          </Text>

          {/* Animated Coin */}
          <TouchableOpacity onPress={handleGetCoins} activeOpacity={0.8}>
            <Animated.Image
              source={require('../../assets/coin.png')}
              style={[styles.coinImage, animatedCoinStyle]}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Text style={[styles.coinCount, { color: theme.colors.text }]}>
            {coins} Coins
          </Text>

          {/* Buttons */}
          <TouchableOpacity
            onPress={handleGetCoins}
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={[styles.buttonText, { color: theme.colors.background }]}>
              Tap for {clickPower} Coin{clickPower > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClickUpgrade}
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={[styles.buttonText, { color: theme.colors.background }]}>
              Upgrade Click Power (Cost: {clickUpgradeCost})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowUpgradeMenu(!showUpgradeMenu)}
            style={[styles.button, { backgroundColor: theme.colors.primary, marginVertical: 20 }]}
          >
            <Text style={[styles.buttonText, { color: theme.colors.background }]}>
              {showUpgradeMenu ? 'Hide Upgrades' : 'Show Upgrades'}
            </Text>
          </TouchableOpacity>

          {/* Passive Upgrades */}
          {showUpgradeMenu && (
            <View style={styles.upgradeContainer}>
              <Text style={[styles.upgradeTitle, { color: theme.colors.text }]}>
                Passive Upgrades
              </Text>

              <Text style={[styles.upgradeLabel, { color: theme.colors.text }]}>
                Passive Income: {totalPassiveIncome} coin/sec
              </Text>

              <View style={styles.upgradeSection}>
                <Text style={[styles.upgradeLabel, { color: theme.colors.text }]}>
                  Cursors: {cursorCount} (Cost: {cursorCost})
                </Text>
                <TouchableOpacity
                  onPress={handleBuyCursor}
                  style={[styles.button, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                    Buy Cursor
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.upgradeSection}>
                <Text style={[styles.upgradeLabel, { color: theme.colors.text }]}>
                  Grandmas: {grandmaCount} (Cost: {grandmaCost})
                </Text>
                <TouchableOpacity
                  onPress={handleBuyGrandma}
                  style={[styles.button, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                    Buy Grandma
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.upgradeSection}>
                <Text style={[styles.upgradeLabel, { color: theme.colors.text }]}>
                  Factories: {factoryCount} (Cost: {factoryCost})
                </Text>
                <TouchableOpacity
                  onPress={handleBuyFactory}
                  style={[styles.button, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                    Buy Factory
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={resetGameData}
            style={[styles.button, { backgroundColor: 'red', marginTop: 20 }]}
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>
              Reset Game
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
    resizeMode: 'cover',  // Ensure the image covers the entire screen
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  container: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  coinImage: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  coinCount: {
    fontSize: 24,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 5,
  },
  buttonText: {
    fontSize: 18,
  },
  upgradeContainer: {
    width: '90%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 20,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  upgradeLabel: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center',
  },
  upgradeSection: {
    marginVertical: 10,
    alignItems: 'center',
  },
});

export default CookieClickerScreen;
