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
      patches.push(instead("setSelfMute", voiceModule, (args, orig) => {
        if (storage.enabled) return orig(true);
        return orig(...args);
      }));

      patches.push(instead("setSelfDeaf", voiceModule, (args, orig) => {
        if (storage.enabled) return orig(true);
        return orig(...args);
      }));
    }

    const MediaEngineStore = findByStoreName("MediaEngineStore");
    if (MediaEngineStore) {
      patches.push(after("getMediaEngine", MediaEngineStore, (_, ret) => {
        if (storage.enabled && ret) {
          try {
            ret.setOutputMuted?.(false);
            ret.setInputMuted?.(false);
          } catch {}
        }
        return ret;
      }));
    }
  },

  onUnload() {
    patches.forEach(p => p());
    patches = [];
  },

  settings: () => {
    const [enabled, setEnabled] = React.useState(storage.enabled);

    return (
      <FormSection title="Fake Mute & Deafen">
        <FormSwitchRow
          label="Activar Fake Mute + Deafen"
          subLabel="Aparecerás muteado y ensordecido, pero podrás seguir escuchando"
          value={enabled}
          onValueChange={(v) => {
            storage.enabled = v;
            setEnabled(v);

            const voiceModule = findByProps("setSelfMute", "setSelfDeaf");
            if (voiceModule) {
              voiceModule.setSelfMute(v);
              voiceModule.setSelfDeaf(v);
            }
          }}
        />
      </FormSection>
    );
  }
};
