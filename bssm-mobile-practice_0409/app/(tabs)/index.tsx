import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import NavigationTop from '@components/navigation/NavigationTop';
import ContentContainer from '@components/container';
import { FeedList } from '@components/feed/FeedList';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@components/themed-view';
import { useFeedStore } from '@/store/feed-store';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';

const HEADER_HIDE_DISTANCE = 72;

export default function HomeScreen() {
    const { posts, loading, fetchFeed, loadMore } = useFeedStore();

    const scrollY = useSharedValue(0);

    const headerAnimatedStyle = useAnimatedStyle(() => {
        const translateY = interpolate(
            scrollY.value,
            [0, HEADER_HIDE_DISTANCE],
            [0, -HEADER_HIDE_DISTANCE],
            Extrapolation.CLAMP,
        );
        const opacity = interpolate(
            scrollY.value,
            [0, HEADER_HIDE_DISTANCE],
            [1, 0],
            Extrapolation.CLAMP,
        );
        const marginBottom = interpolate(
            scrollY.value,
            [0, HEADER_HIDE_DISTANCE],
            [0, -HEADER_HIDE_DISTANCE],
            Extrapolation.CLAMP,
        );

        return {
            transform: [{ translateY }],
            opacity,
            marginBottom,
            zIndex: 1,
        };
    });

    useEffect(() => {
        fetchFeed();
    }, []);

    return (
        <ThemedView style={{ flex: 1, overflow: 'hidden' }}>
            <Animated.View style={headerAnimatedStyle}>
                <ContentContainer isTopElement={true}>
                    <NavigationTop
                        title='MyFeed'
                        icon={'layers'}
                        rightButtons={
                            <View style={styles.headerActions}>
                                <Ionicons
                                    name='add-outline'
                                    size={24}
                                    color='#262626'
                                />
                            </View>
                        }
                    />
                </ContentContainer>
            </Animated.View>

            {loading && posts.length === 0 ? (
                <ActivityIndicator style={{ flex: 1 }} />
            ) : (
                <FeedList
                    posts={posts}
                    onEndReached={loadMore}
                    scrollY={scrollY}
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    headerActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 15,
    },
});
