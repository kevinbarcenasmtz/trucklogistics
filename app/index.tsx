import React, { useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { getThemeStyles } from "@/src/theme";
import ThemeToggle from '@/src/theme/ThemeToggle';

export default function Index(): JSX.Element {
  const { theme } = useTheme();
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const themeStyles = getThemeStyles(theme);

  // Redirect to auth screen if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      router.replace("/(auth)/language");
    }
  }, [user, loading, router]);

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  if (loading) {
    return (
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: themeStyles.colors.background }
      ]}>
        <View style={styles.content}>
          <Text style={[
            styles.title,
            { color: themeStyles.colors.text.primary }
          ]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // If not authenticated, don't render content (will redirect via useEffect)
  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: themeStyles.colors.background }
    ]}>
      <View style={styles.content}>
        <Text style={[
          styles.title,
          { color: themeStyles.colors.text.primary }
        ]}>
          TruckLogistics
        </Text>
        
        <View style={[
          styles.card,
          { 
            backgroundColor: themeStyles.colors.surface,
            borderColor: themeStyles.colors.border,
            ...themeStyles.shadow.md
          }
        ]}>
          <Text style={[
            styles.cardText,
            { color: themeStyles.colors.text.primary }
          ]}>
            Welcome, {user?.displayName || 'User'}
          </Text>
          
          <Text style={[
            styles.cardSubText,
            { color: themeStyles.colors.text.secondary }
          ]}>
            You are signed in with {user?.email}
          </Text>

          <TouchableOpacity
            style={[
              styles.signOutButton,
              { backgroundColor: themeStyles.colors.greenThemeColor }
            ]}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.themeToggleContainer}>
          <ThemeToggle />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  card: {
    width: "100%",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  cardText: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
  },
  cardSubText: {
    fontSize: 14,
    marginBottom: 16,
  },
  themeToggleContainer: {
    marginTop: 16,
  },
  signOutButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});