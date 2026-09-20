import { storage } from "@vendetta/plugin";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { instead, after } from "@vendetta/patcher";
import { ReactNative } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";

const { FormSwitchRow, FormSection } = Forms;

storage.enabled ??= false;

let patches = [];

export default {
  onLoad() {
    const voiceModule = findByProps("setSelfMute", "setSelfDeaf");

    if (voiceModule) {
      patches.push(
        instead("setSelfMute", voiceModule, (args, orig) => {
          if (storage.enabled) return orig(true);
          return orig(...args);
        })
      );

      patches.push(
        instead("setSelfDeaf", voiceModule, (args, orig) => {
          if (storage.enabled) return orig(true);
          return orig(...args);
        })
      );
    }

    const MediaEngineStore = findByStoreName("MediaEngineStore");
    if (MediaEngineStore) {
      patches.push(
        after("getMediaEngine", MediaEngineStore, (_, ret) => {
          if (storage.enabled && ret) {
            try {
              if (ret.setOutputMuted) ret.setOutputMuted(false);
              if (ret.setInputMuted) ret.setInputMuted(false);
            } catch (e) {}
          }
          return ret;
        })
      );
    }
  },

  onUnload() {
    patches.forEach((p) => p());
    patches = [];
  },

  settings: () => {
    const [enabled, setEnabled] = ReactNative.React.useState(storage.enabled);

    return (
      ReactNative.React.createElement(
        FormSection,
        { title: "Fake Mute & Deafen" },
        ReactNative.React.createElement(FormSwitchRow, {
          label: "Activar Fake Mute + Deafen",
          subLabel: "Aparecerás muteado y ensordecido, pero podrás seguir escuchando",
          value: enabled,
          onValueChange: (v) => {
            storage.enabled = v;
            setEnabled(v);

            const voiceModule = findByProps("setSelfMute", "setSelfDeaf");
            if (voiceModule) {
              if (v) {
                voiceModule.setSelfMute(true);
                voiceModule.setSelfDeaf(true);
              } else {
                voiceModule.setSelfMute(false);
                voiceModule.setSelfDeaf(false);
              }
            }
          },
        })
      )
    );
  },
};
