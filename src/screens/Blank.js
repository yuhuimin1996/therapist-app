import { StyleSheet, View, Text } from 'react-native'
import React from 'react'

export default function Blank() {
  return (
    <View style={styles.container}></View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'white'
    },
  });