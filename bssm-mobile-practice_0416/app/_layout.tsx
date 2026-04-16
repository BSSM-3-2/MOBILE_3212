import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@components/themed-text';
import { StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/auth-store';
import { usePushRegistration } from '@/hooks/use-push-registration';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
    anchor: '(tabs)',
};

const AUTH_ROUTES = new Set(['login', 'signup']);

function AuthGuard() {
    const { accessToken } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    usePushRegistration();

    useEffect(() => {
        const receivedSub = Notifications.addNotificationReceivedListener(
            notification => {
                console.log('[Foreground 수신]', notification.request.content);
            },
        );

        const responseSub =
            Notifications.addNotificationResponseReceivedListener(response => {
                const data = response.notification.request.content.data;
                console.log('[알림 탭]', data);
            });

        Notifications.getLastNotificationResponseAsync().then(response => {
            if (response) {
                const data = response.notification.request.content.data;
                console.log('[Killed 상태 복귀]', data);
            }
        });

        return () => {
            receivedSub.remove();
            responseSub.remove();
        };
    }, []);

    useEffect(() => {
        const currentRoute = segments[0] as string | undefined;
        const inAuthRoute = AUTH_ROUTES.has(currentRoute ?? '');

        if (!accessToken && !inAuthRoute) {
            router.replace('/login' as never);
        } else if (accessToken && inAuthRoute) {
            router.replace('/(tabs)');
        }
    }, [accessToken, segments]);

    return null;
}

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [loaded] = useFonts({
        'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
        'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.otf'),
        'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
        'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
        'Pretendard-ExtraBold': require('../assets/fonts/Pretendard-ExtraBold.otf'),
    });

    useEffect(() => {
        if (loaded) SplashScreen.hideAsync();
    }, [loaded]);

    if (!loaded) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider
                value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
            >
                <AuthGuard />
                <Stack>
                    <Stack.Screen
                        name='(tabs)'
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name='create'
                        options={{
                            headerShown: false,
                            animation: 'slide_from_right',
                        }}
                    />
                    <Stack.Screen
                        name='signup'
                        options={{
                            headerShown: true,
                            headerTitle: () => (
                                <ThemedText style={styles.default}>
                                    회원가입
                                </ThemedText>
                            ),
                            headerBackTitle: '뒤로',
                        }}
                    />
                    <Stack.Screen
                        name='login'
                        options={{
                            headerShown: true,
                            headerTitle: () => (
                                <ThemedText style={styles.default}>
                                    로그인
                                </ThemedText>
                            ),
                            headerBackTitle: '뒤로',
                        }}
                    />
                    <Stack.Screen
                        name='profile/[id]'
                        options={{
                            headerShown: true,
                            headerTitle: () => (
                                <ThemedText style={styles.default}>
                                    사용자 프로필
                                </ThemedText>
                            ),
                            headerBackTitle: '홈으로',
                        }}
                    />
                </Stack>
                <StatusBar style='auto' />
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    default: {
        fontSize: 19,
        fontFamily: 'Pretendard-Bold',
    },
});
