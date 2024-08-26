import React, { useState, useEffect } from 'react';
import { View, Text, Image, Dimensions, TouchableOpacity, Button, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 1;
const SPACING = 0;
const CENTER_POSITION = (width - ITEM_WIDTH) / 2;

const availableSkins = [
  { name: 'Classic', image: require('../assets/skins/classic.jpg') },
  { name: 'Modern', image: require('../assets/skins/modern.jpg') },
  { name: 'Retro', image: require('../assets/skins/retro.jpg') },
  { name: 'Neon', image: require('../assets/skins/neon.jpg') },
  { name: 'Cyber', image: require('../assets/skins/cyber.png') },
];

// Generate a large number of images to ensure we never run out
const generateSkinReel = (skins) => {
  const reel = [];
  const totalImages = 300; // Generating a large number of images
  for (let i = 0; i < totalImages; i++) {
    reel.push(skins[i % skins.length]);
  }
  return reel;
};

const CaseOpeningScreen = ({ navigation }) => {
  const [selectedSkin, setSelectedSkin] = useState(null);
  const [isOpening, setIsOpening] = useState(false);
  const scrollX = useSharedValue(0);
  const [targetOffset, setTargetOffset] = useState(0);
  const [openingDuration, setOpeningDuration] = useState(6); // Set the duration in seconds

  const randomScrollDistance = 5000 + Math.floor(Math.random() * 2000);

  // Generate the reel skins with a massive number of images
  const reelSkins = generateSkinReel(availableSkins);

  const [sound, setSound] = useState();

  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/case_opening.mp3')
    );
    setSound(sound);
    await sound.playAsync(); 
  }

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync(); 
        }
      : undefined;
  }, [sound]);

  const startOpeningCase = () => {
    setIsOpening(true);
    playSound();

    const totalDuration = openingDuration * 1000; // Convert seconds to milliseconds

    // Calculate the target offset to land at a random item
    const randomIndex = Math.floor(Math.random() * availableSkins.length);
    const initialOffset = randomScrollDistance + randomIndex * (ITEM_WIDTH + SPACING) - CENTER_POSITION;

    setTargetOffset(initialOffset);

    setTimeout(() => {
      scrollX.value = withTiming(initialOffset, {
        duration: totalDuration,
        easing: Easing.out(Easing.cubic),
      });

      setTimeout(() => {
        // Calculate the final position of the closest item to the center
        const adjustedScrollX = scrollX.value + CENTER_POSITION;
        const finalIndex = Math.round(adjustedScrollX / (ITEM_WIDTH + SPACING)) % reelSkins.length;

        // Calculate the exact position for the finalOffset, ensuring it's centered
        const finalOffset = finalIndex * (ITEM_WIDTH + SPACING) - (ITEM_WIDTH / 2) + CENTER_POSITION  + ITEM_WIDTH;

        // Secondary animation to center the closest skin
        scrollX.value = withTiming(finalOffset, {
          duration: 1000,
          easing: Easing.out(Easing.cubic),
        });

        setTimeout(() => {
          const skinAtCenter = reelSkins[finalIndex];
          setSelectedSkin(skinAtCenter);

          // Log the details of the image that touches the white line (center position)
          console.log('Skin touching the white line:', skinAtCenter.name, skinAtCenter.image);
        }, 1000); // Wait for the centering animation to complete before showing the result

      }, totalDuration);
    }, 2500); // 2.5-second delay before starting the animation
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -scrollX.value }],
    };
  });

  return (
    <View style={styles.container}>
      {!isOpening ? (
        <TouchableOpacity onPress={startOpeningCase}>
          <Image
            source={require('../assets/skins/case.png')}
            style={styles.caseImage}
          />
          <Text style={styles.openText}>Tap to Open the Case</Text>
        </TouchableOpacity>
      ) : (
        <>
          {/* White Line Indicator */}
          <View style={styles.whiteLine} />

          <View style={styles.reelContainer}>
            <Animated.View style={[styles.animatedReel, animatedStyle]}>
              {reelSkins.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.skinItem,
                    {
                      borderColor: scrollX.value === targetOffset ? 'rgba(255, 215, 0, 0.5)' : 'transparent',
                    },
                  ]}
                >
                  <Image source={item.image} style={styles.skinImage} resizeMode="contain" />
                  <Text style={styles.skinText}>{item.name}</Text>
                </View>
              ))}
            </Animated.View>
          </View>

          {selectedSkin && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>You Unlocked:</Text>
              <Text style={styles.resultSkinText}>{selectedSkin.name}</Text>
              <Image source={selectedSkin.image} style={styles.resultSkinImage} />
            </View>
          )}

          {selectedSkin && (
            <Button
              title="Back to Fridges"
              onPress={() => navigation.goBack()}
              color="#FFD700"
              style={styles.backButton}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  caseImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  openText: {
    color: '#FFF',
    fontSize: 18,
  },
  whiteLine: {
    position: 'absolute',
    height: ITEM_WIDTH * 2,
    width: 2,
    backgroundColor: '#FFF',
    top: '50%',
    left: '50%',
    transform: [{ translateY: -ITEM_WIDTH }],
    zIndex: 10,
  },
  reelContainer: {
    height: ITEM_WIDTH * 1.5, // Reduced height to better fit the items
    overflow: 'hidden',
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    marginTop: 20,
  },
  animatedReel: {
    flexDirection: 'row',
  },
  skinItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.25,
    marginHorizontal: SPACING / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    borderWidth: 2,
  },
  skinImage: {
    width: '100%',
    height: '80%',
    borderRadius: 10,
  },
  skinText: {
    color: '#FFF',
    marginTop: 5,
  },
  resultContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  resultText: {
    color: '#FFF',
    fontSize: 24,
  },
  resultSkinText: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: 'bold',
  },
  resultSkinImage: {
    width: 100,
    height: 100,
    marginTop: 20,
    borderRadius: 10,
  },
  backButton: {
    marginTop: 20,
  },
});

export default CaseOpeningScreen;
