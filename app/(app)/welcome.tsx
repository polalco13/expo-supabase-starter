import { useRouter } from "expo-router";
import React from "react";
import { View, ImageBackground } from "react-native";
import { Image } from "@/components/image";
import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, Muted } from "@/components/ui/typography";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require("@/assets/welcome/fons3.png")} // Imagen de fondo
      resizeMode="cover"
      className="flex-1"
    >
      <SafeAreaView className="flex flex-1 p-2">
        {/* Overlay semitransparente para mejorar la legibilidad */}
        <View className="absolute inset-0 bg-black/60" />
        
        <View className="flex-1 relative justify-between">
          {/* Parte superior: Logo, título y subtítulo */}
          <View className="items-center">
            <Image
              source={require("@/assets/icon.png")} // Imagen del logo
              className="w-40 h-40 rounded-xl"
              contentFit="cover"
            />
            <H1 className="text-center text-white mb-4">
              Benvingut a Transports Penedès
            </H1>
            <Muted className="text-center text-white text-md px-2">
              Inicia sessió per accedir a totes les funcionalitats disponibles de la nostra aplicació.
            </Muted>
          </View>
          
          {/* Parte inferior: Botones con tonos blancos */}
          <View className="flex flex-col gap-y-4 mx-8 mb-12">
            <Button
              size="default"
              variant="default"
              onPress={() => router.push("/sign-up")}
              className="bg-white rounded-full py-3 shadow"
            >
              <Text className="text-black font-bold">Registra't</Text>
            </Button>
            <Button
              size="default"
              variant="secondary"
              onPress={() => router.push("/sign-in")}
              className="bg-transparent border border-white rounded-full py-3"
            >
              <Text className="text-white font-bold">Inicia Sessió</Text>
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
