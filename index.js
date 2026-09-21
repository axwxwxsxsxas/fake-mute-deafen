import { storage } from "@vendetta/plugin";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { instead, after } from "@vendetta/patcher";
import { React } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";

const { FormSwitchRow, FormSection } = Forms;

storage.enabled ??= false;
let patches = [];

export default {
  onLoad() {
    const voiceModule = findByProps("setSelfMute", "setSelfDeaf");

    if (voiceModule) {
      patches.push(instead("setSelfMute", voiceModule, function(args, orig) {
        if (storage.enabled) return orig(true);
        return orig.apply(this, args);
      }));

      patches.push(instead("setSelfDeaf", voiceModule, function(args, orig) {
        if (storage.enabled) return orig(true);
        return orig.apply(this, args);
      }));
    }

    const MediaEngineStore = findByStoreName("MediaEngineStore");
    if (MediaEngineStore) {
      patches.push(after("getMediaEngine", MediaEngineStore, function(_, ret) {
        if (storage.enabled && ret) {
          try {
            if (ret.setOutputMuted) ret.setOutputMuted(false);
            if (ret.setInputMuted) ret.setInputMuted(false);
          } catch (e) {}
        }
        return ret;
      }));
    }
  },

  onUnload() {
    for (var i = 0; i < patches.length; i++) {
      patches[i]();
    }
    patches = [];
  },

  settings: function() {
    var enabled = storage.enabled;
    var setEnabled = function(v) {
      storage.enabled = v;
      var voiceModule = findByProps("setSelfMute", "setSelfDeaf");
      if (voiceModule) {
        voiceModule.setSelfMute(v);
        voiceModule.setSelfDeaf(v);
      }
    };

    return React.createElement(FormSection, { title: "Fake Mute & Deafen" },
      React.createElement(FormSwitchRow, {
        label: "Activar Fake Mute + Deafen",
        subLabel: "Apareceras muteado y ensordecido, pero podras seguir escuchando",
        value: enabled,
        onValueChange: setEnabled
      })
    );
  }
};
