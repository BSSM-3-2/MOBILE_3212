import { Post } from '@type/Post';
import ContentContainer from '@components/container';
import { FeedPostHeader } from './FeedPostHeader';
import { FeedPostActions } from './FeedPostActions';
import { FeedPostCaption } from './FeedPostCaption';
import { ThemedView } from '@components/themed-view';
import FeedImage from '@components/feed/post/FeedImage';
import { resolveImageSource } from '@/utils/image';
import { useFeedStore } from '@/store/feed-store';
import type { GestureType } from 'react-native-gesture-handler';

function FeedPost({
    post,
    simultaneousGesture,
}: {
    post: Post;
    simultaneousGesture?: GestureType;
}) {
    const user = post.author;
    const { posts, toggleLike } = useFeedStore();

    if (!user) return null;

    const currentPost = posts.find(item => item.id === post.id);
    const liked = currentPost?.liked ?? post.liked ?? false;

    const handleDoubleTap = () => {
        if (!liked) {
            toggleLike(post.id);
        }
    };

    return (
        <ThemedView>
            <FeedPostHeader user={user} />
            <FeedImage
                image={resolveImageSource(post.images[0])}
                onDoubleTap={handleDoubleTap}
                simultaneousGesture={simultaneousGesture}
            />
            <ContentContainer style={{ gap: 4 }}>
                <FeedPostActions
                    postId={post.id}
                    initialLikes={post.likes}
                    initialLiked={post.liked}
                    commentCount={post.commentCount ?? post.comments.length}
                />
                <FeedPostCaption
                    username={user.username}
                    caption={post.caption}
                    timestamp={post.timestamp}
                />
            </ContentContainer>
        </ThemedView>
    );
}

export { FeedPost };
