import { Image } from 'expo-image';
import {Dimensions, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {AvatarSizes, Colors, FeedColors, FontSizes, Spacing} from '@/constants/theme';
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PlaygroundScreen() {
    const inset = useSafeAreaInsets();

  return (
    <View style={[styles.contentContainer, {paddingTop: inset.top + 20}]}>
        <View style={styles.contentPadding}>
            <Text style={[styles.title, {
                borderColor: Colors.light.text
            }]}>Playground 1</Text>
        </View>
        <View style={styles.playgroundGap}>
            <View style={[styles.contentPadding, styles.flexDirection]}>
                <Image source={"https://i.pravatar.cc/150?img=5"} contentFit="contain" style={styles.avatar}/>
                <Text style={styles.username}>solar_moments</Text>
            </View>
            <Image
                source={{ uri: "https://picsum.photos/seed/sun/800/800" }}
                style={styles.postImage}
            />
            <View style={[styles.contentPadding]}>
                <View style={styles.flexDirection}>
                <View style={styles.flexDirection}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.row]}
                >
                    <Ionicons
                        name={"heart-outline"}
                        size={26}
                        color={FeedColors.primaryText}
                    />
                    <Text style={styles.countText}>
                        {parseInt("999").toLocaleString()}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.row]}
                >
                    <Ionicons
                        name={"chatbubble-outline"}
                        size={26}
                        color={FeedColors.primaryText}
                    />
                    <Text style={styles.countText}>
                        {parseInt("0").toLocaleString()}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                >
                    <Ionicons
                        name={"paper-plane-outline"}
                        size={26}
                        color={FeedColors.primaryText}
                    />
                </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={[styles.actionButton, styles.bookmark]}
                >
                    <Ionicons
                        name={"bookmark-outline"}
                        size={26}
                        color={FeedColors.primaryText}
                    />
                </TouchableOpacity>
                </View>
                <Text style={styles.caption} numberOfLines={2}>
                    <Text style={styles.bold}>solar_moments</Text>
                    {'  '}
                    오늘 하루도 빛나게 <Text>☀️#감성 #일상 # 풍경 </Text>
                </Text>
                <Text style={styles.timestamp}>3시간 전</Text>
            </View>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
    contentPadding: {
        paddingHorizontal: 16
    },
    contentContainer: {
        flex: 1,
        backgroundColor: "#fff",
    },
    playgroundGap: {
        marginTop: Spacing.xxl,
        gap: Spacing.xxl
    },
    title: {
        fontSize: 24,
        paddingBottom: 20,
        fontWeight: 'bold',
        borderBottomWidth: 1,
    },
    avatar: {
        width: AvatarSizes.md,
        height: AvatarSizes.md,
        borderRadius: AvatarSizes.md / 2,
    },
    username: {
        marginTop : 5,
        fontWeight: '600',
        fontSize: FontSizes.md,
    },
    postImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 0.7,
    },
    actionButton: {
        padding: 2,
    },
    row: {
        flexDirection: 'row',
        gap: Spacing.xs,
        alignItems: 'center',
    },
    countText: {
        fontWeight: '600',
    },
    bold: {
        fontWeight: '600',
    },
    caption: {
        fontSize: 14,
        color: FeedColors.primaryText,
        lineHeight: 19,
        marginBottom: Spacing.xs,
    },
    timestamp: {
        fontSize: FontSizes.xs,
        color: '#8E8E8E',
    },
    flexDirection : {
        flexDirection : "row",
        gap : 10
    },
    bookmark : {
        marginLeft: 'auto',
    }
});