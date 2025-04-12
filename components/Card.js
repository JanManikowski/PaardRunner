// /src/components/Card.js
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

// Updated, smaller dimensions for cards:
const CARD_WIDTH_OWN = 50;
const CARD_HEIGHT_OWN = 75;
const CARD_WIDTH_OTHERS = 40;
const CARD_HEIGHT_OTHERS = 60;

const Card = ({ card, delayTime = 0, size = 'own' }) => {
  const translateY = useSharedValue(-200);
  
  useEffect(() => {
    translateY.value = withTiming(0, { duration: 600, delay: delayTime });
  }, [delayTime]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  
  const isOwn = size === 'own';
  const cardWidth = isOwn ? CARD_WIDTH_OWN : CARD_WIDTH_OTHERS;
  const cardHeight = isOwn ? CARD_HEIGHT_OWN : CARD_HEIGHT_OTHERS;
  // For simplicity, display the card as text (e.g. "A♠")
  const display = card?.rank ? `${card.rank}${card.suit}` : card;
  
  return (
    <Animated.View
      style={[
        {
          width: cardWidth,
          height: cardHeight,
          borderRadius: 6,
          backgroundColor: '#fff',
          margin: 3,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 3,
          elevation: 4,
        },
        animatedStyle,
      ]}
    >
      <Text style={{ fontSize: isOwn ? 14 : 12, fontWeight: 'bold' }}>{display}</Text>
    </Animated.View>
  );
};

export default Card;
