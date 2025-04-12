import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { ThemeContext } from '../../contexts/ThemeContext';
import StyledButton from '../../components/StyledButton';
import { CoinContext } from '../../contexts/CoinContext';

const GambleHomeScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const { balance } = useContext(CoinContext);

  const handleBlackjack = () => {
    navigation.navigate('Blackjack');
  };

  const handleRoulette = () => {
    navigation.navigate('Roulette');
  };

  const handleClicker = () => {
    navigation.navigate('Clicker');
  };

  const handleLogin = () => {
    navigation.navigate('GamblingLogin');
  };

  const handleSlotMachine = () => {
    navigation.navigate('SlotMachine');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16 }}>
      <Text style={{ fontSize: 20, color: theme.colors.text, fontWeight: 'bold', marginBottom: 10 }}>
        Balance: ${balance}
      </Text>
      <Text style={{ fontSize: 24, color: theme.colors.text, fontWeight: 'bold', marginBottom: 20 }}>
        Gamble
      </Text>
      <StyledButton
        title="Blackjack"
        onPress={handleBlackjack}
        style={{ backgroundColor: theme.colors.primary, marginBottom: 10 }}
        textStyle={{ color: theme.colors.background }}
      />
      <StyledButton
        title="Roulette"
        onPress={handleRoulette}
        style={{ backgroundColor: theme.colors.primary, marginBottom: 10 }}
        textStyle={{ color: theme.colors.background }}
      />
      <StyledButton
        title="Cookie Clicker"
        onPress={handleClicker}
        style={{ backgroundColor: theme.colors.primary, marginBottom: 10 }}
        textStyle={{ color: theme.colors.background }}
      />
      <StyledButton
        title="Gamble Login"
        onPress={handleLogin}
        style={{ backgroundColor: theme.colors.primary, marginBottom: 10 }}
        textStyle={{ color: theme.colors.background }}
      />
      <StyledButton
        title="Slot machine"
        onPress={handleSlotMachine}
        style={{ backgroundColor: theme.colors.primary, marginBottom: 10 }}
        textStyle={{ color: theme.colors.background }}
      />
    </View>
  );
};

export default GambleHomeScreen;
