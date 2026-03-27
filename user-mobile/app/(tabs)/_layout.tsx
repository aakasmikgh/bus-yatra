import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF', // Blue theme
        tabBarInactiveTintColor: '#8E8E93', // Grey for inactive
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: 'Offers',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="ticket-percent" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-trips"
        options={{
          title: 'My Trips',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bus-side" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'Support',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="face-agent" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
