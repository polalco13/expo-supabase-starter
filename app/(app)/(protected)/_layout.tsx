import { Tabs } from "expo-router";
import React from "react";
import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";

export default function ProtectedLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: "none",
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      <Tabs.Screen name="all-incidents" options={{ title: "Incidències" }} />
      <Tabs.Screen name="incident-detail" options={{ title: "Detall d'incidència" }} />
     </Tabs>
  );
}