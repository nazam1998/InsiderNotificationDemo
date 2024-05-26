import messaging, {
  FirebaseMessagingTypes,
} from "@react-native-firebase/messaging";
import * as RNInsider from "react-native-insider";

async function onMessageReceived(
  message: FirebaseMessagingTypes.RemoteMessage
) {
  if (message.data?.title && message.data.message) {
    if (message.data.source === "Insider") {
      RNInsider?.handleNotification(message.data);
    }
  } else {
    console.warn("EMPTY PUSH NOTIFICATION?", message);
  }
}

messaging().onMessage(onMessageReceived);
messaging().setBackgroundMessageHandler(onMessageReceived);
