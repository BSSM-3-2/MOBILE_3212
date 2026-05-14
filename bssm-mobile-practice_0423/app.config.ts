import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    const owner = process.env.EXPO_PUBLIC_EXPO_OWNER ?? 'jmj732';
    const easProjectId =
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
        (config.extra?.eas as { projectId?: string } | undefined)?.projectId ??
        '296f8a1d-6294-4c54-a12b-f7f097955b60';

    if (!apiUrl) {
        throw new Error(
            'EXPO_PUBLIC_API_URL is required. Set it in your .env file.',
        );
    }

    const updates = easProjectId
        ? {
              url: `https://u.expo.dev/${easProjectId}`,
              enabled: true,
              fallbackToCacheTimeout: 0,
              checkAutomatically: 'ON_LOAD' as const,
          }
        : undefined;

    return {
        ...config,
        name: 'MyFeed',
        slug: 'MyFeed',
        owner,
        version: '1.0.0',
        runtimeVersion: {
            policy: 'appVersion',
        },
        updates,
        orientation: 'portrait',
        icon: './assets/images/icon.png',
        scheme: 'myfeed',
        userInterfaceStyle: 'automatic',
        newArchEnabled: true,
        ios: {
            supportsTablet: true,
        },
        android: {
            adaptiveIcon: {
                backgroundColor: '#E6F4FE',
                foregroundImage: './assets/images/android-icon-foreground.png',
                backgroundImage: './assets/images/android-icon-background.png',
                monochromeImage: './assets/images/android-icon-monochrome.png',
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
        },
        web: {
            output: 'static',
            favicon: './assets/images/favicon.png',
        },
        plugins: [
            'expo-router',
            'expo-secure-store',
            [
                'expo-image-picker',
                {
                    photosPermission:
                        '사진을 게시물에 첨부하기 위해 앨범 접근 권한이 필요합니다.',
                },
            ],
            [
                'expo-notifications',
                {
                    icon: './assets/images/icon.png',
                    color: '#0095F6',
                },
            ],
            [
                'expo-splash-screen',
                {
                    image: './assets/images/splash-icon.png',
                    imageWidth: 200,
                    resizeMode: 'contain',
                    backgroundColor: '#ffffff',
                    dark: {
                        backgroundColor: '#000000',
                    },
                },
            ],
        ],
        experiments: {
            typedRoutes: true,
            reactCompiler: true,
        },
        extra: {
            ...config.extra,
            apiUrl,
            ...(easProjectId
                ? {
                      eas: {
                          ...(config.extra?.eas as object | undefined),
                          projectId: easProjectId,
                      },
                  }
                : {}),
        },
    };
};
