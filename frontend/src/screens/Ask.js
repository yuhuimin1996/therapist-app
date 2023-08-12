import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Modal,TouchableWithoutFeedback, Pressable, Animated, TextInput, Button } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { Camera, CameraType } from 'expo-camera' 
//import { Audio } from 'expo-av'
import { useIsFocused } from '@react-navigation/core';
//import { FontAwesome } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import storage from '../../firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL, getStorage } from 'firebase/storage';
import { collection, doc, setDoc, getFirestore, serverTimestamp } from "firebase/firestore";


import RecordingButton from '../components/RecordingButton';


export default function Ask() {
  const [hasCameraPermissions, setHasCameraPermissions] = useState(false);
  const [hasMicPermissions, setHasMicPermissions] = useState(false);

  const [cameraRef, setCameraRef] = useState(null);
  //const [cameraType, setCameraType] = useState(CameraType.front);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const isFocused = useIsFocused();
  const [isRecording, setIsRecording] = useState(false);
  const [videoURI, setVideoURI] = useState(null);
  const recordingProgress = useRef(new Animated.Value(0)).current;
  const [isManuallyStopped, setIsManuallyStopped] = useState(false);



  const [isTitleModalVisible, setTitleModalVisible] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");

  const [infoIconColor, setInfoIconColor] = useState('white');
  const [isInfoModalVisible, setInfoModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        //Access the permission of camera on user's mobile device
        const cameraStatus = await Camera.requestCameraPermissionsAsync();
        setHasCameraPermissions(cameraStatus.status == 'granted');
        //Microphone permission
        const micStatus = await Camera.requestMicrophonePermissionsAsync();
        setHasMicPermissions(micStatus.status == 'granted');
      } catch (error) {
        console.error('error when get access:', error);
      }
    })()
  }, []);

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

  //Record videos
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

  //Stop recording
  const stopVideo = async () => {
    if(cameraRef) {
      cameraRef.stopRecording();
      recordingProgress.stopAnimation();
      recordingProgress.setValue(0);  // reset recording progress
      console.log('stop');

      setTitleModalVisible(true);
      setIsRecording(false);
      setIsManuallyStopped(false);
    }
  }

  //Upload videos to firebase
  const uploadVideo = async () => {
    try {
      if(!videoURI || !videoTitle) return;

      //Upload video to Firebase Storage
      //Upload video metadata to Firestore database
      const db = getFirestore();
      const storage = getStorage();

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
    setTitleModalVisible(false);   // close modal
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
              onCameraReady={() => setIsCameraReady(true)}
            />
            : null }

        {/* Info icon */}
        <TouchableOpacity
          style={styles.button}
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
            //animationType="slide"
            transparent={true}
            visible={isInfoModalVisible}
          >
            <TouchableWithoutFeedback
              onPress={() => {
                setInfoModalVisible(false);
                setInfoIconColor('white');
              }}
            >
              <View style={styles.modalContainer}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalView}>
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
                if(isRecording) {
                  setIsManuallyStopped(true);
                  stopVideo();
                } else {
                  setIsManuallyStopped(false);
                  recordVideo();
                }
                setIsRecording(!isRecording);
              }}
            />
          </View>
        </View>
          
          
        {/* Pop up window after stop recording */}
        {isTitleModalVisible && (
          <Modal
            transparent={true}
            visible={isTitleModalVisible}
          >
            <View style={styles.modalTitleContainer}>
              <TouchableOpacity 
                style={[styles.discardButton, { zIndex: 3 }]} 
                onPress={discardVideo}
              >
                <Text style={styles.discardButtonText}>Discard</Text>
              </TouchableOpacity>

              <View style={styles.modalTitleView}>
                <TextInput
                  placeholder="Title of your question"
                  value={videoTitle}
                  onChangeText={text => setVideoTitle(text)}
                  style={styles.titleInput}
                />
                <Button title="Submit" onPress={() => {
                  uploadVideo();
                  setTitleModalVisible(false);
                  setVideoTitle('');
                }} />
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
  button: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1
  },
  modalContainer: {
    flex: 1,
    paddingLeft: 120,
    paddingTop: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 2
  },
  modalView: {
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
  modalTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
},
modalTitleView: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
},
titleInput: {
    width: '100%',
    height: 40,
    padding: 10,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
},
discardButton: {
  position: 'absolute',
  top: 60,
  left: 10,
  padding: 5,
  backgroundColor: 'red',
  borderRadius: 4
},
discardButtonText: {
  color: 'white',
  fontWeight: 'bold'
}

});