import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface StepTransitionProps {
  entering: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const StepTransition: React.FC<StepTransitionProps> = ({ entering, children, style }) => {
  const fadeAnim = useRef(new Animated.Value(entering ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(entering ? 30 : 0)).current;

  useEffect(() => {
    if (entering) {
      // Start from hidden/offset state
      fadeAnim.setValue(0);
      slideAnim.setValue(30);

      // Animate to visible/positioned state
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate to hidden/offset state
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 30,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [entering, fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        {
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default StepTransition;
