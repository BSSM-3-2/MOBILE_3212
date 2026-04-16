import { useEffect } from 'react';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useAuthStore } from '@/store/auth-store';
import { registerPushDevice } from '@/api/push';

/**
 * 로그인된 상태에서 Expo push token을 얻어 서버에 등록합니다.
 * accessToken이 생기는 순간(로그인/회원가입 직후) 자동으로 실행됩니다.
 */
export function usePushRegistration() {
    const accessToken = useAuthStore(s => s.accessToken);

    useEffect(() => {
        if (!accessToken) return;
        registerDevice();
    }, [accessToken]);
}

async function registerDevice() {
    // 실기기가 아니면 Expo push token을 발급받을 수 없음
    if (!Device.isDevice) return;

    let Notifications;
    try {
        Notifications = require('expo-notifications');
    } catch (e) {
        console.warn('푸시 알림 모듈을 사용할 수 없습니다. (Expo Go 안드로이드 제한 등)');
        return;
    }

    // TODO 실습 8-1
    // setNotificationChannelAsync로 Android 알림 채널을 생성하세요
    // name, importance 등을 지정하고, importance 값을 바꿔가며 heads-up 동작을 비교해보세요
    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: '기본 알림',
            importance: Notifications.AndroidImportance.MAX, // Heads-up 알림을 띄우려면 MAX 설정 권장
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    // TODO 실습 4-1
    // getPermissionsAsync로 현재 권한 상태를 확인하고
    // 미허용 시 requestPermissionsAsync로 사용자에게 요청하세요
    // 최종적으로 granted가 아니면 return 처리하세요
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
        const { status: requestStatus } = await Notifications.requestPermissionsAsync();
        status = requestStatus;
    }
    
    if (status !== 'granted') {
        console.log('[Push] 푸시 알림 권한이 거부되었습니다.');
        return;
    }

    // TODO 실습 4-2
    // getExpoPushTokenAsync로 Expo Push Token을 발급받고
    // registerPushDevice(token)으로 서버에 전송하세요
    try {
        const projectId = require('expo-constants').default?.expoConfig?.extra?.eas?.projectId 
                          || require('expo-constants').default?.easConfig?.projectId;

        const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = pushTokenData.data;
        console.log('✨ [Expo Push Token] 성공적으로 발급되었습니다!:', token);

        // registerPushDevice(token)으로 서버에 기기 정보 전송
        await registerPushDevice(token);
        console.log('✅ 통신 완료: 서버에 기기의 Push Token 정보를 등록했습니다.');
    } catch (error) {
        console.error('[Push Token Error] 토큰 발급/등록 중 오류가 발생했습니다:', error);
    }
}
