import { StyleSheet, View } from 'react-native';
import TabNavigation from './src/components/TabNavigation';
import { NavigationContainer } from '@react-navigation/native';




export default function App() {
  return (
    <View style={styles.container}>
      <NavigationContainer>
        <TabNavigation />
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
});
