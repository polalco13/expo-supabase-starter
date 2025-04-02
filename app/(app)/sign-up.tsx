import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ActivityIndicator, View, ImageBackground, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import * as z from "zod";

import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormInput } from "@/components/ui/form";
import { Text } from "@/components/ui/text";
import { H1 } from "@/components/ui/typography";
import { useSupabase } from "@/context/supabase-provider";
import { Image } from "@/components/image";
import { ChevronLeft } from "lucide-react-native";

const formSchema = z
	.object({
		email: z.string().email("Introdueix una adreça de correu vàlida."),
		password: z
			.string()
			.min(8, "Introdueix almenys 8 caràcters.")
			.max(64, "Introdueix menys de 64 caràcters.")
			.regex(
				/^(?=.*[a-z])/,
				"La contrasenya ha de tenir almenys una lletra minúscula.",
			)
			.regex(
				/^(?=.*[A-Z])/,
				"La contrasenya ha de tenir almenys una lletra majúscula.",
			)
			.regex(/^(?=.*[0-9])/, "La contrasenya ha de tenir almenys un número.")
			.regex(
				/^(?=.*[!@#$%^&*])/,
				"La contrasenya ha de tenir almenys un caràcter especial.",
			),
		confirmPassword: z.string().min(8, "Introdueix almenys 8 caràcters."),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Les contrasenyes no coincideixen.",
		path: ["confirmPassword"],
	});

export default function SignUp() {
	const { signUp } = useSupabase();
	
	const handleGoBack = () => {
		router.back();
	};

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	async function onSubmit(data: z.infer<typeof formSchema>) {
		try {
			await signUp(data.email, data.password);

			form.reset();
		} catch (error: Error | any) {
			console.log(error.message);
		}
	}

	return (
		<ImageBackground
			source={require("@/assets/welcome/bground.png")} 
			style={{ flex: 1 }}
			resizeMode="cover"
		>
			{/* Overlay semi-transparente para mejorar legibilidad */}
			<View style={{ 
				flex: 1, 
				backgroundColor: 'rgba(0,20,50,0.4)' 
			}}>
				<SafeAreaView className="flex-1" edges={["top", "bottom"]}>
					{/* Header con botón de retroceso */}
					<View className="flex-row items-center p-4">
						<TouchableOpacity 
							onPress={handleGoBack}
							className="p-2 bg-white/20 rounded-full"
						>
							<ChevronLeft size={24} color={"white"} />
						</TouchableOpacity>
					</View>
					
					<View className="flex-1 p-4 relative">
						{/* Logo y título */}
						<View className="items-center mb-8">
							<Image
								source={require("@/assets/icon.png")}
								className="w-24 h-24 rounded-xl mb-4"
								contentFit="cover"
							/>
							<H1 className="text-center text-white">Registra't</H1>
						</View>

						{/* Formulario con mensajes de error mejorados */}
						<View className="flex-1 mx-4">
							<Form {...form}>
								<View className="gap-1">
									<Text className="text-white font-medium mb-1 text-base">Correu electrònic</Text>
									<FormField
										control={form.control}
										name="email"
										render={({ field, fieldState }) => (
											<>
												<FormInput
													label=""
													placeholder="Correu electrònic"
													autoCapitalize="none"
													autoComplete="email"
													autoCorrect={false}
													keyboardType="email-address"
													className="bg-white/10 border-white/50 text-white"
													placeholderClassName="text-white/70"
													style={{ color: 'white' }}
													{...field}
												/>
												{fieldState.error && (
													<Text className="text-red-500 text-sm mt-1 mb-4">
														{fieldState.error.message}
													</Text>
												)}
											</>
										)}
									/>
									
									<Text className="text-white font-medium mb-1 mt-2 text-base">Contrasenya</Text>
									<FormField
										control={form.control}
										name="password"
										render={({ field, fieldState }) => (
											<>
												<FormInput
													label=""
													placeholder="Contrasenya"
													autoCapitalize="none"
													autoCorrect={false}
													secureTextEntry
													className="bg-white/10 border-white/50 text-white"
													placeholderClassName="text-white/70"
													{...field}
												/>
												{fieldState.error && (
													<Text className="text-red-500 text-sm mt-1 mb-4">
														{fieldState.error.message}
													</Text>
												)}
											</>
										)}
									/>
									
									<Text className="text-white font-medium mb-1 mt-2 text-base">Confirma la contrasenya</Text>
									<FormField
										control={form.control}
										name="confirmPassword"
										render={({ field, fieldState }) => (
											<>
												<FormInput
													label=""
													placeholder="Confirma la contrasenya"
													autoCapitalize="none"
													autoCorrect={false}
													secureTextEntry
													className="bg-white/10 border-white/50 text-white"
													placeholderClassName="text-white/70"
													{...field}
												/>
												{fieldState.error && (
													<Text className="text-red-500 text-sm mt-1 mb-4">
														{fieldState.error.message}
													</Text>
												)}
											</>
										)}
									/>
								</View>
							</Form>
						</View>

						{/* Botón de registro */}
						<View className="px-4 mb-8">
							<Button
								size="default"
								variant="default"
								onPress={form.handleSubmit(onSubmit)}
								disabled={form.formState.isSubmitting}
								className="bg-white rounded-full py-3 shadow"
							>
								{form.formState.isSubmitting ? (
									<ActivityIndicator size="small" color="#000" />
								) : (
									<Text className="text-black font-bold">Registra't</Text>
								)}
							</Button>
							{/* Enlace para iniciar sesión */}
							<View className="flex-row justify-center mt-4">
								<Text className="text-white/80">Ja tens compte?</Text>
								<TouchableOpacity className="ml-1" onPress={() => router.replace('/sign-in')}>
									<Text className="text-white font-bold">Inicia Sessió</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</SafeAreaView>
			</View>
		</ImageBackground>
	);
}