import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Modal,TouchableWithoutFeedback, Pressable, Animated} from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { Camera, CameraType } from 'expo-camera' 
//import { Audio } from 'expo-av'
import { useIsFocused } from '@react-navigation/core';
//import { FontAwesome } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
//import storage from '../../firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL, getStorage } from 'firebase/storage';
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


  const [infoIconColor, setInfoIconColor] = useState('white');
  const [modalVisible, setModalVisible] = useState(false);

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

  const recordVideo = async () => {
    if(cameraRef) {
      try{
        const options = {
          maxDuration: 15, 
          quality: Camera.Constants.VideoQuality['16:9'] 
        };
        const videoRecordPromise = cameraRef.recordAsync(options);
        console.log('begin');

        if(videoRecordPromise) {
          const data = await videoRecordPromise;
          const source = data.uri;
          setVideoURI(source);

        }
      } catch(error) {
        console.warn(error);
      }
    }
  }

  const stopVideo = async () => {
    if(cameraRef) {
      cameraRef.stopRecording();
      recordingProgress.stopAnimation();
      recordingProgress.setValue(0);  // reset recording progress
      console.log('stop');
    }
  }

  const uploadVideo = async () => {
    try {
      if(!videoURI) return;
      console.log(videoURI);

      const response = await fetch(videoURI);
      const blob = await response.blob();
      console.log('Blob:', blob);

      const storage = getStorage();
      const videoRef = ref(storage, 'videos/' + new Date().getTime() + '.mp4');
      
      const uploadTask = uploadBytesResumable(videoRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
          },
          (error) => {
            console.log('Video upload failed: ', error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Video available at', downloadURL);
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error('error when upload videos: ', error);
    }
    
  }

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
            : null}

        <TouchableOpacity
          style={styles.button}
          onPress={(event) => {
            setInfoIconColor('green');
            setModalVisible(true);
            }}
          >
          <AntDesign name="exclamationcircleo" size={20} color={infoIconColor} />
        </TouchableOpacity>

        {modalVisible && (
          <Modal
            //animationType="slide"
            transparent={true}
            visible={modalVisible}
          >
            <TouchableWithoutFeedback
              onPress={() => {
                setModalVisible(false);
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


        <View style={styles.bottomBarContainer}>
          <View style={styles.recordButtonContainer}>
            <RecordingButton 
              isRecording={isRecording}
              progress={recordingProgress}
              onPress={() => {
                if(isRecording) {
                  stopVideo();
                } else {
                  recordVideo();
                }
                setIsRecording(!isRecording);
              }}
            />
          </View>
        </View>
          
        <Pressable onPress={uploadVideo} style={{ marginLeft: 20 }}>
          <Text style={{ color: 'black', fontSize: 16, alignSelf: 'center' }}>Upload test button</Text>
        </Pressable>
          


      </View>
    </SafeAreaView>
    
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative'
    //marginTop: 30
  },
  // infoModalContainer: {
  //   position: 'absolute',
  //   top: 0,
  //   flex: 1,
  //   justifyContent: 'center',
  //   alignItems: 'center'
  // },
  camera: {
    flex: 1,
    //position: 'absolute',
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
    //position: 'absolute',
    //backgroundColor: '#ff4040',
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
    //justifyContent: 'center',
    //alignItems: 'center',
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
  }
});