import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, TouchableOpacity, Share } from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, orderBy, query, onSnapshot } from 'firebase/firestore';
import { Audio, Video } from 'expo-av';
import { useIsFocused } from '@react-navigation/core';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';



export default function Watch() {
  const isFocused = useIsFocused();
  const flatListRef = useRef(null);

  const [videos, setVideos] = useState([]);
  const [videoRefs, setVideoRefs] = useState([]);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(0);
  const [loadedVideos, setLoadedVideos] = useState([]);

  const [isModalVisible, setIsModalVisible] = useState(false);


  useEffect(() => {
    // If the screen is out of focus: user leaves the watch page
    if (!isFocused && currentPlayingIndex !== null && videoRefs[currentPlayingIndex]?.current) {
      // Pause the currently playing video
      videoRefs[currentPlayingIndex].current.pauseAsync();
    }
      // If the screen comes back into focus
      else if (isFocused && currentPlayingIndex !== null && videoRefs[currentPlayingIndex]?.current && loadedVideos.includes(currentPlayingIndex)) {
        // Reset the currently playing video's position to the start
        videoRefs[currentPlayingIndex].current.setPositionAsync(0)
        .then(() => {
          // Play the current video again from the beginning
          return videoRefs[currentPlayingIndex].current.playAsync();
        })
        .catch(e => {
          console.error("Error when trying to play video: ", e);
        });
    }
  }, [isFocused, currentPlayingIndex, loadedVideos, videoRefs]);
  
  // Ensure the audio will play even when iOS devices is in silent mode
  useEffect(() => {
    async function setAudioMode() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
        });
      } catch (error) {
        console.error("Error setting audio mode", error);
      }
    }
    setAudioMode();
  }, []);

  // Fetch video collection from firestore, update local state
  useEffect(() => {
    const videosCollectionRef = collection(db, 'videos');
    // Latest video will be on the top
    const q = query(videosCollectionRef, orderBy('timestamp', 'desc'));

    // Use onSnapshot to listen for real-time changes in the collection
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        // Map the query result into a new array where each item contains the video data and its ID
        const videosData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        // Update the state with the array of videos
        setVideos(videosData);
        // Create a reference for each video and update the state with the array of references
        setVideoRefs(videosData.map(() => React.createRef()));
    });

    // Clean up the listener
    return () => unsubscribe();
  }, []);

  function handlePlaybackStatusUpdate(playbackStatus, index) {
    if (playbackStatus.didJustFinish) {
        videoRefs[index].current.replayAsync();
    }
    if (playbackStatus.isPlaying) {
      setIsModalVisible(false);  // Hide play button when playing
    } else if (playbackStatus.isPaused) {
      setIsModalVisible(true);  // Shwo play button when click to stop
    }
  }

  const viewConfigRef = useRef({
    waitForInteraction: true,
    // When users scroll the view which covers 75% or more of a certain area
    viewAreaCoveragePercentThreshold: 75,
  });

  // Ensure only the most visible video plays when scrolling or changing
  // Other videos are paused and reset to their starting position.
  const onViewableItemsChangedRef = useRef(({ viewableItems, changed }) => {
    // If there are viewable items
    if (viewableItems.length > 0) {
      // Sort videos by their visible percentage
      const sortedItems = viewableItems.sort((a, b) => b.percentVisible - a.percentVisible);
      // Get the index of the most visible video
      const newIndex = sortedItems[0].index;

      // If there's a currently playing video, pause it and reset its playback position
      if (currentPlayingIndex !== null && videoRefs[currentPlayingIndex]?.current) {
        videoRefs[currentPlayingIndex].current.pauseAsync();
        videoRefs[currentPlayingIndex].current.setPositionAsync(0);
      }
      
      // Set the current playing video index to the most visible video
      setCurrentPlayingIndex(newIndex);
      
      // If the newly selected video is loaded, reset its playback position and play
      if (videoRefs[newIndex]?.current && loadedVideos.includes(newIndex)) {
        videoRefs[newIndex].current.setPositionAsync(0)
          .then(() => {
            if(videoRefs[newIndex]?.current) {
              return videoRefs[newIndex].current.playAsync();
            }
          })
          .catch(e => {
            console.error("Error when trying to play video: ", e);
          });
      }
    } else {
      // If there are no viewable items and there's a currently playing video, pause it
      if (currentPlayingIndex !== null && videoRefs[currentPlayingIndex]?.current) {
        videoRefs[currentPlayingIndex].current.pauseAsync();
        setCurrentPlayingIndex(null);
      }
    }
    
    // Iterate over all changed items
    changed.forEach(({ item, index, isViewable }) => {
      // If a video is no longer viewable, reset its playback position
      if (!isViewable && videoRefs[index]?.current) {
        videoRefs[index].current.setPositionAsync(0);
      }
    });
  });

  // Share function
  const handleShare = () => {
    Share.share({
      message: 'I think you\'d love Diall. Here is an invite to get the app: https://apps.apple.com/app/apple-store/id6446042096',
      title: 'Diall App',
    });
  };
  

  const renderItem = ({ item, index }) => {
    const isPlaying = index === currentPlayingIndex;

    return(
      <View style={styles.videoContainer}>
        <Text style={styles.videoTitle}>{item.title}</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Feather name="send" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={{flex: 1}} 
          activeOpacity={1} 
          onPress={() => {// Control playing or not by clicking on the screen
            if (videoRefs[currentPlayingIndex]?.current) {
              if(isModalVisible) {  // when play button visible, click to replay
                videoRefs[currentPlayingIndex].current.playAsync();
                setIsModalVisible(false);
              } else {  // when play button is hidden, click screen to stop
                videoRefs[currentPlayingIndex].current.pauseAsync();
                setIsModalVisible(true);
              }
            }
          }}
        >
          <Video 
            ref={videoRefs[index]}
            useNativeControls={false}
            onPlaybackStatusUpdate={(status) => handlePlaybackStatusUpdate(status, index)}
            onLoad={() => {
              setLoadedVideos(prevLoaded => [...prevLoaded, index]);
              if (isFocused && index === 0) {
                videoRefs[index].current.playAsync().then(() => {
                  setIsModalVisible(false);
                });
              }
            }}
            source={{ uri: item.videoURL }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode="cover"
            shouldPlay={isPlaying}
            style={styles.video}
            onError={(e) => console.log(e)}
            repeat={true}
            status={isPlaying ? { shouldPlay: true, positionMillis: 0 } : { shouldPlay: false }}
          />
        </TouchableOpacity>
        
        {isModalVisible && isPlaying && ( // Play button modal
          <View style={styles.playButtonModal}>
            <TouchableOpacity 
              onPress={() => {
                videoRefs[currentPlayingIndex]?.current.playAsync();
                setIsModalVisible(false);
              }}
            >
              <Ionicons name="play" size={60} color="white" style={{ opacity: 0.5 }}/>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
        {videos.length === 0 ? ( // When there is no videos
          <View></View>
        ) : (
          <FlatList
            data={videos}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            pagingEnabled={true}
            initialNumToRender={2}  
            maxToRenderPerBatch={1}  
            onViewableItemsChanged={onViewableItemsChangedRef.current}
            viewabilityConfig={viewConfigRef.current}
            ref={flatListRef}
          />
        )}
      </View>
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  videoContainer: {
    width: '100%',
    height: Dimensions.get('window').height - 80,
    borderBottomWidth: 1,
    borderColor: '#e5e5e5'
  },
  videoTitle: {
    position: 'absolute',    
    top: 700,                 
    left: 10,                
    zIndex: 1,               
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',          
    textShadowColor: 'rgba(0, 0, 0, 0.7)', 
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3
  },
  video: {
    width: '100%',
    height: Dimensions.get('window').height - 80,
    zIndex: 0
  },

  // Play button
  playButtonModal: {
    position: 'absolute',   
    top: 0,                 
    left: 0,                
    right: 0,               
    bottom: 0,              
    justifyContent: 'center', 
    alignItems: 'center'    
  },

  // Share button
  shareButton: {
    position: 'absolute',  
    bottom: 50,               
    right: 10,             
    zIndex: 2           
  }
});