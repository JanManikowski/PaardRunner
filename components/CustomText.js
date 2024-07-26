// import React from 'react';
// import { Text } from 'react-native';
// import * as Font from 'expo-font';
// import AppLoading from 'expo-app-loading';

// const loadFonts = () => {
//   return Font.loadAsync({
//     'Roboto-Regular': require('../assets/fonts/Roboto-Regular.ttf'),
//   });
// };

// const CustomText = ({ style, ...props }) => {
//   const [fontsLoaded, setFontsLoaded] = React.useState(false);

//   React.useEffect(() => {
//     (async () => {
//       await loadFonts();
//       setFontsLoaded(true);
//     })();
//   }, []);

//   if (!fontsLoaded) {
//     return <AppLoading />;
//   }

//   return <Text {...props} style={[style, { fontFamily: 'Roboto-Regular' }]} />;
// };

// export default CustomText;
