import { Image, ImageLoadEventData } from 'expo-image';
import { Dimensions, ImageSourcePropType, StyleSheet } from 'react-native';
import { useState } from 'react';
import {
    Gesture,
    GestureDetector,
    type GestureType,
} from 'react-native-gesture-handler';
import Animated, {
    clamp,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { FeedColors } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_SCALE = 3;

export default function FeedImage({
    image,
    onDoubleTap,
    simultaneousGesture,
}: {
    image: ImageSourcePropType;
    onDoubleTap?: () => void;
    simultaneousGesture?: GestureType;
}) {
    const [imageHeight, setImageHeight] = useState(SCREEN_WIDTH);

    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    const focalX = useSharedValue(SCREEN_WIDTH / 2);
    const focalY = useSharedValue(imageHeight / 2);
    const isPinching = useSharedValue(false);
    const heartOpacity = useSharedValue(0);
    const heartScale = useSharedValue(0.7);

    const pinchGesture = Gesture.Pinch();
    if (simultaneousGesture) {
        pinchGesture.simultaneousWithExternalGesture(simultaneousGesture);
    }
    pinchGesture
        .onStart(event => {
            isPinching.value = true;
            focalX.value = event.focalX;
            focalY.value = event.focalY;
        })
        .onUpdate(event => {
            const nextScale = savedScale.value * event.scale;
            scale.value = Math.min(Math.max(nextScale, 1), MAX_SCALE);
            const maxTranslateX =
                (SCREEN_WIDTH * scale.value - SCREEN_WIDTH) / 2;
            const maxTranslateY = (imageHeight * scale.value - imageHeight) / 2;
            translateX.value = clamp(
                translateX.value,
                -maxTranslateX,
                maxTranslateX,
            );
            translateY.value = clamp(
                translateY.value,
                -maxTranslateY,
                maxTranslateY,
            );
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            if (scale.value <= 1) {
                translateX.value = withTiming(0, { duration: 160 });
                translateY.value = withTiming(0, { duration: 160 });
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
                return;
            }

            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        })
        .onFinalize(() => {
            isPinching.value = false;
        });

    const panGesture = Gesture.Pan().maxPointers(1);
    if (simultaneousGesture) {
        panGesture.simultaneousWithExternalGesture(simultaneousGesture);
    }
    panGesture
        .onStart(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        })
        .onUpdate(event => {
            if (savedScale.value <= 1 || isPinching.value) {
                return;
            }

            const maxTranslateX =
                (SCREEN_WIDTH * scale.value - SCREEN_WIDTH) / 2;
            const maxTranslateY = (imageHeight * scale.value - imageHeight) / 2;

            translateX.value = clamp(
                savedTranslateX.value + event.translationX,
                -maxTranslateX,
                maxTranslateX,
            );
            translateY.value = clamp(
                savedTranslateY.value + event.translationY,
                -maxTranslateY,
                maxTranslateY,
            );
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    const doubleTapGesture = Gesture.Tap().numberOfTaps(2).maxDuration(250);
    if (simultaneousGesture) {
        doubleTapGesture.simultaneousWithExternalGesture(simultaneousGesture);
    }
    doubleTapGesture.onStart(() => {
        heartOpacity.value = withSequence(
            withTiming(1, { duration: 120 }),
            withTiming(0, { duration: 220 }),
        );
        heartScale.value = withSequence(
            withTiming(1.15, { duration: 120 }),
            withTiming(1, { duration: 100 }),
        );

        if (onDoubleTap) {
            runOnJS(onDoubleTap)();
        }
    });

    const composedGesture = Gesture.Simultaneous(
        pinchGesture,
        panGesture,
        doubleTapGesture,
    );

    const imageAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { translateX: focalX.value - SCREEN_WIDTH / 2 },
            { translateY: focalY.value - imageHeight / 2 },
            { scale: scale.value },
            { translateX: -(focalX.value - SCREEN_WIDTH / 2) },
            { translateY: -(focalY.value - imageHeight / 2) },
        ],
    }));

    const heartAnimatedStyle = useAnimatedStyle(() => ({
        opacity: heartOpacity.value,
        transform: [{ scale: heartScale.value }],
    }));

    const handleImageLoad = (e: ImageLoadEventData) => {
        const { width, height } = e.source;
        const ratio = height / width;
        setImageHeight(SCREEN_WIDTH * ratio);
    };

    return (
        <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.imageFrame, { height: imageHeight }]}>
                <Animated.View
                    style={[styles.imageContainer, imageAnimatedStyle]}
                >
                    <Image
                        source={image}
                        style={{ width: SCREEN_WIDTH, height: imageHeight }}
                        onLoad={handleImageLoad}
                    />
                </Animated.View>
                <Animated.View
                    pointerEvents='none'
                    style={[styles.heartOverlay, heartAnimatedStyle]}
                >
                    <Ionicons
                        name='heart'
                        size={96}
                        color={FeedColors.likeActive}
                    />
                </Animated.View>
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    imageFrame: {
        width: SCREEN_WIDTH,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    heartOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
