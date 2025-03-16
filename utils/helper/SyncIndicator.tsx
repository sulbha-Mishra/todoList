/**
 * SyncIndicator Component
 * Displays a loading indicator with a progress bar and a message.
 *
 * @param {Object} props - Component props
 * @param {string} props.message - The message to display during syncing
 * @returns {JSX.Element} React component
 */
import React, {useEffect, useRef} from 'react';
import {View, Text, Animated, Easing, StyleSheet, ActivityIndicator} from 'react-native';

const SyncIndicator: React.FC<{message: string}> = ({message}) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [progress]);

  const animatedWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.syncContainer}>
      <ActivityIndicator size="large" color="#00AEEF" />
      <Text style={styles.syncText}>{message}</Text>
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBar, {width: animatedWidth}]} />
      </View>
    </View>
  );
};

export default SyncIndicator;

const styles = StyleSheet.create({
  syncContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
  },
  syncText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#00AEEF',
    marginTop: 10,
  },
  progressBarContainer: {
    width: '80%',
    height: 8,
    backgroundColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00AEEF',
  },
});
