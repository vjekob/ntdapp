import React, { Component } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  Text,
  Image,
  Button,
  AsyncStorage
} from "react-native";
import { bindComponentToItemDispatch } from "../redux/itemReducer";
import { getSettings } from "./SettingsScreen";
import { TinderSwiper } from "../components/TinderSwiper";
import { CustomVisionAPI } from "../custom-vision/endpoints";
import { getNotifications } from "../azure/azure-api";
import { API } from "../constants/API";
import { getCurrentToken } from "../components/AzureOAuth";
import blobToBase64 from "blob-to-base64";
import { Notification } from "../classes/Notification";
import { NTDAPP_SKIP, NTDAPP_NOTIFICATIONS, NTDAPP_LIKES } from "../constants/AsyncPaths";

const SWIPE_ACTION = {
  LIKE: Symbol("LIKE"),
  NOPE: Symbol("NOPE")
};

export class UnboundHomeScreen extends Component {
  constructor(props) {
    super(props);

    this.state = { tagId: "", swipe: false };
    (async () => {
      const settings = await getSettings();
      if (settings.tagId)
        this.setState({ tagId: settings.tagId, swipe: true });
      this._likeTagName = `like_${settings.tag}`;
      this._likeThreshold = settings.threshold;

      const skip = await AsyncStorage.getItem(NTDAPP_SKIP) || "{}";
      this._startAt = JSON.parse(skip).startAt || 0;

      const currentToken = await getCurrentToken();
      this._authorization = API.getAuthorization(currentToken);
      this._lastGeneration = Number.parseInt(await AsyncStorage.getItem(NTDAPP_NOTIFICATIONS) || "0");
      this._likes = JSON.parse(await AsyncStorage.getItem(NTDAPP_LIKES) || "[]");
      this._delayLikes = this._likes.length < 5;
      this._scheduleNotifications();
    })();
  }

  _scheduleNotifications() {
    setTimeout(() => this._checkNotifications(), 5000);
  }

  async _checkNotifications() {
    this._scheduleNotifications();

    console.log("Checking notifications");
    const notifications = await getNotifications(this._lastGeneration);
    console.log(`Notification generation comparison: online ${notifications.lastGeneration}, local ${this._lastGeneration}`)
    if (notifications.lastGeneration === this._lastGeneration)
      return;

    console.log("Refreshing notifications, now could be found");
    this._lastGeneration = notifications.lastGeneration;
    await AsyncStorage.setItem(NTDAPP_NOTIFICATIONS, `${this._lastGeneration}`);

    const likeTagName = this._likeTagName;
    const likeThreshold = this._likeThreshold;
    const authorization = this._authorization;
    const setState = state => this.setState(state);
    for (let notification of notifications.notifications) {
      fetch(notification.resource, { method: "GET", headers: authorization })
        .then(result => result.json())
        .then(async match => {
          console.log(`Match: ${JSON.stringify(match)}`);
          console.log(`Comparing match: theirs ${match.tagName}, ours: ${likeTagName}`);
          console.log(`Comparing confidence: theirs ${match.predictionConfidence}, ours: ${likeThreshold}`);
          if (match.tagName === likeTagName && match.predictionConfidence >= likeThreshold) {
            console.log("Match found, retrieving info and notifying");
            let picture = await fetch(API.getItemPictureContentUrl(match.legoItemSystemId), { headers: authorization });
            let blob = await picture.blob();
            let base64 = await new Promise((fulfill, reject) => {
              blobToBase64(blob, (error, base64) => {
                if (error) {
                  reject(error);
                  return;
                }
                fulfill(base64);
              });
            });
            console.log("Playing notification");
            Notification.play();
            setState({ match: base64 });
          }
        })
        .catch(e => {
          console.error(`Error occurred during checking match: ${e.message}`);
        });
    }
  }

  async _swipe(image, action) {
    this.props.swipe();

    if (!this.state.tagId)
      return;

    switch (action) {
      case SWIPE_ACTION.LIKE:
        this._likes.push(image.item.customVisionId);
        await AsyncStorage.setItem(NTDAPP_LIKES, JSON.stringify(this._likes));
        if (this._likes.length < 5)
          return;
        if (this._likes === 5) {
          this._likes.forEach(async like => {
            await CustomVisionAPI.likeImage(like, this.state.tagId);
          });
        }
        await CustomVisionAPI.likeImage(image.item.customVisionId, this.state.tagId);
        break;
    }

    const nextStart = image.index + this._startAt;
    AsyncStorage.setItem(NTDAPP_SKIP, JSON.stringify({ startAt: nextStart }));
  }

  render() {
    return <View style={styles.container}>
      {this.state.match
        ? <View style={styles.match}>
          <View style={styles.matchInner}>
            <Text style={styles.matchCaption}>It's a match</Text>
            <Image style={styles.matchImage} source={{ uri: this.state.match }}></Image>
            <Button onPress={() => this.setState({ match: null })} title="Duh, we didn't expect any less than this, can we go on with the session now?"></Button>
          </View>
        </View>
        : <TinderSwiper
          onLike={image => this._swipe(image, SWIPE_ACTION.LIKE)}
          onNope={image => this._swipe(image, SWIPE_ACTION.NOPE)}
        />
      }
    </View>
  }
}

export const HomeScreen = bindComponentToItemDispatch(UnboundHomeScreen);

HomeScreen.navigationOptions = {
  header: null
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#00c284",
    flex: 1,
    justifyContent: "center",
    alignContent: "center"
  },
  match: {
    flex: 1,
    padding: 40,
  },
  matchInner: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  matchCaption: {
    fontSize: 32,
    marginBottom: 64
  },
  matchImage: {
    marginBottom: 64,
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 1,
    borderColor: "transparent",
    shadowOffset: { width: 0, height: 0, },
    shadowRadius: 5,
    shadowColor: 'black',
    shadowOpacity: 0.4,
  },
  image: {
    flex: 1,
    resizeMode: "contain",
    width: Dimensions.get("screen").width,
    height: Dimensions.get("screen").height
  }
});
