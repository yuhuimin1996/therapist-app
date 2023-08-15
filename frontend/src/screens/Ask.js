import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Modal,TouchableWithoutFeedback, Pressable, Animated, TextInput, Button } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { storage, db } from '../../firebaseConfig';

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Camera, CameraType } from 'expo-camera' 
import { useIsFocused } from '@react-navigation/core';

import { AntDesign } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

import RecordingButton from '../components/RecordingButton';




export default function Ask() {
  const [hasCameraPermissions, setHasCameraPermissions] = useState(false);
  const [hasMicPermissions, setHasMicPermissions] = useState(false);

  const isFocused = useIsFocused();

  const [cameraRef, setCameraRef] = useState(null);
  
  const recordingProgress = useRef(new Animated.Value(0)).current;
  const [isRecording, setIsRecording] = useState(false);
  // There are two ways to stop recording: manually click / automaticlly after 15 seconds
  const [isManuallyStopped, setIsManuallyStopped] = useState(false);

  const [videoURI, setVideoURI] = useState(null);
  
  // Title-Input pop-up after recording
  const [videoTitle, setVideoTitle] = useState("");
  const [isTitleModalVisible, setTitleModalVisible] = useState(false);

  // Info pop-up modal on the top right
  const [infoIconColor, setInfoIconColor] = useState('white');
  const [isInfoModalVisible, setInfoModalVisible] = useState(false);

  // Access the permission of camera/microphone on user's mobile device
  useEffect(() => {
    (async () => {
      try {
        //...Camera permission...
        const cameraStatus = await Camera.requestCameraPermissionsAsync();
        setHasCameraPermissions(cameraStatus.status == 'granted');
        //...Microphone permission...
        const micStatus = await Camera.requestMicrophonePermissionsAsync();
        setHasMicPermissions(micStatus.status == 'granted');
      } catch (error) {
        console.error('error when get access:', error);
      }
    })()
  }, []);

  // The progress circle animation around the recording button
  useEffect(() => {
    if (isRecording) {
        Animated.timing(recordingProgress, {
            toValue: 1, // from 0 to 1
            duration: 15000, // 15 seconds
            useNativeDriver: false,
        }).start();
    } else {
        recordingProgress.stopAnimation();
    }
  }, [isRecording]);

  // Record videos
  const recordVideo = async () => {
    if(cameraRef) {
      try{
        const options = {
          maxDuration: 15, 
          quality: Camera.Constants.VideoQuality['16:9'] 
        };
        const videoRecordPromise = cameraRef.recordAsync(options);
        
        setIsRecording(true);
        console.log('begin');

        if(videoRecordPromise) {
          videoRecordPromise
            .then(data => {
              const source = data.uri;
              setVideoURI(source);

              //Automaticlly stop video recording after 15 seconds
              if(!isManuallyStopped) {
                stopVideo();
              }
            })
            .catch(error => {
              console.warn(error);
            });
          }
      } catch(error) {
        console.warn(error);
      }
    }
  }

  // Stop recording
  const stopVideo = async () => {
    if(cameraRef) {
      cameraRef.stopRecording();
      recordingProgress.stopAnimation();
      recordingProgress.setValue(0);  // reset recording progress
      console.log('stop');

      setIsRecording(false);
      setIsManuallyStopped(false);

      setTitleModalVisible(true);
    }
  }

  // Upload video to Firebase Storage
  // Upload video metadata to Firestore database
  const uploadVideo = async () => {
    try {
      // User must enter a title before upload
      if(!videoURI || !videoTitle) return;

      const videosCollectionRef = collection(db, "videos");
      const newDocRef = doc(videosCollectionRef);
      const videoID = newDocRef.id;
      const videoRef = ref(storage, 'videos/' + videoID + '.mp4');

      const response = await fetch(videoURI);
      const blob = await response.blob();
      const uploadTask = uploadBytesResumable(videoRef, blob);

      uploadTask.on('state_changed',
        (snapshot) => {
          let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '%');
        },
        (error) => {
          console.log('Video upload failed: ', error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('Video available at: ', downloadURL);
          
          const videoData = {
            id: videoID,
            title: videoTitle,
            videoURL: downloadURL,
            timestamp: serverTimestamp()
          };
          await setDoc(newDocRef, videoData);
        }
      );
      setVideoTitle('');
    } catch (error) {
      console.error('error when upload videos: ', error);
    }
  }

  //Discard videos
  const discardVideo = () => {
    setTitleModalVisible(false);   // close title-input modal
    setVideoURI(null);             // discard this video
    setVideoTitle('');             // reset title to ''
  };

  //If there is no permission of the camera/microphone, return null
  if(!hasCameraPermissions || !hasMicPermissions) {
    return (
      <View></View>
    )
  }

 
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>

        {isFocused ? 
            <Camera 
              ref={ref => setCameraRef(ref)}
              style={styles.camera}
              ratio={'16:9'}
              type={CameraType.front}
            />
            : null }

        {/* Info icon top right*/}
        <TouchableOpacity
          style={styles.infoButton}
          onPress={(event) => {
            setInfoIconColor('green');
            setInfoModalVisible(true);
            }}
          >
          <AntDesign name="exclamationcircleo" size={20} color={infoIconColor} />
        </TouchableOpacity>
        
        {/* Info pop-up window */}
        {isInfoModalVisible && (
          <Modal
            transparent={true}
            visible={isInfoModalVisible}
          >
            <TouchableWithoutFeedback
            //Click anywhere except the info pop-up will close this pop-up
              onPress={() => {
                setInfoModalVisible(false);
                setInfoIconColor('white');
              }}
            >
            <View style={styles.infoModalContainer}>
              <TouchableWithoutFeedback>
                <View style={styles.infoModalView}>
                  <Text style={styles.infoText}>This is not a substitute for diagnosis or treatment, but if you have a question, you can ask a therapist.</Text>
                  <Text style={{ height: 14 }}></Text>
                  <Text style={styles.infoText}>If you are in crisis, please call 988.</Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}

        {/* Recoring circle button */}
        <View style={styles.bottomBarContainer}>
          <View style={styles.recordButtonContainer}>
            <RecordingButton 
              isRecording={isRecording}
              progress={recordingProgress}
              onPress={() => {
                if(isRecording) {// When is recording, press means manually stop
                  setIsManuallyStopped(true); 
                  stopVideo();
                } else {// When is not recording, press means start recording
                  setIsManuallyStopped(false);
                  recordVideo();
                }
                setIsRecording(!isRecording); // Reset IsRecording
              }}
            />
          </View>
        </View>
          
          
        {/* Pop up title-input window after stop recording */}
        {isTitleModalVisible && (
          <Modal
            transparent={true}
            visible={isTitleModalVisible}
          >
            <View style={styles.titleModalContainer}>
              <TouchableOpacity 
                style={[styles.discardButton, { zIndex: 3 }]} 
                onPress={discardVideo}
              >
                <MaterialIcons
                  name="close"
                  size={30}
                  color="white"
                />
              </TouchableOpacity>

              <View style={styles.titleModalView}>
                <TextInput
                  placeholder="Title of your question..."
                  placeholderTextColor="white" 
                  value={videoTitle}
                  onChangeText={text => setVideoTitle(text)}
                  multiline={true}
                  maxLength={40}
                  style={styles.titleInput}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={() => { 
                    uploadVideo();
                    setTitleModalVisible(false);
                    setVideoTitle('');
                  }}
                >
                  <Text style={styles.sendButtonText}>Send it</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

      </View>
    </SafeAreaView>
    
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative'
  },
  camera: {
    flex: 1,
    backgroundColor: 'black',
    aspectRatio: 9 / 16,
  },

  // Recording button
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row'
  },
  recordButtonContainer: {
    flex: 1,
    marginHorizontal: 30,
    marginBottom: 20,
    alignItems: 'center'
  },
  recordButton: {
    borderWidth: 6,
    borderColor: 'white',
    borderRadius: 100,
    height: 70,
    width: 70,
    alignSelf: 'center',
    marginBottom: 30
  },

  // Info icon on top right
  infoButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1
  },

  // Info pop-up when click info icon
  infoModalContainer: {
    flex: 1,
    paddingLeft: 120,
    paddingTop: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 2
  },
  infoModalView: {
    width: 220,
    height: 160,
    backgroundColor: 'white',
    borderRadius: 8,
    justifyContent: 'center',
    elevation: 5,
    padding: 20
  },
  infoText: {
    fontWeight: 'bold'
  },

  // Pop-up after stop recording: 
  // Title-input
  titleModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
},
  titleModalView: {
      width: 320,
      padding: 20,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center'
  },
  titleInput: {
    width: '100%',
    height: 70, 
    paddingTop: 10, 
    paddingLeft: 10,
    paddingHorizontal: 5,
    fontSize: 24,
    borderColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 25,
    color: 'white',
    backgroundColor: 'rgba(105,105,105, 0.5)'
  },
  // X button to discard this video
  discardButton: {
    position: 'absolute',
    top: 60,
    left: 10,
    padding: 5,
    borderRadius: 4
  },
  // send button to upload this video
  sendButton: {
    backgroundColor: '#9ACD32',
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    marginTop: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    width: '60%',
    height: 60
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 25
  }
});