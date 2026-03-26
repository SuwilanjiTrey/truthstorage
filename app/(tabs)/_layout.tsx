// app/(tabs)/_layout.tsx  ← REPLACE your existing _layout.tsx with this file
import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';


function Icon({
  name,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}) {
  return (
    <Ionicons
      name={name}
      size={22}
      color={focused ? Colors.accent : Colors.textMuted}
      style={{ opacity: focused ? 1 : 0.6 }}
    />
  );
}


function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{
      fontFamily: 'SpaceMono',
      fontSize: 9,
      letterSpacing: 0.8,
      color: focused ? Colors.accent : Colors.textMuted,
    }}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg1,
          borderTopColor:  Colors.bg3,
          borderTopWidth:  1,
          height:          Platform.OS === 'ios' ? 80 : 62,
          paddingBottom:   Platform.OS === 'ios' ? 24 : 10,
          paddingTop:      8,
        },
        tabBarActiveTintColor:   Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Icon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="HOME" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="apps"
        options={{
          title: 'Apps',
          tabBarIcon: ({ focused }) => (
            <Icon name={focused ? 'grid' : 'grid-outline'} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="APPS" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ focused }) => (
            <Icon name={focused ? 'analytics' : 'analytics-outline'} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="INSIGHTS" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="connect"
        options={{
          title: 'Connect',
          tabBarIcon: ({ focused }) => (
            <Icon name={focused ? 'hardware-chip' : 'hardware-chip-outline'} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="CONNECT" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ focused }) => (
            <Icon name={focused ? 'information-circle' : 'information-circle-outline'} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="ABOUT" focused={focused} />,
        }}
      />
    </Tabs>
  );
}