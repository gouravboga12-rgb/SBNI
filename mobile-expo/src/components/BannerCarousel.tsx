import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

export interface BannerSlide {
  id: string;
  image: any;
  title: string;
  badge?: string;
}

interface BannerCarouselProps {
  slides: BannerSlide[];
  autoScrollIntervalMs?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export const BannerCarousel: React.FC<BannerCarouselProps> = ({
  slides,
  autoScrollIntervalMs = 4000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const bannerWidth = Math.min(screenWidth - 32, 600);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % slides.length;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, autoScrollIntervalMs);
    return () => clearInterval(timer);
  }, [currentIndex, slides.length, autoScrollIntervalMs]);

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % slides.length;
    setCurrentIndex(nextIndex);
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  };

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
    setCurrentIndex(prevIndex);
    flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
  };

  if (!slides || slides.length === 0) return null;

  return (
    <View style={[styles.container, { width: bannerWidth }]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: bannerWidth,
          offset: bannerWidth * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / bannerWidth);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slideWrapper, { width: bannerWidth }]}>
            <Image source={item.image} style={styles.bannerImage} resizeMode="cover" />
            <View style={styles.gradientOverlay} />
            <View style={styles.textOverlay}>
              <View style={styles.badgeRow}>
                <View style={styles.pulseDot} />
                <Text style={styles.badgeText} numberOfLines={1}>
                  {item.badge || 'Verified Capital Hub'}
                </Text>
              </View>
              <Text style={styles.slideTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Prev / Next Arrows */}
      <TouchableOpacity style={styles.arrowLeft} onPress={handlePrev} activeOpacity={0.7}>
        <ChevronLeft size={18} color="#ffffff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.arrowRight} onPress={handleNext} activeOpacity={0.7}>
        <ChevronRight size={18} color="#ffffff" />
      </TouchableOpacity>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {slides.map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, idx === currentIndex ? styles.dotActive : null]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 16,
    backgroundColor: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  slideWrapper: {
    height: 180,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 48,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  slideTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  arrowLeft: {
    position: 'absolute',
    left: 8,
    top: '40%',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowRight: {
    position: 'absolute',
    right: 8,
    top: '40%',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagination: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    width: 14,
    backgroundColor: '#38bdf8',
  },
});
