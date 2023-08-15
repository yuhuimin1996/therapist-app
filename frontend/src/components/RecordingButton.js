import React from 'react';
import { Animated, TouchableOpacity } from 'react-native';
import { Svg, Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function RecordingButton({ isRecording, progress, onPress }) {
  
  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const innerRadius = radius - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;
  
  const dashOffset = Animated.subtract(circumference, Animated.multiply(progress, circumference));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          fill="rgba(255, 255, 255, 0.5)"
          stroke="transparent"
        />

        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    </TouchableOpacity>
  );
}
