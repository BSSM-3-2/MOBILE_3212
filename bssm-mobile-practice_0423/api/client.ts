import axios, {
    AxiosError,
    AxiosHeaders,
    InternalAxiosRequestConfig,
} from 'axios';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.apiUrl as string | undefined;
if (!BASE_URL) {
    throw new Error(
        'API URL is missing. Set EXPO_PUBLIC_API_URL in your .env file.',
    );
}

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
};

type PendingRequest = {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
};

let isRefreshing = false;
let pendingQueue: PendingRequest[] = [];

const isAuthRoute = (url?: string): boolean => {
    if (!url) return false;
    return (
        url.includes('/auth/login') ||
        url.includes('/auth/signup') ||
        url.includes('/auth/refresh') ||
        url.includes('/auth/logout')
    );
};

const processQueue = (error: unknown, token?: string) => {
    pendingQueue.forEach(pending => {
        if (error) {
            pending.reject(error);
            return;
        }
        pending.resolve(token ?? '');
    });
    pendingQueue = [];
};

const setAuthHeader = (
    request: RetryableRequestConfig,
    accessToken: string,
) => {
    const headers = AxiosHeaders.from(request.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    request.headers = headers;
};

// Request Interceptor
// 모든 요청 전에 실행 — 토큰 주입
apiClient.interceptors.request.use(
    config => {
        // auth-store를 직접 import하면 순환 참조가 생기므로 동적으로 참조
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useAuthStore } = require('@/store/auth-store');
        const token: string | null = useAuthStore.getState().accessToken;
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    error => Promise.reject(error),
);

// Response Interceptor
// 모든 응답 후에 실행 — 에러 코드를 한 곳에서 처리
apiClient.interceptors.response.use(
    response => response,
    async error => {
        if (!axios.isAxiosError(error)) {
            return Promise.reject(error);
        }

        const axiosError = error as AxiosError;
        const status = error.response?.status;

        if (status === 404) {
            console.warn('[API] 리소스를 찾을 수 없습니다:', error.config?.url);
            return Promise.reject(error);
        }

        if (status === 401) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { useAuthStore } = require('@/store/auth-store');
            const store = useAuthStore.getState();
            const originalRequest = axiosError.config as
                | RetryableRequestConfig
                | undefined;

            if (!originalRequest) {
                await store.logOut();
                return Promise.reject(error);
            }

            if (isAuthRoute(originalRequest.url) || originalRequest._retry) {
                await store.logOut();
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    pendingQueue.push({
                        resolve: token => resolve(token),
                        reject,
                    });
                }).then((token: unknown) => {
                    setAuthHeader(originalRequest, String(token));
                    return apiClient(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newAccessToken = await store.refreshAccessToken();
                processQueue(null, newAccessToken);
                setAuthHeader(originalRequest, newAccessToken);
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                await store.logOut();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        console.error('[API] 서버 에러:', status, error.message);
        return Promise.reject(error);
    },
);

export default apiClient;
