import React, { Component } from "react";
import { Button, StyleSheet, TextInput, View, Text, SafeAreaView, AsyncStorage } from "react-native";
import Slider from 'react-native-slider';
import { NavigationEvents } from "react-navigation";
import { CustomVisionAPI } from "../custom-vision/endpoints";
import { clearToken } from "../components/AzureOAuth";
import { NTDAPP_SKIP, NTDAPP_SETTINGS } from "../constants/AsyncPaths";

export const getSettings = async () => {
  const state = await AsyncStorage.getItem(NTDAPP_SETTINGS);
  return JSON.parse(state || "{}");
}

export default class SettingsScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      threshold: 0.67,
      tag: ""
    }

    this._loadState();
  }

  async _clearSettings() {
      await AsyncStorage.removeItem(NTDAPP_SKIP);
      await AsyncStorage.removeItem(NTDAPP_SETTINGS);
      await clearToken();
      this._loadState();
  }

  async _loadState() {
    const state = await getSettings();
    this.initialState = { ...state };
    this.setState(state);
  }

  async _willBlur() {
    const state = { ...this.state };

    if (state.tag === this.initialState.tag && state.threshold === this.initialState.threshold || !this.state.tag)
      return;

    if (state.tag !== this.initialState.tag) {
      const tags = await CustomVisionAPI.getTags();
      let mytag = null;
      for (let tag of tags) {
        if (tag.name.toLowerCase() === `like_${this.state.tag.toLowerCase()}`) {
          mytag = tag;
          break;
        }
      }

      if (mytag === null)
        mytag = await CustomVisionAPI.createTag(this.state.tag);

      state.tagId = mytag.id;
    }

    AsyncStorage.setItem(NTDAPP_SETTINGS, JSON.stringify(state));
    this.initialState = { ...state };
  }

  _update(threshold, tag) {
    this.setState({ threshold: threshold, tag: tag });
  }

  render() {
    return (
      <SafeAreaView style={styles.root}>
        <NavigationEvents onWillBlur={() => this._willBlur()} />
        <View style={styles.setting}>
          <Text style={styles.caption}>Prediction tag</Text>
          <TextInput style={styles.input} onChangeText={tag => this._update(this.state.threshold, tag)} value={this.state.tag} />
        </View>
        <View style={styles.setting}>
          <Text style={styles.caption}>Prediction threshold</Text>
          <Slider
            onValueChange={threshold => this._update(threshold, this.state.tag)}
            style={styles.slider}
            trackStyle={styles.track}
            thumbStyle={styles.thumb}
            minimumTrackTintColor="#2f2f2f"
            value={this.state.threshold}
            animateTransitions={true}></Slider>
        </View>
        <View style={styles.setting}>
          <View style={styles.spacer} />
          <Button color="#ffffff" style={styles.button} title="Clear settings" onPress={() => this._clearSettings()}></Button>
        </View>
      </SafeAreaView>
    );
  }
}

SettingsScreen.navigationOptions = {
  title: 'Settings',
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#00c284",
    padding: 10,
    flex: 1
  },
  caption: {
    color: "white",
    fontSize: 18,
    marginTop: 20,
    marginBottom: 15,
  },
  setting: {
    padding: 30
  },
  input: {
    borderWidth: 0,
    backgroundColor: "white",
    borderRadius: 4,
    padding: 8,
    fontSize: 18,
  },
  slider: {
    marginTop: 20,
    height: 10,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  track: {
    height: 0,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  thumb: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 8,
    borderRadius: 16,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    shadowOpacity: 0.35,
  },
  button: {
    marginTop: 32,
    color: "#ffffff"
  },
  spacer: {
    height: 30
  }
})