import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Post } from '@type/Post';
import ContentContainer from '@components/container';
import { FeedPostHeader } from './FeedPostHeader';
import { FeedPostActions } from './FeedPostActions';
import { FeedPostCaption } from './FeedPostCaption';
import { ThemedView } from '@components/themed-view';
import FeedImage from '@components/feed/post/FeedImage';
import { resolveImageSource } from '@/utils/image';
import { useFeedStore } from '@/store/feed-store';

// TODO 1: console.log('FeedPost render:', post.id) 를 추가해 렌더링 횟수를 추적하세요
//         좋아요 버튼을 누를 때 몇 개의 로그가 찍히는지 확인하세요

// TODO 2: React.memo로 컴포넌트를 감싸세요
//         export const FeedPost = React.memo(function FeedPost(...) { ... });

interface FeedPostProps {
    post: Post;
    onLike?: (id: string) => void;
}

const FeedPost = React.memo(function FeedPost({ post, onLike }: FeedPostProps) {
    console.log('FeedPost render:', post.id);
    const user = post.author;
    const { posts, toggleLike } = useFeedStore();

    // 스토어에서 최신 liked 상태를 가져와 더블탭 중복 좋아요 방지
    const currentPost = posts.find(p => p.id === post.id);
    const liked = currentPost?.liked ?? post.liked;

    // TODO 4: useCallback으로 감싸세요 — dependency: [liked, toggleLike, post.id]
    //         단, useCallback은 if (!user) return null 보다 위에 있어야 합니다
    const handleDoubleTap = useCallback(() => {
        if (!liked) {
            if (onLike) {
                onLike(post.id);
            } else {
                toggleLike(post.id);
            }
        }
    }, [liked, toggleLike, onLike, post.id]);

    if (!user) return null;

    return (
        <ThemedView style={styles.feedMargin}>
            <FeedPostHeader user={user} />
            {post.images[0] && (
                <FeedImage
                    image={resolveImageSource(post.images[0])}
                    onDoubleTap={handleDoubleTap}
                />
            )}
            <ContentContainer style={{ gap: 4 }}>
                <FeedPostActions
                    postId={post.id}
                    initialLikes={post.likes}
                    initialLiked={post.liked}
                    commentCount={post.commentCount ?? post.comments.length}
                    onLike={onLike}
                />
                <FeedPostCaption
                    username={user.username}
                    caption={post.caption}
                    timestamp={post.timestamp}
                />
            </ContentContainer>
        </ThemedView>
    );
});

const styles = StyleSheet.create({
    feedMargin: {
        marginBottom: 20,
    },
});

export { FeedPost };
