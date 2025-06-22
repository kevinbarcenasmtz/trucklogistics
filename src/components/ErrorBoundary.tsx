// src/components/ErrorBoundary.tsx 
import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale, verticalScale, horizontalScale } from '@/src/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Onboarding Error:', error, errorInfo);
    // Add analytics tracking here
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(24),
    backgroundColor: '#1c1c1e',
  },
  errorText: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: verticalScale(24),
  },
  retryButton: {
    backgroundColor: '#004d40',
    paddingHorizontal: horizontalScale(24),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});