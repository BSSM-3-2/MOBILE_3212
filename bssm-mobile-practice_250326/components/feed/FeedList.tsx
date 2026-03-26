import { FlatList, StyleSheet } from 'react-native';
import { Post } from '@type/Post';
import { FeedPost } from './post/FeedPost';

function FeedList({ posts }: { posts: Post[] }) {
    return (
        <FlatList
            data={posts}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <FeedPost post={item} />}
            showsVerticalScrollIndicator={false}
            style={styles.container}
        />
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
});

export { FeedList };
