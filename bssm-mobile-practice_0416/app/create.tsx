import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    ActivityIndicator,
    Alert,
    Platform,
    Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createPost } from '@/api/content';
import { useFeedStore } from '@/store/feed-store';
import { Pretendard, FontSizes, Spacing, FeedColors } from '@/constants/theme';

interface SelectedImage {
    uri: string;
    name: string;
    type: string;
}

// 업로드 성공 후 로컬 알림 예약
async function scheduleUploadNotification(caption: string) {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('upload', {
            name: '게시물 업로드',
            importance: Notifications.AndroidImportance.HIGH,
        });
    }

    await Notifications.scheduleNotificationAsync({
        content: {
            title: '게시물 업로드 완료',
            body: caption || '새 게시물이 업로드되었습니다.',
            data: { type: 'upload_success' },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 3,
        },
    });
}

export default function CreateScreen() {
    const insets = useSafeAreaInsets();
    const { prependPost } = useFeedStore();
    const router = useRouter();

    const [images, setImages] = useState<SelectedImage[]>([]);
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);

    const canSubmit =
        (images.length > 0 || caption.trim().length > 0) && !loading;

    // ── 이미지 선택 ──────────────────────────────────────────────
    const handlePickImage = async () => {
        // TODO 실습 1-1
        // getMediaLibraryPermissionsAsync로 현재 권한 상태(status, canAskAgain)를 확인하세요
        const { status, canAskAgain } =
            await ImagePicker.getMediaLibraryPermissionsAsync();

        // TODO 실습 2-1
        // canAskAgain이 false면 Linking.openSettings()로 설정 앱을 유도하고 return 하세요
        if (status !== 'granted' && !canAskAgain) {
            Linking.openSettings();
            return;
        }

        // TODO 실습 3-1 (iOS)
        // Platform.OS === 'ios'이고 아직 미결정 상태라면
        // 커스텀 Alert로 사용 목적을 먼저 안내한 뒤 시스템 팝업을 띄우세요
        if (Platform.OS === 'ios' && status === 'undetermined') {
            const shouldRequest = await new Promise<boolean>(resolve => {
                Alert.alert(
                    '사진 접근 권한 안내',
                    '게시물에 사진을 업로드하려면 갤러리 접근 권한이 필요합니다.\n권한 요청을 진행하시겠습니까?',
                    [
                        {
                            text: '괜찮아요',
                            style: 'cancel',
                            onPress: () => resolve(false),
                        },
                        { text: '확인', onPress: () => resolve(true) },
                    ],
                );
            });

            if (!shouldRequest) return; // '괜찮아요' 선택 시 바로 종료 (시스템 팝업 요청 진행 안 함)
        }

        // TODO 실습 1-2
        // 미허용 상태라면 requestMediaLibraryPermissionsAsync로 권한을 요청하세요
        // 거부 시 Alert 안내 후 return 하세요
        if (status !== 'granted') {
            const { status: requestStatus } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (requestStatus !== 'granted') {
                Alert.alert(
                    '알림',
                    '갤러리 접근 권한이 있어야 사진을 업로드할 수 있습니다.',
                );
                return;
            }
        }

        // TODO 실습 1-3
        // launchImageLibraryAsync로 이미지 피커를 실행하고
        // 선택된 asset에서 uri, fileName, mimeType을 추출해 setImages에 저장하세요
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], // Deprecation warning 수정
            allowsMultipleSelection: true,
            selectionLimit: 10 - images.length, // 최대 10장 제한에 맞춤
            quality: 0.8,
        });

        if (!result.canceled && result.assets) {
            const newImages = result.assets.map(asset => {
                // Expo 안드로이드에서 HEIC 원본을 선택하면 실제 파일(uri)은 .jpeg로 자동 변환되지만,
                // fileName과 mimeType은 원본(heic)으로 잘못 남는 고질적인 이슈가 있습니다.
                // 따라서 파일의 [진짜 확장자]는 캐시된 경로(uri)의 맨 끝을 믿어야 합니다!
                let realExt =
                    asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
                if (realExt === 'jpeg') realExt = 'jpg';

                // 실제 확장자를 바탕으로 올바른 MIME 타입을 재구성합니다.
                let finalMime = `image/${realExt === 'jpg' ? 'jpeg' : realExt}`;

                // 파일명 추출 후 명시적 확장자 강제 주입
                let filename = asset.fileName || `image_${Date.now()}`;
                const dotIndex = filename.lastIndexOf('.');
                if (dotIndex !== -1) {
                    filename = filename.substring(0, dotIndex);
                }
                filename = `${filename}.${realExt}`;

                console.log('[이미지 픽 데이터 보정 후]', {
                    uri: asset.uri,
                    name: filename,
                    type: finalMime,
                });

                return {
                    uri: asset.uri,
                    name: filename,
                    type: finalMime,
                };
            });

            // 기존 이미지와 합치고 최대 10장까지만 유지
            setImages(prev => [...prev, ...newImages].slice(0, 10));
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    // ── 업로드 ────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        try {
            const post = await createPost({
                caption: caption.trim() || undefined,
                images: images.length > 0 ? images : undefined,
            });

            // 피드 맨 앞에 낙관적으로 추가
            prependPost(post);

            // 로컬 알림 예약
            await scheduleUploadNotification(caption.trim());

            // 초기화
            setImages([]);
            setCaption('');
        } catch (error) {
            console.error('[업로드 실패 예외]', error);
            Alert.alert(
                '업로드 실패',
                '게시물을 올리는 데 실패했습니다. 다시 시도해 주세요.',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
                    <Ionicons name='chevron-back' size={26} color='#262626' />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>새 게시물</Text>
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={!canSubmit}
                    hitSlop={8}
                >
                    {loading ? (
                        <ActivityIndicator size='small' color='#0095F6' />
                    ) : (
                        <Text
                            style={[
                                styles.shareButton,
                                !canSubmit && styles.shareButtonDisabled,
                            ]}
                        >
                            공유
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps='handled'
                showsVerticalScrollIndicator={false}
            >
                {/* 이미지 선택 영역 */}
                <View style={styles.imageSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.imageRow}
                    >
                        {/* 추가 버튼 */}
                        {images.length < 10 && (
                            <TouchableOpacity
                                style={styles.addImageButton}
                                onPress={handlePickImage}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name='image-outline'
                                    size={32}
                                    color='#8e8e8e'
                                />
                                <Text style={styles.addImageLabel}>
                                    {images.length === 0
                                        ? '사진 선택'
                                        : `+추가 (${images.length}/10)`}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* 선택된 이미지 썸네일 */}
                        {images.map((img, index) => (
                            <View key={img.uri} style={styles.thumbWrapper}>
                                <Image
                                    source={{ uri: img.uri }}
                                    style={styles.thumb}
                                />
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => handleRemoveImage(index)}
                                    hitSlop={4}
                                >
                                    <Ionicons
                                        name='close-circle'
                                        size={20}
                                        color='#fff'
                                    />
                                </TouchableOpacity>
                                {index === 0 && (
                                    <View style={styles.coverBadge}>
                                        <Text style={styles.coverBadgeText}>
                                            대표
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* 캡션 입력 */}
                <View style={styles.captionSection}>
                    <TextInput
                        style={styles.captionInput}
                        placeholder='문구를 입력하세요...'
                        placeholderTextColor='#999'
                        value={caption}
                        onChangeText={setCaption}
                        multiline
                        maxLength={2200}
                        textAlignVertical='top'
                    />
                    <Text style={styles.captionCount}>
                        {caption.length} / 2200
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const THUMB_SIZE = 100;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#DBDBDB',
    },
    headerTitle: {
        fontFamily: Pretendard.semiBold,
        fontSize: FontSizes.md,
        color: FeedColors.primaryText,
    },
    shareButton: {
        fontFamily: Pretendard.semiBold,
        fontSize: FontSizes.sm,
        color: '#0095F6',
    },
    shareButtonDisabled: {
        color: '#B2DFFC',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    imageSection: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#DBDBDB',
        paddingVertical: Spacing.xl,
    },
    imageRow: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
        alignItems: 'flex-start',
    },
    addImageButton: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#DBDBDB',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: '#FAFAFA',
    },
    addImageLabel: {
        fontFamily: Pretendard.medium,
        fontSize: 11,
        color: '#8e8e8e',
        textAlign: 'center',
    },
    thumbWrapper: {
        position: 'relative',
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: 8,
        overflow: 'hidden',
    },
    thumb: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: 8,
    },
    removeButton: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    coverBadge: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 4,
    },
    coverBadgeText: {
        fontFamily: Pretendard.semiBold,
        fontSize: 10,
        color: '#fff',
    },
    captionSection: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#DBDBDB',
    },
    captionInput: {
        fontFamily: Pretendard.regular,
        fontSize: FontSizes.sm,
        color: FeedColors.primaryText,
        minHeight: 100,
        lineHeight: 22,
        ...Platform.select({ android: { paddingTop: 0 } }),
    },
    captionCount: {
        fontFamily: Pretendard.regular,
        fontSize: 12,
        color: '#c7c7c7',
        textAlign: 'right',
        marginTop: 4,
    },
    hint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
    },
    hintText: {
        fontFamily: Pretendard.regular,
        fontSize: FontSizes.xs,
        color: '#8e8e8e',
    },
});
